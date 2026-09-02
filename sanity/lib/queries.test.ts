import { describe, expect, it } from 'vitest'
import {
  ALL_PROJECT_SLUGS_QUERY,
  CATEGORIES_BY_DISCIPLINE_QUERY,
  DISCIPLINE_BY_SLUG_QUERY,
  DISCIPLINE_PROJECT_REFS_QUERY,
  PROJECT_CARD_PROJECTION,
  PROJECT_DETAIL_QUERY,
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

describe('PROJECT_DETAIL_QUERY', () => {
  it('looks up one non-archived project by slug', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('_type == "project"')
    expect(PROJECT_DETAIL_QUERY).toContain('slug.current == $slug')
    expect(PROJECT_DETAIL_QUERY).toContain('!archived')
    expect(PROJECT_DETAIL_QUERY).toContain('[0]')
  })

  it('follows the Mux asset reference to the playback id', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('muxVideo.asset->')
    expect(PROJECT_DETAIL_QUERY).toContain('playbackId')
  })

  it('returns gallery images with their alt text and captions', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('gallery')
    expect(PROJECT_DETAIL_QUERY).toContain('alt')
    expect(PROJECT_DETAIL_QUERY).toContain('caption')
  })

  it('resolves the credits the page shows', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('client->')
    expect(PROJECT_DETAIL_QUERY).toContain('partners[]->')
  })
})

describe('DISCIPLINE_PROJECT_REFS_QUERY', () => {
  it('lists a discipline’s projects in the editor-defined order', () => {
    expect(DISCIPLINE_PROJECT_REFS_QUERY).toContain(
      'discipline->slug.current == $disciplineSlug',
    )
    expect(DISCIPLINE_PROJECT_REFS_QUERY).toContain('order(orderRank)')
    expect(DISCIPLINE_PROJECT_REFS_QUERY).toContain('!archived')
  })
})

describe('ALL_PROJECT_SLUGS_QUERY', () => {
  it('lists every non-archived project slug for prerendering', () => {
    expect(ALL_PROJECT_SLUGS_QUERY).toContain('_type == "project"')
    expect(ALL_PROJECT_SLUGS_QUERY).toContain('!archived')
  })
})
