import { RichText } from "./rich-text";

/**
 * Shared layout for policy pages.
 *
 * Numbered sections with a sticky contents list, which is how people actually
 * read a policy — they arrive looking for one clause, not to read it through.
 */
export function LegalDocument({
  sections,
  lastUpdated = "January 2026",
}: {
  sections: { heading: string; body: string }[];
  lastUpdated?: string;
}) {
  const anchor = (heading: string) => heading.toLowerCase().replace(/[^\w]+/g, "-");

  return (
    <div className="container-editorial section-y">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
        <nav aria-label="Contents" className="lg:col-span-3">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">Contents</p>
            <ol className="mt-5 space-y-2.5">
              {sections.map((section, i) => (
                <li key={section.heading} className="flex gap-2.5 text-sm">
                  <span aria-hidden="true" className="tabular-nums text-ink-subtle">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <a
                    href={`#${anchor(section.heading)}`}
                    className="link-reveal text-ink-muted transition-colors hover:text-ink"
                  >
                    {section.heading}
                    <span className="link-reveal-line" />
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="lg:col-span-9">
          <p className="text-sm text-ink-subtle">Last updated: {lastUpdated}</p>

          <div className="mt-10 space-y-14">
            {sections.map((section, i) => (
              <section
                key={section.heading}
                id={anchor(section.heading)}
                className="scroll-mt-32"
              >
                <h2 className="flex gap-4 font-display text-display-sm">
                  <span aria-hidden="true" className="text-champagne-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {section.heading}
                </h2>
                <div className="mt-4 max-w-[46rem]">
                  <RichText content={section.body} />
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
