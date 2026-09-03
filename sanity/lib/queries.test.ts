import { describe, expect, it } from 'vitest'
import {
  ALL_PROJECT_SLUGS_QUERY,
  CATEGORIES_BY_DISCIPLINE_QUERY,
  CLIENTS_QUERY,
  DISCIPLINE_BY_SLUG_QUERY,
  DISCIPLINE_PROJECT_REFS_QUERY,
  FEATURED_PROJECTS_QUERY,
  PARTNERS_QUERY,
  PROJECT_CARD_PROJECTION,
  PROJECT_DETAIL_QUERY,
  projectListQuery,
  SITE_SETTINGS_QUERY,
} from './queries'

describe('projectListQuery', () => {
  it('always excludes archived projects', () => {
    expect(projectListQuery({})).toContain('!archived')
  })

  it('sorts by the editor-defined order', () => {
    expect(projectListQuery({})).toContain('order(orderRank)')
  })

  it('filters by discipline when given one', () => {
    expect(projectListQuery({ disciplineSlug: 'director' })).toContain(
      'discipline->slug.current == $disciplineSlug',
    )
  })

  it('filters by category when given one', () => {
    expect(projectListQuery({ categorySlug: 'ads' })).toContain(
      'category->slug.current == $categorySlug',
    )
  })

  it('omits the category clause when no category is given', () => {
    expect(projectListQuery({ disciplineSlug: 'director' })).not.toContain(
      '$categorySlug',
    )
  })
})

describe('DISCIPLINE_BY_SLUG_QUERY', () => {
  it('looks up a single discipline by slug', () => {
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('_type == "discipline"')
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('slug.current == $slug')
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('[0]')
  })

  it('returns the cadence that drives the grid layout', () => {
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('cadence')
  })

  it('projects the cover image, which the page needs for its share image', () => {
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('"coverImage": coverImage{')
  })
})

describe('CATEGORIES_BY_DISCIPLINE_QUERY', () => {
  it('scopes categories to one discipline', () => {
    expect(CATEGORIES_BY_DISCIPLINE_QUERY).toContain(
      'discipline->slug.current == $disciplineSlug',
    )
  })

  it('projects parentId so the tree helper can nest sub-categories', () => {
    expect(CATEGORIES_BY_DISCIPLINE_QUERY).toContain('"parentId": parent._ref')
  })

  it('orders by the editor-defined rank', () => {
    expect(CATEGORIES_BY_DISCIPLINE_QUERY).toContain('order(orderRank)')
  })
})

describe('PROJECT_CARD_PROJECTION', () => {
  it('exposes the parent category slug so a parent filter can match its children', () => {
    expect(PROJECT_CARD_PROJECTION).toContain('parentSlug')
  })

  it('includes LQIP metadata for blur placeholders', () => {
    expect(PROJECT_CARD_PROJECTION).toContain('lqip')
  })

  it('includes the image hotspot so crops respect the focal point', () => {
    expect(PROJECT_CARD_PROJECTION).toContain('hotspot')
  })

  // A component reading a field the query never projects fails silently — it
  // just renders as if the client uploaded nothing. This has bitten this
  // project repeatedly, so the projection is pinned rather than trusted.
  it('projects the mobile crop the card art-directs with', () => {
    expect(PROJECT_CARD_PROJECTION).toContain('"mobileCoverImage": mobileCoverImage')
  })

  it('gives the mobile crop the same metadata as the wide one', () => {
    // Its own ratio sizes the frame, its own hotspot positions it, and its
    // own LQIP blurs it — the wide image's values are all wrong for it.
    const mobile = PROJECT_CARD_PROJECTION.split('"mobileCoverImage"')[1]?.split('}')[0] ?? ''
    expect(mobile).toContain('hotspot')
    expect(mobile).toContain('lqip')
    expect(mobile).toContain('aspectRatio')
  })
})

