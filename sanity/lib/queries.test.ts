import { describe, expect, it } from 'vitest'
import {
  CATEGORIES_BY_DISCIPLINE_QUERY,
  DISCIPLINE_BY_SLUG_QUERY,
  PROJECT_CARD_PROJECTION,
  projectListQuery,
} from './queries'

describe('projectListQuery', () => {
  it('always excludes archived projects', () => {
    expect(projectListQuery({})).toContain('!archived')
  })

  it('sorts by the editor-defined order', () => {
    expect(projectListQuery({})).toContain('order(orderRank)')
  })

  it('filters by discipline when given one', () => {
    expect(projectListQuery({ disciplineSlug: 'director' })).toContain(
      'discipline->slug.current == $disciplineSlug',
    )
  })

  it('filters by category when given one', () => {
    expect(projectListQuery({ categorySlug: 'ads' })).toContain(
      'category->slug.current == $categorySlug',
    )
  })

  it('omits the category clause when no category is given', () => {
    expect(projectListQuery({ disciplineSlug: 'director' })).not.toContain(
      '$categorySlug',
    )
  })
})

describe('DISCIPLINE_BY_SLUG_QUERY', () => {
  it('looks up a single discipline by slug', () => {
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('_type == "discipline"')
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('slug.current == $slug')
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('[0]')
  })

  it('returns the cadence that drives the grid layout', () => {
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('cadence')
  })
})

describe('CATEGORIES_BY_DISCIPLINE_QUERY', () => {
  it('scopes categories to one discipline', () => {
    expect(CATEGORIES_BY_DISCIPLINE_QUERY).toContain(
      'discipline->slug.current == $disciplineSlug',
    )
  })

  it('projects parentId so the tree helper can nest sub-categories', () => {
    expect(CATEGORIES_BY_DISCIPLINE_QUERY).toContain('"parentId": parent._ref')
  })

  it('orders by the editor-defined rank', () => {
    expect(CATEGORIES_BY_DISCIPLINE_QUERY).toContain('order(orderRank)')
  })
})

describe('PROJECT_CARD_PROJECTION', () => {
  it('exposes the parent category slug so a parent filter can match its children', () => {
    expect(PROJECT_CARD_PROJECTION).toContain('parentSlug')
  })

  it('includes LQIP metadata for blur placeholders', () => {
    expect(PROJECT_CARD_PROJECTION).toContain('lqip')
  })

  it('includes the image hotspot so crops respect the focal point', () => {
    expect(PROJECT_CARD_PROJECTION).toContain('hotspot')
  })
})
