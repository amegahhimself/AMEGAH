import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WorkBrowser } from './work-browser'
import type { CategoryNode } from '@/lib/categories'
import type { ProjectCardData } from '@/sanity/lib/content'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/cinematographer',
}))

const categories: CategoryNode[] = [
  { _id: 'ads', title: 'Ads', slug: 'ads', parentId: null, children: [] },
  {
    _id: 'events',
    title: 'Events',
    slug: 'events',
    parentId: null,
    children: [
      { _id: 'corporate', title: 'Corporate', slug: 'corporate', parentId: 'events', children: [] },
    ],
  },
]

const make = (
  slug: string,
  category: { slug: string; parentSlug: string | null },
): ProjectCardData => ({
  _id: slug,
  title: slug,
  slug,
  discipline: { title: 'Cinematographer', slug: 'cinematographer', cadence: 'filmstrip' },
  category: { title: category.slug, ...category },
})

const projects = [
  make('advert-one', { slug: 'ads', parentSlug: null }),
  make('gala-night', { slug: 'corporate', parentSlug: 'events' }),
]

describe('WorkBrowser', () => {
  beforeEach(() => replace.mockClear())

  it('shows every project when unfiltered', () => {
    render(
      <WorkBrowser
        projects={projects}
        categories={categories}
        cadence="filmstrip"
        initialCategory={null}
        initialType={null}
      />,
    )
    expect(screen.getByText('advert-one')).toBeInTheDocument()
    expect(screen.getByText('gala-night')).toBeInTheDocument()
  })

  it('filters instantly when a category is chosen', async () => {
    render(
      <WorkBrowser
        projects={projects}
        categories={categories}
        cadence="filmstrip"
        initialCategory={null}
        initialType={null}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ads' }))
    expect(screen.getByText('advert-one')).toBeInTheDocument()
    expect(screen.queryByText('gala-night')).not.toBeInTheDocument()
  })

  it('syncs the chosen filter to the URL without scrolling the page', async () => {
    render(
      <WorkBrowser
        projects={projects}
        categories={categories}
        cadence="filmstrip"
        initialCategory={null}
        initialType={null}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ads' }))
    expect(replace).toHaveBeenCalledWith('/cinematographer?category=ads', { scroll: false })
  })

  it('honours a filter that arrived in the URL', () => {
    render(
      <WorkBrowser
        projects={projects}
        categories={categories}
        cadence="filmstrip"
        initialCategory="events"
        initialType={null}
      />,
    )
    expect(screen.getByText('gala-night')).toBeInTheDocument()
    expect(screen.queryByText('advert-one')).not.toBeInTheDocument()
  })

  it('reveals more projects on request and then retires the button', async () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      make(`project-${i}`, { slug: 'ads', parentSlug: null }),
    )
    render(
      <WorkBrowser
        projects={many}
        categories={categories}
        cadence="filmstrip"
        initialCategory={null}
        initialType={null}
        pageSize={2}
      />,
    )
    expect(screen.queryByText('project-4')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /load more/i }))
    expect(screen.getByText('project-3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /load more/i }))
    expect(screen.getByText('project-4')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
  })

  it('tells the visitor when a filter matches nothing', async () => {
    render(
      <WorkBrowser
        projects={[projects[0]]}
        categories={categories}
        cadence="filmstrip"
        initialCategory={null}
        initialType={null}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Events' }))
    expect(screen.getByText(/no projects/i)).toBeInTheDocument()
  })
})
