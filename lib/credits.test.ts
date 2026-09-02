import { describe, expect, it } from 'vitest'
import { creditLine } from './credits'
import type { ProjectDetail } from '@/sanity/lib/content'

const base: ProjectDetail = {
  _id: 'p1',
  title: 'Nightfall',
  slug: 'nightfall',
  discipline: { title: 'Director', slug: 'director', cadence: 'cinematic' },
  category: { title: 'Music Videos', slug: 'music-videos', parentSlug: null },
}

describe('creditLine', () => {
  it('reads discipline, category and year', () => {
    expect(creditLine({ ...base, year: 2025 })).toBe('Director · Music Videos · 2025')
  })

  it('omits a year the client has not filled in', () => {
    expect(creditLine(base)).toBe('Director · Music Videos')
  })

  it('omits a category a project has not been filed under', () => {
    expect(creditLine({ ...base, category: null, year: 2025 })).toBe('Director · 2025')
  })
})
