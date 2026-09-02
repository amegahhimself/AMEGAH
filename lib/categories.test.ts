import { describe, expect, it } from 'vitest'
import { buildCategoryTree, type FlatCategory } from './categories'

const cat = (id: string, slug: string, parentId: string | null = null): FlatCategory => ({
  _id: id,
  title: slug,
  slug,
  parentId,
})

describe('buildCategoryTree', () => {
  it('returns top-level categories as roots', () => {
    const tree = buildCategoryTree([cat('1', 'ads'), cat('2', 'events')])
    expect(tree.map((n) => n.slug)).toEqual(['ads', 'events'])
    expect(tree.every((n) => n.children.length === 0)).toBe(true)
  })

  it('nests children under their parent', () => {
    const tree = buildCategoryTree([
      cat('1', 'events'),
      cat('2', 'corporate', '1'),
      cat('3', 'funerals', '1'),
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0].children.map((c) => c.slug)).toEqual(['corporate', 'funerals'])
  })

  it('preserves the incoming order', () => {
    const tree = buildCategoryTree([cat('2', 'events'), cat('1', 'ads')])
    expect(tree.map((n) => n.slug)).toEqual(['events', 'ads'])
  })

  it('treats a child whose parent is missing as a root', () => {
    const tree = buildCategoryTree([cat('2', 'corporate', 'missing')])
    expect(tree.map((n) => n.slug)).toEqual(['corporate'])
  })

  it('returns an empty array for no categories', () => {
    expect(buildCategoryTree([])).toEqual([])
  })
})
