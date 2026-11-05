import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

test.each([
  ['production', undefined, undefined, ''],
  ['production', 'https://answers.example.com', undefined, 'https://answers.example.com'],
  ['development', undefined, undefined, '/docs-ai'],
  ['production', undefined, 'http://localhost:3100', '/docs-ai'],
  ['development', '', 'http://localhost:3100', ''],
])('AI endpoint for %s with URL %s and proxy %s', async (mode, url, proxy, expected) => {
  vi.stubEnv('NODE_ENV', mode);
  vi.stubEnv('DOCS_AI_API_URL', url);
  vi.stubEnv('DOCS_AI_PROXY_TARGET', proxy);
  const { default: config } = await import('../../docs.config');
  expect(config.ask?.endpoint).toBe(expected);
});
