import { cacheLife, cacheTag } from 'next/cache'

import type { FlatCategory } from '@/lib/categories'

import { client } from './client'
import {
  CATEGORIES_BY_DISCIPLINE_QUERY,
  DISCIPLINE_BY_SLUG_QUERY,
  DISCIPLINES_QUERY,
  projectListQuery,
  SITE_SETTINGS_QUERY,
} from './queries'
import { TAGS } from './tags'

export type Cadence = 'cinematic' | 'filmstrip' | 'editorial'

export type SanityImage = {
  asset?: { _ref: string }
  hotspot?: { x: number; y: number }
  lqip?: string
  aspectRatio?: number
}

export type ProjectCardData = {
  _id: string
  title: string
  slug: string
  year?: number
  coverImage?: SanityImage
  mobileCoverImage?: SanityImage
  discipline: { title: string; slug: string; cadence: Cadence }
  category: { title: string; slug: string; parentSlug: string | null } | null
}

export type Discipline = {
  _id: string
  title: string
  slug: string
  description?: string
  coverImage?: unknown
  cadence: Cadence
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

export async function getDisciplineBySlug(slug: string): Promise<Discipline | null> {
  'use cache'
  cacheTag(TAGS.discipline)
  cacheLife('max')
  return client.fetch<Discipline | null>(DISCIPLINE_BY_SLUG_QUERY, { slug })
}

export async function getCategoriesForDiscipline(
  disciplineSlug: string,
): Promise<FlatCategory[]> {
  'use cache'
  // Dereferences the discipline, so a discipline rename must invalidate this too.
  cacheTag(TAGS.category, TAGS.discipline)
  cacheLife('max')
  return client.fetch<FlatCategory[]>(CATEGORIES_BY_DISCIPLINE_QUERY, { disciplineSlug })
}

export async function getProjectsForDiscipline(
  disciplineSlug: string,
): Promise<ProjectCardData[]> {
  'use cache'
  // The card projection dereferences discipline and category, so renaming
  // either must invalidate this list, not just editing a project.
  cacheTag(TAGS.project, TAGS.category, TAGS.discipline)
  cacheLife('max')
  return client.fetch<ProjectCardData[]>(projectListQuery({ disciplineSlug }), {
    disciplineSlug,
  })
}
