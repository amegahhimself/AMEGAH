import type { Metadata } from "next";
import { Anton, Archivo_Black, Fraunces, Inter } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { ContactSection } from "@/components/contact-section";
import { getDisciplines, getSiteSettings } from "@/sanity/lib/content";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  // Real italic glyphs, not a CSS-synthesized slant — used for the "Work"
  // accent line in components/featured-work.tsx.
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// The bold condensed caps face used specifically for the name in the header
// and hero — matches the reference site's typographic treatment (see
// components/site-header.tsx and components/home-hero.tsx). Fraunces stays
// the display face everywhere else for now; this is scoped to the
// hero/header pass.
const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});

// A heavier, uncondensed grotesk for section headings ("Selected Works")
// — Anton's letterforms are tight enough that a multi-word heading reads
// cramped; this face carries the same boldness with normal proportions.
const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
  display: "swap",
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
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${anton.variable} ${archivoBlack.variable} h-full antialiased`}
    >
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
