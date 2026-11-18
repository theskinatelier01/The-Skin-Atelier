import { ContentPage } from "@/components/admin/content-page";

export const metadata = { title: "Frequently Asked Questions" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ContentPage
      kind="faqs"
      title="Frequently Asked Questions"
      description="Shown on the FAQ page and emitted as FAQ structured data, so accurate wording here affects search results."
    />
  );
}
