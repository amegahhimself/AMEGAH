import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AboutSection } from './about-section'
import type { PortableTextValue } from '@/sanity/lib/content'

const bio = [
  {
    _type: 'block',
    _key: 'a',
    style: 'normal',
    children: [{ _type: 'span', _key: 'a1', text: 'A working director and photographer.', marks: [] }],
  },
] as unknown as PortableTextValue

describe('AboutSection', () => {
  it('titles the section with the client’s own name', () => {
    render(<AboutSection settings={{ name: 'Amegah Boateng', role: 'Director' }} />)
    expect(screen.getByRole('heading', { name: /About Amegah Boateng/ })).toBeInTheDocument()
  })

  it('falls back to the site name when settings are unavailable', () => {
    render(<AboutSection settings={null} />)
    expect(screen.getByRole('heading', { name: /About Amegah/ })).toBeInTheDocument()
  })

  it('anchors as #about so the header nav can scroll straight to it', () => {
    const { container } = render(<AboutSection settings={null} />)
    expect(container.querySelector('#about')).toBeInTheDocument()
  })

  it('shows the real bio when one exists', () => {
    render(<AboutSection settings={{ name: 'Amegah', bio }} />)
    expect(screen.getByText('A working director and photographer.')).toBeInTheDocument()
  })

  it('says the bio is coming soon rather than showing a blank column', () => {
    render(<AboutSection settings={{ name: 'Amegah' }} />)
    expect(screen.getByText('Biography coming soon.')).toBeInTheDocument()
  })

  it('takes only the first discipline as the accent line, not the full role string', () => {
    render(<AboutSection settings={{ name: 'Amegah', role: 'Director · Cinematographer · Photographer' }} />)
    expect(screen.getByText('Director')).toBeInTheDocument()
    expect(screen.queryByText('Director · Cinematographer · Photographer')).not.toBeInTheDocument()
  })

  it('renders no accent line when there is no role set', () => {
    const { container } = render(<AboutSection settings={{ name: 'Amegah' }} />)
    expect(container.querySelectorAll('.text-outline').length).toBe(0)
  })

  it('sets the headshot in greyscale and a tall portrait ratio, matching the reference layout', () => {
    render(
      <AboutSection
        settings={{ name: 'Amegah', headshot: { asset: { _ref: 'image-a-1200x1500-jpg' } } }}
      />,
    )
    const photo = screen.getByAltText('Amegah')
    expect(photo.className).toContain('grayscale')
    expect(photo.parentElement).toHaveClass('aspect-[3/4]')
  })
})