describe('PROJECT_DETAIL_QUERY', () => {
  it('looks up one non-archived project by slug', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('_type == "project"')
    expect(PROJECT_DETAIL_QUERY).toContain('slug.current == $slug')
    expect(PROJECT_DETAIL_QUERY).toContain('!archived')
    expect(PROJECT_DETAIL_QUERY).toContain('[0]')
  })

  it('follows the Mux asset reference to the playback id', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('muxVideo.asset->')
    expect(PROJECT_DETAIL_QUERY).toContain('playbackId')
  })

  it('returns gallery images with their alt text and captions', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('gallery')
    expect(PROJECT_DETAIL_QUERY).toContain('alt')
    expect(PROJECT_DETAIL_QUERY).toContain('caption')
  })

  it('resolves the credits the page shows', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('client->')
    expect(PROJECT_DETAIL_QUERY).toContain('partners[]->')
  })

  // The hero read `mobileCoverImage` while this query didn't project it —
  // the field silently arrived undefined and the phone got the wide crop.
  it('projects the mobile crop the hero art-directs with', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('"mobileCoverImage": mobileCoverImage')
  })

  it('gives the mobile crop the same metadata as the wide one', () => {
    const mobile = PROJECT_DETAIL_QUERY.split('"mobileCoverImage"')[1]?.split('}')[0] ?? ''
    expect(mobile).toContain('hotspot')
    expect(mobile).toContain('lqip')
    expect(mobile).toContain('aspectRatio')
  })
})

describe('DISCIPLINE_PROJECT_REFS_QUERY', () => {
  it('lists a discipline’s projects in the editor-defined order', () => {
    expect(DISCIPLINE_PROJECT_REFS_QUERY).toContain(
      'discipline->slug.current == $disciplineSlug',
    )
    expect(DISCIPLINE_PROJECT_REFS_QUERY).toContain('order(orderRank)')
    expect(DISCIPLINE_PROJECT_REFS_QUERY).toContain('!archived')
  })
})

describe('ALL_PROJECT_SLUGS_QUERY', () => {
  it('lists every non-archived project slug for prerendering', () => {
    expect(ALL_PROJECT_SLUGS_QUERY).toContain('_type == "project"')
    expect(ALL_PROJECT_SLUGS_QUERY).toContain('!archived')
  })
})

describe('SITE_SETTINGS_QUERY', () => {
  it('returns the hero treatment and its assets', () => {
    expect(SITE_SETTINGS_QUERY).toContain('heroVariant')
    expect(SITE_SETTINGS_QUERY).toContain('heroVideo')
    expect(SITE_SETTINGS_QUERY).toContain('heroImages')
  })

  it('follows the hero video reference to its playback id', () => {
    expect(SITE_SETTINGS_QUERY).toContain('heroVideo.asset->')
    expect(SITE_SETTINGS_QUERY).toContain('playbackId')
  })

  it('returns the role line and share metadata', () => {
    expect(SITE_SETTINGS_QUERY).toContain('role')
    expect(SITE_SETTINGS_QUERY).toContain('seoTitle')
    expect(SITE_SETTINGS_QUERY).toContain('ogImage')
  })
})

describe('FEATURED_PROJECTS_QUERY', () => {
  it('returns only featured, unarchived projects in the editor’s order', () => {
    expect(FEATURED_PROJECTS_QUERY).toContain('featured == true')
    expect(FEATURED_PROJECTS_QUERY).toContain('!archived')
    expect(FEATURED_PROJECTS_QUERY).toContain('order(orderRank)')
  })
})

describe('SITE_SETTINGS_QUERY headshot', () => {
  it('projects the headshot’s image fields so the About page can blur and crop it', () => {
    expect(SITE_SETTINGS_QUERY).toContain('"headshot": headshot{')
    expect(SITE_SETTINGS_QUERY).toContain('lqip')
    expect(SITE_SETTINGS_QUERY).toContain('hotspot')
  })
})

describe('CLIENTS_QUERY and PARTNERS_QUERY', () => {
  it('each list their own document type in the editor’s order', () => {
    expect(CLIENTS_QUERY).toContain('_type == "client"')
    expect(CLIENTS_QUERY).toContain('order(orderRank)')
    expect(PARTNERS_QUERY).toContain('_type == "partner"')
    expect(PARTNERS_QUERY).toContain('order(orderRank)')
  })

  it('return the logo and the outbound link', () => {
    expect(CLIENTS_QUERY).toContain('logo')
    expect(CLIENTS_QUERY).toContain('url')
    expect(PARTNERS_QUERY).toContain('logo')
    expect(PARTNERS_QUERY).toContain('url')
  })
})
