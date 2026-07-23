import { readFile, writeFile } from 'node:fs/promises';

async function replaceOnce(path, before, after) {
  const source = await readFile(path, 'utf8');
  if (source.includes(after)) return;
  if (!source.includes(before)) {
    throw new Error(`Expected checkpoint text not found in ${path}: ${before.slice(0, 120)}`);
  }
  await writeFile(path, source.replace(before, after), 'utf8');
}

await replaceOnce(
  'ROADMAP.md',
  'Ultimo aggiornamento: **22 luglio 2026**.',
  'Ultimo aggiornamento: **23 luglio 2026**.',
);
await replaceOnce(
  'ROADMAP.md',
  '**Stato: parità read-only completa; prima mutation verificata in CI, produzione ancora aperta**',
  '**Stato: parità read-only completa; prima mutation verificata in produzione**',
);
await replaceOnce(
  'ROADMAP.md',
  '- [x] Decisione brief implementata e verificata in CI — draft PR #54, CI #230.\n- [ ] Merge PR #54, applicazione remota `0020` e verifica browser reale.',
  '- [x] Decisione brief mergiata e verificata in produzione — PR #54, merge `15ea0445`, CI finale #237, checkpoint produttivo #244.',
);
await replaceOnce(
  'ROADMAP.md',
  `1. chiudere la review della draft PR #54 e rieseguire la CI finale;\n2. autorizzare separatamente merge, deploy e migrazione remota \`0020\`;\n3. verificare nel browser reale decisione brief e linkage read-only recenti;\n4. verificare separatamente la migrazione remota \`0019\` senza dati artificiali;\n5. migrare la conversione brief come capacità distinta;\n6. migrare le mutation residue una per branch;\n7. rimuovere la legacy soltanto quando il fallback non serve più;\n8. migrare il sito pubblico ad Astro;\n9. collegare Search Console, consenso e analytics;\n10. attivare affiliazioni soltanto dopo quality gate e misurazione.`,
  `1. verificare visivamente in produzione i linkage claim → task e audit → versione draft;\n2. verificare funzionalmente il topic-mismatch sul primo nuovo run autorizzato, senza dati artificiali;\n3. migrare la conversione brief come capacità distinta;\n4. migrare le mutation residue una per branch;\n5. rimuovere la legacy soltanto quando il fallback non serve più;\n6. migrare il sito pubblico ad Astro;\n7. collegare Search Console, consenso e analytics;\n8. attivare affiliazioni soltanto dopo quality gate e misurazione.`,
);

