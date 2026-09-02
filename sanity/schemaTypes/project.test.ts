import { describe, expect, it } from 'vitest'
import { categoryFilter, project } from './project'

type Field = { name: string; type: string; to?: { type: string }[] }
const fields = () => project.fields as unknown as Field[]
const field = (name: string) => fields().find((f) => f.name === name)

describe('project schema', () => {
  it('references the discipline taxonomy rather than a hardcoded list', () => {
    const discipline = field('discipline')
    expect(discipline?.type).toBe('reference')
    expect(discipline?.to).toEqual([{ type: 'discipline' }])
  })

  it('references the category taxonomy rather than a hardcoded list', () => {
    const category = field('category')
    expect(category?.type).toBe('reference')
    expect(category?.to).toEqual([{ type: 'category' }])
  })

  it('no longer has the special-cased eventType field', () => {
    expect(field('eventType')).toBeUndefined()
  })

  it('supports an art-directed mobile crop', () => {
    expect(field('mobileCoverImage')?.type).toBe('image')
  })
})

describe('categoryFilter', () => {
  it('offers no categories until a discipline is chosen', () => {
    expect(categoryFilter({ document: {} })).toEqual({ filter: 'false' })
  })

  it('restricts categories to the chosen discipline', () => {
    expect(categoryFilter({ document: { discipline: { _ref: 'abc123' } } })).toEqual({
      filter: 'discipline._ref == $disciplineId',
      params: { disciplineId: 'abc123' },
    })
  })
})

describe('description block restrictions', () => {
  type BlockOf = {
    type: string
    styles?: { value: string }[]
    lists?: unknown[]
    marks?: { annotations?: { name: string }[] }
  }

  const blockOf = () => {
    const description = fields().find((f) => f.name === 'description') as unknown as {
      of: BlockOf[]
    }
    return description.of.find((entry) => entry.type === 'block')
  }

  it('only offers the normal paragraph style, not headings or quotes', () => {
    expect(blockOf()?.styles?.map((s) => s.value)).toEqual(['normal'])
  })

  it('offers no bullet or numbered lists', () => {
    expect(blockOf()?.lists).toEqual([])
  })

  it('keeps the link annotation so editors can still link text', () => {
    const names = blockOf()?.marks?.annotations?.map((a) => a.name)
    expect(names).toContain('link')
  })
})

describe('project video field', () => {
  it('stores video as a Mux asset so the client uploads it in Studio', () => {
    expect(field('muxVideo')?.type).toBe('mux.video')
  })

  it('keeps previewLoop separate from the full video', () => {
    expect(field('previewLoop')?.type).toBe('file')
  })
})
