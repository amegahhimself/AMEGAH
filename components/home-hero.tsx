'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'

import { hotspotPosition } from '@/lib/card-meta'
import sanityImageLoader from '@/lib/sanity-image-loader'
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
  // builds a poster for project pages. When the client has only ever
  // configured the reel treatment, `heroImages` is hidden in Studio and may
  // never have been set — fall back to Mux's own public, unauthenticated
  // thumbnail CDN, built from the `playbackId` already in hand (no extra
  // fetch: pure string construction).
  const muxPoster = playbackId
    ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
    : undefined
  const rawPoster = posterUrl(still) ?? muxPoster
  // HeroReel forwards this string straight into MuxPlayer, which renders
  // its own <img> in shadow DOM from the literal URL — it never goes
  // through next/image's loader. Left as the bare source, that produced a
  // second, separate fetch from the `<Image>` rendered just above (which
  // the loader resizes per breakpoint): confirmed live, two distinct 200s
  // for the same frame.
  //
  // The fix isn't to drop the `poster` prop from HeroReel: verified in a
  // real browser (throttled network, screenshot mid-load) that MuxPlayer's
  // shadow-DOM media-controller paints an opaque solid-black background
  // behind its video element, so with no poster there is a real black
  // flash — the `<Image>` beneath does NOT show through, because MuxPlayer
  // stacks visually on top of it. So instead, resolve the poster through
  // the loader once, here, to the same clamped width Finding 2 caps the
  // `<Image>`'s largest srcset candidate at (1920) and hand that identical
  // string to both places. They can't share literally every request (the
  // `<Image>` still serves smaller srcset entries on narrower viewports),
  // but whenever the browser picks the 1920w candidate — the common case
  // for a full-bleed, high-DPR hero — both elements request the exact same
  // URL and share one HTTP cache entry instead of two.
  const poster = rawPoster ? sanityImageLoader({ src: rawPoster, width: 1920 }) : undefined

  const showReel = variant === 'reel' && playbackId
  const showStill = variant === 'still' && still?.asset

  return (
    <section className="relative flex min-h-[70vh] flex-col justify-end overflow-hidden px-6 py-20 md:min-h-[85vh]">
      {showReel && (
        <div className="absolute inset-0 bg-hairline">
          {/*
            HeroReel is loaded via next/dynamic({ ssr: false }), so nothing
            in that subtree exists in server HTML until hydration — the
            browser's preload scanner can't discover the poster until then.
            This Image DOES server-render (only the HeroReel import itself
            is client-only), so it gives the LCP element a real, priority
            `<img>` in the initial HTML. Once hydrated, MuxPlayer's own
            `poster` prop paints the identical image over this one — no
            visible change, only an earlier first paint.
          */}
          {poster && (
            <Image
              src={poster}
              alt=""
              fill
              priority
              sizes="100vw"
              placeholder={still?.lqip ? 'blur' : 'empty'}
              blurDataURL={still?.lqip}
              style={still ? { objectPosition: hotspotPosition(still) } : undefined}
              className="object-cover"
            />
          )}
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

      {/*
        The name is white and sits on top of whatever the client uploads. A
        bright reel or still leaves it unreadable — a bright showreel made the
        name completely invisible during review. This scrim darkens only the
        lower band the name and role occupy, so the imagery above stays clean.
      */}
      {(showReel || showStill) && (
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ground/90 via-ground/30 to-transparent" />
      )}

      {/*
        The name AND role now live in the header (see site-header.tsx), not
        repeated here. The reference site's hero meta row shows information
        the header doesn't (location, credentials, specialisms) — we have no
        such separate data, only the same role string, so putting it here too
        was literal duplication three lines under the header on mobile.
        <h1> stays on the page via the header's own heading semantics
        elsewhere; this hidden one keeps a single real h1 for the homepage.
      */}
      <h1 className="sr-only">{name}</h1>

      <div className="relative">
        <a
          href="#work"
          className="inline-flex min-h-11 items-center bg-accent px-6 text-sm font-medium tracking-wide text-accent-ink transition-opacity hover:opacity-90"
        >
          View Work
        </a>
      </div>

      <div className="absolute inset-x-0 bottom-6 flex justify-center md:bottom-10">
        <span className="index-meta text-ink-muted">Scroll</span>
      </div>
    </section>
  )
}
