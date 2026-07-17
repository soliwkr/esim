import type { Env } from './types';

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store' }
  });
}

function authorized(request: Request, env: Env): Response | null {
  if (!env.MAINTENANCE_TOKEN) {
    return json({ ok: false, error: 'maintenance_api_disabled' }, 503);
  }
  if (request.headers.get('authorization') !== `Bearer ${env.MAINTENANCE_TOKEN}`) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  return null;
}

function requiredConfig(env: Env): Array<[string, string | undefined]> {
  return [
    ['CLOUDFLARE_ACCOUNT_ID', env.CLOUDFLARE_ACCOUNT_ID],
    ['AI_GATEWAY_ID', env.AI_GATEWAY_ID],
    ['GOOGLE_VERTEX_PROJECT_ID', env.GOOGLE_VERTEX_PROJECT_ID],
    ['GOOGLE_VERTEX_LOCATION', env.GOOGLE_VERTEX_LOCATION],
    ['GOOGLE_VERTEX_MODEL', env.GOOGLE_VERTEX_MODEL],
    ['AI_GATEWAY_TOKEN', env.AI_GATEWAY_TOKEN]
  ];
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return '';

  const first = candidates[0];
  if (!first || typeof first !== 'object') return '';
  const content = (first as { content?: unknown }).content;
  if (!content || typeof content !== 'object') return '';
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return '';

  return parts
    .map((part) => part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string'
      ? String((part as { text: string }).text)
      : '')
    .join('')
    .trim();
}

export async function aiGatewaySmoke(request: Request, env: Env): Promise<Response> {
  const authError = authorized(request, env);
  if (authError) return authError;
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

  const missing = requiredConfig(env)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) return json({ ok: false, error: 'ai_gateway_not_configured', missing }, 503);

  const accountId = env.CLOUDFLARE_ACCOUNT_ID as string;
  const gatewayId = env.AI_GATEWAY_ID as string;
  const projectId = env.GOOGLE_VERTEX_PROJECT_ID as string;
  const location = env.GOOGLE_VERTEX_LOCATION as string;
  const model = env.GOOGLE_VERTEX_MODEL as string;
  const token = env.AI_GATEWAY_TOKEN as string;

  const endpoint = [
    'https://gateway.ai.cloudflare.com/v1',
    encodeURIComponent(accountId),
    encodeURIComponent(gatewayId),
    'google-vertex-ai/v1/projects',
    encodeURIComponent(projectId),
    'locations',
    encodeURIComponent(location),
    'publishers/google/models',
    `${encodeURIComponent(model)}:generateContent`
  ].join('/');

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-aig-authorization': `Bearer ${token}`,
      'cf-aig-collect-log-payload': 'false'
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: 'Rispondi esclusivamente con: SENZA_ROAMING_AI_OK' }]
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 32
      }
    })
  });

  const raw = await upstream.text();
  let payload: unknown = null;
  try { payload = JSON.parse(raw); } catch { payload = null; }

  if (!upstream.ok) {
    return json({
      ok: false,
      error: 'ai_gateway_upstream_error',
      upstreamStatus: upstream.status,
      detail: raw.slice(0, 1500)
    }, 502);
  }

  const text = extractText(payload);
  return json({
    ok: text.includes('SENZA_ROAMING_AI_OK'),
    provider: 'google-vertex-ai',
    projectId,
    location,
    model,
    response: text.slice(0, 200)
  });
}
