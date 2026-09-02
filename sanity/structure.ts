import type { StructureResolver } from 'sanity/structure'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      orderableDocumentListDeskItem({ type: 'project', title: 'Projects', S, context }),
      S.divider(),
      orderableDocumentListDeskItem({ type: 'discipline', title: 'Disciplines', S, context }),
      orderableDocumentListDeskItem({ type: 'category', title: 'Categories', S, context }),
      S.divider(),
      orderableDocumentListDeskItem({ type: 'client', title: 'Clients', S, context }),
      orderableDocumentListDeskItem({ type: 'partner', title: 'Partners', S, context }),
    ])
