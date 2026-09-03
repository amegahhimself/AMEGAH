import type { CSSProperties } from 'react'

import { hotspotPosition } from '@/lib/card-meta'
import { cn } from '@/lib/utils'
import type { SanityImage } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'
import { BlurUpImage } from './blur-up-image'

/**
 * A cover image with real art direction: when the client has uploaded a
 * `mobileCoverImage` — a portrait-friendly crop they framed themselves, not a
 * resize of the wide one — phones get that file, in that shape, positioned by
 * that crop's own hotspot (spec 7.2 and 8).
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
 *  - reserved space: the wrapper's aspect ratio (see `coverFrameProps`) does
 *    the reserving, so CLS stays at zero. The `width`/`height` attributes are
 *    the intrinsic ratio for anything reading the markup without the CSS —
 *    `absolute inset-0 h-full w-full` neutralises them in the page itself.
 *  - blur placeholder: the LQIP data URI as the image's own background, until
 *    `BlurUpImage` clears it.
 *
 * SWITCHING IS NOT JUST THE FILE. `object-position` and `background-image`
 * cannot vary per `<source>` — CSS knows nothing about which source won. So a
 * naive `<picture>` renders the mobile crop at the *wide* image's hotspot: set
 * a subject at x≈0.8 in the wide cover and centre it in the portrait crop, and
 * every phone pushes that subject out of frame. Worse than shipping nothing.
 *
 * So the ratio, the hotspot and the placeholder all travel as CSS custom
 * properties and flip inside one media query, generated below from the single
 * `MOBILE_MAX_WIDTH` constant that also writes `<source media>`. One boundary,
 * one definition, nothing to drift.
 *
 * The `<picture>` is `display: contents` so the `<img>` still positions
 * against the caller's wrapper exactly as `next/image`'s `fill` did — the
 * wrapper owns the aspect ratio, the image just fills it.
 */

/**
 * The one definition of the art-direction boundary. `<source media>`, the
 * aspect-ratio switch and the hotspot/placeholder switch are all generated
 * from it, so the three can never disagree about where mobile ends.
 */
export const MOBILE_MAX_WIDTH = 767

/** Matches Tailwind's `md` breakpoint, where the grids go multi-column. */
export const MOBILE_MEDIA = `(max-width: ${MOBILE_MAX_WIDTH}px)`

/**
 * The literal negation of `MOBILE_MEDIA`, not `(min-width: 768px)`. Viewport
 * widths are fractional on scaled displays, and at 767.5px BOTH of those
 * queries are false — the browser would take the wide file from the `<img>`
 * while the CSS still applied the mobile crop's hotspot and placeholder.
 * Negating leaves no width unaccounted for.
 */
const DESKTOP_MEDIA = `not all and ${MOBILE_MEDIA}`

/** Sizes the frame a cover fills. Applied only when art-directing. */
const FRAME_CLASS = 'cover-frame'
/** Carries the hotspot and placeholder that switch with the source. */
const ART_CLASS = 'cover-art'

/**
 * Mobile-first: the `--cover-mobile-*` properties win, each falling back to
 * its desktop twin when there is no mobile crop. Above the breakpoint the
 * desktop properties are restored unconditionally.
 *
 * `[data-loaded='true']` outranks both blocks on specificity alone (0,2,0 vs
 * 0,1,0), so clearing the placeholder never depends on source order.
 */
export const COVER_CSS = `
.${FRAME_CLASS}{aspect-ratio:var(--cover-mobile-ratio,var(--cover-ratio))}
.${ART_CLASS}{object-position:var(--cover-mobile-position,var(--cover-position));background-image:var(--cover-mobile-lqip,var(--cover-lqip,none));background-position:var(--cover-mobile-position,var(--cover-position));background-size:cover;background-repeat:no-repeat}
@media ${DESKTOP_MEDIA}{
.${FRAME_CLASS}{aspect-ratio:var(--cover-ratio)}
.${ART_CLASS}{object-position:var(--cover-position);background-image:var(--cover-lqip,none);background-position:var(--cover-position)}
}
.${ART_CLASS}[data-loaded='true']{background-image:none}
`

