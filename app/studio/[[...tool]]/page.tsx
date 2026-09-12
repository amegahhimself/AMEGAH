/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 */

import type { Metadata } from 'next'
import { NextStudio, metadata as studioMetadata } from 'next-sanity/studio'
import config from '../../../sanity.config'

// next-sanity/studio's own metadata (referrer/robots only, no title) has
// no title, so this tab silently inherited the root layout's marketing
// title — meaning the client's browser tab looked identical whether they
// had the live site or the CMS open. Spreading it and adding our own
// title is the customization path next-sanity/studio's own doc comment
// recommends, rather than re-exporting it unchanged.
export { viewport } from 'next-sanity/studio'
export const metadata: Metadata = {
  ...studioMetadata,
  title: 'Studio — Amegah',
}

export default function StudioPage() {
  return <NextStudio config={config} />
}
