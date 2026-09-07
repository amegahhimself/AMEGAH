/**
 * Placeholder content, so the site can be seen and reviewed before the client
 * has uploaded anything of their own.
 *
 * NONE OF THIS IS REAL. Every image is a random stock photo, every project is
 * invented, and the showreel is Mux's public demo video. The brief is explicit
 * that the client owns all assets, so all of it must be gone before launch —
 * `npm run seed:placeholders -- --clear` removes it.
 *
 * This is seed data only. Once seeded, the content lives in the Studio and is
 * edited there — never read this file from application code.
 */

export type PlaceholderProject = {
  slug: string
  title: string
  discipline: string
  /** Category slug within that discipline; children use their own slug. */
  category: string
  year: number
  featured?: boolean
  /** A specific, curated Pexels photo id used for the cover image. */
  pexelsId: number
  /** Salt and Water's cover comes from its own video's frame instead. */
  muxThumbnail?: { playbackId: string; time?: number }
  galleryCount: number
  description: string[]
  client?: string
  partners?: string[]
  /** Which real Mux-hosted video (see demoVideos) this project carries, if any. */
  video?: 'mountainNight' | 'fishermanSunset'
}

export const placeholderProjects: PlaceholderProject[] = [
  {
    slug: 'northern-lights',
    title: 'Northern Lights',
    discipline: 'director',
    category: 'music-videos',
    year: 2025,
    featured: true,
    pexelsId: 1699161,
    galleryCount: 4,
    video: 'mountainNight',
    client: 'kwame-records',
    partners: ['harmattan-post'],
    description: [
      'A single unbroken take through a night market, shot on 35mm with a handheld rig and available light.',
      'The brief asked for movement without spectacle — the camera never stops, but it never announces itself either.',
    ],
  },
  {
    slug: 'kinetic',
    title: 'Kinetic',
    discipline: 'director',
    category: 'ads',
    year: 2024,
    featured: true,
    pexelsId: 2529148,
    galleryCount: 3,
    client: 'atlas-athletic',
    description: [
      'Sixty seconds of controlled motion for a sportswear launch, cut to a rhythm the athletes set themselves.',
    ],
  },
  {
    slug: 'the-long-walk-home',
    title: 'The Long Walk Home',
    discipline: 'director',
    category: 'short-films',
    year: 2024,
    pexelsId: 3244513,
    galleryCount: 4,
    partners: ['harmattan-post', 'north-star-sound'],
    description: [
      'A twelve-minute short following a boy walking back to a village that has moved since he left.',
      'Selected for two regional festivals and still touring.',
    ],
  },
  {
    slug: 'salt-and-water',
    title: 'Salt and Water',
    discipline: 'cinematography',
    category: 'documentaries',
    year: 2025,
    featured: true,
    muxThumbnail: { playbackId: 'aCHSbTMxc814scDkxFaIGuIjIvC1X14bA29oJH2xOJE' },
    pexelsId: 1834407,
    galleryCount: 5,
    video: 'fishermanSunset',
    client: 'coastline-films',
    description: [
      'Six weeks with a fishing crew on the coast, shot almost entirely at first light.',
      'The grade was built to hold detail in the sky without flattening the water.',
    ],
  },
  {
    slug: 'midnight-run',
    title: 'Midnight Run',
    discipline: 'cinematography',
    category: 'music-videos',
    year: 2024,
    pexelsId: 1707823,
    galleryCount: 3,
    client: 'kwame-records',
    description: [
      'Neon, rain machines and a car that had to look faster than it was.',
    ],
  },
  {
    slug: 'accra-after-dark',
    title: 'Accra After Dark',
    discipline: 'cinematography',
    category: 'short-films',
    year: 2023,
    pexelsId: 2387877,
    galleryCount: 4,
    description: [
      'A night in three parts, lit almost entirely by the city itself.',
    ],
  },
  {
    slug: 'adjei-mensah',
    title: 'Adjei & Mensah',
    discipline: 'events',
    category: 'white-wedding',
    year: 2025,
    pexelsId: 3059720,
    galleryCount: 5,
    description: [
      'A two-day wedding filmed with two operators and no second takes.',
    ],
  },
  {
    slug: 'studio-portraits',
    title: 'Studio Portraits',
    discipline: 'photography',
    category: 'portraits',
    year: 2025,
    featured: true,
    pexelsId: 1024311,
    galleryCount: 6,
    description: [
      'An ongoing series shot against a single grey seamless, one light, no retouching beyond dust.',
    ],
  },
  {
    slug: 'market-day',
    title: 'Market Day',
    discipline: 'photography',
    category: 'lifestyle',
    year: 2024,
    pexelsId: 2896853,
    galleryCount: 5,
    description: [
      'Colour work made across four markets over a year, printed large.',
    ],
  },
  {
    slug: 'fabric',
    title: 'Fabric',
    discipline: 'photography',
    category: 'editorial',
    year: 2023,
    pexelsId: 3785424,
    galleryCount: 4,
    client: 'atlas-athletic',
    partners: ['north-star-sound'],
    description: [
      'An editorial commission on cloth, weave and the people who make it.',
    ],
  },
]

