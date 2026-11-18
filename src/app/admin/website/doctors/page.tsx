import { ContentPage } from "@/components/admin/content-page";

export const metadata = { title: "Doctors" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ContentPage
      kind="doctors"
      title="Doctors"
      description="Public clinician profiles. These also populate the booking form and the appointment diary."
    />
  );
}
