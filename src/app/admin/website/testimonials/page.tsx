import { ContentPage } from "@/components/admin/content-page";

export const metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ContentPage
      kind="testimonials"
      title="Testimonials"
      description="Reviews shown on the homepage carousel. Publish only what the patient has agreed to have quoted."
    />
  );
}
