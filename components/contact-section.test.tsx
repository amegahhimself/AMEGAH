import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ContactSection } from './contact-section'
import type { SiteSettings } from '@/sanity/lib/content'

const settings: SiteSettings = {
  name: 'Amegah',
  role: 'Director · Cinematographer',
  email: 'hello@amegah.com',
  phone: '+233 20 000 0000',
  instagramUrl: 'https://instagram.com/amegah',
}

describe('ContactSection', () => {
  it('anchors as #contact so the header nav can scroll straight to it', () => {
    const { container } = render(<ContactSection settings={settings} />)
    expect(container.querySelector('#contact')).toBeInTheDocument()
  })

  it('titles the section', () => {
    render(<ContactSection settings={settings} />)
    expect(screen.getByRole('heading', { name: 'Let’s Make Something' })).toBeInTheDocument()
  })

  it('offers real, working links for every channel the client has set', () => {
    render(<ContactSection settings={settings} />)
    expect(screen.getByRole('link', { name: settings.phone })).toHaveAttribute(
      'href',
      'tel:+233 20 000 0000',
    )
    expect(screen.getByRole('link', { name: settings.email })).toHaveAttribute(
      'href',
      'mailto:hello@amegah.com',
    )
    expect(screen.getByRole('link', { name: 'instagram.com/amegah' })).toHaveAttribute(
      'href',
      'https://instagram.com/amegah',
    )
  })

  it('offers a WhatsApp click-to-chat link alongside the plain call link, with trunk-prefix parens stripped', () => {
    render(
      <ContactSection settings={{ ...settings, phone: '+233 (0) 55 976 0048' }} />,
    )
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/233559760048',
    )
  })

  it('never renders a form — the brief asks only for contact information', () => {
    const { container } = render(<ContactSection settings={settings} />)
    expect(container.querySelector('form')).not.toBeInTheDocument()
    expect(container.querySelector('input')).not.toBeInTheDocument()
  })

  it('says contact details are coming soon rather than an empty section', () => {
    render(<ContactSection settings={{ name: 'Amegah' }} />)
    expect(screen.getByText('Contact details coming soon.')).toBeInTheDocument()
  })
})
