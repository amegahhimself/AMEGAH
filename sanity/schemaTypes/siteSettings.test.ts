import { describe, expect, it } from 'vitest'
import { siteSettings } from './siteSettings'

type Field = { name: string; type: string; options?: { list?: unknown[] }; initialValue?: unknown }
const fields = () => siteSettings.fields as unknown as Field[]
const field = (name: string) => fields().find((f) => f.name === name)

describe('siteSettings schema', () => {
  it('carries the role line shown under the name', () => {
    expect(field('role')?.type).toBe('string')
  })

  it('lets the client choose the hero treatment themselves', () => {
    const heroVariant = field('heroVariant')
    expect(heroVariant?.type).toBe('string')
    expect(heroVariant?.options?.list).toEqual(['reel', 'still', 'type'])
  })

  it('defaults the hero to type, the only treatment that works with no assets', () => {
    expect(field('heroVariant')?.initialValue).toBe('type')
  })

  it('holds a showreel for the reel treatment', () => {
    expect(field('heroVideo')?.type).toBe('mux.video')
  })

  it('holds stills for the still treatment', () => {
    expect(field('heroImages')?.type).toBe('array')
  })

  it('carries search and share metadata', () => {
    expect(field('seoTitle')?.type).toBe('string')
    expect(field('seoDescription')?.type).toBe('text')
    expect(field('ogImage')?.type).toBe('image')
  })

  it('keeps the contact details the footer already uses', () => {
    expect(field('email')?.type).toBe('string')
    expect(field('phone')?.type).toBe('string')
    expect(field('instagramUrl')?.type).toBe('url')
  })
})
