import type { PublicListingType } from './public-page-cards';

export type PublicListingCuratedLink = {
  slug: string;
  label: string;
  description: string;
};

export type PublicListingDefinition = {
  type: PublicListingType;
  canonicalPath: `/${string}`;
  previewPath: `/astro-foundation/${string}`;
  navLabel: string;
  eyebrow: string;
  seoTitle: string;
  title: string;
  description: string;
  lead: string;
  criteriaLabel: string;
  criteriaTitle: string;
  criteriaItems: readonly string[];
  curatedTitle: string;
  curatedDescription: string;
  curatedLinks: readonly PublicListingCuratedLink[];
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
    seoTitle: 'eSIM per destinazione: guide per Paese',
    title: 'eSIM per destinazione: scegli il Paese',
    description: 'Scegli il Paese e raggiungi la guida eSIM specifica, con condizioni, reti e limiti verificati per la destinazione.',
    lead: 'Parti dal Paese. Durata, rete disponibile, attivazione, hotspot e fair use appartengono poi alla guida specifica della destinazione.',
    criteriaLabel: 'Come usare l’hub',
    criteriaTitle: 'Prima il Paese, poi le condizioni reali.',
    criteriaItems: [
      'Ogni pagina Paese possiede reti, condizioni e limiti specifici.',
      'Durata del viaggio e consumo previsto cambiano la scelta.',
      'Hotspot, attivazione e fair use richiedono fonti datate.',
      'Questo hub orienta: non sostituisce la guida della destinazione.',
    ],
    curatedTitle: 'Percorsi utili prima di scegliere il Paese',
    curatedDescription: 'Le guide generali restano separate dalle condizioni della singola destinazione.',
    curatedLinks: [],
    cardTitle: 'Guide eSIM per Paese',
    cardDescription: 'Ogni scheda conduce a una destinazione già pubblicata e proprietaria del proprio intento geografico.',
    cardLinkLabel: 'Apri la destinazione',
    emptyMessage: 'Non ci sono ancora destinazioni pubblicate.',
  },
  {
    type: 'guide',
    canonicalPath: '/guide',
    previewPath: '/astro-foundation/guide',
    navLabel: 'Guide',
    eyebrow: 'Problemi pratici',
    seoTitle: 'Guide eSIM: compatibilità, attivazione e uso',
    title: 'Guide eSIM: come funzionano, si installano e si usano',
    description: 'Guide eSIM su compatibilità, funzionamento, installazione, attivazione, uso dati e problemi prima della partenza.',
    lead: 'Parti dal dubbio concreto: capire la eSIM, verificare il telefono, scegliere per l’estero o risolvere un passaggio operativo.',
    criteriaLabel: 'Come trovare la risposta',
    criteriaTitle: 'Parti dal problema, non dal provider.',
    criteriaItems: [
      'Funzionamento e requisiti appartengono alla guida fondamentale.',
      'La compatibilità va verificata sul modello esatto del telefono.',
      'Installazione e attivazione sono passaggi diversi.',
      'Le scelte commerciali restano nelle guide e nei confronti dedicati.',
    ],
    curatedTitle: 'Guide fondamentali',
    curatedDescription: 'Tre percorsi distinti per capire la tecnologia, verificare il dispositivo e pianificare l’uso all’estero.',
    curatedLinks: [
      {
        slug: 'esim-come-funziona',
        label: 'Come funziona una eSIM',
        description: 'Profilo digitale, installazione, attivazione, dual SIM, vantaggi e limiti.',
      },
      {
        slug: 'esim-telefoni-compatibili',
        label: 'Telefoni compatibili con eSIM',
        description: 'Controlla modello, variante, mercato di vendita e blocco operatore.',
      },
      {
        slug: 'esim-estero',
        label: 'Come scegliere una eSIM per l’estero',
        description: 'Valuta piano locale, regionale o globale in base all’itinerario.',
      },
    ],
    cardTitle: 'Tutte le guide pubblicate',
    cardDescription: 'Compatibilità, configurazione e problemi pratici dal catalogo pubblico, senza duplicare le risposte monografiche.',
    cardLinkLabel: 'Leggi la guida',
    emptyMessage: 'Non ci sono ancora guide pubblicate.',
  },
  {
    type: 'comparison',
    canonicalPath: '/confronti',
    previewPath: '/astro-foundation/confronti',
    navLabel: 'Confronti',
    eyebrow: 'Cosa cambia',
    seoTitle: 'Confronti eSIM e provider: differenze e criteri',
    title: 'Confronti eSIM: provider, piani e limiti',
    description: 'Confronta eSIM, provider, piani e limiti con criteri dichiarati, fonti datate e nessuna classifica automatica.',
    lead: 'Durata, dati, rete, hotspot, attivazione e condizioni contano più di un vincitore universale. Ogni confronto deve dichiarare il proprio perimetro.',
    criteriaLabel: 'Criteri di confronto',
    criteriaTitle: 'Confronta ciò che cambia davvero.',
    criteriaItems: [
      'Il confronto dichiara scenario, criteri e data delle informazioni.',
      'Prezzo e copertura non vengono separati da limiti e fair use.',
      'Un confronto specifico possiede la propria coppia o il proprio criterio.',
      'L’eventuale remunerazione resta separata dal giudizio editoriale.',
    ],
    curatedTitle: 'Da quale confronto iniziare',
    curatedDescription: 'La pagina decisionale generale spiega come scegliere senza trasformare il catalogo in una graduatoria automatica.',
    curatedLinks: [
      {
        slug: 'migliore-esim',
        label: 'Qual è la migliore eSIM per viaggiare?',
        description: 'Usa destinazione, durata, dati, hotspot, rete, attivazione e prezzo come criteri verificabili.',
      },
    ],
    cardTitle: 'Confronti pubblicati',
    cardDescription: 'Confronti specifici già pubblicati, ciascuno proprietario della propria domanda e dei criteri dichiarati.',
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
