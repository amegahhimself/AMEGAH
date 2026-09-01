import { type SchemaTypeDefinition } from 'sanity'

import { discipline } from './discipline'
import { project } from './project'
import { client } from './client'
import { partner } from './partner'
import { siteSettings } from './siteSettings'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [discipline, project, client, partner, siteSettings],
}
