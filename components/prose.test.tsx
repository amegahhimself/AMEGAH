import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Prose, hasProse } from './prose'
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

const withStrong = [
  {
    _type: 'block',
    _key: 'c',
    style: 'normal',
    children: [{ _type: 'span', _key: 'c1', text: 'Amegah Boateng', marks: ['strong'] }],
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

  it('brightens bolded text to full ink instead of leaving it the muted body colour', () => {
    render(<Prose value={withStrong} />)
    const strong = screen.getByText('Amegah Boateng')
    expect(strong.tagName).toBe('STRONG')
    expect(strong.className).toContain('text-ink')
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

  it('sets the prose in the body face by default', () => {
    const { container } = render(<Prose value={paragraph} />)
    expect(container.firstElementChild?.className).not.toContain('font-display')
  })

  it('sets the prose in the display face when asked, for the About bio', () => {
    const { container } = render(<Prose value={paragraph} serif />)
    expect(container.firstElementChild?.className).toContain('font-display')
  })
})

// The client can type into a field and then clear it. Studio stores that as an
// empty array, or as a block whose spans are blank — both are truthy, so a
// page guarding with `value ? ... : fallback` would show neither prose nor its
// fallback and leave a blank column.
describe('hasProse', () => {
  it('reports prose that has text', () => {
    expect(hasProse(paragraph)).toBe(true)
  })

  it('reports nothing for undefined', () => {
    expect(hasProse(undefined)).toBe(false)
  })

  it('reports nothing for an empty array', () => {
    expect(hasProse([] as unknown as PortableTextValue)).toBe(false)
  })

  it('reports nothing for a block the client emptied out', () => {
    const cleared = [
      {
        _type: 'block',
        _key: 'c',
        style: 'normal',
        children: [{ _type: 'span', _key: 'c1', text: '', marks: [] }],
      },
    ] as unknown as PortableTextValue
    expect(hasProse(cleared)).toBe(false)
  })

  it('reports nothing for a block holding only whitespace', () => {
    const blank = [
      {
        _type: 'block',
        _key: 'd',
        style: 'normal',
        children: [{ _type: 'span', _key: 'd1', text: '   \n ', marks: [] }],
      },
    ] as unknown as PortableTextValue
    expect(hasProse(blank)).toBe(false)
  })
})
