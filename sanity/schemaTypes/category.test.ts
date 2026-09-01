import { describe, expect, it } from 'vitest'
import { category } from './category'

type Field = { name: string; type: string; to?: { type: string }[] }
const fields = () => category.fields as unknown as Field[]
const field = (name: string) => fields().find((f) => f.name === name)

describe('category schema', () => {
  it('is a document type named category', () => {
    expect(category.name).toBe('category')
    expect(category.type).toBe('document')
  })

  it('belongs to a discipline', () => {
    const discipline = field('discipline')
    expect(discipline?.type).toBe('reference')
    expect(discipline?.to).toEqual([{ type: 'discipline' }])
  })

  it('can nest under another category', () => {
    const parent = field('parent')
    expect(parent?.type).toBe('reference')
    expect(parent?.to).toEqual([{ type: 'category' }])
  })
})
