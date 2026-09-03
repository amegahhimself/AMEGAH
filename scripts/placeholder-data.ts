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
  /** Seeds the cover image and gallery deterministically. */
  imageSeed: string
  galleryCount: number
  description: string[]
  client?: string
  partners?: string[]
  /** Only one project carries the demo film; the rest are stills. */
  video?: boolean
}

export const placeholderProjects: PlaceholderProject[] = [
  {
    slug: 'northern-lights',
    title: 'Northern Lights',
    discipline: 'director',
    category: 'music-videos',
    year: 2025,
    featured: true,
    imageSeed: 'amegah-northern',
    galleryCount: 4,
    video: true,
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
    imageSeed: 'amegah-kinetic',
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
    imageSeed: 'amegah-longwalk',
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
    discipline: 'cinematographer',
    category: 'documentaries',
    year: 2025,
    featured: true,
    imageSeed: 'amegah-salt',
    galleryCount: 5,
    client: 'coastline-films',
    description: [
      'Six weeks with a fishing crew on the coast, shot almost entirely at first light.',
      'The grade was built to hold detail in the sky without flattening the water.',
    ],
  },
  {
    slug: 'midnight-run',
    title: 'Midnight Run',
    discipline: 'cinematographer',
    category: 'music-videos',
    year: 2024,
    imageSeed: 'amegah-midnight',
    galleryCount: 3,
    client: 'kwame-records',
    description: [
      'Neon, rain machines and a car that had to look faster than it was.',
    ],
  },
  {
    slug: 'accra-after-dark',
    title: 'Accra After Dark',
    discipline: 'cinematographer',
    category: 'short-films',
    year: 2023,
    imageSeed: 'amegah-afterdark',
    galleryCount: 4,
    description: [
      'A night in three parts, lit almost entirely by the city itself.',
    ],
  },
  {
    slug: 'adjei-mensah',
    title: 'Adjei & Mensah',
    discipline: 'cinematographer',
    category: 'white-wedding',
    year: 2025,
    imageSeed: 'amegah-wedding',
    galleryCount: 5,
    description: [
      'A two-day wedding filmed with two operators and no second takes.',
    ],
  },
  {
    slug: 'studio-portraits',
    title: 'Studio Portraits',
    discipline: 'photographer',
    category: 'portraits',
    year: 2025,
    featured: true,
    imageSeed: 'amegah-portraits',
    galleryCount: 6,
    description: [
      'An ongoing series shot against a single grey seamless, one light, no retouching beyond dust.',
    ],
  },
  {
    slug: 'market-day',
    title: 'Market Day',
    discipline: 'photographer',
    category: 'lifestyle',
    year: 2024,
    imageSeed: 'amegah-market',
    galleryCount: 5,
    description: [
      'Colour work made across four markets over a year, printed large.',
    ],
  },
  {
    slug: 'fabric',
    title: 'Fabric',
    discipline: 'photographer',
    category: 'editorial',
    year: 2023,
    imageSeed: 'amegah-fabric',
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
    imageSeed: 'amegah-discipline-director',
    description: 'Music videos, commercials and short films.',
  },
  {
    slug: 'cinematographer',
    imageSeed: 'amegah-discipline-dop',
    description: 'Camera and lighting for narrative, documentary and events.',
  },
  {
    slug: 'photographer',
    imageSeed: 'amegah-discipline-photo',
    description: 'Portraiture, lifestyle and editorial commissions.',
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
 * Mux's public demo videos. They stream without any Mux account, which is what
 * makes the showreel and the project film viewable before the client's Mux
 * credentials are entered.
 *
 * Chosen by eye from their thumbnails, not picked off a list: Mux's best-known
 * demo ID (`qxb01i6T…`) is a recorded conference talk full of white slides,
 * which looks broken behind a white wordmark. Both of these are dark and
 * cinematic, which is what the hero is designed around.
 *
 * The script verifies each still streams before seeding it.
 */
export const demoVideos = {
  /** Blue ink blooming in water on black — abstract, dark, reads as a reel. */
  reel: 'a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M',
  /** A letterboxed, low-key narrative clip — reads as a film. */
  film: 'DS00Spx1CV902MCtPj5WknGlR102V5HFkDe',
}
