'use client'

import MuxPlayer from '@mux/mux-player-react'

/**
 * The full film on a project page.
 *
 * It does not autoplay: this is the work itself, not a background loop, and
 * the brief is explicit that full videos must never start themselves on
 * mobile data. The visitor presses play, and it plays with its own sound.
 */
export function ProjectVideo({
  playbackId,
  title,
  poster,
}: {
  playbackId: string
  title: string
  poster?: string
}) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      poster={poster}
      title={title}
      streamType="on-demand"
      playsInline
      autoPlay={false}
      metadata={{ video_title: title }}
      accentColor="#ffffff"
      // display: 'block' matters before the custom element upgrades: an
      // unrecognised element defaults to `inline`, and width/aspect-ratio
      // don't apply to inline non-replaced boxes. The parent in
      // ProjectHero already reserves the 16:9 box via aspect-video, so this
      // just makes the player fill it instead of collapsing to zero height
      // in between.
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}
