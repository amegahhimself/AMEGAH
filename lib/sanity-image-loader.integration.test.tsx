import Image from 'next/image'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import sanityImageLoader from './sanity-image-loader'

const SRC = 'https://cdn.sanity.io/images/fknc0b0k/production/abc-1600x900.jpg?w=1600&auto=format'

/**
 * The unit tests prove the loader's own logic. These prove next/image
 * actually accepts it and builds a real srcset from it — i.e. that images
 * are served by Sanity's CDN and never routed through Vercel's optimizer,
 * which is the whole point of the custom loader.
 */
describe('next/image through the Sanity loader', () => {
  it('never routes an image through Vercel’s optimizer', () => {
    render(
      <Image loader={sanityImageLoader} src={SRC} alt="A still" width={800} height={450} />,
    )
    const img = screen.getByRole('img', { name: 'A still' })
    expect(img.getAttribute('src')).not.toContain('/_next/image')
    expect(img.getAttribute('srcset') ?? '').not.toContain('/_next/image')
  })

  it('serves the image from Sanity’s CDN', () => {
    render(
      <Image loader={sanityImageLoader} src={SRC} alt="A still" width={800} height={450} />,
    )
    expect(screen.getByRole('img', { name: 'A still' }).getAttribute('src')).toContain(
      'cdn.sanity.io',
    )
  })

  it('builds a responsive srcset at more than one width', () => {
    render(
      <Image loader={sanityImageLoader} src={SRC} alt="A still" width={800} height={450} />,
    )
    const srcset = screen.getByRole('img', { name: 'A still' }).getAttribute('srcset') ?? ''
    const widths = [...srcset.matchAll(/[?&]w=(\d+)/g)].map((m) => m[1])
    expect(new Set(widths).size).toBeGreaterThan(1)
  })

  it('does not leave the source URL’s original width on every candidate', () => {
    // Regression guard: if the loader appended instead of replacing `w`,
    // every srcset entry would still be 1600 wide.
    render(
      <Image loader={sanityImageLoader} src={SRC} alt="A still" width={800} height={450} />,
    )
    const srcset = screen.getByRole('img', { name: 'A still' }).getAttribute('srcset') ?? ''
    const widths = [...srcset.matchAll(/[?&]w=(\d+)/g)].map((m) => m[1])
    expect(widths.every((w) => w === '1600')).toBe(false)
  })
})
