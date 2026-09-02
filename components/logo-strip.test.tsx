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

  it('hides a group that has no entries', () => {
    render(<LogoStrip clients={[withLogo]} partners={[]} />)
    expect(screen.queryByText('Partners')).not.toBeInTheDocument()
  })

  it('renders nothing when there are neither clients nor partners', () => {
    const { container } = render(<LogoStrip clients={[]} partners={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
