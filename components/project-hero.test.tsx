import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectHero } from './project-hero'
import type { ProjectDetail } from '@/sanity/lib/content'

vi.mock('./project-video', () => ({
  ProjectVideo: ({ playbackId }: { playbackId: string }) => (
    <div data-testid="project-video" data-playback-id={playbackId} />
  ),
}))

const base: ProjectDetail = {
  _id: 'p1',
  title: 'Nightfall',
  slug: 'nightfall',
  year: 2025,
  coverImage: { asset: { _ref: 'image-abc-1600x900-jpg' } },
  discipline: { title: 'Director', slug: 'director', cadence: 'cinematic' },
  category: { title: 'Music Videos', slug: 'music-videos', parentSlug: null },
}

describe('ProjectHero', () => {
  it('plays the film when the project has one', () => {
    render(<ProjectHero project={{ ...base, muxVideo: { playbackId: 'pb1' } }} />)
    expect(screen.getByTestId('project-video')).toHaveAttribute('data-playback-id', 'pb1')
  })

  it('falls back to the cover image for photography', () => {
    render(<ProjectHero project={base} />)
    expect(screen.queryByTestId('project-video')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Nightfall' })).toBeInTheDocument()
  })

  it('treats a video with no playback id as no video', () => {
    render(<ProjectHero project={{ ...base, muxVideo: { assetId: 'a1' } }} />)
    expect(screen.queryByTestId('project-video')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Nightfall' })).toBeInTheDocument()
  })

  it('renders nothing rather than crashing when the project has no media', () => {
    const { container } = render(
      <ProjectHero project={{ ...base, coverImage: undefined }} />,
    )
    expect(container.querySelector('img')).toBeNull()
  })
})

// A 16:9 hero is the worst possible box for a portrait photograph, so the
// hero art-directs too — not just the cards.
describe('ProjectHero mobile art direction', () => {
  const withMobile: ProjectDetail = {
    ...base,
    mobileCoverImage: { asset: { _ref: 'image-def-1080x1350-jpg' }, aspectRatio: 0.8 },
  }

  it('offers the client’s crop to phones', () => {
    const { container } = render(<ProjectHero project={withMobile} />)
    expect(container.querySelector('source')).toHaveAttribute(
      'media',
      '(max-width: 767px)',
    )
  })

  it('takes the crop’s shape below the breakpoint and 16:9 above', () => {
    const { container } = render(<ProjectHero project={withMobile} />)
    const frame = container.firstElementChild as HTMLElement
    expect(frame.className).toContain('cover-frame')
    expect(frame.className).not.toContain('aspect-video')
    expect(frame.getAttribute('style')).toContain(`--cover-ratio: ${16 / 9}`)
    expect(frame.getAttribute('style')).toContain('--cover-mobile-ratio: 0.8')
  })

  it('stays a plain 16:9 hero when the client uploaded no crop', () => {
    const { container } = render(<ProjectHero project={base} />)
    const frame = container.firstElementChild as HTMLElement
    expect(frame.className).toContain('aspect-video')
    expect(frame.className).not.toContain('cover-frame')
  })
})
