/**
 * The one canonical, absolute site URL — used for the sitemap, robots.txt,
 * metadataBase, canonical links and JSON-LD.
 *
 * Not hardcoded, because the client's domain wasn't settled when this file
 * was written (see docs/costs.md's now-resolved open question). Since
 * amegah.co went live, `NEXT_PUBLIC_SITE_URL` is set to
 * `https://www.amegah.co` in Vercel's Production environment — see
 * docs/handover.md's domain entry — so update it there if the canonical
 * domain/subdomain ever changes rather than editing this file. Preview
 * deployments and any environment without that override fall back to
 * Vercel's own system env vars, so they still resolve to a correct,
 * absolute URL of their own.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  'https://amegah.vercel.app'
).replace(/\/$/, '')
