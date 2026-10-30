import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GET, HEAD } from '../+server.js';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../../package.json', import.meta.url)), 'utf8')
);

describe('GET /health', () => {
  test('returns 200 with application/json and no-store', () => {
    const res = GET();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  test('body reports ok, the app version and a fresh ISO 8601 timestamp', async () => {
    const before = Date.now();
    const body = await GET().json();
    const after = Date.now();

    expect(body.status).toBe('ok');
    expect(body.version).toBe(pkg.version);
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    const ts = Date.parse(body.timestamp);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe('HEAD /health', () => {
  test('returns the same 200 no-store response as GET', () => {
    const res = HEAD();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
