import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { WhatsAppFab } from "@/components/public/whatsapp-fab";
import { getMenus, getSettings } from "@/lib/cms/queries";
import { localBusinessSchema } from "@/lib/seo/schema";

/**
 * Public website shell.
 *
 * Header, footer and structured data are fetched once here. `getSettings` and
 * `getMenus` are request-cached, so nested pages that need the same data do
 * not trigger further reads.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, menus] = await Promise.all([getSettings(), getMenus()]);

  return (
    <>
      {/* Organisation-level structured data, emitted once per page load. */}
      <script
        type="application/ld+json"
        // Serialised from our own settings document; no visitor input reaches it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema(settings)) }}
      />

      <SiteHeader
        items={menus.primary?.items ?? []}
        clinicName={settings.clinicName}
        phone={settings.phone}
        announcement={settings.announcementBar}
      />

      <main id="main">{children}</main>

      <SiteFooter
        settings={settings}
        serviceMenu={menus["footer-services"]}
        clinicMenu={menus["footer-clinic"]}
        legalMenu={menus.legal}
      />

      <WhatsAppFab phone={settings.whatsapp} clinicName={settings.clinicName} />
    </>
  );
}
