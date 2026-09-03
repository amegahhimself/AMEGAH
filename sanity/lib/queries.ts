export const IMAGE_FIELDS = `asset,
  hotspot,
  "lqip": asset->metadata.lqip,
  "aspectRatio": asset->metadata.dimensions.aspectRatio`

export const IMAGE_PROJECTION = `{
  ${IMAGE_FIELDS}
}`

export const PROJECT_CARD_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  year,
  "coverImage": coverImage${IMAGE_PROJECTION},
  "mobileCoverImage": mobileCoverImage${IMAGE_PROJECTION},
  "discipline": discipline->{title, "slug": slug.current, cadence},
  "category": category->{
    title,
    "slug": slug.current,
    "parentSlug": parent->slug.current
  }
}`

export function projectListQuery({
  disciplineSlug,
  categorySlug,
}: {
  disciplineSlug?: string
  categorySlug?: string
}): string {
  const clauses = ['_type == "project"', '!archived']
  if (disciplineSlug) clauses.push('discipline->slug.current == $disciplineSlug')
  if (categorySlug) clauses.push('category->slug.current == $categorySlug')
  return `*[${clauses.join(' && ')}] | order(orderRank) ${PROJECT_CARD_PROJECTION}`
}

export const DISCIPLINES_QUERY = `*[_type == "discipline"] | order(orderRank) {
  _id,
  title,
  "slug": slug.current,
  description,
  "coverImage": coverImage{
    ${IMAGE_FIELDS}
  },
  cadence
}`

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0] {
  name,
  role,
  "headshot": headshot{
    ${IMAGE_FIELDS}
  },
  bio,
  phone,
  email,
  instagramUrl,
  heroVariant,
  "heroVideo": heroVideo.asset->{playbackId, assetId},
  "heroImages": heroImages[]{
    ${IMAGE_FIELDS}
  },
  seoTitle,
  seoDescription,
  ogImage
}`

export const DISCIPLINE_BY_SLUG_QUERY = `*[_type == "discipline" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  "coverImage": coverImage{
    ${IMAGE_FIELDS}
  },
  cadence
}`

export const CATEGORIES_BY_DISCIPLINE_QUERY = `*[_type == "category" && discipline->slug.current == $disciplineSlug] | order(orderRank) {
  _id,
  title,
  "slug": slug.current,
  "parentId": parent._ref
}`

export const PROJECT_DETAIL_QUERY = `*[_type == "project" && slug.current == $slug && !archived][0] {
  _id,
  title,
  "slug": slug.current,
  year,
  description,
  "coverImage": coverImage${IMAGE_PROJECTION},
  "mobileCoverImage": mobileCoverImage${IMAGE_PROJECTION},
  "muxVideo": muxVideo.asset->{playbackId, assetId},
  "gallery": gallery[]{
    ${IMAGE_FIELDS},
    alt,
    caption
  },
  "discipline": discipline->{title, "slug": slug.current, cadence},
  "category": category->{
    title,
    "slug": slug.current,
    "parentSlug": parent->slug.current
  },
  "client": client->{name},
  "partners": partners[]->{name}
}`

export const DISCIPLINE_PROJECT_REFS_QUERY = `*[_type == "project" && !archived && discipline->slug.current == $disciplineSlug] | order(orderRank) {
  "slug": slug.current,
  title
}`

export const ALL_PROJECT_SLUGS_QUERY = `*[_type == "project" && !archived].slug.current`

export const FEATURED_PROJECTS_QUERY = `*[_type == "project" && !archived && featured == true] | order(orderRank) ${PROJECT_CARD_PROJECTION}`

export const CLIENTS_QUERY = `*[_type == "client"] | order(orderRank) {
  _id,
  name,
  logo,
  url
}`

export const PARTNERS_QUERY = `*[_type == "partner"] | order(orderRank) {
  _id,
  name,
  logo,
  url
}`