/**
 * The homepage triptych reads `coverImage` and `description` off the
 * discipline documents. Nothing populates them — not the taxonomy seed, not
 * the Studio's defaults — so without this the triptych renders three empty
 * bordered boxes under its three labels.
 */
export const placeholderDisciplines = [
  {
    slug: 'director',
    pexelsId: 1707820,
    description: 'Music videos, commercials and short films.',
  },
  {
    slug: 'cinematography',
    pexelsId: 2117937,
    description: 'Camera and lighting for narrative, documentary and events.',
  },
  {
    slug: 'photography',
    pexelsId: 2896853,
    description: 'Portraiture, lifestyle and editorial commissions.',
  },
  {
    slug: 'events',
    pexelsId: 3059720,
    description: 'Weddings, parties, funerals and corporate occasions.',
  },
]

export type PlaceholderOrg = { slug: string; name: string; url?: string }

/**
 * Deliberately seeded without logos. `LogoStrip` falls back to setting the
 * name as text, which reads as a designed choice — random stock photos used as
 * client logos would just look broken.
 */
export const placeholderClients: PlaceholderOrg[] = [
  { slug: 'kwame-records', name: 'Kwame Records', url: 'https://example.com' },
  { slug: 'atlas-athletic', name: 'Atlas Athletic', url: 'https://example.com' },
  { slug: 'coastline-films', name: 'Coastline Films' },
  { slug: 'meridian-agency', name: 'Meridian Agency', url: 'https://example.com' },
  { slug: 'sable-studio', name: 'Sable Studio' },
  { slug: 'lantern-media', name: 'Lantern Media', url: 'https://example.com' },
]

export const placeholderPartners: PlaceholderOrg[] = [
  { slug: 'harmattan-post', name: 'Harmattan Post', url: 'https://example.com' },
  { slug: 'north-star-sound', name: 'North Star Sound' },
  { slug: 'field-grip', name: 'Field & Grip' },
  { slug: 'aperture-rentals', name: 'Aperture Rentals', url: 'https://example.com' },
]

export const placeholderBio = [
  'Amegah is a director, cinematographer and photographer working between commercial and documentary film. His work is built on long takes, available light and a preference for the moment just before or just after the one everybody expects.',
  'He has shot for record labels, sportswear brands and independent production houses, and continues to make personal photographic work between commissions.',
]

export const placeholderSettings = {
  name: 'Amegah',
  role: 'Director · Cinematographer · Photographer',
  email: 'hello@amegah.com',
  phone: '+233 20 000 0000',
  instagramUrl: 'https://instagram.com/amegah',
  seoTitle: 'Amegah — Director, Cinematographer & Photographer',
  seoDescription:
    'Selected film and photographic work by Amegah, a director, cinematographer and photographer.',
}

/**
 * Real stock footage from Pexels, ingested into Mux via its API
 * (scripts/mux-ingest.ts) so it streams with adaptive bitrate exactly like the
 * client's own footage will. Not a stand-in demo clip — actual video content,
 * licensed for this kind of use under the Pexels license.
 *
 * `mountainNight`: a starry night camp beneath a peak — dark and atmospheric,
 * used for the homepage showreel and the "Northern Lights" project.
 * `fishermanSunset`: a small boat crossing calm water at sunset — used for the
 * "Salt and Water" documentary, whose own description ("shot almost entirely
 * at first light") this happens to match.
 */
export const demoVideos = {
  mountainNight: {
    playbackId: 'osqQxLf7lwrE02n6iGwCmGE31CE9QU4JTVNg1GofO01XY',
    assetId: 'W8jvSbOfeoTcGMuS5J3Mt5GKVZLraSs9WyIJAmVVHiQ',
  },
  fishermanSunset: {
    playbackId: 'aCHSbTMxc814scDkxFaIGuIjIvC1X14bA29oJH2xOJE',
    assetId: '01edF82tvYRPH3cKTCRiVj7zln802UMSLZctl7X44c32M',
  },
}

/** A moody portrait, used for the About page headshot. */
export const headshotPexelsId = 2379005

/** Reused for the social share image — broad appeal, on-brand and dark. */
export const ogImagePexelsId = 3052361
