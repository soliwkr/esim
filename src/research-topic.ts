type ResearchRunKind = 'research' | 'discovery' | 'comparison';

const GENERIC_QUERY_TERMS = new Set([
  'a', 'ad', 'al', 'alla', 'alle', 'allo', 'and', 'best', 'better', 'come', 'compare',
  'comparison', 'confronto', 'contro', 'da', 'dal', 'dalla', 'delle', 'di', 'discussion',
  'discussione', 'does', 'esperienza', 'esperienze', 'experience', 'experiences', 'for',
  'funziona', 'funzionano', 'guida', 'how', 'il', 'in', 'issue', 'issues', 'la', 'le',
  'migliore', 'migliori', 'of', 'opinione', 'opinioni', 'or', 'problema', 'problemi',
  'problem', 'problems', 'recensione', 'recensioni', 'recent', 'recente', 'recenti',
  'review', 'reviews', 'the', 'to', 'travel', 'trip', 'versus', 'viaggio', 'vs', 'with',
  'worth', 'it', 'e', 'o', 'per', 'su', 'un', 'una', 'uno',
]);

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('it');
}

export function extractTopicAnchors(query: string, kind: ResearchRunKind): string[] {
  if (kind === 'discovery') return [];

  const tokens = normalize(query).match(/[\p{L}\p{N}]+/gu) || [];
  const anchors: string[] = [];

  for (const token of tokens) {
    if (token.length < 3 || /^\d+$/.test(token) || GENERIC_QUERY_TERMS.has(token)) continue;
    if (!anchors.includes(token)) anchors.push(token);
    if (anchors.length >= 8) break;
  }

  return anchors;
}
