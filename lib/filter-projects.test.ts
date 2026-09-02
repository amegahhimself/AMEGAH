import { describe, expect, it } from 'vitest'
import { filterProjects } from './filter-projects'
import type { ProjectCardData } from '@/sanity/lib/content'

const make = (
  slug: string,
  category: { slug: string; parentSlug: string | null } | null,
): ProjectCardData => ({
  _id: slug,
  title: slug,
  slug,
  discipline: { title: 'Cinematographer', slug: 'cinematographer', cadence: 'filmstrip' },
  category: category ? { title: category.slug, ...category } : null,
})

const ads = make('an-ad', { slug: 'ads', parentSlug: null })
const corporate = make('a-gala', { slug: 'corporate', parentSlug: 'events' })
const funeral = make('a-funeral', { slug: 'funerals', parentSlug: 'events' })
const uncategorised = make('loose-end', null)
const all = [ads, corporate, funeral, uncategorised]

describe('filterProjects', () => {
  it('returns everything when nothing is selected', () => {
    expect(filterProjects(all, {})).toEqual(all)
    expect(filterProjects(all, { category: null, type: null })).toEqual(all)
  })

  it('matches a top-level category directly', () => {
    expect(filterProjects(all, { category: 'ads' })).toEqual([ads])
  })

  it('includes every sub-category when a parent category is selected', () => {
    expect(filterProjects(all, { category: 'events' })).toEqual([corporate, funeral])
  })

  it('narrows to one sub-category when a type is selected', () => {
    expect(filterProjects(all, { category: 'events', type: 'funerals' })).toEqual([funeral])
  })

  it('returns nothing for a category slug that matches no project', () => {
    expect(filterProjects(all, { category: 'documentaries' })).toEqual([])
  })

  it('never includes an uncategorised project in a filtered view', () => {
    expect(filterProjects(all, { category: 'ads' })).not.toContain(uncategorised)
  })
})
