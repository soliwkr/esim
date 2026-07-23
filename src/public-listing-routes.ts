import type { PublicListingType } from './public-page-cards';

export type PublicListingDefinition = {
  type: PublicListingType;
  canonicalPath: `/${string}`;
  previewPath: `/astro-foundation/${string}`;
  navLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  lead: string;
  cardTitle: string;
  cardDescription: string;
  cardLinkLabel: string;
  emptyMessage: string;
};

export const PUBLIC_LISTING_DEFINITIONS = [
  {
    type: 'destination',
    canonicalPath: '/destinazioni',
    previewPath: '/astro-foundation/destinazioni',
    navLabel: 'Destinazioni',
    eyebrow: 'Dove vai',
    title: 'eSIM per destinazione',
    description: 'Guide e confronti eSIM organizzati per Paese e destinazione.',
    lead: 'Parti dal luogo, dalla durata del viaggio e dalle condizioni che possono cambiare sul posto.',
    cardTitle: 'Destinazioni pubblicate',
    cardDescription: 'Ogni scheda conduce a una guida già pubblicata sul sito corrente.',
    cardLinkLabel: 'Apri la destinazione',
    emptyMessage: 'Non ci sono ancora destinazioni pubblicate.',
  },
  {
    type: 'guide',
    canonicalPath: '/guide',
    previewPath: '/astro-foundation/guide',
    navLabel: 'Guide',
    eyebrow: 'Come funziona',
    title: 'Guide pratiche sulle eSIM',
    description: 'Compatibilità, installazione, attivazione, costi e funzionamento delle eSIM.',
    lead: 'Chiarisci prima della partenza cosa supporta il telefono e quali passaggi richiede davvero una eSIM.',
    cardTitle: 'Guide pubblicate',
    cardDescription: 'Compatibilità, configurazione e problemi pratici dal catalogo già pubblico.',
    cardLinkLabel: 'Leggi la guida',
    emptyMessage: 'Non ci sono ancora guide pubblicate.',
  },
  {
    type: 'comparison',
    canonicalPath: '/confronti',
    previewPath: '/astro-foundation/confronti',
    navLabel: 'Confronti',
    eyebrow: 'Cosa cambia',
    title: 'Confronti tra eSIM e provider',
    description: 'Confronti trasparenti tra provider e tipologie di eSIM.',
    lead: 'Metti in ordine differenze e limiti senza trasformare una commissione in una classifica automatica.',
    cardTitle: 'Confronti pubblicati',
    cardDescription: 'Soltanto confronti già pubblicati, senza prezzi o graduatorie inventate dalla preview.',
    cardLinkLabel: 'Apri il confronto',
    emptyMessage: 'Non ci sono ancora confronti pubblicati.',
  },
] as const satisfies readonly PublicListingDefinition[];

const definitionsByType = new Map<PublicListingType, PublicListingDefinition>(
  PUBLIC_LISTING_DEFINITIONS.map((definition) => [definition.type, definition]),
);

if (definitionsByType.size !== PUBLIC_LISTING_DEFINITIONS.length) {
  throw new Error('Public listing route matrix contains duplicate page types.');
}

export function publicListingDefinition(type: PublicListingType): PublicListingDefinition {
  const definition = definitionsByType.get(type);
  if (!definition) {
    throw new Error(`Missing public listing route definition for ${String(type)}.`);
  }
  return definition;
}