await replaceOnce(
  'docs/STATUS.md',
  'Data di riferimento: **22 luglio 2026**.',
  'Data di riferimento: **23 luglio 2026**.',
);
await replaceOnce(
  'docs/STATUS.md',
  '| Worker e D1 | Operativi | produzione verificata fino a `0018`; `0019` mergiata ma non attestata; `0020` soltanto sulla branch mutation |',
  '| Worker e D1 | Operativi | stack remoto allineato fino a `0020`; verifica funzionale del topic-mismatch sul prossimo run ancora aperta |',
);
await replaceOnce(
  'docs/STATUS.md',
  '| Decisione brief mutation | Implementata e verificata in CI | draft PR #54, CI #230; merge, `0020` remota e browser reale aperti |',
  '| Decisione brief mutation | Operativa e verificata in produzione | PR #54, merge `15ea0445`, CI #237, checkpoint #244; nessuna decisione reale eseguita |',
);
await replaceOnce(
  'docs/STATUS.md',
  `→ snapshot read-only\n→ dettaglio draft GET-only on demand\n→ API esistenti`,
  `→ snapshot read-only\n→ dettaglio draft GET-only on demand\n→ decisione brief POST controllata\n→ API esistenti`,
);
await replaceOnce(
  'docs/STATUS.md',
  'Sono verificati in produzione sessione, overview, radar, brief, claim, readiness, inventario draft, queue/audit, dettaglio draft completo, desktop/mobile e separazione fra stato draft, pagina materializzata e publication eligibility.',
  'Sono verificati in produzione sessione, overview, radar, brief, claim, readiness, inventario draft, queue/audit, dettaglio draft completo, desktop/mobile, route e UI della decisione brief e separazione fra stato draft, pagina materializzata e publication eligibility.',
);
await replaceOnce(
  'docs/STATUS.md',
  '## Decisione brief — draft PR #54',
  '## Decisione brief — PR #54 in produzione',
);
await replaceOnce(
  'docs/STATUS.md',
  'Implementazione verificata dalla CI #230:',
  'Implementazione verificata dalla CI finale #237 e dal checkpoint produttivo #244:',
);
await replaceOnce(
  'docs/STATUS.md',
  'La CI #230 ha superato typecheck, build Astro, migrazioni D1 locali, quality gate, golden evaluation, Container, runtime `workerd` e tutti gli smoke della Control Room.',
  'La CI finale #237 ha superato typecheck, build Astro, migrazioni D1 locali, quality gate, golden evaluation, Container, runtime `workerd` e tutti gli smoke della Control Room.',
);
await replaceOnce(
  'docs/STATUS.md',
  `Non sono ancora operativi o verificati in produzione:\n\n- merge della PR #54;\n- applicazione remota della migrazione \`0020\`;\n- route e UI nel browser reale dietro Access.\n\nConversione brief, claim, readiness, bundle, draft, queue retry, materializzazione e pubblicazione restano escluse.`,
  `Il checkpoint produttivo #244 ha attestato:\n\n- migrazione \`0020\` registrata nella D1 remota, senza migrazioni residue;\n- tabella \`editorial_brief_events\`, colonne \`decision_actor\` / \`decided_at\` e trigger attesi presenti;\n- pagine \`published\` invariate: \`4 → 4\`;\n- stati brief invariati: un solo brief \`converted\`;\n- Access anonimo \`302\`, pagina e snapshot autenticati \`200\`;\n- \`publicationAutomation: false\`;\n- nessuna richiesta browser non-GET;\n- nessuna decisione su brief reali.\n\nLa Control Room reale mostra correttamente l’empty state perché non esistono brief \`proposed\`. Conversione brief, claim, readiness, bundle, draft, queue retry, materializzazione e pubblicazione restano escluse.`,
);
await replaceOnce(
  'docs/STATUS.md',
  'La prima mutation in migrazione è la decisione brief. La legacy resta il fallback per avvio Workflow, conversione brief, operazioni claim, readiness/bundle, generazione e decisione draft e altre azioni non ancora migrate.',
  'La prima mutation migrata e verificata è la decisione brief. La legacy resta il fallback per avvio Workflow, conversione brief, operazioni claim, readiness/bundle, generazione e decisione draft e altre azioni non ancora migrate.',
);
await replaceOnce(
  'docs/STATUS.md',
  `- review e merge della PR #54;\n- applicazione e verifica remota di \`0020\`;\n- verifica browser reale della decisione brief e dei due linkage read-only recenti;`,
  `- verifica browser reale dei due linkage read-only recenti;\n- prima decisione reale soltanto quando esisterà un brief \`proposed\` e sarà autorizzata;`,
);
await replaceOnce(
  'docs/STATUS.md',
  `## Prossimo checkpoint\n\n\`\`\`text\nreview della draft PR #54\n\`\`\`\n\nLa PR non viene dichiarata operativa né mergiata finché il contenuto definitivo non supera una CI finale. La migrazione remota e il deploy pubblico richiedono autorizzazione separata.`,
  `## Prossimo checkpoint\n\n\`\`\`text\nverifica visuale dei linkage read-only recenti\n→ conversione brief come capacità separata\n\`\`\`\n\nLa decisione brief è operativa, ma non è stata eseguita su dati reali. Nessuna capacità successiva viene attivata implicitamente.`,
);

