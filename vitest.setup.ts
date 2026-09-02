import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock missing DOM APIs for Sanity compatibility
if (typeof global.CSS === 'undefined') {
  ;(global.CSS as any) = {
    supports: () => false,
  }
}
