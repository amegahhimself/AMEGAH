import { defineField, defineType, type ReferenceFilterResolverContext } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'

type ProjectDocument = { discipline?: { _ref?: string } }

/**
 * Restricts the category picker to categories belonging to the discipline
 * already chosen on this project, so an invalid pairing cannot be saved.
 */
export function categoryFilter({ document }: { document: ProjectDocument }) {
  const disciplineId = document?.discipline?._ref
  if (!disciplineId) {
    return { filter: 'false' }
  }
  return {
    filter: 'discipline._ref == $disciplineId',
    params: { disciplineId },
  }
}

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
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
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      options: {
        filter: (context: ReferenceFilterResolverContext) =>
          categoryFilter({ document: context.document as ProjectDocument }),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'client' }],
    }),
    defineField({
      name: 'partners',
      title: 'Partners',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'partner' }] }],
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mobileCoverImage',
      title: 'Mobile Cover Image',
      type: 'image',
      options: { hotspot: true },
      description:
        'Optional. A portrait-friendly crop used on phones. Falls back to the cover image.',
    }),
    defineField({
      name: 'muxVideo',
      title: 'Video',
      type: 'mux.video',
      description:
        'The full film. Uploaded straight to Mux — drag a file in and it streams itself.',
    }),
    defineField({
      name: 'previewLoop',
      title: 'Preview Loop',
      type: 'file',
      options: { accept: 'video/*' },
      description: 'Optional short muted clip used for hover and hero previews.',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show in the homepage featured selection.',
      initialValue: false,
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      description: 'Hide from the live site without deleting.',
      initialValue: false,
    }),
    orderRankField({ type: 'project' }),
  ],
  preview: {
    select: {
      title: 'title',
      discipline: 'discipline.title',
      category: 'category.title',
      media: 'coverImage',
    },
    prepare({ title, discipline, category, media }) {
      return { title, subtitle: [discipline, category].filter(Boolean).join(' · '), media }
    },
  },
})
