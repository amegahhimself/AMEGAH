import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SelectedWorkCard } from './selected-work-card'
import type { ProjectCardData } from '@/sanity/lib/content'

const project: ProjectCardData = {
  _id: 'soproni-130',
  title: 'Soproni 130',
  slug: 'soproni-130',
  coverImage: { asset: { _ref: 'image-a-1600x900-jpg' } },
  discipline: { title: 'Director', slug: 'director', cadence: 'cinematic' },
  category: { title: 'Commercial', slug: 'commercial', parentSlug: null },
}

describe('SelectedWorkCard', () => {
  it('links to the project', () => {
    render(<SelectedWorkCard project={project} />)
    expect(screen.getByRole('link', { name: /Soproni 130/ })).toHaveAttribute(
      'href',
      '/work/soproni-130',
    )
  })

  it('shows the title and category', () => {
    render(<SelectedWorkCard project={project} />)
    expect(screen.getByText('Soproni 130')).toBeInTheDocument()
    expect(screen.getByText('Commercial')).toBeInTheDocument()
  })

  it('renders without a category when the client hasn’t set one', () => {
    render(<SelectedWorkCard project={{ ...project, category: null }} />)
    expect(screen.getByText('Soproni 130')).toBeInTheDocument()
  })

  it('offers the "View Project" hint on hover, not just a bare image', () => {
    render(<SelectedWorkCard project={project} />)
    expect(screen.getByText('View Project')).toBeInTheDocument()
  })

  it('constrains the title so it truncates inside its own column instead of overflowing into the next one', () => {
    // jsdom doesn't compute real layout, so this can't assert the visual
    // clip — it pins the specific bug that shipped once already instead:
    // `truncate` alone does nothing on a flex child, whose default
    // min-width is its content's natural width. Without min-w-0 here, a
    // long title overflows past the grid column and visually runs into
    // the next card's text row.
    render(
      <SelectedWorkCard
        project={{ ...project, title: 'A very long project title that would otherwise overflow' }}
      />,
    )
    const title = screen.getByRole('heading', { level: 3 })
    expect(title).toHaveClass('truncate', 'min-w-0')
  })
})
