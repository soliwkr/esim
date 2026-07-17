import type { Env } from './types';

type Obj = Record<string, unknown>;

export type VertexJsonResult<T> = {
  data: T;
  responseId: string | null;
  modelVersion: string | null;
  usage: Obj;
};

export class VertexGatewayError extends Error {
  readonly upstreamStatus: number;
  readonly detail: string;

  constructor(message: string, upstreamStatus: number, detail: string) {
    super(message);
    this.name = 'VertexGatewayError';
    this.upstreamStatus = upstreamStatus;
    this.detail = detail;
  }
}

function obj(value: unknown): Obj | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Obj : null;
}

function str(value: unknown, max = 2000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
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

function endpoint(env: Env): string {
  return [
    'https://gateway.ai.cloudflare.com/v1',
    encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID as string),
    encodeURIComponent(env.AI_GATEWAY_ID as string),
    'google-vertex-ai/v1/projects',
    encodeURIComponent(env.GOOGLE_VERTEX_PROJECT_ID as string),
    'locations',
    encodeURIComponent(env.GOOGLE_VERTEX_LOCATION as string),
    'publishers/google/models',
    `${encodeURIComponent(env.GOOGLE_VERTEX_MODEL as string)}:generateContent`
  ].join('/');
}

function extractText(payload: unknown): string {
  const root = obj(payload);
  const candidates = Array.isArray(root?.candidates) ? root.candidates : [];
  const first = obj(candidates[0]);
  const content = obj(first?.content);
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  return parts
    .map((part) => str(obj(part)?.text, 100_000))
    .filter(Boolean)
    .join('')
    .trim();
}

export function missingVertexConfig(env: Env): string[] {
  return requiredConfig(env).filter(([, value]) => !value).map(([name]) => name);
}

export async function generateVertexJson<T>(
  env: Env,
  prompt: string,
  responseSchema: Obj,
  options: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<VertexJsonResult<T>> {
  const missing = missingVertexConfig(env);
  if (missing.length) {
    throw new VertexGatewayError(`Missing Vertex configuration: ${missing.join(', ')}`, 503, missing.join(','));
  }

  const upstream = await fetch(endpoint(env), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-aig-authorization': `Bearer ${env.AI_GATEWAY_TOKEN as string}`,
      'cf-aig-collect-log-payload': 'false'
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
        responseMimeType: 'application/json',
        responseSchema
      }
    })
  });

  const raw = await upstream.text();
  let payload: unknown = null;
  try { payload = JSON.parse(raw); } catch { payload = null; }

  if (!upstream.ok) {
    throw new VertexGatewayError(
      `Vertex AI request failed with status ${upstream.status}`,
      upstream.status,
      raw.slice(0, 2000)
    );
  }

  const text = extractText(payload);
  if (!text) throw new VertexGatewayError('Vertex AI returned no text candidate', 502, raw.slice(0, 2000));

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new VertexGatewayError('Vertex AI returned invalid JSON', 502, text.slice(0, 2000));
  }

  const root = obj(payload) || {};
  return {
    data,
    responseId: str(root.responseId, 300) || null,
    modelVersion: str(root.modelVersion, 300) || null,
    usage: obj(root.usageMetadata) || {}
  };
}
