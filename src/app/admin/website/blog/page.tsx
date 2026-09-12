import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getBlogPosts } from "@/lib/cms/queries";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "cms.blog.read")) notFound();

  const posts = await getBlogPosts(200);
  const averageRead = posts.length
    ? Math.round(posts.reduce((sum, p) => sum + (p.readingMinutes ?? 0), 0) / posts.length)
    : 0;

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Skin Journal"
        description="Articles published under the clinic name. Each one carries the standard medical disclaimer automatically."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Blog" }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Published" value={posts.length} icon={<FileText />} />
        <StatCard label="Featured" value={posts.filter((p) => p.isFeatured).length} />
        <StatCard label="Average read" value={averageRead ? `${averageRead} min` : "—"} />
      </div>

      <div className="mt-5">
        <AdminSection title="Articles" description={`${posts.length} published`}>
          {posts.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="Nothing published yet"
              description="Write the first article for the skin journal. Clinical accuracy matters more than volume."
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Title</Th>
                    <Th>Author</Th>
                    <Th>Categories</Th>
                    <Th>Published</Th>
                    <Th align="right">Read time</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <Tr key={post.id}>
                      <Td>
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="font-medium hover:underline"
                        >
                          {post.title}
                        </Link>
                        <span className="block font-mono text-xs text-ink-subtle">
                          /blog/{post.slug}
                        </span>
                      </Td>
                      <Td className="text-ink-muted">{post.authorName}</Td>
                      <Td className="text-ink-muted">{post.categories.join(", ") || "—"}</Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDate(post.publishedAt)}
                      </Td>
                      <Td align="right" className="text-ink-muted">
                        {post.readingMinutes ?? "—"} min
                      </Td>
                      <Td>
                        <Badge tone="success" dot>
                          {post.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </AdminSection>
      </div>
    </>
  );
}
