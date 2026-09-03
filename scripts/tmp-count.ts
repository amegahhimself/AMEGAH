import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_READ_TOKEN,
  apiVersion: '2026-09-01',
  useCdn: false,
  perspective: 'published',
})

const query = `{
  "settings": *[_type=="siteSettings"][0]{
    heroVariant,
    "rawHeroVideo": heroVideo,
    "derefHeroVideo": heroVideo.asset->{playbackId, assetId}
  },
  "muxDocs": *[_type=="mux.videoAsset"]{_id, playbackId},
  "projectVideo": *[_type=="project" && slug.current=="northern-lights"][0]{
    title, "muxVideo": muxVideo.asset->{playbackId}
  }
}`

console.log(JSON.stringify(await client.fetch(query), null, 2))
