import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HeroReel } from './hero-reel'

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

function mockReducedMotion(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HeroReel', () => {
  it('autoplays muted and looping when the visitor has no motion preference', () => {
    mockReducedMotion(false)
    render(<HeroReel playbackId="pb1" poster="https://example.com/poster.jpg" />)
    const player = screen.getByTestId('hero-player')
    expect(player).toHaveAttribute('data-playback-id', 'pb1')
    expect(player).toHaveAttribute('data-autoplay', 'true')
    expect(player).toHaveAttribute('data-muted', 'true')
    expect(player).toHaveAttribute('data-loop', 'true')
  })

  it('holds on the poster instead of autoplaying when the visitor prefers reduced motion', () => {
    mockReducedMotion(true)
    render(<HeroReel playbackId="pb1" poster="https://example.com/poster.jpg" />)
    expect(screen.queryByTestId('hero-player')).not.toBeInTheDocument()
    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      'https://example.com/poster.jpg',
    )
  })

  it('renders nothing under reduced motion when there is no poster to hold on', () => {
    mockReducedMotion(true)
    const { container } = render(<HeroReel playbackId="pb1" />)
    expect(container).toBeEmptyDOMElement()
  })
})
