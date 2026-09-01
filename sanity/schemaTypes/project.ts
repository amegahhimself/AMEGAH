import { defineField, defineType } from 'sanity'

const DIRECTOR_CATEGORIES = ['Music Videos', 'Ads', 'Short Films']
const CINEMATOGRAPHER_CATEGORIES = [
  'Music Videos',
  'Ads',
  'Documentaries',
  'Short Films',
  'Events',
]
const PHOTOGRAPHER_CATEGORIES = ['Portraits', 'Lifestyle', 'Editorial']
const EVENT_TYPES = ['Corporate', 'Traditional Wedding', 'White Wedding', 'Parties', 'Funerals']

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
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
      type: 'string',
      options: {
        list: [
          { title: 'Director', value: 'director' },
          { title: 'Cinematographer', value: 'cinematographer' },
          { title: 'Photographer', value: 'photographer' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          ...new Set([
            ...DIRECTOR_CATEGORIES,
            ...CINEMATOGRAPHER_CATEGORIES,
            ...PHOTOGRAPHER_CATEGORIES,
          ]),
        ],
      },
      hidden: ({ parent }) => !parent?.discipline,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const discipline = (context.parent as { discipline?: string })?.discipline
          if (!discipline) return true
          if (!value) return 'Category is required'
          const allowed =
            discipline === 'director'
              ? DIRECTOR_CATEGORIES
              : discipline === 'cinematographer'
                ? CINEMATOGRAPHER_CATEGORIES
                : PHOTOGRAPHER_CATEGORIES
          return allowed.includes(value) ? true : `Not a valid category for ${discipline}`
        }),
    }),
    defineField({
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: { list: EVENT_TYPES },
      hidden: ({ parent }) =>
        !(parent?.discipline === 'cinematographer' && parent?.category === 'Events'),
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
      name: 'coverVideo',
      title: 'Cover Video',
      type: 'file',
      description: 'Optional short looping/showreel clip for cards and hero use.',
      options: { accept: 'video/*' },
    }),
    defineField({
      name: 'externalVideoUrl',
      title: 'External Video URL',
      type: 'url',
      description: 'Link to the full video hosted externally (e.g. Vimeo, YouTube unlisted).',
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
      description: 'Show on the homepage featured selection.',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower numbers appear first. Used to manually rearrange projects.',
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      description: 'Hide from the live site without deleting.',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Year, newest first',
      name: 'yearDesc',
      by: [{ field: 'year', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'discipline',
      media: 'coverImage',
    },
  },
})
