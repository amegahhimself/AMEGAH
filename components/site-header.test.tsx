import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { SiteHeader } from './site-header'

const disciplines = [
  { title: 'Director', slug: 'director' },
  { title: 'Cinematographer', slug: 'cinematographer' },
]

describe('SiteHeader', () => {
  it('links to each discipline from the CMS', () => {
    render(<SiteHeader disciplines={disciplines} settings={null} />)
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
    render(<SiteHeader disciplines={disciplines} settings={null} />)
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/#about')
    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('href', '/#clients')
    expect(screen.getByRole('link', { name: 'Partners' })).toHaveAttribute('href', '/#partners')
  })

  it('has no standalone Contact link — Hire {name} already points at #contact', () => {
    render(<SiteHeader disciplines={disciplines} settings={null} />)
    expect(screen.queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument()
  })

  it('renders nothing discipline-shaped when the CMS is empty', () => {
    render(<SiteHeader disciplines={[]} settings={null} />)
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
  })

  it('exposes a labelled menu toggle for small screens', () => {
    render(<SiteHeader disciplines={disciplines} settings={null} />)
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })

  it('falls back to the site name when settings are unavailable', () => {
    render(<SiteHeader disciplines={disciplines} settings={null} />)
    expect(screen.getByText('Amegah')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Hire Amegah/i })).toHaveAttribute(
      'href',
      '/#contact',
    )
  })

  it('shows the client’s own name and role, and offers to hire by first name', () => {
    render(
      <SiteHeader
        disciplines={disciplines}
        settings={{ name: 'Amegah Boateng', role: 'Director · Cinematographer' }}
      />,
    )
    expect(screen.getByText('Amegah Boateng')).toBeInTheDocument()
    expect(screen.getByText('Director · Cinematographer')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Hire Amegah/i })).toHaveAttribute(
      'href',
      '/#contact',
    )
  })

  // The mobile-menu focus trap (WCAG 2.4.3 / 2.1.2): built in an earlier
  // task, verified only by a one-off manual script until now. These pin
  // the exact behaviour the useEffect in site-header.tsx implements.
  describe('mobile menu focus trap', () => {
    it('moves focus to the first link when opened, not the trigger button', async () => {
      render(<SiteHeader disciplines={disciplines} settings={null} />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
      const dialog = screen.getByRole('dialog', { name: 'Menu' })
      expect(within(dialog).getByRole('link', { name: 'Director' })).toHaveFocus()
    })

    it('cycles from the last focusable element back to the first (the overlay’s own close button)', async () => {
      render(<SiteHeader disciplines={disciplines} settings={null} />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
      const dialog = screen.getByRole('dialog', { name: 'Menu' })

      const lastLink = within(dialog).getByRole('link', { name: 'Partners' })
      lastLink.focus()
      expect(lastLink).toHaveFocus()

      await userEvent.tab()
      expect(within(dialog).getByRole('button', { name: 'Close menu' })).toHaveFocus()
    })

    it('shift+tabs from the first focusable element to the last', async () => {
      render(<SiteHeader disciplines={disciplines} settings={null} />)
      await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
      const dialog = screen.getByRole('dialog', { name: 'Menu' })

      const closeButton = within(dialog).getByRole('button', { name: 'Close menu' })
      closeButton.focus()
      expect(closeButton).toHaveFocus()

      await userEvent.tab({ shift: true })
      expect(within(dialog).getByRole('link', { name: 'Partners' })).toHaveFocus()
    })

    it('closes on Escape and returns focus to the trigger button', async () => {
      render(<SiteHeader disciplines={disciplines} settings={null} />)
      const trigger = screen.getByRole('button', { name: 'Menu' })
      await userEvent.click(trigger)
      expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument()

      await userEvent.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus()
    })
  })
})
