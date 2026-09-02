import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SiteHeader } from './site-header'

const disciplines = [
  { title: 'Director', slug: 'director' },
  { title: 'Cinematographer', slug: 'cinematographer' },
]

describe('SiteHeader', () => {
  it('links to each discipline from the CMS', () => {
    render(<SiteHeader disciplines={disciplines} />)
    expect(screen.getByRole('link', { name: 'Director' })).toHaveAttribute(
      'href',
      '/director',
    )
    expect(screen.getByRole('link', { name: 'Cinematographer' })).toHaveAttribute(
      'href',
      '/cinematographer',
    )
  })

  it('always offers the standing pages', () => {
    render(<SiteHeader disciplines={disciplines} />)
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('href', '/clients')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')
  })

  it('renders nothing discipline-shaped when the CMS is empty', () => {
    render(<SiteHeader disciplines={[]} />)
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
  })

  it('exposes a labelled menu toggle for small screens', () => {
    render(<SiteHeader disciplines={disciplines} />)
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })
})
