import { cacheLife, cacheTag } from 'next/cache'

import { client } from './client'
import { DISCIPLINES_QUERY, SITE_SETTINGS_QUERY } from './queries'
import { TAGS } from './tags'

export type Discipline = {
  _id: string
  title: string
  slug: string
  description?: string
  coverImage?: unknown
  cadence: 'cinematic' | 'filmstrip' | 'editorial'
}

export type SiteSettings = {
  name: string
  headshot?: unknown
  bio?: unknown
  phone?: string
  email?: string
  instagramUrl?: string
}

export async function getDisciplines(): Promise<Discipline[]> {
  'use cache'
  cacheTag(TAGS.discipline)
  cacheLife('max')
  return client.fetch<Discipline[]>(DISCIPLINES_QUERY)
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  'use cache'
  cacheTag(TAGS.siteSettings)
  cacheLife('max')
  return client.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY)
}
