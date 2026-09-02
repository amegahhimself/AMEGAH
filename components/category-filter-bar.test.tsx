import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CategoryFilterBar } from './category-filter-bar'
import type { CategoryNode } from '@/lib/categories'

const node = (slug: string, children: CategoryNode[] = []): CategoryNode => ({
  _id: slug,
  title: slug === 'music-videos' ? 'Music Videos' : slug === 'events' ? 'Events' : slug,
  slug,
  parentId: null,
  children,
})

const categories: CategoryNode[] = [
  node('music-videos'),
  node('events', [
    { _id: 'corporate', title: 'Corporate', slug: 'corporate', parentId: 'events', children: [] },
    { _id: 'funerals', title: 'Funerals', slug: 'funerals', parentId: 'events', children: [] },
  ]),
]

describe('CategoryFilterBar', () => {
  it('offers every top-level category plus an All option', () => {
    render(
      <CategoryFilterBar
        categories={categories}
        activeCategory={null}
        activeType={null}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Music Videos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Events' })).toBeInTheDocument()
  })

  it('reports the chosen category and clears any type', async () => {
    const onChange = vi.fn()
    render(
      <CategoryFilterBar
        categories={categories}
        activeCategory="events"
        activeType="funerals"
        onChange={onChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Music Videos' }))
    expect(onChange).toHaveBeenCalledWith({ category: 'music-videos', type: null })
  })

  it('clears both filters from the All option', async () => {
    const onChange = vi.fn()
    render(
      <CategoryFilterBar
        categories={categories}
        activeCategory="events"
        activeType={null}
        onChange={onChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(onChange).toHaveBeenCalledWith({ category: null, type: null })
  })

  it('hides sub-categories until their parent is the active category', () => {
    const { rerender } = render(
      <CategoryFilterBar
        categories={categories}
        activeCategory={null}
        activeType={null}
        onChange={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Corporate' })).not.toBeInTheDocument()

    rerender(
      <CategoryFilterBar
        categories={categories}
        activeCategory="events"
        activeType={null}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Corporate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Funerals' })).toBeInTheDocument()
  })

  it('reports a chosen sub-category alongside its parent', async () => {
    const onChange = vi.fn()
    render(
      <CategoryFilterBar
        categories={categories}
        activeCategory="events"
        activeType={null}
        onChange={onChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Corporate' }))
    expect(onChange).toHaveBeenCalledWith({ category: 'events', type: 'corporate' })
  })

  it('marks the active pill for assistive tech', () => {
    render(
      <CategoryFilterBar
        categories={categories}
        activeCategory="music-videos"
        activeType={null}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Music Videos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
