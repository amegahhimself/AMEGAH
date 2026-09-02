export const IMAGE_PROJECTION = `{
  asset,
  hotspot,
  "lqip": asset->metadata.lqip,
  "aspectRatio": asset->metadata.dimensions.aspectRatio
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
  coverImage,
  cadence
}`

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0] {
  name,
  headshot,
  bio,
  phone,
  email,
  instagramUrl
}`

export const DISCIPLINE_BY_SLUG_QUERY = `*[_type == "discipline" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  cadence
}`

export const CATEGORIES_BY_DISCIPLINE_QUERY = `*[_type == "category" && discipline->slug.current == $disciplineSlug] | order(orderRank) {
  _id,
  title,
  "slug": slug.current,
  "parentId": parent._ref
}`
