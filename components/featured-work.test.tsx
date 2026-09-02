import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FeaturedWork } from './featured-work'
import type { ProjectCardData } from '@/sanity/lib/content'

const make = (slug: string): ProjectCardData => ({
  _id: slug,
  title: slug,
  slug,
  coverImage: { asset: { _ref: 'image-a-1600x900-jpg' } },
  discipline: { title: 'Director', slug: 'director', cadence: 'cinematic' },
  category: { title: 'Music Videos', slug: 'music-videos', parentSlug: null },
})

describe('FeaturedWork', () => {
  it('renders every featured project', () => {
    render(<FeaturedWork projects={[make('one'), make('two')]} />)
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })

  it('links each project to its page', () => {
    render(<FeaturedWork projects={[make('one')]} />)
    expect(screen.getByRole('link', { name: /one/ })).toHaveAttribute('href', '/work/one')
  })

  it('renders nothing when the client has featured nothing yet', () => {
    const { container } = render(<FeaturedWork projects={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('sizes the full slot for its full-viewport width and the half slot for its half-viewport width', () => {
    render(<FeaturedWork projects={[make('one'), make('two')]} />)
    expect(screen.getByAltText('one')).toHaveAttribute('sizes', '100vw')
    expect(screen.getByAltText('two')).toHaveAttribute(
      'sizes',
      '(min-width: 768px) 50vw, 100vw',
    )
  })

  it('spans the full slot across both grid columns and keeps the half slot to one', () => {
    render(<FeaturedWork projects={[make('one'), make('two')]} />)
    const fullWrapper = screen.getByRole('link', { name: /one/ }).parentElement
    const halfWrapper = screen.getByRole('link', { name: /two/ }).parentElement
    expect(fullWrapper).toHaveClass('md:col-span-2')
    expect(halfWrapper).not.toHaveClass('md:col-span-2')
  })
})
