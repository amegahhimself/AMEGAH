const round = (value: number) => parseFloat(value.toFixed(4)).toString()

/**
 * Builds a CSS clamp() that scales linearly between two viewport widths.
 * Sizes are given in pixels; the output is in rem so it respects the
 * reader's browser font-size setting.
 */
export function fluid(minPx: number, maxPx: number, minVw = 360, maxVw = 1440): string {
  const slope = (maxPx - minPx) / (maxVw - minVw)
  const intercept = minPx - slope * minVw
  return `clamp(${round(minPx / 16)}rem, ${round(intercept / 16)}rem + ${round(
    slope * 100,
  )}vw, ${round(maxPx / 16)}rem)`
}
