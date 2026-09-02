import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LogoGroups, LogoStrip } from './logo-strip'
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
  it('shows both groups when both have entries', () => {
    render(<LogoStrip clients={[withLogo]} partners={[withoutLogo]} />)
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Partners')).toBeInTheDocument()
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

  it('renders nothing when there are neither clients nor partners', () => {
    const { container } = render(<LogoStrip clients={[]} partners={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('carries the homepage band’s own rule and page padding', () => {
    const { container } = render(<LogoStrip clients={[withLogo]} partners={[]} />)
    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('border-t')
    expect(className).toContain('px-6')
  })
})

// The Clients page supplies its own heading and page padding, so it renders
// the groups without the band chrome. Nesting the full band there doubled the
// horizontal padding and floated an inset rule across the middle of the page.
describe('LogoGroups', () => {
  it('renders the groups', () => {
    render(<LogoGroups clients={[withLogo]} partners={[]} />)
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByAltText('Studio One')).toBeInTheDocument()
  })

  it('brings no rule or page padding of its own', () => {
    const { container } = render(<LogoGroups clients={[withLogo]} partners={[]} />)
    const className = container.firstElementChild?.className ?? ''
    expect(className).not.toContain('border-t')
    expect(className).not.toContain('px-6')
  })

  it('renders nothing when there are neither clients nor partners', () => {
    const { container } = render(<LogoGroups clients={[]} partners={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
