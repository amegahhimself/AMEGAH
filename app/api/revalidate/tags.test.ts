import { describe, expect, it } from 'vitest'
import { tagsForPayload } from './tags'

describe('tagsForPayload', () => {
  it('revalidates the matching tag for a known document type', () => {
    expect(tagsForPayload({ _type: 'project' })).toEqual(['project'])
  })

  it('revalidates settings when the singleton changes', () => {
    expect(tagsForPayload({ _type: 'siteSettings' })).toEqual(['siteSettings'])
  })

  it('ignores document types the site does not render', () => {
    expect(tagsForPayload({ _type: 'sanity.imageAsset' })).toEqual([])
  })

  it('revalidates the project page when its Mux video asset changes', () => {
    expect(tagsForPayload({ _type: 'mux.videoAsset' })).toEqual(['muxVideoAsset'])
  })

  it('ignores a payload with no type', () => {
    expect(tagsForPayload({})).toEqual([])
    expect(tagsForPayload(null)).toEqual([])
  })
})
