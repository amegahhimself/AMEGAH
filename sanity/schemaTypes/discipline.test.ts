import { describe, expect, it } from 'vitest'
import { discipline } from './discipline'

type Field = { name: string; type: string; options?: { list?: unknown[] } }
const fields = () => discipline.fields as unknown as Field[]

describe('discipline schema', () => {
  it('is a document type named discipline', () => {
    expect(discipline.name).toBe('discipline')
    expect(discipline.type).toBe('document')
  })

  it('has the fields the site queries', () => {
    const names = fields().map((f) => f.name)
    expect(names).toEqual(
      expect.arrayContaining(['title', 'slug', 'description', 'coverImage', 'cadence']),
    )
  })

  it('offers exactly the three grid cadences', () => {
    const cadence = fields().find((f) => f.name === 'cadence')
    expect(cadence?.options?.list).toEqual(['cinematic', 'filmstrip', 'editorial'])
  })
})
