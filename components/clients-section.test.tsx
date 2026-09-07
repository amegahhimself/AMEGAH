import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ClientsSection } from './clients-section'
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

describe('ClientsSection', () => {
  it('anchors as #clients so the header nav can scroll straight to it', () => {
    const { container } = render(<ClientsSection clients={[withLogo]} />)
    expect(container.querySelector('#clients')).toBeInTheDocument()
  })

  it('titles the section', () => {
    render(<ClientsSection clients={[withLogo]} />)
    expect(screen.getByRole('heading', { name: 'Clients' })).toBeInTheDocument()
  })

  it('links a logo out when the client gave a website', () => {
    render(<ClientsSection clients={[withLogo]} />)
    expect(screen.getByRole('link', { name: 'Studio One' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
  })

  it('still credits a name that has no logo uploaded', () => {
    render(<ClientsSection clients={[withoutLogo]} />)
    expect(screen.getByText('Studio Two')).toBeInTheDocument()
  })

  it('renders an entry with no website as plain text, not a dead link', () => {
    render(<ClientsSection clients={[withoutLogo]} />)
    expect(screen.getByText('Studio Two')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Studio Two' })).not.toBeInTheDocument()
  })

  it('renders a logo with no website as an image, not a dead link', () => {
    render(<ClientsSection clients={[logoNoUrl]} />)
    expect(screen.getByAltText('Studio Three')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Studio Three' })).not.toBeInTheDocument()
  })

  it('says the client list is coming soon rather than rendering an empty section — the #clients anchor must still exist for the nav link to land on', () => {
    const { container } = render(<ClientsSection clients={[]} />)
    expect(screen.getByText('Client list coming soon.')).toBeInTheDocument()
    expect(container.querySelector('#clients')).toBeInTheDocument()
  })
})
