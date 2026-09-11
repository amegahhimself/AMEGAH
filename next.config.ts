import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Drops the `X-Powered-By: Next.js` response header — free, and no
  // reason to hand a scanner the framework/version for free.
  poweredByHeader: false,
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
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Nothing on this site uses the camera, mic, or geolocation —
          // deny them so an embedded/compromised third-party script (Mux
          // player, Sanity Studio) can't silently request them.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
