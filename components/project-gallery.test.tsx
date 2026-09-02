import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProjectGallery } from './project-gallery'
import type { GalleryImage } from '@/sanity/lib/content'

const images: GalleryImage[] = [
  { asset: { _ref: 'image-a-1600x900-jpg' }, alt: 'On location at dawn' },
  { asset: { _ref: 'image-b-1600x900-jpg' }, caption: 'Second unit' },
]

describe('ProjectGallery', () => {
  it('renders every image', () => {
    render(<ProjectGallery images={images} title="Nightfall" />)
    expect(screen.getAllByRole('img')).toHaveLength(2)
  })

  it('uses the alt text the client wrote', () => {
    render(<ProjectGallery images={images} title="Nightfall" />)
    expect(screen.getByRole('img', { name: 'On location at dawn' })).toBeInTheDocument()
  })

  it('falls back to the project title when an image has no alt text', () => {
    render(<ProjectGallery images={images} title="Nightfall" />)
    expect(screen.getByRole('img', { name: 'Nightfall' })).toBeInTheDocument()
  })

  it('shows captions where the client wrote one', () => {
    render(<ProjectGallery images={images} title="Nightfall" />)
    expect(screen.getByText('Second unit')).toBeInTheDocument()
  })

  it('renders nothing for an empty gallery', () => {
    const { container } = render(<ProjectGallery images={[]} title="Nightfall" />)
    expect(container).toBeEmptyDOMElement()
  })
})
