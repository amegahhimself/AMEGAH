import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Practices } from './practices'
import type { Discipline } from '@/sanity/lib/content'

const disciplines: Discipline[] = [
  { _id: 'd1', title: 'Director', slug: 'director', cadence: 'cinematic', description: 'Music videos and ads' },
  { _id: 'd2', title: 'Photographer', slug: 'photographer', cadence: 'editorial' },
]

describe('Practices', () => {
  it('links each practice to its own page', () => {
    render(<Practices disciplines={disciplines} />)
    expect(screen.getByRole('link', { name: /Director/ })).toHaveAttribute('href', '/director')
    expect(screen.getByRole('link', { name: /Photographer/ })).toHaveAttribute('href', '/photographer')
  })

  it('shows the description where the client wrote one', () => {
    render(<Practices disciplines={disciplines} />)
    expect(screen.getByText('Music videos and ads')).toBeInTheDocument()
  })

  it('renders nothing when there are no disciplines', () => {
    const { container } = render(<Practices disciplines={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
