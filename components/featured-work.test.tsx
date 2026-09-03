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

  it('titles the section', () => {
    render(<FeaturedWork projects={[make('one')]} />)
    expect(screen.getByRole('heading', { name: 'Selected Work' })).toBeInTheDocument()
  })

  it('gives only the first card priority loading, above the fold', () => {
    render(<FeaturedWork projects={[make('one'), make('two')]} />)
    expect(screen.getByAltText('one')).toHaveAttribute('loading', 'eager')
    expect(screen.getByAltText('two')).toHaveAttribute('loading', 'lazy')
  })
})
