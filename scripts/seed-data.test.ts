import { describe, expect, it } from 'vitest'
import { taxonomy } from './seed-data'

const bySlug = (slug: string) => taxonomy.find((d) => d.slug === slug)

describe('seed taxonomy matches the client brief', () => {
  it('has the three disciplines', () => {
    expect(taxonomy.map((d) => d.slug)).toEqual([
      'director',
      'cinematographer',
      'photographer',
    ])
  })

  it('gives Director its three categories', () => {
    expect(bySlug('director')?.categories.map((c) => c.title)).toEqual([
      'Music Videos',
      'Ads',
      'Short Films',
    ])
  })

  it('gives Cinematographer its five categories', () => {
    expect(bySlug('cinematographer')?.categories.map((c) => c.title)).toEqual([
      'Music Videos',
      'Ads',
      'Documentaries',
      'Short Films',
      'Events',
    ])
  })

  it('nests the event types under Events', () => {
    const events = bySlug('cinematographer')?.categories.find((c) => c.slug === 'events')
    expect(events?.children?.map((c) => c.title)).toEqual([
      'Corporate',
      'Traditional Wedding',
      'White Wedding',
      'Parties',
      'Funerals',
    ])
  })

  it('gives Photographer its three categories', () => {
    expect(bySlug('photographer')?.categories.map((c) => c.title)).toEqual([
      'Portraits',
      'Lifestyle',
      'Editorial',
    ])
  })

  it('assigns each discipline a grid cadence', () => {
    expect(taxonomy.map((d) => d.cadence)).toEqual([
      'cinematic',
      'filmstrip',
      'editorial',
    ])
  })
})
