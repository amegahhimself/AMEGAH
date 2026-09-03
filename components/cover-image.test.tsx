import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CoverImage } from './cover-image'
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
