import { describe, expect, it } from 'vitest'
import { discipline } from './discipline'
import { category } from './category'
import { project } from './project'
import { client } from './client'
import { partner } from './partner'

type Field = { name: string }
const names = (t: { fields: unknown }) => (t.fields as Field[]).map((f) => f.name)

describe('orderable documents', () => {
  it.each([
    ['discipline', discipline],
    ['category', category],
    ['project', project],
    ['client', client],
    ['partner', partner],
  ])('%s can be reordered by dragging', (_label, schema) => {
    expect(names(schema)).toContain('orderRank')
  })
})
