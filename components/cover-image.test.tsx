import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  COVER_CSS,
  CoverImage,
  MOBILE_MAX_WIDTH,
  MOBILE_MEDIA,
  coverFrameProps,
} from './cover-image'
import type { SanityImage } from '@/sanity/lib/content'

const wide = { asset: { _ref: 'image-abc-2400x1350-jpg' }, aspectRatio: 1.78 } as SanityImage
const tall = { asset: { _ref: 'image-def-1080x1350-jpg' }, aspectRatio: 0.8 } as SanityImage

describe('CoverImage', () => {
  it('renders the image', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    expect(container.querySelector('img')).toHaveAttribute('alt', 'A still')
  })

  it('offers the mobile crop to narrow screens when the client uploaded one', () => {
    const { container } = render(
      <CoverImage image={wide} mobileImage={tall} alt="A still" />,
    )
    const source = container.querySelector('source')
    expect(source).toHaveAttribute('media', '(max-width: 767px)')
  })

  it('offers no alternate source when there is no mobile crop', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    expect(container.querySelector('source')).toBeNull()
  })

  it('lazy-loads by default so a grid of covers is not fetched at once', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy')
  })

  it('loads eagerly when it is the page’s hero', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" priority />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })

  it('reserves layout space so the page does not shift as it loads', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('width')
    expect(img).toHaveAttribute('height')
  })

  it('renders nothing without an image, rather than an empty box', () => {
    const { container } = render(<CoverImage alt="A still" />)
    expect(container).toBeEmptyDOMElement()
  })
})

// `object-position` and `background-image` cannot vary per <source>, so a
// naive <picture> renders the client's portrait crop at the WIDE image's
// hotspot — a subject framed at x=0.8 in the wide cover gets pushed out of
// the portrait frame on every phone. These pin the switch.
describe('CoverImage per-source art direction', () => {
  const wideHotspot = { ...wide, hotspot: { x: 0.8, y: 0.5 }, lqip: 'data:image/jpeg;base64,WIDE' }
  const tallHotspot = { ...tall, hotspot: { x: 0.5, y: 0.3 }, lqip: 'data:image/jpeg;base64,TALL' }

  function renderArtDirected() {
    const { container } = render(
      <CoverImage image={wideHotspot} mobileImage={tallHotspot} alt="A still" />,
    )
    return container.querySelector('img')!
  }

  it('offers each screen its own crop file, not two sizes of one', () => {
    const { container } = render(
      <CoverImage image={wide} mobileImage={tall} alt="A still" />,
    )
    const mobileSrcSet = container.querySelector('source')?.getAttribute('srcset') ?? ''
    expect(mobileSrcSet).toContain('def-1080x1350')
    expect(mobileSrcSet).not.toContain('abc-2400x1350')
    expect(container.querySelector('img')?.getAttribute('srcset')).toContain(
      'abc-2400x1350',
    )
  })

  it('positions the mobile crop by its own hotspot, not the wide one’s', () => {
    const style = renderArtDirected().getAttribute('style') ?? ''
    expect(style).toContain('--cover-position: 80% 50%')
    expect(style).toContain('--cover-mobile-position: 50% 30%')
  })

  it('blurs the mobile crop with its own placeholder, not the wide one’s', () => {
    const style = renderArtDirected().getAttribute('style') ?? ''
    expect(style).toContain('--cover-lqip: url("data:image/jpeg;base64,WIDE")')
    expect(style).toContain('--cover-mobile-lqip: url("data:image/jpeg;base64,TALL")')
  })

  it('shows no placeholder at all when the mobile crop has none, rather than the wide image’s', () => {
    const { container } = render(
      <CoverImage image={wideHotspot} mobileImage={tall} alt="A still" />,
    )
    const style = container.querySelector('img')?.getAttribute('style') ?? ''
    expect(style).toContain('--cover-mobile-lqip: none')
  })

  it('sets no mobile properties when there is no mobile crop', () => {
    const { container } = render(<CoverImage image={wideHotspot} alt="A still" />)
    const style = container.querySelector('img')?.getAttribute('style') ?? ''
    expect(style).not.toContain('--cover-mobile')
  })

  it('switches file, hotspot and placeholder at ONE breakpoint, from one definition', () => {
    expect(MOBILE_MEDIA).toBe(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    // The stylesheet negates the SAME query the <source> uses rather than
    // restating it as `min-width: 768px`: at a fractional 767.5px viewport
    // both of those would be false, and the wide file would be drawn with
    // the mobile crop's hotspot. Negation leaves no width unaccounted for.
    const desktopQuery = `@media not all and ${MOBILE_MEDIA}`
    expect(COVER_CSS).toContain(desktopQuery)
    expect(COVER_CSS).not.toContain('min-width')
    // Every switching property flips inside that one query.
    const desktopBlock = COVER_CSS.split(desktopQuery)[1]
    expect(desktopBlock).toContain('aspect-ratio:var(--cover-ratio)')
    expect(desktopBlock).toContain('object-position:var(--cover-position)')
    expect(desktopBlock).toContain('background-image:var(--cover-lqip,none)')
  })
})

// A transparent PNG cover (a title card, a logo treatment) would otherwise
// show the blur through its transparent areas forever, and a failed fetch
// would show blur plus alt text instead of a broken-image state.
describe('CoverImage placeholder lifecycle', () => {
  it('holds the placeholder until the file has painted', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    expect(container.querySelector('img')).toHaveAttribute('data-loaded', 'false')
    expect(COVER_CSS).toContain("[data-loaded='true']{background-image:none}")
  })

  it('drops the placeholder once the image loads', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    const img = container.querySelector('img')!
    fireEvent.load(img)
    expect(img).toHaveAttribute('data-loaded', 'true')
  })

  it('drops the placeholder when the fetch fails, so the browser can show its own broken state', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    const img = container.querySelector('img')!
    fireEvent.error(img)
    expect(img).toHaveAttribute('data-loaded', 'true')
  })
})

// Fetching the portrait crop and then object-cover-ing it into a 16:9 box
// throws away most of what the client framed — and charges them the bytes.
describe('coverFrameProps', () => {
  it('gives the frame the mobile shape below the breakpoint and the desktop shape above', () => {
    const frame = coverFrameProps({ mobileImage: tall, desktopRatio: 16 / 9 })
    expect(frame?.style).toMatchObject({
      '--cover-ratio': String(16 / 9),
      '--cover-mobile-ratio': '0.8',
    })
    expect(COVER_CSS).toContain('aspect-ratio:var(--cover-mobile-ratio,var(--cover-ratio))')
  })

  it('leaves a card with no mobile crop entirely alone', () => {
    expect(coverFrameProps({ desktopRatio: 16 / 9 })).toBeNull()
    expect(coverFrameProps({ mobileImage: undefined, desktopRatio: 1.5 })).toBeNull()
  })

  it('leaves the frame alone when the mobile crop has no ratio to switch to', () => {
    const noRatio = { asset: { _ref: 'image-ghi-100x100-jpg' } } as SanityImage
    expect(coverFrameProps({ mobileImage: noRatio, desktopRatio: 16 / 9 })).toBeNull()
  })
})
