import { describe, expect, it } from 'vitest'
import { projectListQuery } from './queries'

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
