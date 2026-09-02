import { describe, expect, it } from 'vitest'
import { buildFilterQuery } from './filter-query'

describe('buildFilterQuery', () => {
  it('is empty when nothing is filtered, so the canonical URL stays clean', () => {
    expect(buildFilterQuery({ category: null, type: null })).toBe('')
  })

  it('carries the category alone', () => {
    expect(buildFilterQuery({ category: 'music-videos', type: null })).toBe(
      '?category=music-videos',
    )
  })

  it('carries category and type together', () => {
    expect(buildFilterQuery({ category: 'events', type: 'white-wedding' })).toBe(
      '?category=events&type=white-wedding',
    )
  })

  it('drops a type with no category rather than emitting a filter that cannot be restored', () => {
    expect(buildFilterQuery({ category: null, type: 'corporate' })).toBe('')
  })
})
