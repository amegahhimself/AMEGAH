import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock missing DOM APIs for Sanity compatibility
if (typeof global.CSS === 'undefined') {
  global.CSS = { supports: () => false } as unknown as typeof global.CSS
}

// jsdom doesn't implement matchMedia. Default to "no preference" so
// prefers-reduced-motion checks (e.g. components/hero-reel.tsx) behave like
// a typical browser unless a test explicitly overrides it.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
