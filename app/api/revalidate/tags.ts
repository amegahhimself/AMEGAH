import { isContentType, TAGS } from '@/sanity/lib/tags'

/**
 * Maps a Sanity webhook payload to the cache tags that should be revalidated.
 * Unknown document types (asset records, drafts of internal types) map to
 * nothing, so an unexpected payload can never blow away the whole cache.
 */
export function tagsForPayload(body: unknown): string[] {
  const type = (body as { _type?: unknown } | null)?._type
  if (typeof type !== 'string' || !isContentType(type)) {
    return []
  }
  return [TAGS[type]]
}
