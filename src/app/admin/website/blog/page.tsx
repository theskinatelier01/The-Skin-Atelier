import { ContentPage } from "@/components/admin/content-page";

export const metadata = { title: "Skin Journal" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ContentPage
      kind="blog"
      title="Skin Journal"
      description="Articles published under the clinic name. Each one carries the standard medical disclaimer automatically."
    />
  );
}