await replaceOnce(
  'docs/NEXT.md',
  'Ultimo aggiornamento: **22 luglio 2026**.',
  'Ultimo aggiornamento: **23 luglio 2026**.',
);
await replaceOnce(
  'docs/NEXT.md',
  `### 1. Chiudere la review della draft PR #54\n\nBranch:\n\n\`\`\`text\nfeat/control-room-brief-decision-mutation\n\`\`\`\n\nScope esclusivo:\n\n\`\`\`text\nproposed → accepted | dismissed\n\`\`\`\n\nLa CI #230 è completamente verde e verifica:\n\n- un solo brief per richiesta;\n- conferma esplicita dell’operatore;\n- attore derivato dal JWT Cloudflare Access;\n- state machine D1;\n- audit append-only \`editorial_brief_events\`;\n- retry della stessa decisione idempotente;\n- conflitto sulla decisione opposta;\n- motivo obbligatorio per il rifiuto;\n- cancellazione del task editoriale aperto soltanto su \`dismissed\`;\n- reload dello snapshot;\n- endpoint reale e browser desktop/mobile;\n- conteggio pubblicazioni invariato;\n- \`publicationTriggered: false\`;\n- regressioni delle altre viste e legacy parity.\n\nPrima del merge:\n\n- riallineare ROADMAP, FRONTEND-PLAN, STATUS, NEXT, DECISIONS e README;\n- rieseguire la CI sul contenuto definitivo;\n- mantenere esplicito che \`0020\` non è applicata remotamente;\n- non dichiarare la mutation operativa in produzione.\n\nLa branch non include conversione brief, claim, readiness, bundle, draft, materializzazione, queue retry, pubblicazione o rimozione della legacy.\n\n### 2. Gate produttivo separato\n\nDopo un eventuale merge della PR #54 restano separati:\n\n- deploy del codice operativo su \`main\`;\n- applicazione remota della migrazione \`0020\`;\n- verifica browser reale dietro Cloudflare Access;\n- conferma che accept e dismiss non attivino conversione o pubblicazione;\n- controllo dell’audit persistito e della queue reale.\n\nMerge, migrazione remota e deploy richiedono autorizzazione esplicita. La CI locale non sostituisce la verifica produttiva.\n\n### 3. Verificare i linkage read-only nel browser reale`,
  `### 1. Checkpoint decisione brief completato\n\nPR #54 è mergiata nel commit \`15ea0445\`. La CI finale #237 e il checkpoint produttivo #244 attestano:\n\n- migrazione remota \`0020\` registrata;\n- state machine e audit append-only presenti in D1;\n- Access e snapshot operativi;\n- UI reale con guardrail e empty state;\n- pagine pubblicate e stati brief invariati;\n- automazione di pubblicazione disabilitata;\n- zero richieste browser non-GET;\n- zero decisioni su brief reali.\n\nLa capacità è disponibile soltanto per futuri brief \`proposed\`. Conversione, claim, readiness, bundle, draft, materializzazione, queue retry, pubblicazione e rimozione della legacy restano escluse.\n\n### 2. Verificare i linkage read-only nel browser reale`,
);
await replaceOnce(
  'docs/NEXT.md',
  '### 4. Verificare separatamente il topic-mismatch gate',
  '### 3. Verificare separatamente il topic-mismatch gate',
);
await replaceOnce(
  'docs/NEXT.md',
  `Soltanto dopo merge, migrazione remota e verifica della decisione brief:\n\n\`\`\`text\nconversione brief`,
  `Dopo il checkpoint documentale e mantenendo una branch separata:\n\n\`\`\`text\nconversione brief`,
);
await replaceOnce(
  'docs/NEXT.md',
  '- PR #52 — audit → versione draft, merge `35f56e82`, CI #220.',
  '- PR #52 — audit → versione draft, merge `35f56e82`, CI #220;\n- PR #54 — decisione brief, merge `15ea0445`, CI #237 e checkpoint produttivo #244.',
);
await replaceOnce(
  'docs/NEXT.md',
  `## Checkpoint in review\n\n- draft PR #54 — decisione brief controllata, CI #230 verde.\n\n`,
  '',
);
await replaceOnce(
  'docs/NEXT.md',
  '- nessuna mutation diversa dalla decisione brief nella PR #54;',
  '- ogni nuova mutation richiede una nuova branch e uno scope esclusivo;',
);

