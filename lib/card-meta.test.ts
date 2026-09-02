import { describe, expect, it } from 'vitest'
import { hotspotPosition, indexLabel } from './card-meta'

describe('indexLabel', () => {
  it('renders the archival index form', () => {
    expect(indexLabel({ index: 0, category: 'Music Videos', year: 2025 })).toBe(
      '01 — Music Videos — 2025',
    )
  })

  it('keeps counting past nine without losing the padding', () => {
    expect(indexLabel({ index: 11, category: 'Ads', year: 2024 })).toBe('12 — Ads — 2024')
  })

  it('omits a missing year rather than printing undefined', () => {
    expect(indexLabel({ index: 2, category: 'Portraits' })).toBe('03 — Portraits')
  })

  it('omits a missing category', () => {
    expect(indexLabel({ index: 0, year: 2025 })).toBe('01 — 2025')
  })

  it('still labels a project with neither category nor year', () => {
    expect(indexLabel({ index: 4 })).toBe('05')
  })
})

describe('hotspotPosition', () => {
  it('centres an image that has no hotspot', () => {
    expect(hotspotPosition(undefined)).toBe('50% 50%')
    expect(hotspotPosition({})).toBe('50% 50%')
  })

  it('converts a Sanity hotspot into a CSS object-position', () => {
    expect(hotspotPosition({ hotspot: { x: 0.25, y: 0.75 } })).toBe('25% 75%')
  })
})
