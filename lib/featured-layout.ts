/**
 * The featured selection runs in a repeating full / half / half rhythm.
 *
 * A uniform grid is what makes portfolio templates look like templates
 * (spec criterion 7). Opening full-bleed and then breaking into pairs gives
 * the page a cadence without needing the client to lay anything out.
 */
export function featuredSpan(index: number): 'full' | 'half' {
  return index % 3 === 0 ? 'full' : 'half'
}
