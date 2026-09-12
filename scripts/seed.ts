/**
 * Seeds Firestore with the clinic catalogue and, optionally, demo operating data.
 *
 *   npm run seed                  catalogue + demo data
 *   npm run seed -- --no-demo     catalogue only (use for a real go-live)
 *   npm run seed:clean            delete every record flagged isDemo, then exit
 *
 * Real content (services, doctors, packages, settings, menus) is written with
 * `isDemo: false` and is never touched by the clean command. Everything
 * generated to make the admin look alive — patients, appointments, invoices,
 * stock — carries `isDemo: true` so it can be removed in one step before the
 * clinic starts using the system for real.
 */

import { config } from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

config({ path: ".env.local" });
config({ path: ".env" });

import {
  DEFAULT_DOCTORS,
  DEFAULT_FAQS,
  DEFAULT_GALLERY,
  DEFAULT_MENUS,
  DEFAULT_PACKAGES,
  DEFAULT_SERVICES,
  DEFAULT_SERVICE_CATEGORIES,
  DEFAULT_SETTINGS,
  DEFAULT_TESTIMONIALS,
} from "../src/lib/cms/defaults";
import { C, DEFAULT_BRANCH_ID, SETTINGS_DOC_ID } from "../src/lib/firebase/collections";
import { INVENTORY_CATEGORIES, WHATSAPP_TEMPLATE_KEYS } from "../src/types";

/* -------------------------------------------------------------------------- */
/* Bootstrap                                                                   */
/* -------------------------------------------------------------------------- */

const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "\nMissing Firebase credentials.\n\n" +
      "Copy .env.example to .env.local and fill in FIREBASE_PROJECT_ID,\n" +
      "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY from a service account key.\n",
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();
const auth = getAuth();

const args = process.argv.slice(2);
const CLEAN_ONLY = args.includes("--clean");
const WITH_DEMO = !args.includes("--no-demo");

const now = FieldValue.serverTimestamp();
const log = (message: string) => console.log(`  ${message}`);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Firestore caps a batch at 500 writes, so large seeds are chunked. */
async function commitInChunks(writes: (() => void)[], chunkSize = 400) {
  for (let i = 0; i < writes.length; i += chunkSize) {
    const batch = db.batch();
    currentBatch = batch;
    writes.slice(i, i + chunkSize).forEach((write) => write());
    await batch.commit();
  }
}

let currentBatch: FirebaseFirestore.WriteBatch;

function randomFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/* Clean                                                                       */
/* -------------------------------------------------------------------------- */

async function cleanDemoData() {
  console.log("\nRemoving demo data…\n");

  const collections = [
    C.patients,
    C.patientMedical,
    C.patientNotes,
    C.appointments,
    C.appointmentRequests,
    C.queue,
    C.consultations,
    C.treatments,
    C.treatmentPlans,
    C.beforeAfterCases,
    C.invoices,
    C.payments,
    C.expenses,
    C.leads,
    C.products,
    C.inventoryBatches,
    C.stockMovements,
    C.suppliers,
    C.purchaseOrders,
    C.patientPackages,
    C.staff,
    C.notifications,
  ];

  let removed = 0;
  for (const collection of collections) {
    const snap = await db.collection(collection).where("isDemo", "==", true).get();
    if (snap.empty) continue;

    const writes = snap.docs.map((doc) => () => currentBatch.delete(doc.ref));
    await commitInChunks(writes);
    removed += snap.size;
    log(`${collection}: removed ${snap.size}`);
  }

  console.log(`\nDone. ${removed} demo records removed.`);
  console.log("Services, doctors, packages, settings and menus were left in place.\n");
}

/* -------------------------------------------------------------------------- */
/* Catalogue (real content)                                                    */
/* -------------------------------------------------------------------------- */

