const nativeFetch = globalThis.fetch.bind(globalThis);

function requestMethod(init) {
  return String(init?.method || 'GET').toUpperCase();
}

function requestUrl(input) {
  return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
}

async function boundedFetch(input, init = {}) {
  const method = requestMethod(init);
  const url = requestUrl(input);
  const retryableRead = method === 'GET'
    && (url.includes('/api/health') || url.includes('/control-room-foundation/api/'));
  const attempts = retryableRead ? 3 : 1;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await nativeFetch(input, {
        ...init,
        signal: init.signal || AbortSignal.timeout(15_000),
      });
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }

  throw lastError;
}

globalThis.fetch = boundedFetch;

await import('./smoke-control-room-brief-decisions.mjs');
