'use client'

import { useCallback, useState, type ComponentProps } from 'react'

/**
 * An `<img>` that drops its LQIP placeholder once the real file has settled —
 * the lifecycle `next/image` gave its blur placeholder, which a hand-rolled
 * `<picture>` otherwise loses.
 *
 * Leaving the placeholder in place is not harmless. A cover uploaded as a
 * transparent PNG — a title card or a logo treatment, and Sanity's
 * `auto=format` keeps the alpha in WebP — would show the blur through its
 * transparent areas forever. A fetch that fails would show blur *plus* alt
 * text rather than the browser's broken-image state.
 *
 * The placeholder itself is a CSS custom property on the element (see
 * `cover-image.tsx`), so clearing it is a single data attribute rather than an
 * imperative style write, and the art-directed mobile/desktop placeholders
 * both switch off together.
 *
 * This is the only part of the cover that needs to be a Client Component, so
 * it is split out here: `cover-image.tsx` stays on the server and Sanity's
 * image-URL builder stays out of the browser bundle.
 */
export function BlurUpImage(props: ComponentProps<'img'>) {
  const [settled, setSettled] = useState(false)

  // A cached image can finish decoding before hydration, so `load` never
  // fires for it. Checking `complete` as the element attaches covers that.
  // `complete` is also true for an image that failed, which is what we want:
  // either way the placeholder has done its job and should go.
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) setSettled(true)
  }, [])

  const settle = () => setSettled(true)

  return (
    /* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text --
       deliberate: art direction needs <picture>/<source media>, which
       next/image cannot express (see cover-image.tsx). `alt` arrives through
       the spread, and CoverImage makes it a required prop. */
    <img
      {...props}
      ref={ref}
      data-loaded={settled ? 'true' : 'false'}
      onLoad={settle}
      onError={settle}
    />
  )
}
