import type { SanityImage } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

/**
 * The poster frame for a project's video.
 *
 * When the client has chosen a cover image, that is the frame they want the
 * work to be represented by, so it wins. Otherwise we return nothing and let
 * Mux generate a thumbnail from the video itself.
 */
export function posterUrl(coverImage?: SanityImage): string | undefined {
  if (!coverImage?.asset) return undefined
  return urlFor(coverImage).width(1920).auto('format').url()
}
