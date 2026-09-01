export type SeedCategory = {
  title: string
  slug: string
  children?: SeedCategory[]
}

export type SeedDiscipline = {
  title: string
  slug: string
  cadence: 'cinematic' | 'filmstrip' | 'editorial'
  categories: SeedCategory[]
}

/**
 * The starting taxonomy from the client brief (section 3).
 *
 * This is seed data only. Once seeded, the client owns this content and edits
 * it in the Studio — never read this file from application code.
 */
export const taxonomy: SeedDiscipline[] = [
  {
    title: 'Director',
    slug: 'director',
    cadence: 'cinematic',
    categories: [
      { title: 'Music Videos', slug: 'music-videos' },
      { title: 'Ads', slug: 'ads' },
      { title: 'Short Films', slug: 'short-films' },
    ],
  },
  {
    title: 'Cinematographer',
    slug: 'cinematographer',
    cadence: 'filmstrip',
    categories: [
      { title: 'Music Videos', slug: 'music-videos' },
      { title: 'Ads', slug: 'ads' },
      { title: 'Documentaries', slug: 'documentaries' },
      { title: 'Short Films', slug: 'short-films' },
      {
        title: 'Events',
        slug: 'events',
        children: [
          { title: 'Corporate', slug: 'corporate' },
          { title: 'Traditional Wedding', slug: 'traditional-wedding' },
          { title: 'White Wedding', slug: 'white-wedding' },
          { title: 'Parties', slug: 'parties' },
          { title: 'Funerals', slug: 'funerals' },
        ],
      },
    ],
  },
  {
    title: 'Photographer',
    slug: 'photographer',
    cadence: 'editorial',
    categories: [
      { title: 'Portraits', slug: 'portraits' },
      { title: 'Lifestyle', slug: 'lifestyle' },
      { title: 'Editorial', slug: 'editorial' },
    ],
  },
]

export const disciplineId = (slug: string) => `discipline.${slug}`
export const categoryId = (disciplineSlug: string, categorySlug: string) =>
  `category.${disciplineSlug}.${categorySlug}`
