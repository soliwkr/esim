import type { Env } from './types';

type Obj = Record<string, unknown>;

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function authorized(request: Request, env: Env): Response | null {
  if (!env.MAINTENANCE_TOKEN) return json({ ok: false, error: 'maintenance_api_disabled' }, 503);
  if (request.headers.get('authorization') !== `Bearer ${env.MAINTENANCE_TOKEN}`) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  return null;
}

function parseJson(value: unknown, fallback: unknown): unknown {
  try { return JSON.parse(String(value ?? '')); } catch { return fallback; }
}

function numberValue(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRows(rows: Obj[], jsonFields: string[] = []): Obj[] {
  return rows.map((row) => {
    const result: Obj = { ...row };
    for (const field of jsonFields) result[field.replace(/_json$/, '')] = parseJson(row[field], []);
    return result;
  });
}

async function controlRoomData(env: Env): Promise<Response> {
  const overview = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM source_registry) AS sources_total,
      (SELECT COUNT(*) FROM maintenance_due_sources WHERE is_due=1) AS sources_due,
      (SELECT COUNT(*) FROM maintenance_queue WHERE status='pending') AS queue_pending,
      (SELECT COUNT(*) FROM maintenance_queue WHERE status='processing') AS queue_processing,
      (SELECT COUNT(*) FROM maintenance_queue WHERE status='failed') AS queue_failed,
      (SELECT COUNT(*) FROM research_runs) AS research_runs,
      (SELECT COUNT(*) FROM research_signals WHERE eligible_for_editorial=1) AS signals_eligible,
      (SELECT COUNT(*) FROM research_signals WHERE eligible_for_editorial=0) AS signals_filtered,
      (SELECT COUNT(*) FROM editorial_briefs WHERE status='proposed') AS briefs_proposed,
      (SELECT COUNT(*) FROM editorial_briefs WHERE status='accepted') AS briefs_accepted,
      (SELECT COUNT(*) FROM editorial_briefs WHERE status='converted') AS briefs_converted,
      (SELECT COUNT(*) FROM editorial_claim_candidates WHERE atomic=1 AND status='pending') AS claims_pending,
      (SELECT COUNT(*) FROM editorial_claim_candidates WHERE atomic=1 AND status='verified') AS claims_verified,
      (SELECT COUNT(*) FROM editorial_claim_candidates WHERE atomic=1 AND status='insufficient') AS claims_insufficient,
      (SELECT COUNT(*) FROM page_evidence_bundles) AS evidence_bundles,
      (SELECT COUNT(*) FROM editorial_review_drafts WHERE status='review') AS drafts_review,
      (SELECT COUNT(*) FROM editorial_review_drafts WHERE status='approved') AS drafts_approved,
      (SELECT COUNT(*) FROM pages WHERE status='review') AS pages_review,
      (SELECT COUNT(*) FROM pages WHERE status='published') AS pages_published
  `).first<Obj>() || {};

  const runs = await env.DB.prepare(`
    SELECT id,source_system,run_kind,query,generated_at,window_days,result_count,
           warning_count,eligible_count,filtered_count,created_at
    FROM research_runs ORDER BY created_at DESC,id DESC LIMIT 12
  `).all<Obj>();

  const signals = await env.DB.prepare(`
    SELECT id,run_id,signal_type,topic,title,source,url,published_at,relevance_score,
           freshness_days,eligible_for_editorial,quality_flags_json,status,updated_at
    FROM research_signals ORDER BY created_at DESC,id DESC LIMIT 30
  `).all<Obj>();

  const briefs = await env.DB.prepare(`
    SELECT b.id,b.cluster_title,b.proposed_title,b.slug_suggestion,b.asset_type,b.search_intent,
           b.opportunity_score,b.evidence_score,b.priority_score,b.quality_flags_json,b.status,b.notes,
           b.created_at,b.updated_at,
           (SELECT eb.id FROM page_evidence_bundles eb WHERE eb.brief_id=b.id ORDER BY eb.version DESC LIMIT 1) AS bundle_id,
           (SELECT eb.readiness_score FROM page_evidence_bundles eb WHERE eb.brief_id=b.id ORDER BY eb.version DESC LIMIT 1) AS readiness_score,
           (SELECT eb.review_status FROM page_evidence_bundles eb WHERE eb.brief_id=b.id ORDER BY eb.version DESC LIMIT 1) AS readiness_status,
           (SELECT d.id FROM editorial_review_drafts d JOIN page_evidence_bundles eb ON eb.id=d.evidence_bundle_id
              WHERE eb.brief_id=b.id ORDER BY d.version DESC LIMIT 1) AS draft_id,
           (SELECT d.status FROM editorial_review_drafts d JOIN page_evidence_bundles eb ON eb.id=d.evidence_bundle_id
              WHERE eb.brief_id=b.id ORDER BY d.version DESC LIMIT 1) AS draft_status,
           (SELECT d.prompt_version FROM editorial_review_drafts d JOIN page_evidence_bundles eb ON eb.id=d.evidence_bundle_id
              WHERE eb.brief_id=b.id ORDER BY d.version DESC LIMIT 1) AS draft_renderer
    FROM editorial_briefs b ORDER BY b.priority_score DESC,b.created_at DESC LIMIT 30
  `).all<Obj>();

  const claims = await env.DB.prepare(`
    SELECT c.id,c.brief_id,c.parent_candidate_id,c.subject_type,c.subject_key,c.scope_json,
           c.field_name,c.claim_text,c.verification_question,c.required_source_kinds_json,
           c.status,c.evidence,c.notes,c.created_at,c.updated_at,
           s.source_kind,s.label AS source_label,s.url AS source_url,s.trust_level,
           v.verification_status,v.confidence,v.checked_at,v.valid_until,v.value_json,
           q.id AS task_id,q.status AS task_status,q.priority AS task_priority,q.last_error
    FROM editorial_claim_candidates c
    LEFT JOIN source_registry s ON s.id=c.source_id
    LEFT JOIN claim_verifications v ON v.id=c.claim_verification_id
    LEFT JOIN maintenance_queue q ON q.entity_key=('editorial-claim:' || c.id) AND q.task_type='verify_claims'
    WHERE c.atomic=1
    ORDER BY CASE c.status WHEN 'pending' THEN 0 WHEN 'processing' THEN 1 WHEN 'insufficient' THEN 2 ELSE 3 END,
             c.updated_at DESC,c.id DESC LIMIT 80
  `).all<Obj>();

  const bundles = await env.DB.prepare(`
    SELECT id,brief_id,page_slug,version,readiness_score,review_draft_eligible,publication_eligible,
           ready_for_review_draft,ready_for_publication,review_status,verified_count,insufficient_count,
           contradicted_count,pending_count,expired_count,conflict_count,source_count,subject_count,
           first_party_test_count,warnings_json,reviewed_by,reviewed_at,created_at,updated_at
    FROM page_evidence_bundles ORDER BY updated_at DESC,id DESC LIMIT 30
  `).all<Obj>();

  const drafts = await env.DB.prepare(`
    SELECT id,evidence_bundle_id,version,page_slug,page_type,prompt_version,status,title,h1,
           used_claim_ids_json,excluded_claim_ids_json,generated_by,reviewed_by,reviewed_at,
           review_notes,error_message,created_at,updated_at
    FROM editorial_review_drafts ORDER BY updated_at DESC,id DESC LIMIT 30
  `).all<Obj>();

  const queue = await env.DB.prepare(`
    SELECT id,task_type,entity_type,entity_key,priority,status,due_at,attempts,max_attempts,
           locked_by,last_error,payload_json,created_at,updated_at
    FROM maintenance_queue
    WHERE status IN ('pending','processing','failed')
    ORDER BY CASE status WHEN 'processing' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
             priority DESC,due_at ASC,id ASC LIMIT 50
  `).all<Obj>();

  const audit = await env.DB.prepare(`
    SELECT * FROM (
      SELECT ('draft-event:' || e.id) AS event_key,'draft' AS domain,e.action AS action,
             e.actor AS actor,d.page_slug AS entity,e.draft_id AS draft_id,d.version AS draft_version,
             e.details_json AS details_json,e.created_at AS created_at
      FROM editorial_review_draft_events e JOIN editorial_review_drafts d ON d.id=e.draft_id
      UNION ALL
      SELECT ('readiness-event:' || e.id),'readiness',e.action,e.actor,b.page_slug,
             NULL,NULL,e.details_json,e.created_at
      FROM page_readiness_events e JOIN page_evidence_bundles b ON b.id=e.bundle_id
      UNION ALL
      SELECT ('claim-event:' || e.id),'claim',e.action,e.actor,('claim:' || e.candidate_id),
             NULL,NULL,e.details_json,e.created_at
      FROM editorial_claim_events e
      UNION ALL
      SELECT ('research-run:' || id),'research','completed','system',query,
             NULL,NULL,json_object('runId',id,'eligible',eligible_count,'filtered',filtered_count),created_at
      FROM research_runs
      UNION ALL
      SELECT ('ai-run:' || id),'ai_editorial',status,'system',('ai-run:' || id),
             NULL,NULL,json_object('model',model,'briefCount',brief_count,'error',error_message),created_at
      FROM ai_editorial_runs
    ) ORDER BY created_at DESC LIMIT 80
  `).all<Obj>();

  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    capabilities: {
      worker: true,
      d1: true,
      maintenanceApi: Boolean(env.MAINTENANCE_TOKEN),
      aiGateway: Boolean(env.AI_GATEWAY_TOKEN && env.AI_GATEWAY_ID),
      vertex: Boolean(env.GOOGLE_VERTEX_PROJECT_ID && env.GOOGLE_VERTEX_MODEL),
      recentDemandWorkflow: Boolean(env.RECENT_DEMAND_WORKFLOW),
      publicationAutomation: false
    },
    overview: Object.fromEntries(Object.entries(overview).map(([key, value]) => [key, numberValue(value)])),
    researchRuns: runs.results,
    signals: normalizeRows(signals.results, ['quality_flags_json']),
    briefs: normalizeRows(briefs.results, ['quality_flags_json']),
    claims: normalizeRows(claims.results, ['scope_json', 'required_source_kinds_json', 'value_json']),
    evidenceBundles: normalizeRows(bundles.results, ['warnings_json']),
    drafts: normalizeRows(drafts.results, ['used_claim_ids_json', 'excluded_claim_ids_json']),
    queue: normalizeRows(queue.results, ['payload_json']),
    audit: normalizeRows(audit.results, ['details_json'])
  });
}

const PAGE = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Senza Roaming Control Room</title><style>
:root{color-scheme:dark;--bg:#0b0d10;--panel:#13171c;--line:#28303a;--text:#f3f5f7;--muted:#9da8b5;--accent:#ffcc66;--good:#69d391;--bad:#ff7a7a;--blue:#79b8ff}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}header{position:sticky;top:0;z-index:3;background:rgba(11,13,16,.95);border-bottom:1px solid var(--line);padding:16px 22px;backdrop-filter:blur(12px)}h1,h2,h3,p{margin-top:0}.top{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.brand{font-size:19px;font-weight:800;margin-right:auto}.status,.muted{color:var(--muted)}main{max-width:1500px;margin:auto;padding:22px}.grid{display:grid;gap:14px}.cards{grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:18px}.card,.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:15px}.metric{font-size:27px;font-weight:800}.label{color:var(--muted)}.panels{grid-template-columns:repeat(auto-fit,minmax(420px,1fr))}.wide{grid-column:1/-1}button,input,select,textarea{font:inherit;color:var(--text);background:#0d1116;border:1px solid var(--line);border-radius:8px;padding:9px 11px}button{cursor:pointer;background:#1c2530}button.primary{background:#5b4315;border-color:#9e7629;color:#fff2cf}input,textarea,select{width:100%}textarea{min-height:72px;resize:vertical}.formgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:9px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.tablewrap{overflow:auto;max-height:460px;border:1px solid var(--line);border-radius:10px}table{border-collapse:collapse;width:100%;min-width:760px}th,td{text-align:left;padding:9px;border-bottom:1px solid var(--line);vertical-align:top}th{position:sticky;top:0;background:#171c22}.pill{display:inline-block;padding:2px 7px;border:1px solid var(--line);border-radius:99px;font-size:12px}.verified,.approved,.completed{color:var(--good)}.failed,.contradicted{color:var(--bad)}.pending,.review,.proposed{color:var(--accent)}a{color:var(--blue)}pre{white-space:pre-wrap;word-break:break-word}.notice{padding:10px;border-left:3px solid var(--accent);background:#17130b;margin-bottom:14px}.log{max-height:160px;overflow:auto;color:var(--muted);font-family:ui-monospace,monospace}
</style></head><body><header><div class="top"><div class="brand">Senza Roaming · Control Room</div><input id="token" type="password" autocomplete="off" placeholder="Maintenance token" style="max-width:280px"><button id="save" class="primary">Apri sessione</button><button id="lock">Blocca</button><button id="refresh">Aggiorna</button><span id="status" class="status">Sessione bloccata</span></div></header><main><div class="notice"><strong>Nessuna pubblicazione automatica.</strong> Un draft approvato resta una pagina in <code>review</code>.</div><section id="cards" class="grid cards"></section><section class="grid panels">
<div class="panel"><h2>Avvia ricerca recente</h2><label>Query, una per riga<textarea id="researchQueries">eSIM Cina problemi
eSIM viaggio VPN</textarea></label><div class="actions"><button data-action="research" class="primary">Avvia Workflow</button></div></div>
<div class="panel"><h2>Brief e readiness</h2><div class="formgrid"><label>Brief ID<input id="briefId" type="number" min="1"></label><label>Bundle ID<input id="bundleId" type="number" min="1"></label></div><div class="actions"><button data-action="acceptBrief">Accetta brief</button><button data-action="convertBrief">Converti in task</button><button data-action="evaluate">Valuta readiness</button><button data-action="approveBundle">Approva per draft</button><button data-action="generateDraft" class="primary">Genera draft</button></div></div>
<div class="panel"><h2>Revisione draft</h2><div class="formgrid"><label>Draft ID<input id="draftId" type="number" min="1"></label><label>Note<input id="draftNotes" value="Bozza verificata editorialmente; l’approvazione non autorizza la pubblicazione."></label></div><div class="actions"><button data-action="approveDraft" class="primary">Approva draft</button><button data-action="changesDraft">Richiedi modifiche</button><button data-action="previewDraft">Apri preview</button></div></div>
<div class="panel"><h2>Esito claim atomico</h2><div class="formgrid"><label>Candidate ID<input id="candidateId" type="number" min="1"></label><label>Esito<select id="claimOutcome"><option>verified</option><option>contradicted</option><option>insufficient</option><option>dismissed</option></select></label><label>Source kind<select id="sourceKind"><option>official_provider</option><option>official_help</option><option>official_terms</option><option>regulator</option><option>manufacturer</option><option>first_party_test</option></select></label><label>Freshness giorni<input id="freshnessDays" type="number" value="14" min="1"></label></div><label>URL fonte<input id="sourceUrl" placeholder="https://..."></label><label>Etichetta fonte<input id="sourceLabel"></label><label>Valore verificato JSON<textarea id="claimValue">{}</textarea></label><label>Evidenza<textarea id="claimEvidence"></textarea></label><label>Note<textarea id="claimNotes"></textarea></label><div class="actions"><button data-action="claimResult" class="primary">Registra esito</button></div></div>
<div class="panel wide"><h2>Pipeline editoriale</h2><div id="briefs" class="tablewrap"></div></div><div class="panel wide"><h2>Claim atomici</h2><div id="claims" class="tablewrap"></div></div><div class="panel"><h2>Coda operativa</h2><div id="queue" class="tablewrap"></div></div><div class="panel"><h2>Evidence bundle e draft</h2><div id="bundles" class="tablewrap"></div></div><div class="panel wide"><h2>Audit recente</h2><div id="audit" class="tablewrap"></div></div><div class="panel wide"><h2>Console</h2><pre id="log" class="log"></pre></div></section></main><script>
(function(){var key='srMaintenanceToken',token=sessionStorage.getItem(key)||'';var $=function(id){return document.getElementById(id)},esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};$('token').value=token;function setStatus(t,b){$('status').textContent=t;$('status').style.color=b?'var(--bad)':'var(--muted)'}function log(v){$('log').textContent=(typeof v==='string'?v:JSON.stringify(v,null,2))+'\n'+$('log').textContent}async function request(path,options,expectText){if(!token)throw new Error('Inserisci il maintenance token');var init=options||{};init.headers=Object.assign({'Authorization':'Bearer '+token},init.headers||{});if(init.body)init.headers['Content-Type']='application/json';var r=await fetch(path,init),text=await r.text();if(!r.ok){var e;try{e=JSON.parse(text)}catch(x){e={}}throw new Error(e.error||('HTTP '+r.status))}if(expectText)return text;try{return JSON.parse(text)}catch(x){return {raw:text}}}function pill(v){return '<span class="pill '+esc(v)+'">'+esc(v)+'</span>'}function table(h,rows){return '<table><thead><tr>'+h.map(function(x){return '<th>'+esc(x)+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table>'}
function render(d){var o=d.overview,c=[['Fonti',o.sources_total],['Fonti scadute',o.sources_due],['Queue pending',o.queue_pending],['Segnali eligible',o.signals_eligible],['Brief proposti',o.briefs_proposed],['Claim verificati',o.claims_verified],['Claim pending',o.claims_pending],['Draft approved',o.drafts_approved],['Pagine review',o.pages_review],['Pagine pubblicate',o.pages_published]];$('cards').innerHTML=c.map(function(x){return '<div class="card"><div class="label">'+esc(x[0])+'</div><div class="metric">'+esc(x[1])+'</div></div>'}).join('');$('briefs').innerHTML=table(['ID','Titolo','Score','Stato','Bundle','Readiness','Draft'],d.briefs.map(function(b){return [esc(b.id),'<strong>'+esc(b.proposed_title)+'</strong><br><span class="muted">'+esc(b.slug_suggestion)+'</span>',esc(b.priority_score),pill(b.status),esc(b.bundle_id||'—'),esc(b.readiness_score||'—')+' '+(b.readiness_status?pill(b.readiness_status):''),esc(b.draft_id||'—')+' '+(b.draft_status?pill(b.draft_status):'')]}));$('claims').innerHTML=table(['ID','Brief','Soggetto','Claim','Stato','Fonte','Scadenza','Task'],d.claims.map(function(c){return [esc(c.id),esc(c.brief_id),esc(c.subject_key),esc(c.claim_text),pill(c.status),c.source_url?'<a target="_blank" rel="noopener" href="'+esc(c.source_url)+'">'+esc(c.source_label||c.source_kind)+'</a>':'—',esc(c.valid_until||'—'),c.task_status?pill(c.task_status)+' #'+esc(c.task_id):'—']}));$('queue').innerHTML=table(['ID','Tipo','Entità','Priorità','Stato','Errore'],d.queue.map(function(q){return [esc(q.id),esc(q.task_type),esc(q.entity_key),esc(q.priority),pill(q.status),esc(q.last_error||'')]}));$('bundles').innerHTML=table(['Tipo','ID','Slug','Versione','Score/Stato'],d.evidenceBundles.map(function(b){return ['bundle',esc(b.id),esc(b.page_slug),esc(b.version),esc(b.readiness_score)+' '+pill(b.review_status)]}).concat(d.drafts.map(function(x){return ['draft',esc(x.id),esc(x.page_slug),esc(x.version),pill(x.status)+' '+esc(x.prompt_version)]})));$('audit').innerHTML=table(['Quando','Dominio','Azione','Attore','Entità'],d.audit.map(function(a){return [esc(a.created_at),esc(a.domain),pill(a.action),esc(a.actor),esc(a.entity)]}));setStatus('Aggiornato '+new Date(d.generatedAt).toLocaleString(),false)}
async function load(){try{setStatus('Caricamento…');render(await request('/api/maintenance/control-room'))}catch(e){setStatus(e.message,true);log(e.message)}}function val(id){return $(id).value.trim()}function intVal(id){return Number(val(id)||0)}async function post(path,body){var r=await request(path,{method:'POST',body:JSON.stringify(body)});log(r);await load();return r}async function act(name){try{if(name==='research'){var qs=val('researchQueries').split(/\n+/).map(function(x){return x.trim()}).filter(Boolean);await post('/api/maintenance/research-run',{queries:qs,reason:'control_room_manual'})}else if(name==='acceptBrief')await post('/api/maintenance/editorial-brief-action',{briefIds:[intVal('briefId')],status:'accepted',notes:'Accettato dalla Control Room; nessun claim è pubblicabile senza verifica.'});else if(name==='convertBrief')await post('/api/maintenance/editorial-brief-convert',{briefId:intVal('briefId'),actor:'christian'});else if(name==='evaluate')await post('/api/maintenance/page-readiness-evaluate',{briefId:intVal('briefId'),actor:'christian'});else if(name==='approveBundle')await post('/api/maintenance/page-readiness-action',{bundleId:intVal('bundleId'),action:'approved_for_draft',actor:'christian',notes:'Approvato dalla Control Room esclusivamente per un draft in review.'});else if(name==='generateDraft')await post('/api/maintenance/editorial-draft-generate',{bundleId:intVal('bundleId'),actor:'christian'});else if(name==='approveDraft')await post('/api/maintenance/editorial-draft-action',{draftId:intVal('draftId'),action:'approved',actor:'christian',notes:val('draftNotes')});else if(name==='changesDraft')await post('/api/maintenance/editorial-draft-action',{draftId:intVal('draftId'),action:'changes_requested',actor:'christian',notes:val('draftNotes')});else if(name==='previewDraft'){var html=await request('/api/maintenance/editorial-draft-preview?draftId='+intVal('draftId'),{},true),url=URL.createObjectURL(new Blob([html],{type:'text/html'}));window.open(url,'_blank','noopener');setTimeout(function(){URL.revokeObjectURL(url)},60000)}else if(name==='claimResult'){var outcome=val('claimOutcome'),body={candidateId:intVal('candidateId'),outcome:outcome,actor:'christian',evidence:val('claimEvidence'),notes:val('claimNotes')};if(outcome==='verified'||outcome==='contradicted'){var value;try{value=JSON.parse(val('claimValue')||'null')}catch(x){throw new Error('Valore verificato: JSON non valido')}body.source={kind:val('sourceKind'),label:val('sourceLabel'),url:val('sourceUrl'),trustLevel:5,freshnessDays:intVal('freshnessDays')};body.value=value;body.confidence=1}await post('/api/maintenance/editorial-atomic-claim-result',body)}}catch(e){setStatus(e.message,true);log(e.message)}}$('save').onclick=function(){token=val('token');sessionStorage.setItem(key,token);load()};$('lock').onclick=function(){token='';sessionStorage.removeItem(key);$('token').value='';setStatus('Sessione bloccata')};$('refresh').onclick=load;document.querySelectorAll('[data-action]').forEach(function(b){b.onclick=function(){act(b.getAttribute('data-action'))}});if(token)load()})();
</script></body></html>`;

export function controlRoomPage(env: Env): Response {
  return new Response(PAGE.replace('Senza Roaming · Control Room', `${env.SITE_NAME} · Control Room`), {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    }
  });
}

export async function controlRoomApi(request: Request, env: Env): Promise<Response> {
  const authError = authorized(request, env);
  if (authError) return authError;
  if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405);
  return controlRoomData(env);
}
