import type { MetadataRoute } from 'next'

import { getAllProjectSlugs, getDisciplines } from '@/sanity/lib/content'
import { SITE_URL } from '@/lib/site-url'

const BASE_URL = SITE_URL

/**
 * Lists every project and discipline URL for search engines to discover.
 *
 * This is what `getAllProjectSlugs` and `ALL_PROJECT_SLUGS_QUERY` are for —
 * `/work/[slug]` deliberately has no `generateStaticParams` (a CMS-driven
 * route must not depend on content existing at build time), so this is the
 * only place that still walks every project slug. Instagram-referred project
 * links benefit from being discoverable even though they are not prerendered.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, disciplines] = await Promise.all([getAllProjectSlugs(), getDisciplines()])

  return [
    // About, Clients and Contact are sections on this URL now, not separate
    // pages — see components/about-section.tsx's doc comment — so they get
    // no entries of their own.
    { url: BASE_URL, changeFrequency: 'monthly', priority: 1 },
    ...disciplines.map((discipline) => ({
      url: `${BASE_URL}/${discipline.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...slugs.map((slug) => ({
      url: `${BASE_URL}/work/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
