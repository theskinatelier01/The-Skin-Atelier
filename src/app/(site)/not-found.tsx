import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * 404 for the public site. Reached by `notFound()` from the service, doctor and
 * blog detail routes, and by any mistyped URL. A visitor who lands here was
 * usually looking for a treatment, so send them to the catalogue rather than
 * only offering the homepage.
 */
export default function SiteNotFound() {
  return (
    <div className="container-editorial section-y">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-4 font-display text-display-sm">We could not find that page.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-muted">
          The link may be out of date, or the page may have moved. Our treatments are all listed
          below.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/services">Browse treatments</ButtonLink>
          <ButtonLink href="/book" variant="outline">
            Book a consultation
          </ButtonLink>
        </div>

        <p className="mt-10 text-sm leading-relaxed text-ink-muted">
          Or call{" "}
          <a href="tel:+923375977799" className="link-reveal font-medium text-ink">
            0337 5977799
            <span className="link-reveal-line" />
          </a>{" "}
          and we will point you in the right direction.
        </p>
      </div>
    </div>
  );
}
