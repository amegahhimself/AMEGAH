import { Suspense } from 'react'

import { FeaturedWork } from '@/components/featured-work'
import { HomeHero } from '@/components/home-hero'
import { LogoStrip } from '@/components/logo-strip'
import { Practices } from '@/components/practices'
import {
  getClients,
  getDisciplines,
  getFeaturedProjects,
  getPartners,
  getSiteSettings,
} from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

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
    openGraph: {
      title,
      ...(settings.seoDescription && { description: settings.seoDescription }),
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
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
      <FeaturedWork projects={featured} />
      <Practices disciplines={disciplines} />
      <LogoStrip clients={clients} partners={partners} />
    </>
  )
}
