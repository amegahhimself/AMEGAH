import { describe, expect, it } from 'vitest'
import { featuredSpan } from './featured-layout'

describe('featuredSpan', () => {
  it('opens full-bleed so the first piece of work lands hardest', () => {
    expect(featuredSpan(0)).toBe('full')
  })

  it('follows with a pair of halves', () => {
    expect(featuredSpan(1)).toBe('half')
    expect(featuredSpan(2)).toBe('half')
  })

  it('repeats the rhythm rather than settling into a uniform grid', () => {
    expect(featuredSpan(3)).toBe('full')
    expect(featuredSpan(4)).toBe('half')
    expect(featuredSpan(5)).toBe('half')
    expect(featuredSpan(6)).toBe('full')
  })
})
