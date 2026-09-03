/**
 * Seeds placeholder content so the site can be reviewed before the client has
 * uploaded anything.
 *
 *   npm run seed:placeholders            # add or refresh the placeholders
 *   npm run seed:placeholders -- --clear # remove every one of them
 *
 * Everything it creates is either prefixed `placeholder.` or is a named field
 * on the Site Settings singleton, so --clear can find and remove all of it
 * without touching real content the client has since added.
 *
 * Requires the taxonomy to exist already: run `npm run seed` first.
 */
import { createClient } from '@sanity/client'
import { LexoRank } from 'lexorank'

import { categoryId, disciplineId } from './seed-data.ts'
import {
  demoVideos,
  headshotPexelsId,
  ogImagePexelsId,
  placeholderBio,
  placeholderClients,
  placeholderDisciplines,
  placeholderPartners,
  placeholderProjects,
  placeholderSettings,
  type PlaceholderOrg,
} from './placeholder-data.ts'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !token) {
  throw new Error(
    'Missing Sanity credentials. Run `vercel env pull` first, then `npm run seed:placeholders`.',
  )
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2026-09-01',
  useCdn: false,
})

const PREFIX = 'placeholder.'
const id = (...parts: string[]) => `${PREFIX}${parts.join('.')}`

/** The Site Settings fields this script writes, and --clear unsets. */
const SETTINGS_FIELDS = [
  'role',
  'headshot',
  'heroVariant',
  'heroVideo',
  'bio',
  'phone',
  'email',
  'instagramUrl',
  'seoTitle',
  'seoDescription',
  'ogImage',
]

async function clear() {
  const ids: string[] = await client.fetch(`*[_id in path("${PREFIX}**")]._id`)
  console.log(`Removing ${ids.length} placeholder documents…`)

  // Projects reference clients and partners, so delete in dependency order:
  // a referenced document cannot be removed while something points at it.
  const order = ['project', 'client', 'partner', 'mux.videoAsset']
  const transaction = client.transaction()
  for (const type of order) {
    for (const docId of ids.filter((i) => i.startsWith(id(type)))) {
      transaction.delete(docId)
    }
  }
  for (const docId of ids.filter((i) => !order.some((t) => i.startsWith(id(t))))) {
    transaction.delete(docId)
  }

  // The singleton is the client's own document — unset the placeholder fields
  // rather than deleting it, and leave `name` alone.
  transaction.patch('siteSettings', (p) => p.unset(SETTINGS_FIELDS))

  // Disciplines belong to the taxonomy seed; only the fields this script set
  // on them come back off.
  for (const discipline of placeholderDisciplines) {
    transaction.patch(disciplineId(discipline.slug), (p) =>
      p.unset(['coverImage', 'description']),
    )
  }

  await transaction.commit()
  console.log('Placeholders removed. Site Settings kept, its placeholder fields unset.')
}

/** Downloads bytes from a URL and uploads them to Sanity as an image asset. */
async function uploadImageFromUrl(url: string, filename: string) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!response.ok) {
    throw new Error(`Could not fetch placeholder image ${url}: ${response.status}`)
  }
  const asset = await client.assets.upload(
    'image',
    Buffer.from(await response.arrayBuffer()),
    { filename },
  )
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
}

/**
 * Downloads a specific, curated Pexels photo and uploads it to Sanity, cropped
 * to the requested size. Sanity deduplicates uploads by content hash, so
 * re-running this script at the same size reuses the same asset.
 */
async function uploadPexelsImage(pexelsId: number, width: number, height: number) {
  const url = `https://images.pexels.com/photos/${pexelsId}/pexels-photo-${pexelsId}.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`
  return uploadImageFromUrl(url, `pexels-${pexelsId}-${width}x${height}.jpg`)
}

/** Uses a frame from the project's own video as its cover, via Mux's thumbnail API. */
async function uploadMuxThumbnail(playbackId: string, time: number, width: number, height: number) {
  const url = `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=smartcrop&time=${time}`
  return uploadImageFromUrl(url, `mux-${playbackId}-${time}.jpg`)
}

/** Confirms a demo video still streams before it is seeded as content. */
async function verifyPlaybackId(playbackId: string) {
  try {
    const response = await fetch(`https://stream.mux.com/${playbackId}.m3u8`, {
      method: 'HEAD',
    })
    return response.ok
  } catch {
    return false
  }
}

