import { defineField, defineType } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'

export const partner = defineType({
  name: 'partner',
  title: 'Partner',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
    }),
    orderRankField({ type: 'partner' }),
  ],
  preview: {
    select: { title: 'name', media: 'logo' },
  },
})
