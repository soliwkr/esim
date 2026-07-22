type AccessEnv = Env & {
  CF_ACCESS_TEAM_DOMAIN?: string
  CF_ACCESS_AUD?: string
  CF_ACCESS_TEST_JWKS?: string
}

type AccessJwtHeader = {
  alg?: string
  kid?: string
  typ?: string
}

type AccessJwtPayload = {
  aud?: string | string[]
  exp?: number
  iat?: number
  iss?: string
  nbf?: number
  sub?: string
  email?: string
}

type AccessJwk = JsonWebKey & {
  alg?: string
  kid?: string
  use?: string
}

type JwkSet = {
  keys: AccessJwk[]
}

const jwksCache = new Map<string, { expiresAt: number; value: JwkSet }>()
const JWKS_CACHE_MS = 5 * 60 * 1000

function accessResponse(status: number, code: string): Response {
  return Response.json(
    { ok: false, error: code },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
        "referrer-policy": "no-referrer",
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow",
      },
    },
  )
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(value.byteLength)
  new Uint8Array(buffer).set(value)
  return buffer
}

function parseJsonPart<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T
}

function normalizeTeamDomain(value: string): string {
  const candidate = /^https:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`
  const url = new URL(candidate)
  if (url.protocol !== "https:") throw new Error("access_team_domain_must_use_https")
  return url.origin
}

function audienceMatches(actual: AccessJwtPayload["aud"], expected: string): boolean {
  return typeof actual === "string" ? actual === expected : Array.isArray(actual) && actual.includes(expected)
}

function parseTestJwks(env: AccessEnv): JwkSet | null {
  const raw = env.CF_ACCESS_TEST_JWKS?.trim()
  if (!raw) return null
  const parsed = JSON.parse(raw) as JwkSet
  if (!Array.isArray(parsed.keys) || parsed.keys.length === 0) throw new Error("access_test_jwks_invalid")
  return parsed
}

async function loadJwks(env: AccessEnv, issuer: string): Promise<JwkSet> {
  const testJwks = parseTestJwks(env)
  if (testJwks) return testJwks

  const cached = jwksCache.get(issuer)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const response = await fetch(`${issuer}/cdn-cgi/access/certs`, {
    headers: { accept: "application/json" },
    cf: { cacheTtl: 300, cacheEverything: true },
  })
  if (!response.ok) throw new Error("access_jwks_unavailable")

  const value = await response.json() as JwkSet
  if (!Array.isArray(value.keys) || value.keys.length === 0) throw new Error("access_jwks_invalid")
  jwksCache.set(issuer, { expiresAt: Date.now() + JWKS_CACHE_MS, value })
  return value
}

async function verifySignature(signingInput: string, signature: Uint8Array, key: AccessJwk): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  )
  return crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    cryptoKey,
    toArrayBuffer(signature),
    toArrayBuffer(new TextEncoder().encode(signingInput)),
  )
}

export function cloudflareAccessActor(request: Request): string {
  const token = request.headers.get("cf-access-jwt-assertion")?.trim()
  if (!token) throw new Error("cloudflare_access_required")

  const parts = token.split(".")
  if (parts.length !== 3) throw new Error("access_jwt_malformed")
  const payload = parseJsonPart<AccessJwtPayload>(parts[1])
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : ""
  if (email) return email.slice(0, 320)

  const subject = typeof payload.sub === "string" ? payload.sub.trim() : ""
  if (subject) return `access:${subject}`.slice(0, 320)
  throw new Error("access_identity_missing")
}

export async function requireCloudflareAccess(request: Request, rawEnv: Env): Promise<Response | null> {
  const env = rawEnv as AccessEnv
  const configuredDomain = env.CF_ACCESS_TEAM_DOMAIN?.trim()
  const audience = env.CF_ACCESS_AUD?.trim()
  if (!configuredDomain || !audience) return accessResponse(503, "control_room_access_not_configured")

  const token = request.headers.get("cf-access-jwt-assertion")?.trim()
  if (!token) return accessResponse(403, "cloudflare_access_required")

  try {
    const parts = token.split(".")
    if (parts.length !== 3) throw new Error("access_jwt_malformed")

    const [encodedHeader, encodedPayload, encodedSignature] = parts
    const header = parseJsonPart<AccessJwtHeader>(encodedHeader)
    const payload = parseJsonPart<AccessJwtPayload>(encodedPayload)
    if (header.alg !== "RS256" || !header.kid) throw new Error("access_jwt_algorithm_invalid")

    const issuer = normalizeTeamDomain(configuredDomain)
    const now = Math.floor(Date.now() / 1000)
    if (payload.iss !== issuer) throw new Error("access_jwt_issuer_invalid")
    if (!audienceMatches(payload.aud, audience)) throw new Error("access_jwt_audience_invalid")
    if (typeof payload.exp !== "number" || payload.exp <= now) throw new Error("access_jwt_expired")
    if (typeof payload.nbf === "number" && payload.nbf > now + 30) throw new Error("access_jwt_not_active")
    if (typeof payload.iat === "number" && payload.iat > now + 30) throw new Error("access_jwt_issued_in_future")

    const jwks = await loadJwks(env, issuer)
    const key = jwks.keys.find((candidate) => candidate.kid === header.kid && candidate.kty === "RSA")
    if (!key) throw new Error("access_jwt_key_missing")

    const valid = await verifySignature(
      `${encodedHeader}.${encodedPayload}`,
      decodeBase64Url(encodedSignature),
      key,
    )
    if (!valid) throw new Error("access_jwt_signature_invalid")

    return null
  } catch (error) {
    console.warn("Cloudflare Access JWT rejected", error instanceof Error ? error.message : "unknown")
    return accessResponse(403, "cloudflare_access_invalid")
  }
}
