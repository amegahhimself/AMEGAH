import { type SchemaTypeDefinition } from 'sanity'

import { discipline } from './discipline'
import { category } from './category'
import { project } from './project'
import { client } from './client'
import { partner } from './partner'
import { siteSettings } from './siteSettings'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [discipline, category, project, client, partner, siteSettings],
}
