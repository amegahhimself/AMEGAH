import { isContentType, TAGS } from '@/sanity/lib/tags'

/**
 * Sanity's own `_type` for a Mux video asset document is `mux.videoAsset`
 * (dotted), which isn't a valid `TAGS` key. This normalizes an incoming
 * webhook `_type` to the plain-identifier key `tagsForPayload` matches
 * against, before falling through to the identity mapping every other
 * document type uses.
 */
const INCOMING_TYPE_ALIASES: Record<string, keyof typeof TAGS> = {
  'mux.videoAsset': 'muxVideoAsset',
}

/**
 * Maps a Sanity webhook payload to the cache tags that should be revalidated.
 * Unknown document types (asset records, drafts of internal types) map to
 * nothing, so an unexpected payload can never blow away the whole cache.
 */
export function tagsForPayload(body: unknown): string[] {
  const rawType = (body as { _type?: unknown } | null)?._type
  if (typeof rawType !== 'string') {
    return []
  }
  const type = INCOMING_TYPE_ALIASES[rawType] ?? rawType
  if (!isContentType(type)) {
    return []
  }
  return [TAGS[type]]
}
