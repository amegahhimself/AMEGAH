import { describe, expect, it } from 'vitest'
import { adjacentProjects } from './adjacent-projects'
import type { ProjectRef } from '@/sanity/lib/content'

const refs: ProjectRef[] = [
  { slug: 'first', title: 'First' },
  { slug: 'middle', title: 'Middle' },
  { slug: 'last', title: 'Last' },
]

describe('adjacentProjects', () => {
  it('finds the neighbours on both sides', () => {
    expect(adjacentProjects(refs, 'middle')).toEqual({
      prev: { slug: 'first', title: 'First' },
      next: { slug: 'last', title: 'Last' },
    })
  })

  it('has no previous at the start of the list', () => {
    expect(adjacentProjects(refs, 'first')).toEqual({
      prev: null,
      next: { slug: 'middle', title: 'Middle' },
    })
  })

  it('has no next at the end of the list — the list does not wrap', () => {
    expect(adjacentProjects(refs, 'last')).toEqual({
      prev: { slug: 'middle', title: 'Middle' },
      next: null,
    })
  })

  it('gives a lone project no neighbours', () => {
    expect(adjacentProjects([refs[0]], 'first')).toEqual({ prev: null, next: null })
  })

  it('returns nothing for a project that is not in the list', () => {
    expect(adjacentProjects(refs, 'archived-one')).toEqual({ prev: null, next: null })
  })

  it('returns nothing for an empty list', () => {
    expect(adjacentProjects([], 'first')).toEqual({ prev: null, next: null })
  })
})
