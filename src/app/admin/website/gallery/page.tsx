import { ContentPage } from "@/components/admin/content-page";

export const metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ContentPage
      kind="gallery"
      title="Gallery"
      description="Clinic photography for the gallery page and the Instagram-style rail on the homepage."
    />
  );
}
