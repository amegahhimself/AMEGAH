import { describe, expect, it } from 'vitest'
import { taxonomy } from './seed-data'

const bySlug = (slug: string) => taxonomy.find((d) => d.slug === slug)

describe('seed taxonomy matches the client brief', () => {
  it('has the four disciplines, with Events before Photography per the client\'s nav-order request', () => {
    expect(taxonomy.map((d) => d.slug)).toEqual([
      'director',
      'cinematography',
      'events',
      'photography',
    ])
  })

  it('gives Director its three categories', () => {
    expect(bySlug('director')?.categories.map((c) => c.title)).toEqual([
      'Music Videos',
      'Ads',
      'Short Films',
    ])
  })

  it('gives Cinematography its four categories, with Events pulled out into its own discipline', () => {
    expect(bySlug('cinematography')?.categories.map((c) => c.title)).toEqual([
      'Music Videos',
      'Ads',
      'Documentaries',
      'Short Films',
    ])
  })

  it('gives Photography its four categories, including Events', () => {
    expect(bySlug('photography')?.categories.map((c) => c.title)).toEqual([
      'Portraits',
      'Lifestyle',
      'Editorial',
      'Events',
    ])
  })

  it("nests the event types under Photography's Events category", () => {
    const events = bySlug('photography')?.categories.find((c) => c.slug === 'events')
    expect(events?.children?.map((c) => c.title)).toEqual([
      'Corporate',
      'Traditional Wedding',
      'White Wedding',
      'Parties',
      'Funerals',
      'Birthdays',
    ])
  })

  it('gives Events its six top-level categories, matching the ones nested under Photography', () => {
    expect(bySlug('events')?.categories.map((c) => c.title)).toEqual([
      'Corporate',
      'Traditional Wedding',
      'White Wedding',
      'Parties',
      'Funerals',
      'Birthdays',
    ])
  })

  it('assigns each discipline a grid cadence', () => {
    expect(taxonomy.map((d) => d.cadence)).toEqual([
      'cinematic',
      'filmstrip',
      'editorial',
      'editorial',
    ])
  })

  it('places Events before Photography, matching how they should appear on scroll/in the nav', () => {
    const events = taxonomy.findIndex((d) => d.slug === 'events')
    const photography = taxonomy.findIndex((d) => d.slug === 'photography')
    expect(events).toBeLessThan(photography)
  })
})
