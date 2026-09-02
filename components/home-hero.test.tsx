import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HomeHero } from './home-hero'
import type { SiteSettings } from '@/sanity/lib/content'

vi.mock('@mux/mux-player-react', () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-testid="hero-player"
      data-playback-id={props.playbackId as string}
      data-autoplay={String(props.autoPlay ?? false)}
      data-muted={String(props.muted ?? false)}
      data-loop={String(props.loop ?? false)}
    />
  ),
}))

const base: SiteSettings = { name: 'Amegah', role: 'Director · Cinematographer' }

describe('HomeHero', () => {
  it('always shows the name and role, whichever treatment is chosen', () => {
    for (const heroVariant of ['reel', 'still', 'type'] as const) {
      const { unmount } = render(<HomeHero settings={{ ...base, heroVariant }} />)
      expect(screen.getByText('Amegah')).toBeInTheDocument()
      expect(screen.getByText('Director · Cinematographer')).toBeInTheDocument()
      unmount()
    }
  })

  it('plays the showreel silently and on a loop for the reel treatment', () => {
    render(
      <HomeHero
        settings={{ ...base, heroVariant: 'reel', heroVideo: { playbackId: 'pb1' } }}
      />,
    )
    const player = screen.getByTestId('hero-player')
    expect(player).toHaveAttribute('data-playback-id', 'pb1')
    expect(player).toHaveAttribute('data-autoplay', 'true')
    expect(player).toHaveAttribute('data-muted', 'true')
    expect(player).toHaveAttribute('data-loop', 'true')
  })

  it('shows the first still for the still treatment', () => {
    render(
      <HomeHero
        settings={{
          ...base,
          heroVariant: 'still',
          heroImages: [{ asset: { _ref: 'image-a-1600x900-jpg' } }],
        }}
      />,
    )
    expect(screen.getByRole('img', { name: 'Amegah' })).toBeInTheDocument()
  })

  it('falls back to type when the chosen treatment has no asset yet', () => {
    render(<HomeHero settings={{ ...base, heroVariant: 'reel' }} />)
    expect(screen.queryByTestId('hero-player')).not.toBeInTheDocument()
    expect(screen.getByText('Amegah')).toBeInTheDocument()
  })

  it('renders nothing when there are no settings at all', () => {
    const { container } = render(<HomeHero settings={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
