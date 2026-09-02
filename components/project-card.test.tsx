import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProjectCard } from './project-card'
import type { ProjectCardData } from '@/sanity/lib/content'

const project: ProjectCardData = {
  _id: 'p1',
  title: 'Nightfall',
  slug: 'nightfall',
  year: 2025,
  coverImage: { asset: { _ref: 'image-abc-1600x900-jpg' }, hotspot: { x: 0.5, y: 0.5 } },
  discipline: { title: 'Director', slug: 'director', cadence: 'cinematic' },
  category: { title: 'Music Videos', slug: 'music-videos', parentSlug: null },
}

describe('ProjectCard', () => {
  it('links to the project page', () => {
    render(<ProjectCard project={project} index={0} cadence="cinematic" />)
    expect(screen.getByRole('link', { name: /Nightfall/ })).toHaveAttribute(
      'href',
      '/work/nightfall',
    )
  })

  it('shows the title and the archival index line', () => {
    render(<ProjectCard project={project} index={0} cadence="cinematic" />)
    expect(screen.getByText('Nightfall')).toBeInTheDocument()
    expect(screen.getByText('01 — Music Videos — 2025')).toBeInTheDocument()
  })

  it('renders a project with no image without crashing', () => {
    render(
      <ProjectCard
        project={{ ...project, coverImage: undefined }}
        index={0}
        cadence="cinematic"
      />,
    )
    expect(screen.getByText('Nightfall')).toBeInTheDocument()
  })

  it('renders a project with no category', () => {
    render(
      <ProjectCard project={{ ...project, category: null }} index={2} cadence="editorial" />,
    )
    expect(screen.getByText('03 — 2025')).toBeInTheDocument()
  })
})
