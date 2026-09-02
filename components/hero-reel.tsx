'use client'

import MuxPlayer from '@mux/mux-player-react'
import type { MuxPlayerCSSProperties } from '@mux/mux-player-react'
import { useEffect, useState } from 'react'

/**
 * The homepage showreel: a silent, looping background video.
 *
 * This DOES autoplay, muted and looping — that is the "background/showreel"
 * case the brief sanctions. It is the opposite of ProjectVideo, which must
 * never autoplay because that is the full film. Keep the two straight.
 *
 * Split out from HomeHero and loaded via `next/dynamic({ ssr: false })` so
 * the ~1MB Mux Player chunk is only fetched when the reel treatment is
 * actually chosen — the other two hero treatments never pay for it.
 *
 * Mux Player's shadow DOM defaults to `object-fit: contain` and renders its
 * own controls, neither of which suit a full-bleed silent loop, so both are
 * overridden via the documented CSS custom properties (see
 * node_modules/@mux/mux-player/dist/mux-player.mjs).
 */
export function HeroReel({ playbackId, poster }: { playbackId: string; poster?: string }) {
  // WCAG 2.2.2: a full-viewport autoplaying loop with controls hidden has no
  // pause affordance. Respecting the visitor's reduced-motion preference is
  // the simplest correct fix — hold on the poster instead of ever starting
  // playback. app/globals.css's reduced-motion block only kills CSS
  // animations/transitions, so video playback needs this separate check.
  // This only ever mounts client-side (loaded via next/dynamic({ ssr: false })
  // from HomeHero), so window is available for the lazy initializer.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  if (prefersReducedMotion) {
    if (!poster) return null
    return (
      // eslint-disable-next-line @next/next/no-img-element -- decorative background stand-in, not a real <Image>
      <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
    )
  }

  return (
    <MuxPlayer
      playbackId={playbackId}
      poster={poster}
      streamType="on-demand"
      autoPlay
      muted
      loop
      playsInline
      nohotkeys
      accentColor="#ffffff"
      style={
        {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          '--controls': 'none',
          '--media-object-fit': 'cover',
        } as MuxPlayerCSSProperties
      }
    />
  )
}
