export const TAGS = {
  discipline: 'discipline',
  category: 'category',
  project: 'project',
  client: 'client',
  partner: 'partner',
  siteSettings: 'siteSettings',
} as const

export type ContentType = keyof typeof TAGS

export function isContentType(type: string): type is ContentType {
  return Object.hasOwn(TAGS, type)
}
