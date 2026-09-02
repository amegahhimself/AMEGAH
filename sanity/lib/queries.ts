export const PROJECT_CARD_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  year,
  coverImage,
  mobileCoverImage,
  "discipline": discipline->{title, "slug": slug.current, cadence},
  "category": category->{title, "slug": slug.current}
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
