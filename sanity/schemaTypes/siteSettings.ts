import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'The line under the name, e.g. “Director · Cinematographer · Photographer”.',
    }),
    defineField({
      name: 'headshot',
      title: 'Headshot',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'heroVariant',
      title: 'Homepage Hero',
      type: 'string',
      description:
        'How the homepage opens. Reel: a silent looping showreel. Still: full-bleed photographs. Type: the name at full size, no imagery.',
      options: {
        list: ['reel', 'still', 'type'],
        layout: 'radio',
      },
      initialValue: 'type',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroVideo',
      title: 'Showreel',
      type: 'mux.video',
      description: 'Used when the hero is set to Reel. Plays silently on a loop.',
      hidden: ({ parent }) => parent?.heroVariant !== 'reel',
    }),
    defineField({
      name: 'heroImages',
      title: 'Hero Stills',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Used when the hero is set to Still. The first image is shown.',
      hidden: ({ parent }) => parent?.heroVariant !== 'still',
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Overrides the browser tab and search result title.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      description: 'Shown when the site is linked on Instagram, WhatsApp or elsewhere.',
    }),
  ],
  preview: {
    select: { title: 'name' },
  },
})
