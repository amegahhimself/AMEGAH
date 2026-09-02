import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDisciplines, getSiteSettings } from "@/sanity/lib/content";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
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
    getDisciplines(),
    getSiteSettings(),
  ]);

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader
          disciplines={disciplines.map((d) => ({ title: d.title, slug: d.slug }))}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
