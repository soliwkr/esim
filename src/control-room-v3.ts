import type { Env } from './types';
export { controlRoomApi } from './control-room';

declare const document: any;
declare const window: any;
declare const sessionStorage: any;
declare const URL: any;
declare const Blob: any;

const CONTROL_ROOM_VERSION = '3';

function controlRoomClient(): void {
  const storageKey = 'srMaintenanceToken';
  let token = sessionStorage.getItem(storageKey) || '';

  const byId = (id: string): any => document.getElementById(id);
  const value = (id: string): string => String(byId(id)?.value || '').trim();
  const integerValue = (id: string): number => Number(value(id) || 0);
  const escapeHtml = (input: unknown): string => String(input ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  } as Record<string, string>)[char]);

  function setStatus(message: string, error = false): void {
    const target = byId('status');
    if (!target) return;
    target.textContent = message;
    target.style.color = error ? 'var(--bad)' : 'var(--muted)';
  }

  function writeLog(payload: unknown): void {
    const target = byId('log');
    if (!target) return;
    const line = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
    target.textContent = `${line}${String.fromCharCode(10)}${target.textContent}`;
  }

  async function api(path: string, options: Record<string, unknown> = {}, expectText = false): Promise<any> {
    if (!token) throw new Error('Inserisci il maintenance token');
    const headers = Object.assign({ Authorization: `Bearer ${token}` }, (options.headers || {}) as Record<string, string>);
    if (options.body) headers['Content-Type'] = 'application/json';
    const response = await fetch(path, { ...options, headers } as RequestInit);
    const text = await response.text();
    if (!response.ok) {
      let parsed: any = {};
      try { parsed = JSON.parse(text); } catch { }
      throw new Error(parsed.error || `HTTP ${response.status}`);
    }
    if (expectText) return text;
    try { return JSON.parse(text); } catch { return { raw: text }; }
  }

  const pill = (input: unknown): string => `<span class="pill ${escapeHtml(input)}">${escapeHtml(input)}</span>`;
  const table = (headers: string[], rows: string[][]): string => `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

  function render(data: any): void {
    const overview = data.overview || {};
    const cards: Array<[string, unknown]> = [
      ['Fonti', overview.sources_total], ['Fonti scadute', overview.sources_due], ['Queue pending', overview.queue_pending],
      ['Segnali eligible', overview.signals_eligible], ['Brief proposti', overview.briefs_proposed], ['Claim verificati', overview.claims_verified],
      ['Claim pending', overview.claims_pending], ['Draft approvati', overview.drafts_approved], ['Pagine review', overview.pages_review], ['Pagine pubblicate', overview.pages_published]
    ];
    byId('cards').innerHTML = cards.map(([label, metric]) => `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="metric">${escapeHtml(metric)}</div></div>`).join('');
    byId('briefs').innerHTML = table(['ID','Titolo','Score','Stato','Bundle','Readiness','Draft'], (data.briefs || []).map((brief: any) => [
      escapeHtml(brief.id), `<strong>${escapeHtml(brief.proposed_title)}</strong><br><span class="muted">${escapeHtml(brief.slug_suggestion)}</span>`,
      escapeHtml(brief.priority_score), pill(brief.status), escapeHtml(brief.bundle_id || '—'), `${escapeHtml(brief.readiness_score || '—')} ${brief.readiness_status ? pill(brief.readiness_status) : ''}`,
      `${escapeHtml(brief.draft_id || '—')} ${brief.draft_status ? pill(brief.draft_status) : ''}`
    ]));
    byId('claims').innerHTML = table(['ID','Brief','Soggetto','Claim','Stato','Fonte','Scadenza','Task'], (data.claims || []).map((claim: any) => [
      escapeHtml(claim.id), escapeHtml(claim.brief_id), escapeHtml(claim.subject_key), escapeHtml(claim.claim_text), pill(claim.status),
      claim.source_url ? `<a target="_blank" rel="noopener" href="${escapeHtml(claim.source_url)}">${escapeHtml(claim.source_label || claim.source_kind)}</a>` : '—',
      escapeHtml(claim.valid_until || '—'), claim.task_status ? `${pill(claim.task_status)} #${escapeHtml(claim.task_id)}` : '—'
    ]));
    byId('queue').innerHTML = table(['ID','Tipo','Entità','Priorità','Stato','Errore'], (data.queue || []).map((task: any) => [
      escapeHtml(task.id), escapeHtml(task.task_type), escapeHtml(task.entity_key), escapeHtml(task.priority), pill(task.status), escapeHtml(task.last_error || '')
    ]));
    const bundleRows = (data.evidenceBundles || []).map((bundle: any) => ['bundle', escapeHtml(bundle.id), escapeHtml(bundle.page_slug), escapeHtml(bundle.version), `${escapeHtml(bundle.readiness_score)} ${pill(bundle.review_status)}`]);
    const draftRows = (data.drafts || []).map((draft: any) => ['draft', escapeHtml(draft.id), escapeHtml(draft.page_slug), escapeHtml(draft.version), `${pill(draft.status)} ${escapeHtml(draft.prompt_version)}`]);
    byId('bundles').innerHTML = table(['Tipo','ID','Slug','Versione','Score/Stato'], bundleRows.concat(draftRows));
    byId('audit').innerHTML = table(['Quando','Dominio','Azione','Attore','Entità'], (data.audit || []).map((event: any) => [
      escapeHtml(event.created_at), escapeHtml(event.domain), pill(event.action), escapeHtml(event.actor), escapeHtml(event.entity)
    ]));
  }

  async function load(): Promise<void> {
    setStatus('Caricamento…');
    const data = await api('/api/maintenance/control-room');
    render(data);
    setStatus(`Sessione attiva · aggiornato ${new Date(data.generatedAt).toLocaleString()}`);
  }

  async function post(path: string, body: Record<string, unknown>): Promise<any> {
    const response = await api(path, { method: 'POST', body: JSON.stringify(body) });
    writeLog(response);
    await load();
    return response;
  }

  async function runAction(name: string): Promise<void> {
    try {
      if (name === 'research') {
        const queries = value('researchQueries').split(String.fromCharCode(10)).map((item) => item.trim()).filter(Boolean);
        await post('/api/maintenance/research-run', { queries, reason: 'control_room_manual' });
      } else if (name === 'acceptBrief') {
        await post('/api/maintenance/editorial-brief-action', { briefIds: [integerValue('briefId')], status: 'accepted', notes: 'Accettato dalla Control Room; nessun claim è pubblicabile senza verifica.' });
      } else if (name === 'convertBrief') {
        await post('/api/maintenance/editorial-brief-convert', { briefId: integerValue('briefId'), actor: 'christian' });
      } else if (name === 'evaluate') {
        await post('/api/maintenance/page-readiness-evaluate', { briefId: integerValue('briefId'), actor: 'christian' });
      } else if (name === 'approveBundle') {
        await post('/api/maintenance/page-readiness-action', { bundleId: integerValue('bundleId'), action: 'approved_for_draft', actor: 'christian', notes: 'Approvato dalla Control Room esclusivamente per un draft in review.' });
      } else if (name === 'generateDraft') {
        await post('/api/maintenance/editorial-draft-generate', { bundleId: integerValue('bundleId'), actor: 'christian' });
      } else if (name === 'approveDraft' || name === 'changesDraft') {
        await post('/api/maintenance/editorial-draft-action', { draftId: integerValue('draftId'), action: name === 'approveDraft' ? 'approved' : 'changes_requested', actor: 'christian', notes: value('draftNotes') });
      } else if (name === 'previewDraft') {
        const html = await api(`/api/maintenance/editorial-draft-preview?draftId=${integerValue('draftId')}`, {}, true);
        const objectUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
        window.open(objectUrl, '_blank', 'noopener');
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      } else if (name === 'claimResult') {
        const outcome = value('claimOutcome');
        const body: Record<string, unknown> = { candidateId: integerValue('candidateId'), outcome, actor: 'christian', evidence: value('claimEvidence'), notes: value('claimNotes') };
        if (outcome === 'verified' || outcome === 'contradicted') {
          let verifiedValue: unknown;
          try { verifiedValue = JSON.parse(value('claimValue') || 'null'); } catch { throw new Error('Valore verificato: JSON non valido'); }
          body.source = { kind: value('sourceKind'), label: value('sourceLabel'), url: value('sourceUrl'), trustLevel: 5, freshnessDays: integerValue('freshnessDays') };
          body.value = verifiedValue;
          body.confidence = 1;
        }
        await post('/api/maintenance/editorial-atomic-claim-result', body);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message, true);
      writeLog(message);
    }
  }

  window.__SR_CONTROL_ROOM_VERSION__ = '3';
  document.documentElement.dataset.controlRoomReady = 'true';
  byId('token').value = token;
  setStatus(token ? 'Client v3 pronto · verifica sessione' : 'Client v3 pronto · inserisci token');

  byId('save').addEventListener('click', async () => {
    const candidate = value('token');
    if (!candidate) { setStatus('Inserisci il maintenance token', true); return; }
    token = candidate;
    try { await load(); sessionStorage.setItem(storageKey, token); }
    catch (error) { token = ''; sessionStorage.removeItem(storageKey); const message = error instanceof Error ? error.message : String(error); setStatus(message, true); writeLog(message); }
  });
  byId('lock').addEventListener('click', () => { token = ''; sessionStorage.removeItem(storageKey); byId('token').value = ''; setStatus('Sessione bloccata'); });
  byId('refresh').addEventListener('click', async () => { try { await load(); } catch (error) { const message = error instanceof Error ? error.message : String(error); setStatus(message, true); writeLog(message); } });
  document.querySelectorAll('[data-action]').forEach((button: any) => button.addEventListener('click', () => runAction(String(button.getAttribute('data-action') || ''))));
  if (token) load().catch((error: unknown) => { const message = error instanceof Error ? error.message : String(error); setStatus(message, true); writeLog(message); });
}

