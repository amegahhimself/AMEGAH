// Mock missing DOM APIs for Sanity compatibility
if (typeof global.CSS === 'undefined') {
  ;(global.CSS as any) = {
    supports: () => false,
  }
}
