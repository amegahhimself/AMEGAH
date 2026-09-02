import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Prose } from './prose'
import type { PortableTextValue } from '@/sanity/lib/content'

const paragraph = [
  {
    _type: 'block',
    _key: 'a',
    style: 'normal',
    children: [{ _type: 'span', _key: 'a1', text: 'Shot over three nights.', marks: [] }],
  },
] as unknown as PortableTextValue

const withLink = [
  {
    _type: 'block',
    _key: 'b',
    style: 'normal',
    markDefs: [{ _key: 'l1', _type: 'link', href: 'https://example.com' }],
    children: [{ _type: 'span', _key: 'b1', text: 'See the film', marks: ['l1'] }],
  },
] as unknown as PortableTextValue

describe('Prose', () => {
  it('renders the prose the client wrote', () => {
    render(<Prose value={paragraph} />)
    expect(screen.getByText('Shot over three nights.')).toBeInTheDocument()
  })

  it('renders a link the client wrote, and makes it visibly a link', () => {
    render(<Prose value={withLink} />)
    const link = screen.getByRole('link', { name: 'See the film' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link.className).toContain('underline')
  })

  it('opens outbound links safely', () => {
    render(<Prose value={withLink} />)
    const link = screen.getByRole('link', { name: 'See the film' })
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('constrains the reading width so long prose stays legible', () => {
    const { container } = render(<Prose value={paragraph} />)
    expect(container.firstElementChild?.className).toContain('max-w-[var(--measure)]')
  })

  it('renders nothing when there is no prose', () => {
    const { container } = render(<Prose value={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the prose is empty rather than an empty box', () => {
    const { container } = render(<Prose value={[] as unknown as PortableTextValue} />)
    expect(container).toBeEmptyDOMElement()
  })
})
