import { defineField, defineType } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  description: 'A filter within a discipline, such as Music Videos.',
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
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'discipline',
      title: 'Discipline',
      type: 'reference',
      to: [{ type: 'discipline' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Parent Category',
      type: 'reference',
      to: [{ type: 'category' }],
      description:
        'Optional. Use for sub-categories, e.g. set Events as the parent of Corporate.',
    }),
    orderRankField({ type: 'category' }),
  ],
  preview: {
    select: { title: 'title', discipline: 'discipline.title', parent: 'parent.title' },
    prepare({ title, discipline, parent }) {
      return {
        title,
        subtitle: parent ? `${discipline} · ${parent}` : discipline,
      }
    },
  },
})
