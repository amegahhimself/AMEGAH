'use client'

/**
 * Serves `next/image` straight from Sanity's image CDN instead of routing
 * every image through Vercel's optimizer.
 *
 * Sanity already resizes and format-negotiates on its own CDN, so proxying
 * through Vercel paid for the same work twice — and Vercel's Hobby plan caps
 * image transformations per month, which an image-led portfolio would
 * eventually exhaust, pausing the site until the next billing cycle.
 *
 * `next/image` keeps everything else it is good for: lazy loading, reserved
 * layout space, blur placeholders and responsive `srcset`. Only the resizing
 * moves.
 *
 * The App Router requires this file to be a Client Component so the function
 * can be serialized — see the `loaderFile` docs.
 */
export default function sanityImageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    // Relative paths (e.g. a /public asset) aren't Sanity's to serve.
    return src
  }

  if (url.hostname === 'image.mux.com') {
    // Mux's thumbnail API takes `width` (not Sanity's `w`), and rejects
    // fit_mode=smartcrop whenever the requested width exceeds the source
    // video's own resolution — fit_mode is dropped unconditionally rather
    // than worked around. Clamped to 1920: this poster is a full-bleed
    // background behind a video player, never a print-quality asset, and an
    // unclamped request can ask Mux to upscale a source video far past its
    // own resolution for no visible gain (a 1280x720 source was seen
    // upscaled to a 3840x2160, ~760KB request on a high-DPR full-width view).
    url.searchParams.set('width', String(Math.min(width, 1920)))
    url.searchParams.delete('fit_mode')
    return url.toString()
  }

  if (url.hostname !== 'cdn.sanity.io') {
    return src
  }

  // `set` rather than `append`: call sites build their src with
  // urlFor(...).width(n), and each srcset entry must replace that width
  // rather than add a competing one.
  url.searchParams.set('w', String(width))
  url.searchParams.set('q', String(quality ?? 75))
  url.searchParams.set('auto', 'format')

  return url.toString()
}
