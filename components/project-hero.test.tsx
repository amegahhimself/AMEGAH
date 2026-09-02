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
