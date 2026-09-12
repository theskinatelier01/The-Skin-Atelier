import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { EditorialImage } from "@/components/public/editorial-image";
import { RichText } from "@/components/public/rich-text";
import { getBlogPostBySlug, getBlogPosts, getSettings } from "@/lib/cms/queries";
import { articleSchema, breadcrumbSchema, JsonLd } from "@/lib/seo/schema";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 1800;

export async function generateStaticParams() {
  const posts = await getBlogPosts(100);
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Article not found" };

  return {
    title: post.seo?.title ?? post.title,
    description: post.seo?.description ?? post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      authors: [post.authorName],
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings, all] = await Promise.all([
    getBlogPostBySlug(slug),
    getSettings(),
    getBlogPosts(20),
  ]);

  if (!post) notFound();

  const more = all.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <>
      <JsonLd data={articleSchema(post, settings)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Journal", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ])}
      />

      <PageHero
        eyebrow={`${post.categories[0] ?? "Journal"} · ${formatDate(post.publishedAt)}`}
        title={post.title}
        description={post.excerpt}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Journal", href: "/blog" },
          { label: post.title },
        ]}
      >
        <p className="mt-8 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          <span className="text-ink">{post.authorName}</span>
          {post.readingMinutes && (
            <>
              <span aria-hidden="true" className="h-3 w-px bg-line" />
              <span>{post.readingMinutes} min read</span>
            </>
          )}
        </p>
      </PageHero>

      <article className="container-editorial section-y">
        {post.coverImageUrl && (
          <EditorialImage
            src={post.coverImageUrl}
            alt={post.title}
            className="aspect-[3/2] w-full"
            sizes="100vw"
            priority
          />
        )}

        <div className="mx-auto mt-14 max-w-[42rem]">
          <RichText content={post.body} />

          {post.tags.length > 0 && (
            <ul className="mt-14 flex flex-wrap gap-2 border-t border-line-subtle pt-8">
              {post.tags.map((tag) => (
                <li key={tag} className="border border-line px-3 py-1.5 text-xs text-ink-muted">
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {/* Every clinical article carries the same disclaimer. */}
          <aside className="mt-12 border border-line-subtle bg-canvas-sunken p-6">
            <p className="text-xs leading-relaxed text-ink-muted">
              This article is general information, not medical advice, and it is not a substitute
              for an individual assessment. Treatment suitability is determined by a qualified
              clinician during consultation, and results vary from person to person.
            </p>
          </aside>

          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href="/book">Book a consultation</ButtonLink>
            <ButtonLink href="/blog" variant="outline">
              Back to the journal
            </ButtonLink>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="border-t border-line-subtle bg-canvas-sunken">
          <div className="container-editorial section-y-sm">
            <h2 className="font-display text-display-sm">More from the journal</h2>
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p, i) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group block">
                  <EditorialImage
                    src={p.coverImageUrl}
                    alt={p.title}
                    className="aspect-[4/3] w-full"
                    imgClassName="transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    tone={i}
                  />
                  <p className="eyebrow mt-5">{formatDate(p.publishedAt)}</p>
                  <h3 className="mt-2 font-display text-lg leading-snug">
                    <span className="link-reveal">
                      {p.title}
                      <span className="link-reveal-line" />
                    </span>
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
