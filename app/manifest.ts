import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Amegah — Director, Cinematographer & Photographer',
    short_name: 'Amegah',
    description: 'Selected directing, cinematography and photography work by Amegah.',
    start_url: '/',
    display: 'standalone',
    // Matches the site's ink colour (see app/globals.css's --color-ink) so a
    // browser-chrome/splash-screen flash isn't jarringly off-brand.
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
