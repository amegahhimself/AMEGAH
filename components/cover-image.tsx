import { hotspotPosition } from '@/lib/card-meta'
import { cn } from '@/lib/utils'
import type { SanityImage } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

/**
 * A cover image with real art direction: when the client has uploaded a
 * `mobileCoverImage` — a portrait-friendly crop they framed themselves, not a
 * resize of the wide one — phones get that file instead (spec 7.2 and 8).
 *
 * WHY THIS IS A `<picture>` AND NOT `next/image` — please don't "fix" it back:
 *
 *  - Art direction means swapping the *source file* at a breakpoint, and the
 *    only mechanism for that is `<source media>` inside `<picture>`. The
 *    browser picks exactly one source and fetches exactly one file.
 *  - The obvious `next/image` workaround — two <Image>s toggled with
 *    `hidden` / `md:block` — makes browsers fetch BOTH images. `display:none`
 *    does not cancel an image load. That is the exact opposite of the point,
 *    and it costs the most on the slow mobile connections this is meant to
 *    help.
 *
 * What we give up by leaving `next/image` is small here, because
 * `lib/sanity-image-loader.ts` already sends these straight to Sanity's CDN
 * rather than through Vercel's optimizer. So `next/image` was only
 * contributing `srcset`, lazy loading, reserved layout space and the blur
 * placeholder — all four of which this component writes out explicitly:
 *
 *  - `srcset` / `sizes`: built below from the same width ladder and the same
 *    `urlFor(...).width(w).auto('format')` URLs the loader would have produced.
 *  - lazy loading: `loading="lazy"` by default, `eager` + `fetchpriority=high`
 *    for a hero.
 *  - reserved space: explicit `width`/`height` from the image's own
 *    `aspectRatio`, so nothing shifts as it loads (CLS stays at zero).
 *  - blur placeholder: the LQIP data URI as the image's own background, so it
 *    shows through until the real pixels paint.
 *
 * The `<picture>` is `display: contents` so the `<img>` still positions
 * against the caller's wrapper exactly as `next/image`'s `fill` did — the
 * wrapper owns the aspect ratio, the image just fills it.
 */

/** Width ladder for the srcset. Kept short: four rungs cover phone through
 *  retina desktop without asking Sanity's CDN to mint a dozen renditions. */
const WIDTHS = [640, 1080, 1600, 2400]

/** The `src` fallback for browsers that ignore `srcset`. */
const FALLBACK_WIDTH = 1600

/** Portrait phones and below. Matches Tailwind's `md` breakpoint, so the
 *  swap lines up with the layouts that go single-column there. */
const MOBILE_MEDIA = '(max-width: 767px)'

const DEFAULT_ASPECT_RATIO = 16 / 9

function url(image: SanityImage, width: number): string {
  return urlFor(image).width(width).auto('format').url()
}

function srcSet(image: SanityImage): string {
  return WIDTHS.map((w) => `${url(image, w)} ${w}w`).join(', ')
}

export function CoverImage({
  image,
  mobileImage,
  alt,
  sizes,
  priority = false,
  className,
}: {
  image?: SanityImage
  /** The client's own portrait crop, shown below 768px. */
  mobileImage?: SanityImage
  alt: string
  /** Same syntax as `next/image`; applies to both the wide and mobile source. */
  sizes?: string
  /** Above the fold — load it eagerly and at high priority. */
  priority?: boolean
  /** Extra classes for the `<img>` itself (transitions, hover, etc.). */
  className?: string
}) {
  // No asset means the client hasn't uploaded anything: render nothing rather
  // than an empty box with a broken image icon.
  if (!image?.asset) return null

  const mobile = mobileImage?.asset ? mobileImage : undefined

  // Reserve the space before a byte arrives. An image whose metadata carries
  // no aspectRatio falls back to 16:9 rather than collapsing to zero.
  const ratio = image.aspectRatio || DEFAULT_ASPECT_RATIO
  const width = FALLBACK_WIDTH
  const height = Math.round(width / ratio)

  // The hotspot keeps the subject in frame at whatever ratio the wrapper is.
  const objectPosition = hotspotPosition(image)

  // The LQIP is a tiny data URI; as the image's own background it shows
  // through the transparent img box until the real file paints — the same
  // effect as next/image's blur placeholder, minus the wrapper element.
  const lqip = image.lqip ?? mobile?.lqip

  return (
    <picture className="contents">
      {mobile ? (
        <source media={MOBILE_MEDIA} srcSet={srcSet(mobile)} sizes={sizes} />
      ) : null}
      <img
        src={url(image, FALLBACK_WIDTH)}
        srcSet={srcSet(image)}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
        style={{
          objectPosition,
          ...(lqip
            ? {
                backgroundImage: `url(${lqip})`,
                backgroundSize: 'cover',
                backgroundPosition: objectPosition,
              }
            : null),
        }}
      />
    </picture>
  )
}
