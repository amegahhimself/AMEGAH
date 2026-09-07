import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { ContactSection } from "@/components/contact-section";
import { getDisciplines, getSiteSettings } from "@/sanity/lib/content";

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
  title: "Amegah — Director, Cinematographer & Photographer",
  description:
    "Selected directing, cinematography and photography work by Amegah.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [disciplines, settings] = await Promise.all([
    getDisciplines().catch(() => []),
    getSiteSettings().catch(() => null),
  ]);

  return (
    <html lang="en" className={`${satoshi.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
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