async function seedCatalogue() {
  console.log("\nSeeding clinic catalogue…\n");

  await db.collection(C.branches).doc(DEFAULT_BRANCH_ID).set(
    {
      name: "The Skin Atelier — F-11 Markaz",
      code: "F11",
      addressLine: DEFAULT_SETTINGS.addressLine,
      city: DEFAULT_SETTINGS.city,
      country: DEFAULT_SETTINGS.country,
      phone: DEFAULT_SETTINGS.phone,
      whatsapp: DEFAULT_SETTINGS.whatsapp,
      email: DEFAULT_SETTINGS.email,
      googleMapsUrl: DEFAULT_SETTINGS.googleMapsUrl,
      timezone: "Asia/Karachi",
      openingHours: DEFAULT_SETTINGS.openingHours,
      isActive: true,
      isPrimary: true,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
  log("branches: 1");

  const { id: _settingsId, ...settings } = DEFAULT_SETTINGS;
  await db
    .collection(C.settings)
    .doc(SETTINGS_DOC_ID)
    .set({ ...settings, createdAt: now, updatedAt: now }, { merge: true });
  log("settings: 1");

  const writes: (() => void)[] = [];

  for (const category of DEFAULT_SERVICE_CATEGORIES) {
    const { id, ...data } = category;
    writes.push(() =>
      currentBatch.set(db.collection(C.serviceCategories).doc(id), { ...data, createdAt: now, updatedAt: now }, { merge: true }),
    );
  }

  for (const service of DEFAULT_SERVICES) {
    const { id, ...data } = service;
    writes.push(() =>
      currentBatch.set(db.collection(C.services).doc(id), { ...data, createdAt: now, updatedAt: now }, { merge: true }),
    );
  }

  for (const doctor of DEFAULT_DOCTORS) {
    const { id, ...data } = doctor;
    writes.push(() =>
      currentBatch.set(db.collection(C.doctors).doc(id), { ...data, createdAt: now, updatedAt: now }, { merge: true }),
    );
  }

  for (const pkg of DEFAULT_PACKAGES) {
    const { id, ...data } = pkg;
    writes.push(() =>
      currentBatch.set(db.collection(C.packages).doc(id), { ...data, createdAt: now, updatedAt: now }, { merge: true }),
    );
  }

  for (const testimonial of DEFAULT_TESTIMONIALS) {
    const { id, ...data } = testimonial;
    writes.push(() =>
      currentBatch.set(db.collection(C.testimonials).doc(id), { ...data, createdAt: now, updatedAt: now }, { merge: true }),
    );
  }

  for (const faq of DEFAULT_FAQS) {
    const { id, ...data } = faq;
    writes.push(() =>
      currentBatch.set(db.collection(C.faqs).doc(id), { ...data, createdAt: now, updatedAt: now }, { merge: true }),
    );
  }

  for (const menu of DEFAULT_MENUS) {
    const { id, ...data } = menu;
    writes.push(() =>
      currentBatch.set(db.collection(C.menus).doc(id), { ...data, createdAt: now, updatedAt: now }, { merge: true }),
    );
  }

  for (const item of DEFAULT_GALLERY) {
    const { id, ...data } = item;
    writes.push(() =>
      currentBatch.set(db.collection(C.gallery).doc(id), { ...data, createdAt: now, updatedAt: now }, { merge: true }),
    );
  }

  // WhatsApp templates: never hard-code a message in application code.
  const templates: Record<string, { name: string; body: string; variables: string[] }> = {
    appointment_confirmation: {
      name: "Appointment confirmation",
      body: "Hello {{patientName}}, your appointment at {{clinicName}} is confirmed for {{date}} at {{time}} with {{doctorName}}. Please arrive 10 minutes early. To reschedule, call {{phone}}.",
      variables: ["patientName", "clinicName", "date", "time", "doctorName", "phone"],
    },
    appointment_reminder: {
      name: "Appointment reminder",
      body: "Hello {{patientName}}, a reminder of your appointment at {{clinicName}} tomorrow, {{date}} at {{time}}. Reply here if you need to change it.",
      variables: ["patientName", "clinicName", "date", "time"],
    },
    appointment_cancellation: {
      name: "Cancellation",
      body: "Hello {{patientName}}, your appointment on {{date}} at {{time}} has been cancelled. Call {{phone}} whenever you would like to rebook.",
      variables: ["patientName", "date", "time", "phone"],
    },
    follow_up: {
      name: "Follow-up",
      body: "Hello {{patientName}}, it has been {{weeks}} weeks since your {{serviceName}}. How is your skin settling? Your clinician suggested a review around now.",
      variables: ["patientName", "weeks", "serviceName"],
    },
    payment_reminder: {
      name: "Payment reminder",
      body: "Hello {{patientName}}, a balance of {{amount}} remains on invoice {{invoiceNumber}}. You can settle it at the clinic or by bank transfer. Thank you.",
      variables: ["patientName", "amount", "invoiceNumber"],
    },
    birthday: {
      name: "Birthday",
      body: "Happy birthday, {{patientName}}. From everyone at {{clinicName}} — we hope you have a lovely day.",
      variables: ["patientName", "clinicName"],
    },
    package_expiry: {
      name: "Package expiry",
      body: "Hello {{patientName}}, your {{packageName}} has {{sessionsRemaining}} sessions remaining and expires on {{expiryDate}}. Call {{phone}} to book them in.",
      variables: ["patientName", "packageName", "sessionsRemaining", "expiryDate", "phone"],
    },
    review_request: {
      name: "Review request",
      body: "Hello {{patientName}}, thank you for visiting {{clinicName}}. If you have a moment, a short review helps other people find us: {{reviewUrl}}",
      variables: ["patientName", "clinicName", "reviewUrl"],
    },
  };

  for (const key of WHATSAPP_TEMPLATE_KEYS) {
    const template = templates[key];
    writes.push(() =>
      currentBatch.set(
        db.collection(C.whatsappTemplates).doc(key),
        {
          key,
          name: template.name,
          body: template.body,
          availableVariables: template.variables,
          isActive: true,
          isDemo: false,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true },
      ),
    );
  }

  await commitInChunks(writes);

  log(`serviceCategories: ${DEFAULT_SERVICE_CATEGORIES.length}`);
  log(`services: ${DEFAULT_SERVICES.length}`);
  log(`doctors: ${DEFAULT_DOCTORS.length}`);
  log(`packages: ${DEFAULT_PACKAGES.length}`);
  log(`testimonials: ${DEFAULT_TESTIMONIALS.length}`);
  log(`faqs: ${DEFAULT_FAQS.length}`);
  log(`menus: ${DEFAULT_MENUS.length}`);
  log(`gallery: ${DEFAULT_GALLERY.length}`);
  log(`whatsappTemplates: ${WHATSAPP_TEMPLATE_KEYS.length}`);
}

/* -------------------------------------------------------------------------- */
/* First administrator                                                         */
/* -------------------------------------------------------------------------- */

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "\n  No SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD set — skipping admin creation.\n" +
        "  Add them to .env.local and re-run to create your first sign-in.",
    );
    return;
  }

  console.log("\nCreating the first administrator…\n");

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, { password, emailVerified: true });
    log(`updated existing account ${email}`);
  } catch {
    const created = await auth.createUser({
      email,
      password,
      displayName: "Clinic Administrator",
      emailVerified: true,
    });
    uid = created.uid;
    log(`created ${email}`);
  }

  // The custom claim is what the Firestore and Storage rules read.
  await auth.setCustomUserClaims(uid, { role: "SUPER_ADMIN" });

  await db.collection(C.users).doc(uid).set(
    {
      uid,
      email,
      displayName: "Clinic Administrator",
      role: "SUPER_ADMIN",
      branchIds: [DEFAULT_BRANCH_ID],
      isActive: true,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  log("role: SUPER_ADMIN");
}

/* -------------------------------------------------------------------------- */
/* Demo operating data                                                         */
/* -------------------------------------------------------------------------- */

const DEMO_NAMES = [
  "Mahnoor Abbasi", "Zainab Khan", "Fatima Rehman", "Ayesha Siddiqui", "Sana Tariq",
  "Hira Qureshi", "Amna Malik", "Rabia Hussain", "Nida Farooq", "Sadia Iqbal",
  "Hassan Mehmood", "Bilal Ahmed", "Usman Sheikh", "Kamran Ali", "Faisal Butt",
  "Mariam Javed", "Komal Nawaz", "Sobia Aslam", "Warda Yousaf", "Iqra Baig",
  "Anum Raza", "Maha Zafar", "Laiba Chaudhry", "Areeba Shah", "Noor Fatima",
];

function phoneFor(index: number) {
  return `03${String(10 + (index % 40)).padStart(2, "0")} ${String(1000000 + index * 13717).slice(0, 7)}`;
}

async function seedDemoData() {
  console.log("\nSeeding demo operating data…\n");

  const demo = { isDemo: true, branchId: DEFAULT_BRANCH_ID, createdAt: now, updatedAt: now };

  /* -- Staff ------------------------------------------------------------- */
  const staffSeed = [
    { fullName: "Nimra Shah", role: "FRONT_DESK", department: "Reception", commissionPercent: 0 },
    { fullName: "Imran Khalid", role: "INVENTORY_MANAGER", department: "Operations", commissionPercent: 0 },
    { fullName: "Hina Aslam", role: "ACCOUNTANT", department: "Finance", commissionPercent: 0 },
    { fullName: "Zara Mir", role: "MARKETING_MANAGER", department: "Marketing", commissionPercent: 0 },
    { fullName: "Dr. Sara Ahmed", role: "DOCTOR", department: "Clinical", commissionPercent: 20 },
    { fullName: "Dr. Hina Malik", role: "DOCTOR", department: "Clinical", commissionPercent: 18 },
    { fullName: "Dr. Ayesha Tariq", role: "DOCTOR", department: "Clinical", commissionPercent: 18 },
  ];

  const staffWrites = staffSeed.map((member, i) => () =>
    currentBatch.set(db.collection(C.staff).doc(), {
      ...demo,
      ...member,
      phone: phoneFor(100 + i),
      email: `${member.fullName.toLowerCase().replace(/[^a-z]+/g, ".")}@theskinatelier.pk`,
      joiningDate: Timestamp.fromDate(daysFromNow(-400 + i * 40)),
      isActive: true,
    }),
  );
  await commitInChunks(staffWrites);
  log(`staff: ${staffSeed.length}`);

  /* -- Suppliers --------------------------------------------------------- */
  const supplierSeed = [
    { name: "Allergan Distributors Pakistan", company: "ADP Pvt Ltd", paymentTerms: "30 days" },
    { name: "Derma Supplies Islamabad", company: "Derma Supplies", paymentTerms: "15 days" },
    { name: "MedEquip Solutions", company: "MedEquip", paymentTerms: "On delivery" },
    { name: "Aesthetic Consumables Co", company: "ACC", paymentTerms: "45 days" },
  ];

  const supplierIds: string[] = [];
  const supplierWrites = supplierSeed.map((supplier, i) => {
    const ref = db.collection(C.suppliers).doc();
    supplierIds.push(ref.id);
    return () =>
      currentBatch.set(ref, {
        ...demo,
        ...supplier,
        phone: phoneFor(200 + i),
        email: `orders@${supplier.company.toLowerCase().replace(/[^a-z]+/g, "")}.pk`,
        address: "Blue Area, Islamabad",
        contactPerson: "Sales Desk",
        isActive: true,
      });
  });
  await commitInChunks(supplierWrites);
  log(`suppliers: ${supplierSeed.length}`);

  /* -- Products and batches ---------------------------------------------- */
  const productSeed = [
    { name: "Botulinum Toxin 100U", category: "Botox", unit: "vial", purchase: 14000, sell: 25000, stock: 12, min: 4, retail: false },
    { name: "HA Filler 1ml (Volume)", category: "Fillers", unit: "syringe", purchase: 18000, sell: 45000, stock: 9, min: 3, retail: false },
    { name: "HA Filler 1ml (Lip)", category: "Fillers", unit: "syringe", purchase: 17000, sell: 42000, stock: 6, min: 3, retail: false },
    { name: "PRP Collection Kit", category: "PRP Supplies", unit: "kit", purchase: 3200, sell: 0, stock: 24, min: 8, retail: false },
    { name: "Microneedling Cartridge 36-pin", category: "Facial Consumables", unit: "cartridge", purchase: 1200, sell: 0, stock: 40, min: 15, retail: false },
    { name: "HydraFacial Tip Set", category: "Facial Consumables", unit: "set", purchase: 2400, sell: 0, stock: 18, min: 6, retail: false },
    { name: "Glycolic Peel 35%", category: "Creams", unit: "bottle", purchase: 4500, sell: 0, stock: 5, min: 3, retail: false },
    { name: "Nitrile Gloves (Medium)", category: "Gloves", unit: "box", purchase: 900, sell: 0, stock: 30, min: 10, retail: false },
    { name: "Insulin Syringe 31G", category: "Syringes", unit: "box", purchase: 1400, sell: 0, stock: 22, min: 8, retail: false },
    { name: "Mesotherapy Needle 32G", category: "Needles", unit: "box", purchase: 1800, sell: 0, stock: 3, min: 6, retail: false },
    { name: "Vitamin C Serum 30ml", category: "Serums", unit: "bottle", purchase: 3800, sell: 7500, stock: 26, min: 8, retail: true },
    { name: "Broad Spectrum SPF 50", category: "Skincare Products", unit: "bottle", purchase: 2200, sell: 4500, stock: 44, min: 12, retail: true },
    { name: "Retinol 0.5% Night Cream", category: "Skincare Products", unit: "jar", purchase: 4100, sell: 8200, stock: 19, min: 6, retail: true },
    { name: "Ceramide Barrier Repair", category: "Creams", unit: "tube", purchase: 2600, sell: 5200, stock: 31, min: 10, retail: true },
    { name: "Gentle Cleanser 200ml", category: "Skincare Products", unit: "bottle", purchase: 1500, sell: 3200, stock: 2, min: 10, retail: true },
    { name: "Laser Cooling Gel", category: "Laser Consumables", unit: "bottle", purchase: 1100, sell: 0, stock: 14, min: 5, retail: false },
    { name: "Surface Disinfectant 5L", category: "Cleaning Supplies", unit: "bottle", purchase: 1800, sell: 0, stock: 8, min: 3, retail: false },
    { name: "Face Masks (Box of 50)", category: "Masks", unit: "box", purchase: 700, sell: 0, stock: 26, min: 8, retail: false },
  ];

  const productRefs: { ref: FirebaseFirestore.DocumentReference; data: (typeof productSeed)[number] }[] = [];

  const productWrites = productSeed.map((product, i) => {
    const ref = db.collection(C.products).doc();
    productRefs.push({ ref, data: product });
    return () =>
      currentBatch.set(ref, {
        ...demo,
        name: product.name,
        sku: `SKU-${String(i + 1).padStart(4, "0")}`,
        category: product.category,
        brand: randomFrom(["Allergan", "Teoxane", "SkinCeuticals", "Generic", "Obagi"]),
        supplierId: randomFrom(supplierIds),
        purchasePrice: product.purchase,
        sellingPrice: product.sell,
        currentStock: product.stock,
        minimumStock: product.min,
        // Denormalised so the low-stock badge is a single indexed query.
        isLowStock: product.stock <= product.min,
        unit: product.unit,
        storageLocation: randomFrom(["Store room A", "Fridge 1", "Fridge 2", "Cabinet B"]),
        isRetail: product.retail,
        requiresBatchTracking: !product.retail,
        isActive: true,
      });
  });
  await commitInChunks(productWrites);
  log(`products: ${productSeed.length}`);

  // Batches, deliberately including some near-expiry and expired stock so the
  // FEFO and expiry screens have something meaningful to show.
  const batchWrites: (() => void)[] = [];
  const expiryOffsets = [-20, -5, 12, 25, 48, 75, 120, 200, 300, 400];

  productRefs
    .filter((p) => !p.data.retail)
    .forEach((product, i) => {
      const batchCount = 1 + (i % 2);
      for (let b = 0; b < batchCount; b += 1) {
        const offset = expiryOffsets[(i + b) % expiryOffsets.length];
        const received = Math.max(4, Math.round(product.data.stock / batchCount));
        batchWrites.push(() =>
          currentBatch.set(db.collection(C.inventoryBatches).doc(), {
            ...demo,
            productId: product.ref.id,
            productName: product.data.name,
            batchNumber: `B${String(2600 + i * 7 + b).padStart(5, "0")}`,
            quantityReceived: received,
            quantityRemaining: offset < 0 ? received : Math.max(1, received - b),
            purchaseDate: Timestamp.fromDate(daysFromNow(-120 + i * 3)),
            expiryDate: Timestamp.fromDate(daysFromNow(offset)),
            purchasePrice: product.data.purchase,
            supplierId: randomFrom(supplierIds),
            status: offset < 0 ? "Active" : "Active",
          }),
        );
      }
    });
  await commitInChunks(batchWrites);
  log(`inventoryBatches: ${batchWrites.length}`);

  /* -- Patients ----------------------------------------------------------- */
  const patientRefs: { id: string; name: string; phone: string }[] = [];
  const patientWrites: (() => void)[] = [];

  DEMO_NAMES.forEach((name, i) => {
    const ref = db.collection(C.patients).doc();
    const phone = phoneFor(i);
    patientRefs.push({ id: ref.id, name, phone });

    patientWrites.push(() =>
      currentBatch.set(ref, {
        ...demo,
        patientCode: `TSA-${String(i + 1).padStart(5, "0")}`,
        fullName: name,
        gender: i < 10 || i > 14 ? "Female" : "Male",
        dateOfBirth: Timestamp.fromDate(new Date(1985 + (i % 18), i % 12, 1 + (i % 27))),
        phone,
        whatsapp: phone,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        city: "Islamabad",
        address: randomFrom(["F-11 Markaz", "F-10/3", "E-11/2", "G-13/1", "DHA Phase 2"]),
        source: randomFrom(["Website", "Instagram", "Referral", "Walk-in", "Google", "WhatsApp"]),
        registrationDate: Timestamp.fromDate(daysFromNow(-300 + i * 11)),
        stats: {
          totalVisits: 1 + (i % 6),
          totalSpend: 15000 + i * 4300,
          outstandingBalance: i % 7 === 0 ? 12000 : 0,
        },
        loyaltyPoints: i * 35,
        isActive: true,
      }),
    );

    patientWrites.push(() =>
      currentBatch.set(db.collection(C.patientMedical).doc(ref.id), {
        ...demo,
        patientId: ref.id,
        allergies: i % 5 === 0 ? ["Lidocaine (mild)"] : [],
        skinConcerns: [randomFrom(["Pigmentation", "Acne", "Fine lines", "Dullness", "Hair loss"])],
        skinType: randomFrom(["Fitzpatrick III", "Fitzpatrick IV", "Fitzpatrick V"]),
        contraindications: i % 9 === 0 ? ["Pregnancy — defer injectables"] : [],
      }),
    );
  });

  await commitInChunks(patientWrites);
  log(`patients: ${DEMO_NAMES.length}`);

  /* -- Appointments ------------------------------------------------------- */
  const statuses = ["Booked", "Confirmed", "Arrived", "In Consultation", "Completed", "Completed", "Cancelled", "No Show"];
  const times = ["11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "16:00", "16:30", "17:00", "18:00"];

  const appointmentWrites: (() => void)[] = [];

  for (let dayOffset = -14; dayOffset <= 14; dayOffset += 1) {
    const date = dateKey(daysFromNow(dayOffset));
    const count = dayOffset === 0 ? 8 : 2 + Math.abs(dayOffset % 4);

    for (let i = 0; i < count; i += 1) {
      const patient = randomFrom(patientRefs);
      const service = randomFrom(DEFAULT_SERVICES);
      const doctor = randomFrom(DEFAULT_DOCTORS);
      const start = times[i % times.length];

      // Past appointments are resolved; future ones are still pending.
      const status =
        dayOffset < 0
          ? randomFrom(["Completed", "Completed", "Completed", "Cancelled", "No Show"])
          : dayOffset === 0
            ? randomFrom(statuses)
            : randomFrom(["Booked", "Confirmed", "Confirmed"]);

      const [h, m] = start.split(":").map(Number);
      const endMinutes = h * 60 + m + service.durationMinutes;

      appointmentWrites.push(() =>
        currentBatch.set(db.collection(C.appointments).doc(), {
          ...demo,
          patientId: patient.id,
          patientName: patient.name,
          patientPhone: patient.phone,
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          serviceId: service.id,
          serviceName: service.name,
          date,
          startTime: start,
          endTime: `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`,
          durationMinutes: service.durationMinutes,
          appointmentType: randomFrom(["Consultation", "Treatment", "Follow-up"]),
          status,
          paymentStatus: status === "Completed" ? "Paid" : "Unpaid",
          source: randomFrom(["Website", "Phone", "WhatsApp", "Walk-in", "Instagram"]),
        }),
      );
    }
  }

  await commitInChunks(appointmentWrites);
  log(`appointments: ${appointmentWrites.length}`);

  /* -- Invoices and payments ---------------------------------------------- */
  const invoiceWrites: (() => void)[] = [];

  for (let i = 0; i < 40; i += 1) {
    const patient = randomFrom(patientRefs);
    const service = randomFrom(DEFAULT_SERVICES.filter((s) => s.price));
    const quantity = 1;
    const unitPrice = service.price ?? 20000;
    const discount = i % 6 === 0 ? Math.round(unitPrice * 0.1) : 0;
    const total = unitPrice - discount;
    const paid = i % 8 === 0 ? Math.round(total / 2) : total;

    const invoiceRef = db.collection(C.invoices).doc();
    const invoiceNumber = `TSA-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`;
    const date = Timestamp.fromDate(daysFromNow(-Math.floor(i * 0.7)));

    invoiceWrites.push(() =>
      currentBatch.set(invoiceRef, {
        ...demo,
        invoiceNumber,
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        date,
        lines: [
          {
            kind: "service",
            refId: service.id,
            name: service.name,
            quantity,
            unitPrice,
            discount,
            taxRate: 0,
            total,
          },
        ],
        subtotal: unitPrice,
        discountTotal: discount,
        taxTotal: 0,
        total,
        amountPaid: paid,
        balance: total - paid,
        status: paid >= total ? "Paid" : "Partially Paid",
        cashierId: "seed",
        cashierName: "Front Desk (demo)",
      }),
    );

    invoiceWrites.push(() =>
      currentBatch.set(db.collection(C.payments).doc(), {
        ...demo,
        invoiceId: invoiceRef.id,
        invoiceNumber,
        patientId: patient.id,
        patientName: patient.name,
        amount: paid,
        method: randomFrom(["Cash", "Card", "Bank Transfer", "Easypaisa", "JazzCash"]),
        date,
        receivedBy: "seed",
        receivedByName: "Front Desk (demo)",
        isRefund: false,
      }),
    );
  }

  await commitInChunks(invoiceWrites);
  log(`invoices: 40`);
  log(`payments: 40`);

  /* -- Expenses ----------------------------------------------------------- */
  const expenseSeed = [
    { title: "Clinic rent — F-11 Markaz", category: "Rent", amount: 350000 },
    { title: "Electricity and utilities", category: "Utilities", amount: 68000 },
    { title: "Staff salaries", category: "Salaries", amount: 720000 },
    { title: "Injectable stock order", category: "Inventory", amount: 285000 },
    { title: "Instagram campaign", category: "Marketing", amount: 45000 },
    { title: "Laser device servicing", category: "Maintenance", amount: 90000 },
    { title: "Clinic management software", category: "Software", amount: 18000 },
    { title: "Reception furniture", category: "Equipment", amount: 125000 },
    { title: "Consumables restock", category: "Inventory", amount: 96000 },
    { title: "Photographer for clinic shoot", category: "Marketing", amount: 60000 },
  ];

  const expenseWrites = expenseSeed.map((expense, i) => () =>
    currentBatch.set(db.collection(C.expenses).doc(), {
      ...demo,
      ...expense,
      date: Timestamp.fromDate(daysFromNow(-2 - i * 3)),
      method: randomFrom(["Bank Transfer", "Cash", "Card"]),
      vendor: randomFrom(["Landlord", "IESCO", "Payroll", "Derma Supplies", "Meta Ads", "Service Engineer"]),
      recordedBy: "seed",
      recordedByName: "Accounts (demo)",
    }),
  );
  await commitInChunks(expenseWrites);
  log(`expenses: ${expenseSeed.length}`);

  /* -- Leads -------------------------------------------------------------- */
  const leadWrites = Array.from({ length: 18 }, (_, i) => () =>
    currentBatch.set(db.collection(C.leads).doc(), {
      ...demo,
      fullName: `${randomFrom(["Aiman", "Rida", "Zoya", "Minahil", "Eman", "Danish", "Taha"])} ${randomFrom(["Khan", "Malik", "Raza", "Sheikh", "Iqbal"])}`,
      phone: phoneFor(300 + i),
      email: `lead${i}@example.com`,
      source: randomFrom(["Website", "Instagram", "Facebook", "WhatsApp", "Google", "Referral"]),
      stage: randomFrom(["NEW", "NEW", "CONTACTED", "CONSULTATION BOOKED", "CONSULTATION COMPLETED", "CONVERTED", "LOST"]),
      interestedServiceId: randomFrom(DEFAULT_SERVICES).id,
      interestedServiceName: randomFrom(DEFAULT_SERVICES).name,
      followUpDate: Timestamp.fromDate(daysFromNow(-3 + (i % 10))),
      activities: [],
    }),
  );
  await commitInChunks(leadWrites);
  log(`leads: 18`);

  /* -- Booking requests --------------------------------------------------- */
  const requestWrites = Array.from({ length: 5 }, (_, i) => {
    const service = randomFrom(DEFAULT_SERVICES);
    return () =>
      currentBatch.set(db.collection(C.appointmentRequests).doc(), {
        ...demo,
        fullName: `${randomFrom(["Saba", "Mehwish", "Ali", "Hamza", "Nimra"])} ${randomFrom(["Ahmed", "Khan", "Butt"])}`,
        phone: phoneFor(400 + i),
        whatsapp: phoneFor(400 + i),
        email: `request${i}@example.com`,
        preferredServiceId: service.id,
        preferredServiceName: service.name,
        preferredDate: dateKey(daysFromNow(2 + i)),
        preferredTime: randomFrom(["Morning (11:00 – 13:00)", "Afternoon (13:00 – 16:00)", "Evening (16:00 – 20:00)"]),
        message: randomFrom([
          "I would like to discuss pigmentation on my cheeks.",
          "Looking for advice before my wedding in three months.",
          "Interested in what is suitable for acne scarring.",
          "Please call after 5pm, I am at work during the day.",
          "",
        ]),
        source: "Website",
        status: "New",
      });
  });
  await commitInChunks(requestWrites);
  log(`appointmentRequests: 5`);

  /* -- Notifications ------------------------------------------------------ */
  const notificationWrites = [
    {
      type: "LOW_INVENTORY",
      title: "Products below minimum stock",
      body: "Mesotherapy Needle 32G and Gentle Cleanser 200ml have fallen below their minimum level.",
      href: "/admin/inventory/products?filter=low",
      severity: "warning",
      targetRoles: ["SUPER_ADMIN", "ADMIN", "INVENTORY_MANAGER"],
    },
    {
      type: "EXPIRING_PRODUCT",
      title: "Batches expiring soon",
      body: "Several batches expire within 30 days. Use these first under FEFO.",
      href: "/admin/inventory/expiry",
      severity: "warning",
      targetRoles: ["SUPER_ADMIN", "ADMIN", "INVENTORY_MANAGER"],
    },
    {
      type: "NEW_BOOKING",
      title: "New booking requests",
      body: "Five website booking requests are waiting to be confirmed.",
      href: "/admin/clinic/requests",
      severity: "info",
      targetRoles: ["SUPER_ADMIN", "ADMIN", "FRONT_DESK", "RECEPTIONIST"],
    },
    {
      type: "UNPAID_INVOICE",
      title: "Outstanding balances",
      body: "Some invoices are only partially paid. Review before month end.",
      href: "/admin/clinic/invoices?status=Partially%20Paid",
      severity: "info",
      targetRoles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
    },
  ].map((notification) => () =>
    currentBatch.set(db.collection(C.notifications).doc(), {
      ...notification,
      readBy: [],
      branchId: DEFAULT_BRANCH_ID,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    }),
  );
  await commitInChunks(notificationWrites);
  log(`notifications: ${notificationWrites.length}`);
}

/* -------------------------------------------------------------------------- */
/* Run                                                                         */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log("\n=============================================");
  console.log("  The Skin Atelier — Firestore seed");
  console.log(`  Project: ${projectId}`);
  console.log("=============================================");

  if (CLEAN_ONLY) {
    await cleanDemoData();
    return;
  }

  await seedCatalogue();
  await seedSuperAdmin();

  if (WITH_DEMO) {
    await seedDemoData();
    console.log("\n  Demo records are flagged isDemo: true.");
    console.log("  Remove them before go-live with: npm run seed:clean");
  } else {
    console.log("\n  Skipped demo data (--no-demo).");
  }

  console.log("\nSeed complete.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nSeed failed:\n", error);
    process.exit(1);
  });
