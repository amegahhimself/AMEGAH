import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LogoStrip } from './logo-strip'
import type { LogoRef } from '@/sanity/lib/content'

const withLogo: LogoRef = {
  _id: 'c1',
  name: 'Studio One',
  logo: { asset: { _ref: 'image-a-400x200-png' } },
  url: 'https://example.com',
}
const withoutLogo: LogoRef = { _id: 'c2', name: 'Studio Two' }
const logoNoUrl: LogoRef = {
  _id: 'c3',
  name: 'Studio Three',
  logo: { asset: { _ref: 'image-b-400x200-png' } },
}

describe('LogoStrip', () => {
  it('anchors as #clients so the header nav can scroll straight to it', () => {
    const { container } = render(<LogoStrip clients={[withLogo]} partners={[]} />)
    expect(container.querySelector('#clients')).toBeInTheDocument()
  })

  it('titles the section', () => {
    render(<LogoStrip clients={[withLogo]} partners={[]} />)
    expect(screen.getByRole('heading', { name: 'Clients & Partners' })).toBeInTheDocument()
  })

  it('shows both groups when both have entries', () => {
    // Scoped to level-3 headings: the section's own big headline is also
    // literally the word "Clients" (a level-2 heading), so a bare text match
    // is ambiguous between the two.
    render(<LogoStrip clients={[withLogo]} partners={[withoutLogo]} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Clients' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Partners' })).toBeInTheDocument()
  })

  it('links a logo out when the client gave a website', () => {
    render(<LogoStrip clients={[withLogo]} partners={[]} />)
    expect(screen.getByRole('link', { name: 'Studio One' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
  })

  it('still credits a name that has no logo uploaded', () => {
    render(<LogoStrip clients={[withoutLogo]} partners={[]} />)
    expect(screen.getByText('Studio Two')).toBeInTheDocument()
  })

  it('renders an entry with no website as plain text, not a dead link', () => {
    render(<LogoStrip clients={[withoutLogo]} partners={[]} />)
    expect(screen.getByText('Studio Two')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Studio Two' }),
    ).not.toBeInTheDocument()
  })

  it('renders a logo with no website as an image, not a dead link', () => {
    render(<LogoStrip clients={[logoNoUrl]} partners={[]} />)
    expect(screen.getByAltText('Studio Three')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Studio Three' }),
    ).not.toBeInTheDocument()
  })

  it('hides a group that has no entries', () => {
    render(<LogoStrip clients={[withLogo]} partners={[]} />)
    expect(screen.queryByText('Partners')).not.toBeInTheDocument()
  })

  it('says the client list is coming soon rather than rendering an empty section — the #clients anchor must still exist for the nav link to land on', () => {
    const { container } = render(<LogoStrip clients={[]} partners={[]} />)
    expect(screen.getByText('Client list coming soon.')).toBeInTheDocument()
    expect(container.querySelector('#clients')).toBeInTheDocument()
  })
})
