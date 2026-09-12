import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/public/page-hero";
import { EditorialImage } from "@/components/public/editorial-image";
import { getBlogPosts } from "@/lib/cms/queries";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/schema";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Skin Journal",
  description:
    "Evidence-led writing on skin, hair and aesthetic medicine from the clinicians at The Skin Atelier, Islamabad.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const [lead, ...rest] = posts;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Journal", url: "/blog" },
        ])}
      />

      <PageHero
        eyebrow="Skin Journal"
        title="Writing on skin, plainly."
        description="Notes from our clinicians on what actually works, what does not, and how to tell the difference."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Journal" }]}
      />

      <div className="container-editorial section-y">
        {posts.length === 0 ? (
          <EmptyState
            title="The journal is being written"
            description="Our clinicians are preparing the first articles. In the meantime, the FAQ answers most common questions."
          />
        ) : (
          <>
            {/* Lead article */}
            <Reveal>
              <Link href={`/blog/${lead.slug}`} className="group grid gap-10 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-7">
                  <EditorialImage
                    src={lead.coverImageUrl}
                    alt={lead.title}
                    className="aspect-[3/2] w-full"
                    imgClassName="transition-transform duration-700 ease-editorial group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                  />
                </div>
                <div className="flex flex-col justify-center lg:col-span-5">
                  <p className="eyebrow">
                    {lead.categories[0] ?? "Journal"} · {formatDate(lead.publishedAt)}
                  </p>
                  <h2 className="mt-5 font-display text-display-md">
                    <span className="link-reveal">
                      {lead.title}
                      <span className="link-reveal-line" />
                    </span>
                  </h2>
                  <p className="mt-5 leading-relaxed text-ink-muted">{lead.excerpt}</p>
                  <p className="mt-7 text-xs text-ink-subtle">
                    {lead.authorName}
                    {lead.readingMinutes ? ` · ${lead.readingMinutes} min read` : ""}
                  </p>
                </div>
              </Link>
            </Reveal>

            {rest.length > 0 && (
              <div className="mt-24 grid gap-x-8 gap-y-14 border-t border-line-subtle pt-14 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, i) => (
                  <Reveal key={post.id} delay={(i % 3) * 90}>
                    <article>
                      <Link href={`/blog/${post.slug}`} className="group block">
                        <EditorialImage
                          src={post.coverImageUrl}
                          alt={post.title}
                          className="aspect-[4/3] w-full"
                          imgClassName="transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, 33vw"
                          tone={i}
                        />
                        <p className="eyebrow mt-6">
                          {post.categories[0] ?? "Journal"} · {formatDate(post.publishedAt)}
                        </p>
                        <h2 className="mt-3 font-display text-xl leading-snug">
                          <span className="link-reveal">
                            {post.title}
                            <span className="link-reveal-line" />
                          </span>
                        </h2>
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                          {post.excerpt}
                        </p>
                      </Link>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
