import { generateKeyPairSync, sign } from 'node:crypto';

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function createAccessTestCredentials() {
  const issuer = 'https://runtime-smoke.cloudflareaccess.com';
  const audience = 'runtime-smoke-control-room-aud';
  const kid = 'runtime-smoke-key';
  const now = Math.floor(Date.now() / 1000);
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicJwk = publicKey.export({ format: 'jwk' });
  publicJwk.alg = 'RS256';
  publicJwk.kid = kid;
  publicJwk.use = 'sig';

  const encodedHeader = encodeJson({ alg: 'RS256', kid, typ: 'JWT' });
  const encodedPayload = encodeJson({
    aud: [audience],
    email: 'runtime-smoke@example.test',
    exp: now + 600,
    iat: now,
    iss: issuer,
    nbf: now - 5,
    sub: 'runtime-smoke-user',
  });
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign('RSA-SHA256', Buffer.from(signingInput), privateKey).toString('base64url');

  return {
    audience,
    issuer,
    jwks: JSON.stringify({ keys: [publicJwk] }),
    token: `${signingInput}.${signature}`,
  };
}
