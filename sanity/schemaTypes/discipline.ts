import { defineField, defineType } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'

export const discipline = defineType({
  name: 'discipline',
  title: 'Discipline',
  type: 'document',
  description: 'A portfolio section, such as Director or Photographer.',
  orderings: [orderRankOrdering],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used in the page address, e.g. /cinematography',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'One line shown beneath the heading on this section\'s page.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Represents this section on the homepage.',
    }),
    defineField({
      name: 'cadence',
      title: 'Grid Cadence',
      type: 'string',
      description:
        'Controls the rhythm of this section\'s grid. Cinematic: large 16:9. Filmstrip: dense. Editorial: mixed heights.',
      options: { list: ['cinematic', 'filmstrip', 'editorial'] },
      initialValue: 'editorial',
      validation: (Rule) => Rule.required(),
    }),
    orderRankField({ type: 'discipline' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'cadence', media: 'coverImage' },
  },
})
