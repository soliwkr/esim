PRAGMA foreign_keys = ON;

-- Registro canonico delle fonti che alimentano provider, piani, destinazioni,
-- compatibilità e contenuti editoriali. L'AI può proporre aggiornamenti, ma ogni
-- dato resta collegato a una fonte, una data e una politica di freschezza.
CREATE TABLE IF NOT EXISTS source_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('provider','destination','plan','device','page','policy')),
  entity_key TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK(source_kind IN ('official_provider','official_help','official_terms','regulator','manufacturer','first_party_test','editorial_reference')),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  trust_level INTEGER NOT NULL DEFAULT 5 CHECK(trust_level BETWEEN 1 AND 5),
  freshness_days INTEGER NOT NULL DEFAULT 14 CHECK(freshness_days BETWEEN 1 AND 365),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','blocked','error','archived')),
  last_checked_at TEXT,
  last_changed_at TEXT,
  content_hash TEXT,
  http_etag TEXT,
  http_last_modified TEXT,
  last_http_status INTEGER,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_key, url)
);

CREATE INDEX IF NOT EXISTS idx_sources_entity ON source_registry(entity_type, entity_key);
CREATE INDEX IF NOT EXISTS idx_sources_status ON source_registry(status, last_checked_at);

-- Un claim è una singola affermazione verificabile: prezzo, durata, hotspot,
-- fair use, rete, attivazione, rimborso o compatibilità. Separare i claim dal
-- testo evita che l'AI trasformi una bozza in una "verità" senza evidenza.
CREATE TABLE IF NOT EXISTS claim_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('provider','destination','plan','device','page','policy')),
  entity_key TEXT NOT NULL,
  field_name TEXT NOT NULL,
  value_json TEXT NOT NULL DEFAULT 'null',
  source_id INTEGER NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK(verification_status IN ('verified','conflict','stale','missing')),
  confidence REAL NOT NULL DEFAULT 1 CHECK(confidence >= 0 AND confidence <= 1),
  checked_at TEXT NOT NULL,
  valid_until TEXT,
  evidence TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(source_id) REFERENCES source_registry(id),
  UNIQUE(entity_type, entity_key, field_name, source_id)
);

CREATE INDEX IF NOT EXISTS idx_claims_entity ON claim_verifications(entity_type, entity_key, verification_status);
CREATE INDEX IF NOT EXISTS idx_claims_validity ON claim_verifications(valid_until, verification_status);

-- Coda esplicita per agenti e automazioni. Nessun agente pubblica direttamente:
-- raccoglie, confronta, segnala conflitti e consegna il risultato al quality gate.
CREATE TABLE IF NOT EXISTS maintenance_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dedupe_key TEXT NOT NULL UNIQUE,
  task_type TEXT NOT NULL CHECK(task_type IN ('refresh_source','verify_claims','refresh_page','compare_plans','editorial_review')),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('provider','destination','plan','device','page','policy')),
  entity_key TEXT NOT NULL,
  source_id INTEGER,
  priority INTEGER NOT NULL DEFAULT 50 CHECK(priority BETWEEN 1 AND 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','cancelled')),
  due_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payload_json TEXT NOT NULL DEFAULT '{}',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK(max_attempts BETWEEN 1 AND 10),
  locked_at TEXT,
  locked_by TEXT,
  last_error TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(source_id) REFERENCES source_registry(id)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_pending ON maintenance_queue(status, due_at, priority DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_entity ON maintenance_queue(entity_type, entity_key, status);

CREATE VIEW IF NOT EXISTS maintenance_due_sources AS
SELECT
  id,
  entity_type,
  entity_key,
  source_kind,
  label,
  url,
  trust_level,
  freshness_days,
  last_checked_at,
  CASE
    WHEN last_checked_at IS NULL THEN CURRENT_TIMESTAMP
    ELSE datetime(last_checked_at, '+' || freshness_days || ' days')
  END AS due_at,
  CASE
    WHEN last_checked_at IS NULL THEN 1
    WHEN datetime(last_checked_at, '+' || freshness_days || ' days') <= CURRENT_TIMESTAMP THEN 1
    ELSE 0
  END AS is_due
FROM source_registry
WHERE status = 'active';

-- Importa i provider già presenti come prime fonti canoniche.
INSERT OR IGNORE INTO source_registry(
  entity_type, entity_key, source_kind, label, url, trust_level,
  freshness_days, status, last_checked_at, notes
)
SELECT
  'provider', slug, 'official_provider', name || ' — sito ufficiale', official_url,
  5, 7, CASE WHEN active = 1 THEN 'active' ELSE 'archived' END, checked_at,
  'Fonte importata dal catalogo provider.'
FROM providers;

-- Prima coda: ogni fonte provider deve essere letta, classificata e trasformata
-- in claim strutturati prima che le pagine commerciali possano uscire da review.
INSERT OR IGNORE INTO maintenance_queue(
  dedupe_key, task_type, entity_type, entity_key, source_id, priority, payload_json
)
SELECT
  'bootstrap:refresh-source:' || id,
  'refresh_source',
  entity_type,
  entity_key,
  id,
  90,
  json_object('reason', 'bootstrap', 'sourceUrl', url)
FROM source_registry
WHERE status = 'active';
