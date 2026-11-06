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

test.each([undefined, 'nocobase-v3'])('passes configured site ID %s', async siteId => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('DOCS_AI_SITE_ID', siteId);
  const { default: config } = await import('../../docs.config');
  expect(config.ask?.siteId).toBe(siteId);
});

test('local development selects the local NocoBase 3 site', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('DOCS_AI_SITE_ID', undefined);
  const { default: config } = await import('../../docs.config');
  expect(config.ask?.siteId).toBe('nocobase-v3');
});
