/**
 * One-off: ingest real video into Mux from public URLs, and print the
 * resulting asset id + playback id once ready. Used to replace Mux's demo
 * placeholder videos with real stock footage from Pexels.
 */
const id = process.env.MUX_TOKEN_ID!
const secret = process.env.MUX_TOKEN_SECRET!
const auth = 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64')

async function createAsset(url: string) {
  const res = await fetch('https://api.mux.com/video/v1/assets', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: [{ url }],
      playback_policy: ['public'],
      video_quality: 'basic',
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Mux asset create failed: ${res.status} ${JSON.stringify(json)}`)
  return json.data.id as string
}

async function waitForReady(assetId: string) {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
      headers: { Authorization: auth },
    })
    const json = await res.json()
    const status = json.data.status
    if (status === 'ready') {
      const playbackId = json.data.playback_ids?.[0]?.id
      return { assetId, playbackId }
    }
    if (status === 'errored') throw new Error(`Mux asset errored: ${JSON.stringify(json.data.errors)}`)
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error(`Timed out waiting for asset ${assetId}`)
}

const sources = process.argv.slice(2)
if (sources.length === 0) {
  console.error('Usage: mux-ingest.ts <url> [url...]')
  process.exit(1)
}

for (const url of sources) {
  console.log(`Ingesting ${url}...`)
  const assetId = await createAsset(url)
  const result = await waitForReady(assetId)
  console.log(`  READY assetId=${result.assetId} playbackId=${result.playbackId}`)
}

export {}
