import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /studio is the embedded Sanity Studio (client CMS login) — it's
      // useless to a crawler and shouldn't show up in search results.
      disallow: ['/studio', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
