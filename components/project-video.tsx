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
      style={{ width: '100%', aspectRatio: '16 / 9' }}
    />
  )
}
