import type { StructureResolver } from 'sanity/structure';

export const singletonTypes = new Set(['innstillinger', 'forside', 'nettsidebygg', 'omBorettslaget']);

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type).title(title));

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Innhold')
    .items([
      singleton(S, 'forside', 'Forside'),
      S.documentTypeListItem('side').title('Sider'),
      S.listItem()
        .title('Nyheter')
        .schemaType('nyhet')
        .child(
          S.list()
            .title('Nyheter')
            .items([
              S.listItem().title('Alle nyheter').schemaType('nyhet').child(S.documentTypeList('nyhet').title('Alle nyheter')),
              S.documentTypeListItem('nyhetskategori').title('Kategorier'),
            ]),
        ),
      S.listItem()
        .title('Arrangementer')
        .schemaType('arrangement')
        .child(
          S.list()
            .title('Arrangementer')
            .items([
              S.listItem().title('Kommende').schemaType('arrangement').child(
                S.documentTypeList('arrangement').title('Kommende').filter('_type == "arrangement" && start >= now()').defaultOrdering([{ field: 'start', direction: 'asc' }]),
              ),
              S.listItem().title('Tidligere').schemaType('arrangement').child(
                S.documentTypeList('arrangement').title('Tidligere').filter('_type == "arrangement" && !(start >= now())').defaultOrdering([{ field: 'start', direction: 'desc' }]),
              ),
            ]),
        ),
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
              S.documentTypeListItem('oppgave').title('Oppgaver («Jeg vil …»)'),
            ]),
        ),
      S.documentTypeListItem('generalforsamling').title('Generalforsamlinger'),
      S.listItem()
        .title('ABC-nytt')
        .schemaType('abcUtgave')
        .child(S.documentTypeList('abcUtgave').title('ABC-nytt').defaultOrdering([{ field: 'aar', direction: 'desc' }, { field: 'maaned', direction: 'desc' }])),
      S.documentTypeListItem('utvalg').title('Styre og utvalg'),
      singleton(S, 'omBorettslaget', 'Om borettslaget'),
      S.divider(),
      singleton(S, 'innstillinger', 'Innstillinger'),
    ]);
