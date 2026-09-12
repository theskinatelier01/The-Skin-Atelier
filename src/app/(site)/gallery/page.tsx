import type { Metadata } from "next";

import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/public/page-hero";
import { EditorialImage } from "@/components/public/editorial-image";
import { getGallery, getSettings } from "@/lib/cms/queries";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Clinic Gallery",
  description:
    "Inside The Skin Atelier — our consultation rooms, treatment suites and clinic spaces in F-11 Markaz, Islamabad.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const [items, settings] = await Promise.all([getGallery(), getSettings()]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Gallery", url: "/gallery" },
        ])}
      />

      <PageHero
        eyebrow="Gallery"
        title="Inside the clinic."
        description="A calm, private space designed so that a medical appointment does not have to feel like one."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Gallery" }]}
      />

      <div className="container-editorial section-y">
        {/* Masonry-style columns keep an editorial rhythm without cropping. */}
        <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {items.map((item, i) => (
            <li key={item.id} className="mb-5 break-inside-avoid">
              <Reveal delay={(i % 3) * 80}>
                <figure>
                  <EditorialImage
                    src={item.imageUrl}
                    alt={item.altText}
                    className={i % 3 === 1 ? "aspect-[3/4] w-full" : "aspect-[4/3] w-full"}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    tone={i}
                  />
                  {item.caption && (
                    <figcaption className="mt-3 text-xs text-ink-subtle">{item.caption}</figcaption>
                  )}
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>

        {settings.social.instagram && (
          <p className="mt-14 text-center text-sm text-ink-muted">
            More on Instagram —{" "}
            <a
              href={settings.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="link-reveal text-ink"
            >
              @theskinatelier
              <span className="link-reveal-line" />
            </a>
          </p>
        )}
      </div>
    </>
  );
}