function block(text: string, key: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}s`, text, marks: [] }],
  }
}

function orgDoc(type: 'client' | 'partner', org: PlaceholderOrg, rank: string) {
  return {
    _id: id(type, org.slug),
    _type: type,
    name: org.name,
    ...(org.url && { url: org.url }),
    orderRank: rank,
  }
}

async function seed() {
  const disciplines: string[] = await client.fetch(`*[_type == "discipline"]._id`)
  if (disciplines.length === 0) {
    throw new Error('No disciplines found. Run `npm run seed` first to create the taxonomy.')
  }

  console.log('Checking the placeholder videos still stream…')
  for (const [name, video] of Object.entries(demoVideos)) {
    if (!(await verifyPlaybackId(video.playbackId))) {
      throw new Error(
        `The ${name} video (${video.playbackId}) is not streaming, so seeding it would leave a broken player. Re-run scripts/mux-ingest.ts against a fresh source URL and update demoVideos.`,
      )
    }
    console.log(`  ${name}: streaming`)
  }

  const transaction = client.transaction()

  // Mux asset documents. `muxVideo`/`heroVideo` are references, and the app
  // dereferences them for `playbackId`, so the placeholder needs a real
  // document to point at. These are genuine assets in this project's own Mux
  // account (created by scripts/mux-ingest.ts from real Pexels footage), not
  // borrowed demo IDs — so the assetId is authentic.
  const muxDocIds: Record<keyof typeof demoVideos, string> = {} as never
  for (const [name, video] of Object.entries(demoVideos)) {
    const docId = id('mux', name)
    muxDocIds[name as keyof typeof demoVideos] = docId
    transaction.createOrReplace({
      _id: docId,
      _type: 'mux.videoAsset',
      status: 'ready',
      playbackId: video.playbackId,
      assetId: video.assetId,
    })
  }
  const muxRef = (ref: string) => ({
    _type: 'mux.video',
    asset: { _type: 'reference', _ref: ref },
  })

  // Patched, not replaced: these documents belong to the taxonomy seed, and
  // createOrReplace here would drop their cadence and orderRank.
  console.log('Giving each discipline a cover for the homepage triptych…')
  for (const discipline of placeholderDisciplines) {
    const coverImage = await uploadPexelsImage(discipline.pexelsId, 1600, 2000)
    transaction.patch(disciplineId(discipline.slug), (patch) =>
      patch.set({ coverImage, description: discipline.description }),
    )
  }

  let clientRank = LexoRank.min()
  placeholderClients.forEach((org) => {
    clientRank = clientRank.genNext()
    transaction.createOrReplace(orgDoc('client', org, clientRank.toString()))
  })

  let partnerRank = LexoRank.min()
  placeholderPartners.forEach((org) => {
    partnerRank = partnerRank.genNext()
    transaction.createOrReplace(orgDoc('partner', org, partnerRank.toString()))
  })

  // A small rotating pool of curated photos for gallery filler, so each
  // project's gallery shows real, varied imagery without needing a unique
  // Pexels pick for every single slot.
  const GALLERY_POOL = [
    3052361, 2117937, 3062541, 3062545, 1704488, 2246476, 3760607, 2387819,
    1707823, 3244513, 1699161, 2896853,
  ]

  console.log(`Uploading images for ${placeholderProjects.length} projects…`)
  let projectRank = LexoRank.min()

  for (const [index, project] of placeholderProjects.entries()) {
    projectRank = projectRank.genNext()

    const coverImage = project.muxThumbnail
      ? await uploadMuxThumbnail(project.muxThumbnail.playbackId, project.muxThumbnail.time ?? 3, 2400, 1350)
      : await uploadPexelsImage(project.pexelsId, 2400, 1350)

    const gallery = []
    for (let i = 0; i < project.galleryCount; i += 1) {
      const pexelsId = GALLERY_POOL[(index + i) % GALLERY_POOL.length]
      const image = await uploadPexelsImage(pexelsId, 2000, 1333)
      gallery.push({ ...image, _key: `g${i}`, alt: `${project.title}, still ${i + 1}` })
    }

    transaction.createOrReplace({
      _id: id('project', project.slug),
      _type: 'project',
      title: project.title,
      slug: { _type: 'slug', current: project.slug },
      discipline: { _type: 'reference', _ref: disciplineId(project.discipline) },
      category: {
        _type: 'reference',
        _ref: categoryId(project.discipline, project.category),
      },
      year: project.year,
      coverImage,
      gallery,
      description: project.description.map((text, i) => block(text, `d${i}`)),
      featured: Boolean(project.featured),
      archived: false,
      ...(project.video && { muxVideo: muxRef(muxDocIds[project.video]) }),
      ...(project.client && {
        client: { _type: 'reference', _ref: id('client', project.client) },
      }),
      ...(project.partners && {
        partners: project.partners.map((slug, i) => ({
          _type: 'reference',
          _ref: id('partner', slug),
          _key: `p${i}`,
        })),
      }),
      orderRank: projectRank.toString(),
    })
    console.log(`  ${project.title}`)
  }

  console.log('Uploading the headshot and share image…')
  const headshot = await uploadPexelsImage(headshotPexelsId, 1200, 1500)
  const ogImage = await uploadPexelsImage(ogImagePexelsId, 1200, 630)

  // The singleton belongs to the client — create it only if missing, then set
  // the placeholder fields, so nothing else on it is disturbed.
  transaction.createIfNotExists({
    _id: 'siteSettings',
    _type: 'siteSettings',
    name: placeholderSettings.name,
  })
  transaction.patch('siteSettings', (patch) =>
    patch.set({
      role: placeholderSettings.role,
      email: placeholderSettings.email,
      phone: placeholderSettings.phone,
      instagramUrl: placeholderSettings.instagramUrl,
      seoTitle: placeholderSettings.seoTitle,
      seoDescription: placeholderSettings.seoDescription,
      headshot,
      ogImage,
      bio: placeholderBio.map((text, i) => block(text, `b${i}`)),
      // Shows the reel hero, which has never been seen with real video.
      heroVariant: 'reel',
      heroVideo: muxRef(muxDocIds.mountainNight),
    }),
  )

  await transaction.commit()

  console.log(
    `\nSeeded ${placeholderProjects.length} projects, ${placeholderClients.length} clients, ` +
      `${placeholderPartners.length} partners, and the Site Settings singleton.`,
  )
  console.log('All of it is placeholder content and must be removed before launch:')
  console.log('  npm run seed:placeholders -- --clear')
}

await (process.argv.includes('--clear') ? clear() : seed())
