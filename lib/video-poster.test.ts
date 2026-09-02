import { describe, expect, it } from 'vitest'
import { posterUrl } from './video-poster'

describe('posterUrl', () => {
  it('lets Mux generate a poster when the project has no cover image', () => {
    expect(posterUrl(undefined)).toBeUndefined()
    expect(posterUrl({})).toBeUndefined()
  })

  it('prefers the cover image the client chose', () => {
    const url = posterUrl({ asset: { _ref: 'image-abc-1600x900-jpg' } })
    expect(url).toContain('cdn.sanity.io')
  })
})
