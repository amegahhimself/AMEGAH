import { cacheLife, cacheTag } from 'next/cache'

import type { FlatCategory } from '@/lib/categories'

import { client } from './client'
import {
  ALL_PROJECT_SLUGS_QUERY,
  CATEGORIES_BY_DISCIPLINE_QUERY,
  CLIENTS_QUERY,
  DISCIPLINE_BY_SLUG_QUERY,
  DISCIPLINE_PROJECT_REFS_QUERY,
  DISCIPLINES_QUERY,
  FEATURED_PROJECTS_QUERY,
  PARTNERS_QUERY,
  PROJECT_DETAIL_QUERY,
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
  coverImage?: SanityImage
  cadence: Cadence
}

export type HeroVariant = 'reel' | 'still' | 'type'

export type LogoRef = {
  _id: string
  name: string
  logo?: SanityImage
  url?: string
}

export type SiteSettings = {
  name: string
  role?: string
  headshot?: unknown
  bio?: unknown
  phone?: string
  email?: string
  instagramUrl?: string
  heroVariant?: HeroVariant
  heroVideo?: MuxVideo | null
  heroImages?: SanityImage[]
  seoTitle?: string
  seoDescription?: string
  ogImage?: SanityImage
}

export async function getDisciplines(): Promise<Discipline[]> {
  'use cache'
  cacheTag(TAGS.discipline)
  cacheLife('max')
  return client.fetch<Discipline[]>(DISCIPLINES_QUERY)
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  'use cache'
  // Dereferences the Mux hero asset, so a change to it must invalidate this too.
  cacheTag(TAGS.siteSettings, TAGS.muxVideoAsset)
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

export type GalleryImage = SanityImage & {
  alt?: string
  caption?: string
}

export type MuxVideo = {
  playbackId?: string
  assetId?: string
}

/**
 * Portable Text as it comes back from Sanity. Structurally compatible with
 * what `<PortableText>` accepts, so no cast is needed at the call site.
 */
export type PortableTextValue = { _type: string; _key?: string }[]

export type ProjectRef = {
  slug: string
  title: string
}

export type ProjectDetail = {
  _id: string
  title: string
  slug: string
  year?: number
  description?: PortableTextValue
  coverImage?: SanityImage
  muxVideo?: MuxVideo | null
  gallery?: GalleryImage[]
  // A dangling reference (the client deleted the discipline a project still
  // points to) makes GROQ's discipline-> return null. Sanity's Rule.required()
  // only guards creation time, not later deletion of the referenced document,
  // so this must be nullable and every consumer must guard it.
  discipline: { title: string; slug: string; cadence: Cadence } | null
  category: { title: string; slug: string; parentSlug: string | null } | null
  client?: { name: string } | null
  partners?: { name: string }[] | null
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  'use cache'
  // Dereferences discipline, category, client, partners and the Mux asset,
  // so a change to any of them must invalidate this page.
  cacheTag(
    TAGS.project,
    TAGS.discipline,
    TAGS.category,
    TAGS.client,
    TAGS.partner,
    TAGS.muxVideoAsset,
  )
  cacheLife('max')
  return client.fetch<ProjectDetail | null>(PROJECT_DETAIL_QUERY, { slug })
}

export async function getDisciplineProjectRefs(
  disciplineSlug: string,
): Promise<ProjectRef[]> {
  'use cache'
  cacheTag(TAGS.project, TAGS.discipline)
  cacheLife('max')
  return client.fetch<ProjectRef[]>(DISCIPLINE_PROJECT_REFS_QUERY, { disciplineSlug })
}

export async function getAllProjectSlugs(): Promise<string[]> {
  'use cache'
  cacheTag(TAGS.project)
  cacheLife('max')
  return client.fetch<string[]>(ALL_PROJECT_SLUGS_QUERY)
}

export async function getFeaturedProjects(): Promise<ProjectCardData[]> {
  'use cache'
  // The card projection dereferences discipline and category.
  cacheTag(TAGS.project, TAGS.discipline, TAGS.category)
  cacheLife('max')
  return client.fetch<ProjectCardData[]>(FEATURED_PROJECTS_QUERY)
}

export async function getClients(): Promise<LogoRef[]> {
  'use cache'
  cacheTag(TAGS.client)
  cacheLife('max')
  return client.fetch<LogoRef[]>(CLIENTS_QUERY)
}

export async function getPartners(): Promise<LogoRef[]> {
  'use cache'
  cacheTag(TAGS.partner)
  cacheLife('max')
  return client.fetch<LogoRef[]>(PARTNERS_QUERY)
}
