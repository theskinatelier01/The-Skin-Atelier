import Link from "next/link";
import { UserPlus, Users } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { MobileRowCard, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { requirePermission } from "@/lib/auth/session";
import { getPatients } from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata = { title: "Patients" };

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("patients.read");

  const { q } = await searchParams;
  const [all, settings] = await Promise.all([getPatients(200), getSettings()]);

  // Client-side narrowing of an already-bounded list. The command palette
  // (Ctrl-K) runs the indexed prefix query for a genuine directory search.
  const patients = q
    ? all.filter((p) =>
        [p.fullName, p.phone, p.patientCode, p.email ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
    : all;

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Patients"
        description="The clinic directory. Clinical records are held separately and are visible only to clinicians."
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Patients" }]}
        actions={
          <ButtonLink href="/admin/clinic/patients/new" icon={<UserPlus />}>
            New patient
          </ButtonLink>
        }
      />

      <AdminSection
        title="Directory"
        description={`${patients.length} of ${all.length} shown`}
        action={
          <form className="flex gap-2">
            <label htmlFor="patient-search" className="sr-only">
              Search patients
            </label>
            <input
              id="patient-search"
              name="q"
              defaultValue={q}
              placeholder="Name, phone or code"
              className="h-9 w-56 rounded-sm border border-line bg-canvas-raised px-3 text-sm outline-none focus:border-accent"
            />
          </form>
        }
      >
        {patients.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={q ? "No matching patients" : "No patients yet"}
            description={
              q
                ? "Try a different name, phone number or patient code."
                : "Register the first patient to begin building the directory."
            }
            action={
              <ButtonLink href="/admin/clinic/patients/new" size="sm">
                Register a patient
              </ButtonLink>
            }
          />
        ) : (
          <>
            <div className="hidden md:block">
              <TableWrap className="rounded-none border-0">
                <Table>
                  <thead>
                    <tr>
                      <Th>Code</Th>
                      <Th>Name</Th>
                      <Th>Phone</Th>
                      <Th>Source</Th>
                      <Th>Registered</Th>
                      <Th align="right">Visits</Th>
                      <Th align="right">Lifetime value</Th>
                      <Th align="right">Balance</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <Tr key={patient.id}>
                        <Td className="whitespace-nowrap font-mono text-xs text-ink-subtle">
                          {patient.patientCode}
                        </Td>
                        <Td>
                          <Link
                            href={`/admin/clinic/patients/${patient.id}`}
                            className="font-medium hover:underline"
                          >
                            {patient.fullName}
                          </Link>
                          {patient.isDemo && (
                            <Badge tone="warning" className="ml-2">
                              Demo
                            </Badge>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap text-ink-muted">{patient.phone}</Td>
                        <Td>
                          <Badge tone="neutral">{patient.source}</Badge>
                        </Td>
                        <Td className="whitespace-nowrap text-ink-muted">
                          {formatDate(patient.registrationDate)}
                        </Td>
                        <Td align="right">{patient.stats?.totalVisits ?? 0}</Td>
                        <Td align="right">
                          {formatCurrency(patient.stats?.totalSpend ?? 0, settings.currencySymbol, {
                            compact: true,
                          })}
                        </Td>
                        <Td align="right">
                          {(patient.stats?.outstandingBalance ?? 0) > 0 ? (
                            <span className="text-danger">
                              {formatCurrency(
                                patient.stats?.outstandingBalance ?? 0,
                                settings.currencySymbol,
                                { compact: true },
                              )}
                            </span>
                          ) : (
                            <span className="text-ink-subtle">—</span>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </div>

            <div className="md:hidden">
              {patients.map((patient) => (
                <Link key={patient.id} href={`/admin/clinic/patients/${patient.id}`}>
                  <MobileRowCard
                    title={patient.fullName}
                    subtitle={`${patient.patientCode} · ${patient.phone}`}
                    meta={
                      <>
                        <Badge tone="neutral">{patient.source}</Badge>
                        <span className="text-xs text-ink-subtle">
                          {patient.stats?.totalVisits ?? 0} visits
                        </span>
                      </>
                    }
                  />
                </Link>
              ))}
            </div>
          </>
        )}
      </AdminSection>
    </>
  );
}
