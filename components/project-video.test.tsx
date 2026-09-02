import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectVideo } from './project-video'

vi.mock('@mux/mux-player-react', () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-testid="mux-player"
      data-playback-id={props.playbackId as string}
      data-poster={(props.poster as string) ?? ''}
      data-plays-inline={String(props.playsInline)}
      data-autoplay={String(props.autoPlay ?? false)}
    />
  ),
}))

describe('ProjectVideo', () => {
  it('plays the requested Mux asset', () => {
    const { getByTestId } = render(<ProjectVideo playbackId="abc123" title="Nightfall" />)
    expect(getByTestId('mux-player')).toHaveAttribute('data-playback-id', 'abc123')
  })

  it('never autoplays the full film', () => {
    const { getByTestId } = render(<ProjectVideo playbackId="abc123" title="Nightfall" />)
    expect(getByTestId('mux-player')).toHaveAttribute('data-autoplay', 'false')
  })

  it('plays inline so iOS does not hijack the screen', () => {
    const { getByTestId } = render(<ProjectVideo playbackId="abc123" title="Nightfall" />)
    expect(getByTestId('mux-player')).toHaveAttribute('data-plays-inline', 'true')
  })

  it('uses the poster it is given', () => {
    const { getByTestId } = render(
      <ProjectVideo playbackId="abc123" title="Nightfall" poster="https://cdn.example/x.jpg" />,
    )
    expect(getByTestId('mux-player')).toHaveAttribute(
      'data-poster',
      'https://cdn.example/x.jpg',
    )
  })
})
