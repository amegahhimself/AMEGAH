/**
 * The one canonical, absolute site URL — used for the sitemap, robots.txt,
 * metadataBase, canonical links and JSON-LD.
 *
 * The client's own domain isn't purchased yet (see docs/costs.md), so this
 * can't be hardcoded to a real domain. `NEXT_PUBLIC_SITE_URL` is the escape
 * hatch for when it is: set it in Vercel once the domain goes live, and
 * everything derived from this file picks it up with no code change.
 * Until then this falls back to Vercel's own system env vars so previews
 * and the current amegah.vercel.app production deployment still get a
 * correct, absolute URL.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  'https://amegah.vercel.app'
).replace(/\/$/, '')
