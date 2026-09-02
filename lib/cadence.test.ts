import { describe, expect, it } from 'vitest'
import { cadenceLayout } from './cadence'

describe('cadenceLayout', () => {
  it('gives Director work the largest, widest presentation', () => {
    const layout = cadenceLayout('cinematic')
    expect(layout.aspect).toBe('aspect-video')
    expect(layout.grid).toContain('md:grid-cols-2')
    expect(layout.grid).not.toContain('grid-cols-3')
  })

  it('gives Cinematography a denser filmstrip rhythm', () => {
    const layout = cadenceLayout('filmstrip')
    expect(layout.grid).toContain('lg:grid-cols-3')
    expect(layout.aspect).toBe('aspect-[3/2]')
  })

  it('gives Photography a portrait-led editorial rhythm', () => {
    const layout = cadenceLayout('editorial')
    expect(layout.grid).toContain('lg:grid-cols-3')
    expect(layout.aspect).toBe('aspect-[4/5]')
  })

  it('starts every cadence at one column so mobile is single-column', () => {
    for (const cadence of ['cinematic', 'filmstrip', 'editorial'] as const) {
      expect(cadenceLayout(cadence).grid).toContain('grid-cols-1')
    }
  })

  it('falls back to editorial for a discipline with no cadence set', () => {
    expect(cadenceLayout(undefined)).toEqual(cadenceLayout('editorial'))
  })
})
