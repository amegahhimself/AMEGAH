import { createClient } from '@sanity/client'
import { LexoRank } from 'lexorank'
import {
  categoryId,
  disciplineId,
  taxonomy,
  type SeedCategory,
} from './seed-data.ts'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !token) {
  throw new Error(
    'Missing Sanity credentials. Run `vercel env pull` first, then run this script with `npm run seed`.',
  )
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2026-09-01',
  useCdn: false,
})

async function seed() {
  const transaction = client.transaction()

  let disciplineRank = LexoRank.min()

  // The Studio's "Categories" orderable list (sanity.config.ts /
  // structure) shows every category document — top-level and children,
  // across all disciplines — in one single flat, unscoped list. So all
  // category ranks must come from one running counter shared across the
  // whole taxonomy: per-discipline or per-parent resets would produce
  // duplicate ranks within that one real list and reproduce the same
  // "Try to rank between issues with same rank" crash this fix is for.
  let categoryRank = LexoRank.min()

  taxonomy.forEach((discipline) => {
    disciplineRank = disciplineRank.genNext()

    transaction.createOrReplace({
      _id: disciplineId(discipline.slug),
      _type: 'discipline',
      title: discipline.title,
      slug: { _type: 'slug', current: discipline.slug },
      cadence: discipline.cadence,
      orderRank: disciplineRank.toString(),
    })

    const addCategory = (category: SeedCategory, parentSlug?: string) => {
      categoryRank = categoryRank.genNext()

      transaction.createOrReplace({
        _id: categoryId(discipline.slug, category.slug),
        _type: 'category',
        title: category.title,
        slug: { _type: 'slug', current: category.slug },
        discipline: { _type: 'reference', _ref: disciplineId(discipline.slug) },
        ...(parentSlug
          ? {
              parent: {
                _type: 'reference',
                _ref: categoryId(discipline.slug, parentSlug),
              },
            }
          : {}),
        orderRank: categoryRank.toString(),
      })

      category.children?.forEach((child) => addCategory(child, category.slug))
    }

    discipline.categories.forEach((category) => addCategory(category))
  })

  await transaction.commit()

  const disciplines = taxonomy.length
  const categories = taxonomy.reduce(
    (total, d) =>
      total +
      d.categories.reduce((sum, c) => sum + 1 + (c.children?.length ?? 0), 0),
    0,
  )
  console.log(`Seeded ${disciplines} disciplines and ${categories} categories.`)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