/** Width ladder for the srcset. Kept short: four rungs cover phone through
 *  retina desktop without asking Sanity's CDN to mint a dozen renditions. */
const WIDTHS = [640, 1080, 1600, 2400]

/** The `src` fallback for browsers that ignore `srcset`. */
const FALLBACK_WIDTH = 1600

const DEFAULT_ASPECT_RATIO = 16 / 9

function url(image: SanityImage, width: number): string {
  return urlFor(image).width(width).auto('format').url()
}

function srcSet(image: SanityImage): string {
  return WIDTHS.map((w) => `${url(image, w)} ${w}w`).join(', ')
}

/** A `background-image` value, or the keyword that means "no placeholder". */
function lqipValue(image: SanityImage): string {
  return image.lqip ? `url("${image.lqip}")` : 'none'
}

/** The client's own portrait crop, but only once it has a file behind it. */
function usableMobile(mobileImage?: SanityImage): SanityImage | undefined {
  return mobileImage?.asset ? mobileImage : undefined
}

/**
 * Sizing props for the wrapper a `CoverImage` fills, so the frame takes the
 * *shape* of the mobile crop below the breakpoint, not just its pixels.
 *
 * Without this the feature is only half-delivered: a 1080x1350 portrait crop
 * gets `object-cover`-ed into a 390x219 16:9 box on a phone, throwing away
 * most of the frame the client composed — and charging them the bytes for it.
 * That is source swapping, not art direction.
 *
 * Returns `null` when there is nothing to art-direct (no mobile crop, or one
 * whose metadata carries no aspect ratio), so callers keep their own existing
 * sizing completely unchanged.
 *
 * The caller must drop its own aspect-ratio class or inline `aspect-ratio`
 * when this returns props — this owns the shape at both widths, and an inline
 * ratio would outrank the media query.
 */
export function coverFrameProps({
  mobileImage,
  desktopRatio,
}: {
  mobileImage?: SanityImage
  /** The shape the frame keeps above the breakpoint. */
  desktopRatio: number
}): { className: string; style: CSSProperties } | null {
  const mobileRatio = usableMobile(mobileImage)?.aspectRatio
  if (!mobileRatio) return null

  return {
    className: FRAME_CLASS,
    style: {
      '--cover-ratio': String(desktopRatio),
      '--cover-mobile-ratio': String(mobileRatio),
    } as CSSProperties,
  }
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
  /** The client's own portrait crop, shown below the breakpoint. */
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

  const mobile = usableMobile(mobileImage)

  // The intrinsic ratio, for anything reading the markup without the CSS. An
  // image whose metadata carries no aspectRatio falls back to 16:9 rather
  // than collapsing to zero.
  const width = FALLBACK_WIDTH
  const height = Math.round(width / (image.aspectRatio || DEFAULT_ASPECT_RATIO))

  // Each crop is positioned by its OWN hotspot, and blurred by its OWN LQIP.
  const style = {
    '--cover-position': hotspotPosition(image),
    '--cover-lqip': lqipValue(image),
    ...(mobile
      ? {
          '--cover-mobile-position': hotspotPosition(mobile),
          // Set explicitly rather than inherited: a mobile crop with no LQIP
          // must show nothing, not the wide image's placeholder at the wrong
          // composition and the wrong ratio.
          '--cover-mobile-lqip': lqipValue(mobile),
        }
      : null),
  } as CSSProperties

  return (
    <>
      <style href="cover-image" precedence="default">
        {COVER_CSS}
      </style>
      <picture className="contents">
        {mobile ? (
          <source media={MOBILE_MEDIA} srcSet={srcSet(mobile)} sizes={sizes} />
        ) : null}
        <BlurUpImage
          src={url(image, FALLBACK_WIDTH)}
          srcSet={srcSet(image)}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className={cn(
            ART_CLASS,
            'absolute inset-0 h-full w-full object-cover',
            className,
          )}
          style={style}
        />
      </picture>
    </>
  )
}
