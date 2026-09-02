import { describe, expect, it } from 'vitest'
import { fluid } from './typography'

describe('fluid', () => {
  it('interpolates between two sizes across the viewport', () => {
    expect(fluid(16, 32, 400, 1200)).toBe('clamp(1rem, 0.5rem + 2vw, 2rem)')
  })

  it('trims trailing zeros from the computed values', () => {
    expect(fluid(16, 32, 400, 1200)).not.toContain('0000')
  })

  it('handles a fixed size where both ends match', () => {
    expect(fluid(16, 16, 400, 1200)).toBe('clamp(1rem, 1rem + 0vw, 1rem)')
  })
})
