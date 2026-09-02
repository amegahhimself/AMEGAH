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
}

export default nextConfig
