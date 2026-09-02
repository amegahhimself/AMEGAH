'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'

import { hotspotPosition } from '@/lib/card-meta'
import { posterUrl } from '@/lib/video-poster'
import type { SiteSettings } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

// Matches the literal SiteHeader and the root layout already hardcode, so
// the typographic hero needs nothing from the CMS that isn't already
// assumed elsewhere on the page (see components/site-header.tsx, app/layout.tsx).
const FALLBACK_NAME = 'Amegah'

// The Mux player itself lives in hero-reel.tsx, loaded lazily so its ~1MB
// chunk is only fetched when the reel treatment is actually chosen.
// `ssr: false` is only permitted inside a Client Component (Next 16 docs,
// node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md) — that is
// the one reason this file still needs 'use client' now that the player
// itself has moved out.
const HeroReel = dynamic(() => import('./hero-reel').then((mod) => mod.HeroReel), {
  ssr: false,
})

/**
 * The homepage opening. The client chooses the treatment in Site Settings.
 *
 * All three treatments render the name and role identically (spec decision
 * 3) — never renders nothing, even with no Site Settings document, because
 * the header and layout already assume a name exists.
 */
export function HomeHero({ settings }: { settings: SiteSettings | null }) {
  const name = settings?.name || FALLBACK_NAME
  const variant = settings?.heroVariant ?? 'type'
  const playbackId = settings?.heroVideo?.playbackId
  const still = settings?.heroImages?.[0]
  // The first hero still doubles as the reel's poster frame — it's already
  // fetched regardless of variant, and mirrors how lib/video-poster.ts
  // builds a poster for project pages.
  const poster = posterUrl(still)

  const showReel = variant === 'reel' && playbackId
  const showStill = variant === 'still' && still?.asset

  return (
    <section className="relative flex min-h-[70vh] flex-col justify-end overflow-hidden px-6 py-20 md:min-h-[85vh]">
      {showReel && (
        <div className="absolute inset-0 bg-hairline">
          <HeroReel playbackId={playbackId} poster={poster} />
        </div>
      )}

      {showStill && (
        <div className="absolute inset-0 bg-hairline">
          <Image
            src={urlFor(still).width(2400).auto('format').url()}
            alt={name}
            fill
            priority
            sizes="100vw"
            placeholder={still.lqip ? 'blur' : 'empty'}
            blurDataURL={still.lqip}
            style={{ objectPosition: hotspotPosition(still) }}
            className="object-cover"
          />
        </div>
      )}

      <div className="relative">
        <h1
          className="font-display text-ink"
          style={{ fontSize: 'clamp(2.5rem, 10vw, 8rem)', lineHeight: 1.02 }}
        >
          {name}
        </h1>
        {settings?.role && <p className="index-meta mt-4">{settings.role}</p>}
      </div>

      <div className="absolute inset-x-0 bottom-6 flex justify-center md:bottom-10">
        <span className="index-meta text-ink-muted">Scroll</span>
      </div>
    </section>
  )
}