await replaceOnce(
  'docs/ARCHITECTURE.md',
  'Data di riferimento: **22 luglio 2026**.',
  'Data di riferimento: **23 luglio 2026**.',
);
await replaceOnce(
  'docs/ARCHITECTURE.md',
  'La capacità è verificata in CI #230 sulla draft PR #54. Merge, migrazione remota `0020`, deploy e verifica browser reale restano separati e non sono ancora attestati.',
  'La capacità è mergiata con PR #54 ed è verificata dalla CI finale #237 e dal checkpoint produttivo #244. La migrazione `0020`, Access, snapshot, guardrail ed empty state sono attestati in produzione; nessuna decisione reale è stata eseguita.',
);

await replaceOnce(
  'docs/DECISIONS.md',
  '**Stato:** proposta sulla branch `feat/control-room-brief-decision-mutation`',
  '**Stato:** accettata e verificata in produzione con PR #54',
);
await replaceOnce(
  'docs/DECISIONS.md',
  'La decisione diventa accettata soltanto dopo CI, merge e verifica remota della migrazione `0020`.',
  'La decisione è stata accettata dopo merge `15ea0445`, CI finale #237 e checkpoint produttivo #244: `0020` è registrata nella D1 remota, la Control Room è verificata dietro Access e nessun brief reale è stato modificato.',
);

await replaceOnce(
  'docs/FRONTEND-PLAN.md',
  'Data di riferimento: **22 luglio 2026**.',
  'Data di riferimento: **23 luglio 2026**.',
);
await replaceOnce(
  'docs/FRONTEND-PLAN.md',
  '- prima route mutabile limitata alla decisione brief, verificata in CI #230.\n\nLa route mutabile non è ancora dichiarata operativa in produzione finché PR #54, migrazione remota `0020` e verifica browser reale non sono chiuse.',
  '- prima route mutabile limitata alla decisione brief, verificata in CI #237 e in produzione con checkpoint #244.\n\nLa route è operativa dietro Cloudflare Access. Il checkpoint non ha eseguito decisioni reali e ha confermato `publicationAutomation: false`.',
);
await replaceOnce(
  'docs/FRONTEND-PLAN.md',
  'Draft PR #54:',
  'PR #54:',
);
await replaceOnce(
  'docs/FRONTEND-PLAN.md',
  'CI #230 completamente verde:',
  'CI finale #237 completamente verde:',
);
await replaceOnce(
  'docs/FRONTEND-PLAN.md',
  `Ancora aperti:\n\n- review e merge PR #54;\n- applicazione remota \`0020\`;\n- deploy operativo;\n- verifica browser reale dietro Access.\n\nLa branch non include conversione, claim, readiness, bundle, draft, materializzazione, queue retry o pubblicazione.`,
  `Checkpoint produttivo #244 completato:\n\n- PR #54 mergiata nel commit \`15ea0445\`;\n- migrazione \`0020\` registrata nella D1 remota;\n- tabella, colonne e trigger verificati;\n- Control Room e snapshot autenticati \`200\`;\n- guardrail ed empty state verificati nel browser reale;\n- nessun POST browser e nessuna decisione reale;\n- pagine pubblicate invariate e pubblicazione automatica disabilitata.\n\nLa PR non include conversione, claim, readiness, bundle, draft, materializzazione, queue retry o pubblicazione.`,
);

await replaceOnce(
  'apps/web/README.md',
  'Questa branch non implementa conversione brief, mutation claim, valutazione readiness, approvazione bundle, generazione o revisione draft, materializzazione, queue retry, accesso browser a D1 o pubblicazione.',
  'La PR #54 non implementa conversione brief, mutation claim, valutazione readiness, approvazione bundle, generazione o revisione draft, materializzazione, queue retry, accesso browser a D1 o pubblicazione.',
);
await replaceOnce(
  'apps/web/README.md',
  'La CI #230 è completamente verde sulla branch. Merge, migrazione remota `0020` e verifica browser reale di produzione restano separati e non sono ancora attestati.',
  'La CI finale #237 è verde. PR #54, migrazione remota `0020` e Control Room reale dietro Access sono verificati dal checkpoint produttivo #244; nessuna decisione su brief reali è stata eseguita.',
);

console.log('Brief decision documentation checkpoint applied.');
