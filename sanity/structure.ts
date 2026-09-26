import type { StructureResolver } from 'sanity/structure';

export const singletonTypes = new Set(['innstillinger', 'forside']);

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type).title(title));

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Innhold')
    .items([
      singleton(S, 'forside', 'Forside'),
      S.documentTypeListItem('side').title('Sider'),
      S.documentTypeListItem('nyhet').title('Nyheter'),
      S.divider(),
      S.listItem()
        .title('Dokumenter')
        .child(
          S.list()
            .title('Dokumenter')
            .items([
              S.listItem().title('Alle dokumenter').child(S.documentTypeList('dokument').title('Alle dokumenter')),
              S.listItem()
                .title('Etter kategori')
                .child(
                  S.documentTypeList('dokumentkategori')
                    .title('Kategorier')
                    .child((id) => S.documentList().title('Dokumenter').filter('_type == "dokument" && kategori._ref == $id').params({ id })),
                ),
              S.documentTypeListItem('dokumentkategori').title('Kategorier'),
            ]),
        ),
      S.documentTypeListItem('utvalg').title('Styre og utvalg'),
      S.divider(),
      singleton(S, 'innstillinger', 'Innstillinger'),
    ]);
