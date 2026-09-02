export const TAGS = {
  discipline: 'discipline',
  category: 'category',
  project: 'project',
  client: 'client',
  partner: 'partner',
  siteSettings: 'siteSettings',
  // Sanity's own `_type` for a Mux video asset document is `mux.videoAsset`
  // (with a dot), which cannot be used as a plain object key here — see the
  // `_type` -> key normalisation in app/api/revalidate/tags.ts.
  muxVideoAsset: 'muxVideoAsset',
} as const

export type ContentType = keyof typeof TAGS

export function isContentType(type: string): type is ContentType {
  return Object.hasOwn(TAGS, type)
}
