'use client'

import MuxPlayer from '@mux/mux-player-react'
import Image from 'next/image'

import { hotspotPosition } from '@/lib/card-meta'
import type { SiteSettings } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

/**
 * The homepage opening. The client chooses the treatment in Site Settings.
 *
 * The showreel here DOES autoplay, muted and looping — that is the
 * "background/showreel" case the brief sanctions. It is the opposite of
 * ProjectVideo, which must never autoplay because that is the full film.
 * Keep the two straight.
 */
export function HomeHero({ settings }: { settings: SiteSettings | null }) {
  if (!settings) return null

  const variant = settings.heroVariant ?? 'type'
  const playbackId = settings.heroVideo?.playbackId
  const still = settings.heroImages?.[0]

  const showReel = variant === 'reel' && playbackId
  const showStill = variant === 'still' && still?.asset

  return (
    <section className="relative flex min-h-[70vh] flex-col justify-end overflow-hidden px-6 py-20 md:min-h-[85vh]">
      {showReel && (
        <div className="absolute inset-0 bg-hairline">
          <MuxPlayer
            playbackId={playbackId}
            streamType="on-demand"
            autoPlay
            muted
            loop
            playsInline
            accentColor="#ffffff"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      )}

      {showStill && (
        <div className="absolute inset-0 bg-hairline">
          <Image
            src={urlFor(still).width(2400).auto('format').url()}
            alt={settings.name}
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
          {settings.name}
        </h1>
        {settings.role && <p className="index-meta mt-4">{settings.role}</p>}
      </div>
    </section>
  )
}
