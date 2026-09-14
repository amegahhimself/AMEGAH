import { SiteHeader } from "@/components/site-header";
import { ContactSection } from "@/components/contact-section";
import { getDisciplines, getSiteSettings } from "@/sanity/lib/content";
import { SITE_URL } from "@/lib/site-url";

// The header/footer/JSON-LD chrome for the public marketing site only.
// Deliberately not in the root layout: /studio embeds Sanity Studio, which
// expects to own the full browser viewport itself. Wrapping it in this same
// header+footer pushed its own sticky document-action toolbar (Publish,
// etc.) below the visible viewport — confirmed by measuring the button's
// position against window.innerHeight while investigating a "Publish
// button doesn't work" report that was actually this layout bug, not a
// missing button. This route group keeps /studio and /api out of the
// site's chrome entirely.
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [disciplines, settings] = await Promise.all([
    getDisciplines().catch(() => []),
    getSiteSettings().catch(() => null),
  ]);

  // Person schema, not Organization — this is a solo director/DP/photographer
  // site, and settings.name/role/instagramUrl are exactly the fields a
  // search engine's Person schema wants. Only rendered once real data
  // exists so an empty dataset doesn't emit a schema with no content.
  const personSchema = settings?.name && {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.name,
    url: SITE_URL,
    ...(settings.role && { jobTitle: settings.role }),
    ...(settings.instagramUrl && { sameAs: [settings.instagramUrl] }),
  };

  return (
    <>
      {personSchema && (
        <script
          type="application/ld+json"
          // Static JSON.stringify of our own constructed object (Sanity
          // site settings), not user-supplied markup.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      )}
      <SiteHeader
        disciplines={disciplines.map((d) => ({ title: d.title, slug: d.slug }))}
        settings={settings}
      />
      <main className="flex-1">{children}</main>
      <ContactSection settings={settings} />
    </>
  );
}