const CLIENT_SCRIPT = `(${controlRoomClient.toString()})();\n//# sourceURL=/control-room.js`;
const PAGE = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Senza Roaming Control Room v3</title><style>
:root{color-scheme:dark;--bg:#0b0d10;--panel:#13171c;--line:#28303a;--text:#f3f5f7;--muted:#9da8b5;--accent:#ffcc66;--good:#69d391;--bad:#ff7a7a;--blue:#79b8ff}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}header{position:sticky;top:0;z-index:3;background:rgba(11,13,16,.95);border-bottom:1px solid var(--line);padding:16px 22px;backdrop-filter:blur(12px)}h1,h2,h3,p{margin-top:0}.top{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.brand{font-size:19px;font-weight:800;margin-right:auto}.version{font-size:11px;border:1px solid var(--line);border-radius:999px;padding:2px 7px;color:var(--accent)}.status,.muted{color:var(--muted)}main{max-width:1500px;margin:auto;padding:22px}.grid{display:grid;gap:14px}.cards{grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:18px}.card,.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:15px}.metric{font-size:27px;font-weight:800}.label{color:var(--muted)}.panels{grid-template-columns:repeat(auto-fit,minmax(420px,1fr))}.wide{grid-column:1/-1}button,input,select,textarea{font:inherit;color:var(--text);background:#0d1116;border:1px solid var(--line);border-radius:8px;padding:9px 11px}button{cursor:pointer;background:#1c2530}button.primary{background:#5b4315;border-color:#9e7629;color:#fff2cf}input,textarea,select{width:100%}textarea{min-height:72px;resize:vertical}.formgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:9px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.tablewrap{overflow:auto;max-height:460px;border:1px solid var(--line);border-radius:10px}table{border-collapse:collapse;width:100%;min-width:760px}th,td{text-align:left;padding:9px;border-bottom:1px solid var(--line);vertical-align:top}th{position:sticky;top:0;background:#171c22}.pill{display:inline-block;padding:2px 7px;border:1px solid var(--line);border-radius:99px;font-size:12px}.verified,.approved,.completed{color:var(--good)}.failed,.contradicted{color:var(--bad)}.pending,.review,.proposed{color:var(--accent)}a{color:var(--blue)}pre{white-space:pre-wrap;word-break:break-word}.notice{padding:10px;border-left:3px solid var(--accent);background:#17130b;margin-bottom:14px}.log{max-height:160px;overflow:auto;color:var(--muted);font-family:ui-monospace,monospace}@media(max-width:700px){main{padding:12px}.panels{grid-template-columns:1fr}.top input{max-width:none!important;flex:1 1 100%}}
</style></head><body><header><div class="top"><div class="brand">Senza Roaming · Control Room <span class="version">v3</span></div><input id="token" type="password" autocomplete="off" placeholder="Maintenance token" style="max-width:280px"><button id="save" class="primary">Apri sessione</button><button id="lock">Blocca</button><button id="refresh">Aggiorna</button><span id="status" class="status">Caricamento client v3…</span></div></header><main><noscript><div class="notice"><strong>JavaScript disattivato.</strong> La Control Room richiede JavaScript.</div></noscript><div class="notice"><strong>Nessuna pubblicazione automatica.</strong> Un draft approvato resta una pagina in <code>review</code>.</div><section id="cards" class="grid cards"></section><section class="grid panels">
<div class="panel"><h2>Avvia ricerca recente</h2><label>Query, una per riga<textarea id="researchQueries">eSIM Cina problemi
eSIM viaggio VPN</textarea></label><div class="actions"><button data-action="research" class="primary">Avvia Workflow</button></div></div>
<div class="panel"><h2>Brief e readiness</h2><div class="formgrid"><label>Brief ID<input id="briefId" type="number" min="1"></label><label>Bundle ID<input id="bundleId" type="number" min="1"></label></div><div class="actions"><button data-action="acceptBrief">Accetta brief</button><button data-action="convertBrief">Converti in task</button><button data-action="evaluate">Valuta readiness</button><button data-action="approveBundle">Approva per draft</button><button data-action="generateDraft" class="primary">Genera draft</button></div></div>
<div class="panel"><h2>Revisione draft</h2><div class="formgrid"><label>Draft ID<input id="draftId" type="number" min="1"></label><label>Note<input id="draftNotes" value="Bozza verificata editorialmente; l’approvazione non autorizza la pubblicazione."></label></div><div class="actions"><button data-action="approveDraft" class="primary">Approva draft</button><button data-action="changesDraft">Richiedi modifiche</button><button data-action="previewDraft">Apri preview</button></div></div>
<div class="panel"><h2>Esito claim atomico</h2><div class="formgrid"><label>Candidate ID<input id="candidateId" type="number" min="1"></label><label>Esito<select id="claimOutcome"><option>verified</option><option>contradicted</option><option>insufficient</option><option>dismissed</option></select></label><label>Source kind<select id="sourceKind"><option>official_provider</option><option>official_help</option><option>official_terms</option><option>regulator</option><option>manufacturer</option><option>first_party_test</option></select></label><label>Freshness giorni<input id="freshnessDays" type="number" value="14" min="1"></label></div><label>URL fonte<input id="sourceUrl" placeholder="https://..."></label><label>Etichetta fonte<input id="sourceLabel"></label><label>Valore verificato JSON<textarea id="claimValue">{}</textarea></label><label>Evidenza<textarea id="claimEvidence"></textarea></label><label>Note<textarea id="claimNotes"></textarea></label><div class="actions"><button data-action="claimResult" class="primary">Registra esito</button></div></div>
<div class="panel wide"><h2>Pipeline editoriale</h2><div id="briefs" class="tablewrap"></div></div><div class="panel wide"><h2>Claim atomici</h2><div id="claims" class="tablewrap"></div></div><div class="panel"><h2>Coda operativa</h2><div id="queue" class="tablewrap"></div></div><div class="panel"><h2>Evidence bundle e draft</h2><div id="bundles" class="tablewrap"></div></div><div class="panel wide"><h2>Audit recente</h2><div id="audit" class="tablewrap"></div></div><div class="panel wide"><h2>Console</h2><pre id="log" class="log"></pre></div></section></main><script src="/control-room.js?v=3" defer></script></body></html>`;

export function controlRoomPage(env: Env): Response {
  return new Response(PAGE.replace('Senza Roaming · Control Room', `${env.SITE_NAME} · Control Room`), { headers: {
    'content-type': 'text/html;charset=UTF-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow',
    'x-control-room-version': CONTROL_ROOM_VERSION,
    'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  }});
}

export function controlRoomScript(): Response {
  return new Response(CLIENT_SCRIPT, { headers: {
    'content-type': 'application/javascript;charset=UTF-8', 'cache-control': 'no-store',
    'x-control-room-version': CONTROL_ROOM_VERSION,
    'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer'
  }});
}
