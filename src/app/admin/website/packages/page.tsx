import { ContentPage } from "@/components/admin/content-page";

export const metadata = { title: "Packages" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ContentPage
      kind="packages"
      title="Packages"
      description="Multi-session courses sold at a discount. Shown on the packages page and, when featured, on the homepage."
    />
  );
}
