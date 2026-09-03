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

// Swapping the file but keeping the 16:9 box would object-cover the client's
// portrait crop back into a landscape frame — most of what they composed
// discarded, and they paid the bytes for it.
describe('ProjectCard mobile art direction', () => {
  const withMobile = {
    ...project,
    mobileCoverImage: { asset: { _ref: 'image-def-1080x1350-jpg' }, aspectRatio: 0.8 },
  }

  function frameOf(container: HTMLElement) {
    return container.querySelector('a > div') as HTMLElement
  }

  it('takes the mobile crop’s shape below the breakpoint and the cadence’s above', () => {
    const { container } = render(
      <ProjectCard project={withMobile} index={0} cadence="cinematic" />,
    )
    const frame = frameOf(container)
    expect(frame.className).toContain('cover-frame')
    // The cadence class would pin 16:9 at every width, outranking nothing but
    // beating the media query's intent — it has to step aside.
    expect(frame.className).not.toContain('aspect-video')
    expect(frame.getAttribute('style')).toContain(`--cover-ratio: ${16 / 9}`)
    expect(frame.getAttribute('style')).toContain('--cover-mobile-ratio: 0.8')
  })

  it('keeps the photograph’s own shape as the desktop shape for the editorial grid', () => {
    const { container } = render(
      <ProjectCard
        project={{ ...withMobile, coverImage: { ...project.coverImage, aspectRatio: 1.5 } }}
        index={0}
        cadence="editorial"
      />,
    )
    expect(frameOf(container).getAttribute('style')).toContain('--cover-ratio: 1.5')
  })

  it('leaves a card with no mobile crop exactly as it was', () => {
    const { container } = render(
      <ProjectCard project={project} index={0} cadence="cinematic" />,
    )
    const frame = frameOf(container)
    expect(frame.className).toContain('aspect-video')
    expect(frame.className).not.toContain('cover-frame')
    expect(frame.getAttribute('style')).toBeNull()
  })

  it('hands the crop to the picture so a phone fetches only that file', () => {
    const { container } = render(
      <ProjectCard project={withMobile} index={0} cadence="cinematic" />,
    )
    expect(container.querySelector('source')).toHaveAttribute(
      'media',
      '(max-width: 767px)',
    )
  })
})
