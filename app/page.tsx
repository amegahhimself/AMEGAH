import { Suspense } from 'react'

import { AboutSection } from '@/components/about-section'
import { ClientsSection } from '@/components/clients-section'
import { FeaturedWork } from '@/components/featured-work'
import { HomeHero } from '@/components/home-hero'
import { PartnersSection } from '@/components/partners-section'
import { Practices } from '@/components/practices'
import {
  getClients,
  getDisciplines,
  getFeaturedProjects,
  getPartners,
  getSiteSettings,
} from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'
import { SITE_URL } from '@/lib/site-url'

export async function generateMetadata() {
  const settings = await getSiteSettings()
  if (!settings) return {}

  const title = settings.seoTitle || `${settings.name}${settings.role ? ` — ${settings.role}` : ''}`
  const ogImage = settings.ogImage?.asset
    ? urlFor(settings.ogImage).width(1200).height(630).auto('format').url()
    : undefined

  return {
    title,
    // Next 16 merges metadata with `metadata[key] ?? null`, so an explicit
    // `description: undefined` becomes `null` and overwrites (rather than
    // inherits) the root layout's description
    // (node_modules/next/dist/lib/metadata/resolve-metadata.js). Omitting
    // the key entirely when there's no value lets inheritance work.
    ...(settings.seoDescription && { description: settings.seoDescription }),
    alternates: { canonical: SITE_URL },
    openGraph: {
      title,
      ...(settings.seoDescription && { description: settings.seoDescription }),
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
  }
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeView />
    </Suspense>
  )
}

function HomeFallback() {
  return <div className="min-h-[70vh] animate-pulse bg-hairline" />
}

async function HomeView() {
  const [settings, disciplines, featured, clients, partners] = await Promise.all([
    getSiteSettings().catch(() => null),
    getDisciplines().catch(() => []),
    getFeaturedProjects().catch(() => []),
    getClients().catch(() => []),
    getPartners().catch(() => []),
  ])

  return (
    <>
      <HomeHero settings={settings} />
      <Practices disciplines={disciplines} />
      <FeaturedWork projects={featured} />
      <AboutSection settings={settings} />
      <ClientsSection clients={clients} />
      <PartnersSection partners={partners} />
    </>
  )
}
