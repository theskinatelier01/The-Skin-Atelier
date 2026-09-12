import type { ReactNode } from "react";

/**
 * Minimal rich-text renderer.
 *
 * Blog bodies are authored in a small Markdown subset and rendered into React
 * elements rather than injected as HTML. That removes the XSS surface entirely
 * — there is no `dangerouslySetInnerHTML` in this path — and avoids shipping a
 * Markdown parser plus a sanitiser to the client.
 *
 * Supported: `## h2`, `### h3`, `> quote`, `- list`, `1. list`, `---`,
 * `**bold**`, `*italic*`, `[text](url)`.
 */
export function RichText({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);
  const elements: ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  function flushList(key: string) {
    if (!listBuffer) return;
    const { ordered, items } = listBuffer;
    const Tag = ordered ? "ol" : "ul";
    elements.push(
      <Tag
        key={key}
        className={
          ordered
            ? "my-6 list-decimal space-y-2.5 pl-6 marker:text-ink-subtle"
            : "my-6 list-disc space-y-2.5 pl-6 marker:text-champagne-500"
        }
      >
        {items.map((item, i) => (
          <li key={i} className="leading-relaxed text-ink-muted">
            {inline(item)}
          </li>
        ))}
      </Tag>,
    );
    listBuffer = null;
  }

  blocks.forEach((rawBlock, index) => {
    const block = rawBlock.trim();
    if (!block) return;
    const key = `b-${index}`;

    // Lists may span several lines inside one block.
    const lines = block.split("\n");
    const isUnordered = lines.every((l) => /^[-*]\s+/.test(l.trim()));
    const isOrdered = lines.every((l) => /^\d+\.\s+/.test(l.trim()));

    if (isUnordered || isOrdered) {
      listBuffer = {
        ordered: isOrdered,
        items: lines.map((l) => l.trim().replace(/^([-*]|\d+\.)\s+/, "")),
      };
      flushList(key);
      return;
    }

    flushList(`${key}-flush`);

    if (block.startsWith("### ")) {
      elements.push(
        <h3 key={key} className="mt-12 font-display text-xl text-ink">
          {inline(block.slice(4))}
        </h3>,
      );
    } else if (block.startsWith("## ")) {
      elements.push(
        <h2 key={key} className="mt-14 font-display text-display-sm text-ink">
          {inline(block.slice(3))}
        </h2>,
      );
    } else if (block.startsWith("> ")) {
      elements.push(
        <blockquote
          key={key}
          className="my-9 border-l-2 border-champagne-400 py-1 pl-6 font-display text-xl leading-relaxed text-ink"
        >
          {inline(block.replace(/^>\s?/gm, ""))}
        </blockquote>,
      );
    } else if (/^-{3,}$/.test(block)) {
      elements.push(<hr key={key} className="my-12 border-0 border-t border-line-subtle" />);
    } else {
      elements.push(
        <p key={key} className="my-5 leading-[1.75] text-ink-muted">
          {inline(block)}
        </p>,
      );
    }
  });

  flushList("tail");

  return <div className="text-[1.0625rem]">{elements}</div>;
}

/** Parses bold, italic and links inside a block of text. */
function inline(text: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern).filter(Boolean);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }

    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      // Only http(s), mailto, tel and same-site paths are rendered as links;
      // anything else (javascript:, data:) falls through to plain text.
      const safe = /^(https?:\/\/|\/|mailto:|tel:)/i.test(href);
      if (!safe) return <span key={i}>{label}</span>;

      const external = href.startsWith("http");
      return (
        <a
          key={i}
          href={href}
          className="link-reveal text-ink underline-offset-4"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
          <span className="link-reveal-line" />
        </a>
      );
    }

    return <span key={i}>{part}</span>;
  });
}
