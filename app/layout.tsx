import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { ContactSection } from "@/components/contact-section";
import { getDisciplines, getSiteSettings } from "@/sanity/lib/content";
import { SITE_URL } from "@/lib/site-url";

// The one typeface used everywhere on the site, per the client's explicit
// request to match benceszemerey.com exactly — same font, weight-based
// hierarchy, and casing, site-wide. Self-hosted (not next/font/google,
// which doesn't carry this face) from Fontshare's free Satoshi release; see
// app/fonts/. Weights 400/500/700 cover every hierarchy level currently in
// use — body copy, medium labels, and bold headings.
const satoshi = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Amegah — Director, Cinematographer & Photographer",
  description:
    "Selected directing, cinematography and photography work by Amegah.",
  // Pages that set their own openGraph (app/page.tsx, app/[discipline],
  // app/work/[slug]) inherit this card type by not repeating `twitter` at
  // all — Next 16 falls back to openGraph fields for a summary_large_image
  // card, so there's nothing to duplicate per page.
  twitter: {
    card: "summary_large_image",
  },
};

// themeColor moved out of `metadata` into its own export in this Next.js
// version — the build fails a lint check ("Unsupported metadata themeColor
// ... move it to viewport export instead") if it stays in `metadata`.
// Matches app/manifest.ts's background/theme_color; flat field, so (unlike
// `openGraph`) it's inherited by every page automatically.
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
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
    <html lang="en" className={`${satoshi.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
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
      </body>
    </html>
  );
}
