export type HealthStatus = 'ok' | 'warning' | 'error';
export type ClaimStatus = 'verified' | 'insufficient' | 'pending' | 'contradicted';

export type HealthMetric = { label: string; value: string; status: HealthStatus; detail: string };
export type ClaimRow = { id: number; subject: string; claim: string; status: ClaimStatus; source: string; expiresAt: string; page: string };
export type DraftReview = { id: number; version: number; title: string; status: 'review' | 'approved'; preview: string; usedClaimIds: number[]; excludedClaimIds: number[] };
export type ControlRoomSnapshot = { generatedAt: string; health: HealthMetric[]; claims: ClaimRow[]; draft: DraftReview };

export const sampleSnapshot: ControlRoomSnapshot = {
  generatedAt: '2026-07-18T00:00:00.000Z',
  health: [
    { label: 'API manutenzione', value: 'online', status: 'ok', detail: '/api/maintenance/* resta servita dal Worker esistente' },
    { label: 'Workflow recent-demand', value: 'export preserved', status: 'ok', detail: 'RecentDemandWorkflow esportato dal custom entrypoint' },
    { label: 'Readiness pubblicazione', value: 'bloccata', status: 'warning', detail: 'La bozza può essere revisionata, non pubblicata' }
  ],
  claims: [
    { id: 4, subject: 'Airalo', claim: 'Routing attraverso gateway fuori dalla Cina continentale', status: 'verified', source: 'provider ufficiale', expiresAt: '2026-08-17', page: 'esim-cina-senza-vpn' },
    { id: 7, subject: 'Holafly Cina', claim: 'VPN integrata nella pagina specifica Cina', status: 'insufficient', source: 'scope non compatibile', expiresAt: '2026-07-25', page: 'esim-cina-senza-vpn' },
    { id: 9, subject: 'Nomad', claim: 'Non serve VPN aggiuntiva', status: 'verified', source: 'provider ufficiale', expiresAt: '2026-08-17', page: 'esim-cina-senza-vpn' }
  ],
  draft: { id: 2, version: 2, title: 'eSIM in Cina: funzionano davvero senza VPN?', status: 'approved', preview: 'Bozza grounded in review: mostra claim attribuiti e conserva i claim insufficienti come esclusi.', usedClaimIds: [4, 5, 6, 8, 9], excludedClaimIds: [7] }
};
