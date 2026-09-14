import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../api-client';

const client = (timeoutMs?: number) =>
  new ApiClient({ baseUrl: 'https://api.example.com/', apiKey: 'secret', timeoutMs });

const respond = (init: {
  ok: boolean;
  status?: number;
  statusText?: string;
  body: string;
}) => vi.fn(async (_url: string, _init?: RequestInit) => ({
  ok: init.ok,
  status: init.status ?? (init.ok ? 200 : 500),
  statusText: init.statusText ?? '',
  text: async () => init.body,
}));

const envelope = (data: unknown) => JSON.stringify({ statusCode: 200, message: 'ok', data });
const chatPayload = { chatInput: 'x', visitorToken: 'sv_token' };

describe('ApiClient', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('unwraps the data envelope', async () => {
    vi.stubGlobal('fetch', respond({ ok: true, body: envelope({ text: 'hi', sessionId: 's' }) }));
    await expect(client().sendMessage(chatPayload)).resolves.toEqual({ text: 'hi', sessionId: 's' });
  });

  it('sends the api key and strips the trailing slash from the base url', async () => {
    const fetchMock = respond({ ok: true, body: envelope({}) });
    vi.stubGlobal('fetch', fetchMock);
    await client().fetchConfig();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.com/sdk/config');
    expect((init!.headers as Record<string, string>)['X-API-Key']).toBe('secret');
  });

  it('sends visitor token header on verify', async () => {
    const fetchMock = respond({ ok: true, body: envelope({ valid: true, name: 'Remo' }) });
    vi.stubGlobal('fetch', fetchMock);
    await client().verifyVisitor('sv_abc');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/sdk/visitor');
    expect((fetchMock.mock.calls[0][1]!.headers as Record<string, string>)['X-Visitor-Token']).toBe(
      'sv_abc',
    );
  });

  it('surfaces a structured API error verbatim', async () => {
    vi.stubGlobal('fetch', respond({
      ok: false, status: 401, statusText: 'Unauthorized',
      body: JSON.stringify({ statusCode: 401, message: 'Invalid API key', code: 'UNAUTHORIZED', timestamp: 't', path: '/sdk/chat' }),
    }));
    await expect(client().sendMessage(chatPayload)).rejects.toMatchObject({
      message: 'Invalid API key',
      status: 401,
      apiError: { code: 'UNAUTHORIZED' },
    });
  });

  // A gateway answers with HTML. Parsing before checking res.ok replaced the real
  // status with a JSON SyntaxError.
  it('reports the HTTP status when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', respond({ ok: false, status: 502, statusText: 'Bad Gateway', body: '<html>502</html>' }));
    const err = await client().sendMessage(chatPayload).catch((e) => e);
    expect(err.status).toBe(502);
    expect(err.apiError.code).toBe('HTTP_ERROR');
    expect(err.message).toContain('502');
    expect(err.message).not.toContain('JSON');
  });

  it('rejects an empty body rather than returning undefined data', async () => {
    vi.stubGlobal('fetch', respond({ ok: true, body: '' }));
    await expect(client().fetchConfig()).rejects.toMatchObject({ apiError: { code: 'BAD_RESPONSE' } });
  });

  it('reports network failures with a NETWORK_ERROR code', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string) => { throw new TypeError('Failed to fetch'); }));
    await expect(client().fetchConfig()).rejects.toMatchObject({ apiError: { code: 'NETWORK_ERROR' } });
  });

  // Without this the widget stays disabled forever on a hung connection.
  it('aborts a request that exceeds the timeout', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      })));
    const err = await client(50).sendMessage(chatPayload).catch((e) => e);
    expect(err.apiError.code).toBe('TIMEOUT');
    expect(err.message).toContain('timed out');
  });

  it('does not abort a request that completes in time', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string) => {
      await new Promise((r) => setTimeout(r, 10));
      return { ok: true, status: 200, statusText: 'OK', text: async () => envelope({ ok: true }) };
    }));
    await expect(client(500).fetchConfig()).resolves.toEqual({ ok: true });
  });
});
