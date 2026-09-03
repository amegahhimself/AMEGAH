import { describe, expect, it } from 'vitest'
import sanityImageLoader from './sanity-image-loader'

const BASE = 'https://cdn.sanity.io/images/fknc0b0k/production/abc-1600x900.jpg'

describe('sanityImageLoader', () => {
  it('asks Sanity for the width next/image actually needs', () => {
    const url = new URL(sanityImageLoader({ src: BASE, width: 800 }))
    expect(url.searchParams.get('w')).toBe('800')
  })

  it('replaces a width already baked into the source URL', () => {
    // Call sites build their src with urlFor(...).width(1600), so the loader
    // must override that per srcset entry rather than append a second `w`.
    const url = new URL(
      sanityImageLoader({ src: `${BASE}?w=1600&auto=format`, width: 400 }),
    )
    expect(url.searchParams.getAll('w')).toEqual(['400'])
  })

  it('lets Sanity negotiate the format so modern browsers get webp/avif', () => {
    const url = new URL(sanityImageLoader({ src: BASE, width: 800 }))
    expect(url.searchParams.get('auto')).toBe('format')
  })

  it('passes the requested quality through', () => {
    const url = new URL(sanityImageLoader({ src: BASE, width: 800, quality: 90 }))
    expect(url.searchParams.get('q')).toBe('90')
  })

  it('falls back to a sensible quality when none is requested', () => {
    const url = new URL(sanityImageLoader({ src: BASE, width: 800 }))
    expect(url.searchParams.get('q')).toBe('75')
  })

  it('preserves other Sanity parameters the call site set', () => {
    const url = new URL(
      sanityImageLoader({ src: `${BASE}?rect=0,0,800,600&flip=h`, width: 400 }),
    )
    expect(url.searchParams.get('rect')).toBe('0,0,800,600')
    expect(url.searchParams.get('flip')).toBe('h')
  })

  it('leaves a non-Sanity URL alone rather than rewriting it', () => {
    const external = 'https://example.com/logo.png'
    expect(sanityImageLoader({ src: external, width: 800 })).toBe(external)
  })

  it('leaves a relative path alone rather than throwing', () => {
    // new URL() throws on relative paths; a local /public asset must not break.
    expect(sanityImageLoader({ src: '/next.svg', width: 800 })).toBe('/next.svg')
  })

  describe('Mux thumbnails', () => {
    const MUX_BASE = 'https://image.mux.com/abc123/thumbnail.jpg'

    it('asks Mux for the width next/image actually needs', () => {
      const url = new URL(sanityImageLoader({ src: MUX_BASE, width: 800 }))
      expect(url.searchParams.get('width')).toBe('800')
    })

    it('never emits fit_mode, even if the input URL had one', () => {
      // fit_mode=smartcrop 400s whenever the requested width exceeds the
      // source video's own resolution — this is the exact bug being fixed.
      const url = new URL(
        sanityImageLoader({
          src: `${MUX_BASE}?width=2400&fit_mode=smartcrop`,
          width: 800,
        }),
      )
      expect(url.searchParams.has('fit_mode')).toBe(false)
      expect(url.searchParams.get('width')).toBe('800')
    })
  })
})
