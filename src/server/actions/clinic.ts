"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { C, DEFAULT_BRANCH_ID } from "@/lib/firebase/collections";
import { requirePermission } from "@/lib/auth/session";
import { diff, writeAuditLog } from "@/lib/audit";
import { appointmentSchema, fieldErrors, patientSchema } from "@/lib/validation/schemas";
import { addMinutesToTime, dateKey, timeToMinutes } from "@/lib/utils/format";
import { getServices, getSettings } from "@/lib/cms/queries";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import type { Appointment, AppointmentStatus, Doctor, QueueEntry } from "@/types";

/**
 * Clinic operations.
 *
 * Every export begins with `requirePermission`. Anything that allocates a
 * human-readable sequence number, or that must not double-book, runs inside a
 * Firestore transaction.
 */

/* -------------------------------------------------------------------------- */
/* Sequence numbers                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Allocates the next number in a named sequence.
 *
 * Firestore has no auto-increment, and reading `count()` then adding one races
 * under concurrent use — two receptionists registering patients at the same
 * moment would both read the same value. A transaction on a counter document
 * makes the allocation atomic.
 */
async function nextSequence(key: string, prefix: string, pad = 4): Promise<string> {
  const ref = adminDb().collection(C.counters).doc(key);

  const value = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.data()?.value as number | undefined) ?? 0;
    const next = current + 1;
    tx.set(ref, { value: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return next;
  });

  return `${prefix}-${String(value).padStart(pad, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* Patients                                                                    */
/* -------------------------------------------------------------------------- */

export async function createPatient(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult & { patientId?: string }> {
  try {
    const ctx = await requirePermission("patients.write");

    const parsed = patientSchema.safeParse({
      fullName: formData.get("fullName"),
      gender: formData.get("gender"),
      dateOfBirth: formData.get("dateOfBirth") || undefined,
      phone: formData.get("phone"),
      whatsapp: formData.get("whatsapp") || undefined,
      email: formData.get("email") || undefined,
      address: formData.get("address") || undefined,
      city: formData.get("city") || undefined,
      emergencyContactName: formData.get("emergencyContactName") || undefined,
      emergencyContactPhone: formData.get("emergencyContactPhone") || undefined,
      source: formData.get("source") ?? "Walk-in",
      branchId: formData.get("branchId") ?? DEFAULT_BRANCH_ID,
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const settings = await getSettings();

    // A duplicate phone number is nearly always the same person returning.
    const existing = await adminDb()
      .collection(C.patients)
      .where("phone", "==", parsed.data.phone)
      .limit(1)
      .get();

    if (!existing.empty) {
      return {
        ok: false,
        errors: { phone: "A patient with this phone number already exists." },
        patientId: existing.docs[0].id,
        message: "This phone number is already registered. Open the existing record instead.",
      };
    }

    const patientCode = await nextSequence(
      "patients",
      settings.patientCodePrefix || "TSA",
      5,
    );

    const now = FieldValue.serverTimestamp();
    const ref = await adminDb()
      .collection(C.patients)
      .add({
        ...parsed.data,
        patientCode,
        registrationDate: Timestamp.now(),
        whatsapp: parsed.data.whatsapp || parsed.data.phone,
        stats: { totalVisits: 0, totalSpend: 0, outstandingBalance: 0 },
        loyaltyPoints: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.uid,
      });

    // Clinical data lives in its own document so it can be permissioned apart.
    await adminDb()
      .collection(C.patientMedical)
      .doc(ref.id)
      .set({
        patientId: ref.id,
        allergies: [],
        skinConcerns: [],
        contraindications: [],
        createdAt: now,
        updatedAt: now,
      });

    await writeAuditLog(ctx, {
      action: "patient.create",
      module: "Patients",
      entityId: ref.id,
      entityLabel: `${patientCode} · ${parsed.data.fullName}`,
      after: { patientCode, fullName: parsed.data.fullName, source: parsed.data.source },
      branchId: parsed.data.branchId,
    });

    revalidatePath("/admin/clinic/patients");
    return { ok: true, message: `Patient ${patientCode} created.`, patientId: ref.id };
  } catch (error) {
    return toActionResult(error, "The patient could not be created.");
  }
}

/* -------------------------------------------------------------------------- */
/* Appointments                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Returns the appointments that would overlap the proposed slot for a doctor.
 *
 * Read inside the same transaction that writes the new appointment, so two
 * concurrent bookings cannot both pass the check.
 */
async function findConflicts(
  tx: FirebaseFirestore.Transaction,
  doctorId: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  excludeId?: string,
): Promise<Appointment[]> {
  const query = adminDb()
    .collection(C.appointments)
    .where("doctorId", "==", doctorId)
    .where("date", "==", date);

  const snap = await tx.get(query);
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Appointment)
    .filter((a) => {
      if (a.id === excludeId) return false;
      // A cancelled or missed appointment does not hold its slot.
      if (a.status === "Cancelled" || a.status === "No Show") return false;
      const otherStart = timeToMinutes(a.startTime);
      const otherEnd = otherStart + (a.durationMinutes ?? 30);
      return start < otherEnd && end > otherStart;
    });
}

export async function createAppointment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult & { appointmentId?: string }> {
  try {
    const ctx = await requirePermission("appointments.write");

    const parsed = appointmentSchema.safeParse({
      patientId: formData.get("patientId"),
      doctorId: formData.get("doctorId"),
      serviceId: formData.get("serviceId"),
      date: formData.get("date"),
      startTime: formData.get("startTime"),
      durationMinutes: formData.get("durationMinutes") ?? 30,
      appointmentType: formData.get("appointmentType") ?? "Consultation",
      status: formData.get("status") ?? "Booked",
      source: formData.get("source") ?? "Phone",
      notes: formData.get("notes") || undefined,
      branchId: formData.get("branchId") ?? DEFAULT_BRANCH_ID,
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const input = parsed.data;

    const [patientSnap, doctorSnap, services] = await Promise.all([
      adminDb().collection(C.patients).doc(input.patientId).get(),
      adminDb().collection(C.doctors).doc(input.doctorId).get(),
      getServices(),
    ]);

    if (!patientSnap.exists) return { ok: false, errors: { patientId: "Patient not found." } };
    if (!doctorSnap.exists) return { ok: false, errors: { doctorId: "Clinician not found." } };

    const service = services.find((s) => s.id === input.serviceId);
    if (!service) return { ok: false, errors: { serviceId: "Treatment not found." } };

    const patient = patientSnap.data() as { fullName: string; phone: string };
    const doctor = doctorSnap.data() as Doctor;

    const result = await adminDb().runTransaction(async (tx) => {
      const conflicts = await findConflicts(
        tx,
        input.doctorId,
        input.date,
        input.startTime,
        input.durationMinutes,
      );

      if (conflicts.length > 0) {
        return {
          conflict: `${doctor.fullName} already has ${conflicts[0].patientName} at ${conflicts[0].startTime}.`,
        };
      }

      const ref = adminDb().collection(C.appointments).doc();
      tx.set(ref, {
        branchId: input.branchId,
        patientId: input.patientId,
        patientName: patient.fullName,
        patientPhone: patient.phone,
        doctorId: input.doctorId,
        doctorName: doctor.fullName,
        serviceId: service.id,
        serviceName: service.name,
        date: input.date,
        startTime: input.startTime,
        endTime: addMinutesToTime(input.startTime, input.durationMinutes),
        durationMinutes: input.durationMinutes,
        appointmentType: input.appointmentType,
        status: input.status,
        paymentStatus: "Unpaid",
        source: input.source,
        notes: input.notes ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: ctx.uid,
      });

      return { id: ref.id };
    });

    if ("conflict" in result) {
      return { ok: false, message: result.conflict, errors: { startTime: "This slot is taken." } };
    }

    await writeAuditLog(ctx, {
      action: "appointment.create",
      module: "Appointments",
      entityId: result.id,
      entityLabel: `${patient.fullName} · ${service.name}`,
      after: { date: input.date, startTime: input.startTime, doctorName: doctor.fullName },
      branchId: input.branchId,
    });

    revalidatePath("/admin/clinic/appointments");
    revalidatePath("/admin/clinic/front-desk");
    return { ok: true, message: "Appointment booked.", appointmentId: result.id };
  } catch (error) {
    return toActionResult(error, "The appointment could not be booked.");
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  reason?: string,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission(
      status === "Cancelled" ? "appointments.cancel" : "appointments.write",
    );

    const ref = adminDb().collection(C.appointments).doc(appointmentId);
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, message: "Appointment not found." };

    const before = snap.data() as Appointment;

    const patch: Record<string, unknown> = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: ctx.uid,
    };

    // Stamp the transition times so reporting can measure waiting and duration.
    if (status === "Arrived") patch.checkedInAt = FieldValue.serverTimestamp();
    if (status === "Completed") patch.completedAt = FieldValue.serverTimestamp();
    if (status === "Cancelled") {
      patch.cancelledAt = FieldValue.serverTimestamp();
      patch.cancellationReason = reason ?? null;
    }

    await ref.update(patch);

    // Arriving puts the patient into the live waiting queue.
    if (status === "Arrived") {
      await addToQueue({
        appointmentId,
        patientId: before.patientId,
        patientName: before.patientName,
        doctorId: before.doctorId,
        doctorName: before.doctorName,
        serviceName: before.serviceName,
        branchId: before.branchId,
        isWalkIn: false,
      });
    }

    // Leaving treatment closes the queue entry.
    if (status === "Completed" || status === "Cancelled" || status === "No Show") {
      const queueSnap = await adminDb()
        .collection(C.queue)
        .where("appointmentId", "==", appointmentId)
        .limit(1)
        .get();
      if (!queueSnap.empty) {
        await queueSnap.docs[0].ref.update({
          status: "COMPLETED",
          completedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    const changes = diff({ status: before.status }, { status });
    await writeAuditLog(ctx, {
      action: `appointment.status.${status.toLowerCase().replace(/\s+/g, "-")}`,
      module: "Appointments",
      entityId: appointmentId,
      entityLabel: `${before.patientName} · ${before.serviceName}`,
      before: changes.before,
      after: changes.after,
      branchId: before.branchId,
    });

    revalidatePath("/admin/clinic/front-desk");
    revalidatePath("/admin/clinic/appointments");
    revalidatePath("/admin/clinic/queue");
    return { ok: true, message: `Marked as ${status.toLowerCase()}.` };
  } catch (error) {
    return toActionResult(error, "The appointment could not be updated.");
  }
}

export async function rescheduleAppointment(
  appointmentId: string,
  date: string,
  startTime: string,
  durationMinutes?: number,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("appointments.write");

    const ref = adminDb().collection(C.appointments).doc(appointmentId);

    const result = await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { error: "Appointment not found." };

      const current = snap.data() as Appointment;
      const duration = durationMinutes ?? current.durationMinutes;

      const conflicts = await findConflicts(
        tx,
        current.doctorId,
        date,
        startTime,
        duration,
        appointmentId,
      );
      if (conflicts.length > 0) {
        return {
          error: `${current.doctorName} already has ${conflicts[0].patientName} at ${conflicts[0].startTime}.`,
        };
      }

      tx.update(ref, {
        date,
        startTime,
        durationMinutes: duration,
        endTime: addMinutesToTime(startTime, duration),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: ctx.uid,
      });

      return { before: current };
    });

    if ("error" in result) return { ok: false, message: result.error };

    await writeAuditLog(ctx, {
      action: "appointment.reschedule",
      module: "Appointments",
      entityId: appointmentId,
      entityLabel: result.before.patientName,
      before: { date: result.before.date, startTime: result.before.startTime },
      after: { date, startTime },
      branchId: result.before.branchId,
    });

    revalidatePath("/admin/clinic/appointments");
    revalidatePath("/admin/clinic/calendar");
    return { ok: true, message: "Appointment rescheduled." };
  } catch (error) {
    return toActionResult(error, "The appointment could not be rescheduled.");
  }
}

/* -------------------------------------------------------------------------- */
/* Waiting queue                                                               */
/* -------------------------------------------------------------------------- */

async function addToQueue(entry: Omit<QueueEntry, "id" | "token" | "status" | "checkedInAt" | "createdAt" | "updatedAt">) {
  // Tokens restart each day, so the board reads 1, 2, 3 rather than 4,127.
  const token = Number((await nextSequence(`queue-${dateKey()}`, "Q", 1)).split("-")[1]);

  await adminDb()
    .collection(C.queue)
    .add({
      ...entry,
      token,
      status: "WAITING",
      checkedInAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function addWalkIn(
  patientId: string,
  patientName: string,
  serviceName?: string,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("queue.manage");

    await addToQueue({
      patientId,
      patientName,
      serviceName,
      branchId: DEFAULT_BRANCH_ID,
      isWalkIn: true,
    });

    await writeAuditLog(ctx, {
      action: "queue.walk-in",
      module: "Queue",
      entityId: patientId,
      entityLabel: patientName,
    });

    revalidatePath("/admin/clinic/queue");
    revalidatePath("/admin/clinic/front-desk");
    return { ok: true, message: `${patientName} added to the queue.` };
  } catch (error) {
    return toActionResult(error, "The patient could not be added to the queue.");
  }
}

export async function updateQueueStatus(
  queueId: string,
  status: QueueEntry["status"],
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("queue.manage");

    const patch: Record<string, unknown> = { status, updatedAt: FieldValue.serverTimestamp() };
    if (status === "CALLED") patch.calledAt = FieldValue.serverTimestamp();
    if (status === "COMPLETED") patch.completedAt = FieldValue.serverTimestamp();

    await adminDb().collection(C.queue).doc(queueId).update(patch);

    await writeAuditLog(ctx, {
      action: `queue.${status.toLowerCase().replace(/\s+/g, "-")}`,
      module: "Queue",
      entityId: queueId,
    });

    revalidatePath("/admin/clinic/queue");
    revalidatePath("/admin/clinic/front-desk");
    return { ok: true };
  } catch (error) {
    return toActionResult(error, "The queue could not be updated.");
  }
}

/* -------------------------------------------------------------------------- */
/* Booking requests                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Converts a website request into a real appointment.
 *
 * Creates the patient record if this is a new person, books the slot through
 * the same conflict-checked path as any other booking, and links the request
 * to what it became so the trail is complete.
 */
export async function confirmBookingRequest(
  requestId: string,
  input: {
    doctorId: string;
    serviceId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
  },
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("appointments.write");

    const reqRef = adminDb().collection(C.appointmentRequests).doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) return { ok: false, message: "Request not found." };

    const request = reqSnap.data() as {
      fullName: string;
      phone: string;
      whatsapp?: string;
      email?: string;
      patientId?: string;
    };

    // Reuse the existing patient where the phone number already exists.
    let patientId = request.patientId;
    if (!patientId) {
      const existing = await adminDb()
        .collection(C.patients)
        .where("phone", "==", request.phone)
        .limit(1)
        .get();

      if (!existing.empty) {
        patientId = existing.docs[0].id;
      } else {
        const settings = await getSettings();
        const patientCode = await nextSequence("patients", settings.patientCodePrefix || "TSA", 5);
        const now = FieldValue.serverTimestamp();

        const created = await adminDb()
          .collection(C.patients)
          .add({
            branchId: DEFAULT_BRANCH_ID,
            patientCode,
            fullName: request.fullName,
            gender: "Prefer not to say",
            phone: request.phone,
            whatsapp: request.whatsapp ?? request.phone,
            email: request.email ?? null,
            source: "Website",
            registrationDate: Timestamp.now(),
            stats: { totalVisits: 0, totalSpend: 0, outstandingBalance: 0 },
            loyaltyPoints: 0,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdBy: ctx.uid,
          });

        patientId = created.id;
        await adminDb().collection(C.patientMedical).doc(patientId).set({
          patientId,
          allergies: [],
          skinConcerns: [],
          contraindications: [],
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const form = new FormData();
    form.set("patientId", patientId);
    form.set("doctorId", input.doctorId);
    form.set("serviceId", input.serviceId);
    form.set("date", input.date);
    form.set("startTime", input.startTime);
    form.set("durationMinutes", String(input.durationMinutes));
    form.set("appointmentType", "Consultation");
    form.set("status", "Confirmed");
    form.set("source", "Website");
    form.set("branchId", DEFAULT_BRANCH_ID);

    const booking = await createAppointment(null, form);
    if (!booking.ok) return booking;

    await reqRef.update({
      status: "Converted",
      patientId,
      appointmentId: booking.appointmentId,
      handledBy: ctx.uid,
      handledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await writeAuditLog(ctx, {
      action: "bookingRequest.confirm",
      module: "Appointments",
      entityId: requestId,
      entityLabel: request.fullName,
      after: { appointmentId: booking.appointmentId, patientId },
    });

    revalidatePath("/admin/clinic/requests");
    revalidatePath("/admin/clinic/front-desk");
    return { ok: true, message: `Appointment confirmed for ${request.fullName}.` };
  } catch (error) {
    return toActionResult(error, "The request could not be confirmed.");
  }
}

export async function updateRequestStatus(
  requestId: string,
  status: "Contacted" | "Declined",
  note?: string,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("appointments.write");

    await adminDb()
      .collection(C.appointmentRequests)
      .doc(requestId)
      .update({
        status,
        internalNotes: note ?? null,
        handledBy: ctx.uid,
        handledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    await writeAuditLog(ctx, {
      action: `bookingRequest.${status.toLowerCase()}`,
      module: "Appointments",
      entityId: requestId,
    });

    revalidatePath("/admin/clinic/requests");
    return { ok: true, message: `Marked as ${status.toLowerCase()}.` };
  } catch (error) {
    return toActionResult(error, "The request could not be updated.");
  }
}
