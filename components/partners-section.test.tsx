import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PartnersSection } from './partners-section'
import type { LogoRef } from '@/sanity/lib/content'

const withLogo: LogoRef = {
  _id: 'p1',
  name: 'Harmattan Post',
  logo: { asset: { _ref: 'image-a-400x200-png' } },
  url: 'https://example.com',
}
const withoutLogo: LogoRef = { _id: 'p2', name: 'North Star Sound' }

describe('PartnersSection', () => {
  it('anchors as #partners so the header nav can scroll straight to it', () => {
    const { container } = render(<PartnersSection partners={[withLogo]} />)
    expect(container.querySelector('#partners')).toBeInTheDocument()
  })

  it('titles the section', () => {
    render(<PartnersSection partners={[withLogo]} />)
    expect(screen.getByRole('heading', { name: 'Partners' })).toBeInTheDocument()
  })

  it('links a logo out when the partner gave a website', () => {
    render(<PartnersSection partners={[withLogo]} />)
    expect(screen.getByRole('link', { name: 'Harmattan Post' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
  })

  it('still credits a name that has no logo uploaded', () => {
    render(<PartnersSection partners={[withoutLogo]} />)
    expect(screen.getByText('North Star Sound')).toBeInTheDocument()
  })

  it('says the partner list is coming soon rather than rendering an empty section — the #partners anchor must still exist for the nav link to land on', () => {
    const { container } = render(<PartnersSection partners={[]} />)
    expect(screen.getByText('Partner list coming soon.')).toBeInTheDocument()
    expect(container.querySelector('#partners')).toBeInTheDocument()
  })
})
