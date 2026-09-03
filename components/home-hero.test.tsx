import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HomeHero } from './home-hero'
import type { SiteSettings } from '@/sanity/lib/content'

// HomeHero no longer imports the Mux player directly — it lazy-loads
// hero-reel.tsx via next/dynamic({ ssr: false }) so the ~1MB player chunk
// is only fetched when the reel treatment is chosen. hero-reel.tsx is the
// module that now owns the player, but it still renders the real
// @mux/mux-player-react component internally, so mocking it here keeps
// this test asserting on the actual props that reach the player.
vi.mock('@mux/mux-player-react', () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-testid="hero-player"
      data-playback-id={props.playbackId as string}
      data-poster={props.poster as string | undefined}
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

  it('plays the showreel silently and on a loop for the reel treatment', async () => {
    render(
      <HomeHero
        settings={{ ...base, heroVariant: 'reel', heroVideo: { playbackId: 'pb1' } }}
      />,
    )
    // hero-reel.tsx is loaded via next/dynamic, so it resolves asynchronously.
    const player = await screen.findByTestId('hero-player')
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

  it('falls back to type when the chosen treatment has no asset yet', async () => {
    render(<HomeHero settings={{ ...base, heroVariant: 'reel' }} />)
    expect(screen.queryByTestId('hero-player')).not.toBeInTheDocument()
    expect(screen.getByText('Amegah')).toBeInTheDocument()
  })

  it('never constructs a reel poster URL containing fit_mode', async () => {
    // The exact regression that shipped once already: Mux's thumbnail API
    // 400s whenever fit_mode=smartcrop is combined with a requested width
    // larger than the source video's own resolution. Pin this directly so
    // it cannot recur silently.
    render(
      <HomeHero
        settings={{
          ...base,
          heroVariant: 'reel',
          heroVideo: { playbackId: 'pb1' },
          heroImages: [{ asset: { _ref: 'image-a-1600x900-jpg' } }],
        }}
      />,
    )
    const poster = await screen.findByAltText('')
    expect(poster).toHaveAttribute('src')
    expect(poster.getAttribute('src')).not.toContain('fit_mode')

    const player = await screen.findByTestId('hero-player')
    expect(player).toHaveAttribute('data-poster')
    expect(player.getAttribute('data-poster')).not.toContain('fit_mode')
  })

  it('renders a poster image in the reel branch when there is no hero still, falling back to the Mux thumbnail', async () => {
    render(
      <HomeHero
        settings={{ ...base, heroVariant: 'reel', heroVideo: { playbackId: 'pb1' } }}
      />,
    )
    const poster = await screen.findByAltText('')
    const src = poster.getAttribute('src') ?? ''
    expect(decodeURIComponent(src)).toContain('image.mux.com/pb1/thumbnail.jpg')
  })

  it('renders the typographic hero with a fallback name when there are no settings', () => {
    render(<HomeHero settings={null} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Amegah' })).toBeInTheDocument()
  })
})
