import { useMemo, useState } from 'react';
import { Badge, Button as MantineButton, Card as MantineCard, Group, Paper, SimpleGrid } from '@mantine/core';
import { sampleSnapshot, type ClaimRow, type ClaimStatus, type ControlRoomSnapshot, type HealthStatus } from '../../lib/contracts';
import './control-room.css';

type Kit = 'shadcn' | 'mantine';
const statuses: Array<ClaimStatus | 'all'> = ['all', 'verified', 'insufficient', 'pending', 'contradicted'];

function statusClass(status: HealthStatus | ClaimStatus) { return `sr-status sr-status-${status}`; }

function Overview({ snapshot }: { snapshot: ControlRoomSnapshot }) {
  return <section aria-labelledby="overview-title"><h2 id="overview-title">A. Overview e health</h2><div className="sr-grid">{snapshot.health.map((metric) => <article className="sr-card" key={metric.label}><span className={statusClass(metric.status)}>{metric.status}</span><h3>{metric.label}</h3><strong>{metric.value}</strong><p>{metric.detail}</p></article>)}</div><p role="status" className="sr-empty">Empty state: quando non arrivano metriche, la vista mostra un messaggio descrittivo e un retry.</p></section>;
}

function Claims({ claims }: { claims: ClaimRow[] }) {
  const [filter, setFilter] = useState<ClaimStatus | 'all'>('all');
  const rows = useMemo(() => claims.filter((claim) => filter === 'all' || claim.status === filter), [claims, filter]);
  return <section aria-labelledby="claims-title"><div className="sr-toolbar"><h2 id="claims-title">B. Claim</h2><label>Filtro stato <select value={filter} onChange={(event) => setFilter(event.target.value as ClaimStatus | 'all')}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label></div><div className="sr-table-wrap"><table><thead><tr><th>ID</th><th>Soggetto</th><th>Claim</th><th>Stato</th><th>Fonte</th><th>Scadenza</th></tr></thead><tbody>{rows.map((claim) => <tr key={claim.id}><td>{claim.id}</td><td>{claim.subject}</td><td>{claim.claim}</td><td><span className={statusClass(claim.status)}>{claim.status}</span></td><td>{claim.source}</td><td>{claim.expiresAt}</td></tr>)}</tbody></table></div>{rows.length === 0 ? <p className="sr-empty">Nessun claim per questo filtro.</p> : null}<aside className="sr-panel" aria-label="Pannello azione claim"><h3>Pannello azione</h3><button type="button">Richiedi riverifica</button><button type="button">Apri fonte</button><p>Nessuna azione modifica claim o stati editoriali nello spike.</p></aside></section>;
}

function DraftReview({ snapshot }: { snapshot: ControlRoomSnapshot }) {
  const { draft } = snapshot;
  return <section aria-labelledby="draft-title"><h2 id="draft-title">C. Draft review</h2><article className="sr-card"><p>Draft #{draft.id} · v{draft.version} · stato {draft.status}</p><h3>{draft.title}</h3><blockquote>{draft.preview}</blockquote><p>Claim usati: {draft.usedClaimIds.join(', ')}</p><p>Claim esclusi: {draft.excludedClaimIds.join(', ')}</p><div className="sr-actions"><button type="button">Approva revisione</button><button type="button">Richiedi modifiche</button></div><p className="sr-empty">Non esiste pulsante di pubblicazione.</p></article></section>;
}

function ShadcnVariant({ snapshot }: { snapshot: ControlRoomSnapshot }) {
  return <div className="sr-kit sr-kit-shadcn" data-kit="shadcn-ui-style"><Overview snapshot={snapshot} /><Claims claims={snapshot.claims} /><DraftReview snapshot={snapshot} /></div>;
}

function MantineVariant({ snapshot }: { snapshot: ControlRoomSnapshot }) {
  return <div className="sr-kit sr-kit-mantine" data-kit="mantine"><Group justify="space-between"><Badge color="teal">Mantine isolated variant</Badge><MantineButton variant="light" type="button">Azione demo</MantineButton></Group><SimpleGrid cols={{ base: 1, md: 3 }}><Overview snapshot={snapshot} /></SimpleGrid><Paper withBorder radius="md" p="md"><Claims claims={snapshot.claims} /></Paper><MantineCard withBorder radius="md" padding="lg"><DraftReview snapshot={snapshot} /></MantineCard></div>;
}

export default function ControlRoomSpike() {
  const [kit, setKit] = useState<Kit>('shadcn');
  const [mode, setMode] = useState<'ready' | 'loading' | 'error'>('ready');
  const snapshot = sampleSnapshot;
  return <div className="sr-shell"><div className="sr-toolbar" role="toolbar" aria-label="Selezione variante UI"><button type="button" aria-pressed={kit === 'shadcn'} onClick={() => setKit('shadcn')}>shadcn/ui</button><button type="button" aria-pressed={kit === 'mantine'} onClick={() => setKit('mantine')}>Mantine</button><button type="button" onClick={() => setMode('loading')}>Mostra loading</button><button type="button" onClick={() => setMode('error')}>Mostra error</button><button type="button" onClick={() => setMode('ready')}>Reset</button></div>{mode === 'loading' ? <p role="status" className="sr-card">Caricamento snapshot…</p> : null}{mode === 'error' ? <p role="alert" className="sr-card sr-error">Errore API simulato. Il token resta in sessionStorage e non viene renderizzato.</p> : null}{mode === 'ready' ? (kit === 'shadcn' ? <ShadcnVariant snapshot={snapshot} /> : <MantineVariant snapshot={snapshot} />) : null}</div>;
}
