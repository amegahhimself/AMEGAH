import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Images are resized by Sanity's CDN rather than Vercel's optimizer —
    // Sanity already does the work, and Vercel's Hobby plan caps image
    // transformations per month, which an image-led portfolio would exhaust.
    // See lib/sanity-image-loader.ts.
    loader: 'custom',
    loaderFile: './lib/sanity-image-loader.ts',
    // Inert while the custom loader is active (nothing is proxied through
    // Vercel), but kept so reverting to the built-in optimizer is a one-line
    // change rather than a rediscovery.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/**' },
      { protocol: 'https', hostname: 'image.mux.com', pathname: '/**' },
    ],
  },
  // Baseline security headers. Not CSP — this site embeds the Sanity
  // Studio (/studio) and Mux's player, both of which pull in scripts/styles
  // from origins that would need constant upkeep in a CSP allowlist; the
  // headers below are the ones with no such cost.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}

export default nextConfig
