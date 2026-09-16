import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatbotCore } from '../chatbot-core';
import type { ChatbotState, ChatMessage } from '@onedeskpro/chatbot-types';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    connected: false,
  })),
}));

const envelope = (data: unknown) => JSON.stringify({ statusCode: 200, message: 'ok', data });
const VISITOR_TOKEN = 'sv_test_token';

interface RouteOverrides {
  config?: unknown;
  visitor?: unknown;
  identify?: unknown;
  chat?: unknown;
  ticketStatus?: unknown;
  humanRequest?: unknown;
  chatDelayMs?: number;
}

function stubApi(overrides: RouteOverrides = {}) {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    const u = String(url);
    if (u.includes('/sdk/config')) {
      return { ok: true, status: 200, statusText: 'OK',
        text: async () => envelope(overrides.config ?? { agentId: 'a', agentName: 'Remote Bot', ready: true, blockReason: null }) };
    }
    if (u.includes('/sdk/visitor')) {
      return { ok: true, status: 200, statusText: 'OK',
        text: async () => envelope(overrides.visitor ?? { valid: true, name: 'Remo' }) };
    }
    if (u.includes('/sdk/identify')) {
      return { ok: true, status: 200, statusText: 'OK',
        text: async () => envelope(overrides.identify ?? { visitorToken: VISITOR_TOKEN }) };
    }
    if (u.includes('/sdk/ticket-status')) {
      return { ok: true, status: 200, statusText: 'OK',
        text: async () => envelope(overrides.ticketStatus ?? { mode: 'ai' }) };
    }
    if (u.includes('/sdk/human-request')) {
      return { ok: true, status: 200, statusText: 'OK',
        text: async () => envelope(overrides.humanRequest ?? { mode: 'waiting' }) };
    }
    if (overrides.chatDelayMs) await new Promise((r) => setTimeout(r, overrides.chatDelayMs));
    return { ok: true, status: 200, statusText: 'OK',
      text: async () => envelope(overrides.chat ?? { text: 'AI reply', sessionId: 's1', mode: 'ai' }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Seed a verified visitor so init opens chat instead of the identify form. */
function seedVisitor(): void {
  localStorage.setItem('onedeskpro_visitor_token:a', VISITOR_TOKEN);
}

const hostCount = () => document.querySelectorAll('#onedeskpro-chatbot-host').length;

// The widget mounts into a *closed* shadow root, so its content is unreachable
// from the document. attachShadow still returns the root, so capture it there
// rather than weakening the widget to 'open' just for the tests.
const attachShadow = Element.prototype.attachShadow;
let shadowRoots: ShadowRoot[] = [];

/** Text of every widget currently attached to the document. */
const widgetText = () =>
  shadowRoots
    .filter((root) => document.contains(root.host))
    .map((root) => root.textContent ?? '')
    .join(' ');

describe('ChatbotCore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    shadowRoots = [];
    Element.prototype.attachShadow = function (init: ShadowRootInit) {
      const root = attachShadow.call(this, init);
      shadowRoots.push(root);
      return root;
    };
  });
  afterEach(() => {
    Element.prototype.attachShadow = attachShadow;
    vi.unstubAllGlobals();
  });

  describe('init', () => {
    it('requires an apiKey', async () => {
      stubApi();
      await expect(new ChatbotCore().init({ apiKey: '' })).rejects.toThrow(/apiKey/);
    });

    it('mounts the widget and becomes ready with identify form when no token', async () => {
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      expect(hostCount()).toBe(1);
      expect(c.getState().isReady).toBe(true);
      expect(c.getState().needsIdentify).toBe(true);
      expect(widgetText()).toContain('Start Chatting');
    });

    it('skips identify when a stored visitor token verifies', async () => {
      seedVisitor();
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      expect(c.getState().needsIdentify).toBe(false);
      expect(c.getState().visitorToken).toBe(VISITOR_TOKEN);
    });

    it('adopts the agent name from remote config unless the caller set one', async () => {
      stubApi();
      const auto = new ChatbotCore();
      await auto.init({ apiKey: 'k' });
      expect(widgetText()).toContain('Remote Bot');

      auto.destroy();
      const explicit = new ChatbotCore();
      await explicit.init({ apiKey: 'k', chatbotName: 'My Bot' });
      expect(widgetText()).toContain('My Bot');
      expect(widgetText()).not.toContain('Remote Bot');
    });

    it('reports a blocked agent instead of becoming ready', async () => {
      stubApi({ config: { agentId: 'a', agentName: 'B', ready: false, blockReason: 'no-prompt' } });
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      expect(c.getState().isReady).toBe(false);
      expect(c.getState().blockReason).toBe('no-prompt');
    });

    it('stays unready when the config request fails', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      expect(c.getState().isReady).toBe(false);
      expect(c.getState().blockReason).toBeNull();
      expect(c.getState().error).toBe('offline');
    });

    it('does not load chat history into state', async () => {
      seedVisitor();
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      expect(c.getState().messages).toHaveLength(0);
    });

    // Spreading optional config through is routine: apiBaseUrl={process.env.X}
    // with X unset must not defeat the default.
    it('ignores options explicitly passed as undefined', async () => {
      stubApi();
      const c = new ChatbotCore();
      await expect(c.init({ apiKey: 'k', apiBaseUrl: undefined, theme: undefined })).resolves.not.toThrow();
      expect(c.getState().isReady).toBe(true);
    });
  });

  describe('submitIdentify', () => {
    it('stores the visitor token and opens chat', async () => {
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      await c.submitIdentify({ name: 'Remo', phone: '+8801744716387' });
      expect(c.getState().needsIdentify).toBe(false);
      expect(c.getState().visitorToken).toBe(VISITOR_TOKEN);
      expect(c.getState().visitorName).toBe('Remo');
    });
  });

  describe('sendMessage', () => {
    it('refuses to run before identify', async () => {
      stubApi();
      await expect(new ChatbotCore().sendMessage('hi')).rejects.toThrow(/Identify/);
    });

    // The optimistic message and the isLoading flip had no event, so a React
    // consumer saw nothing at all until the reply arrived.
    it('announces the user message and the loading state before the reply lands', async () => {
      seedVisitor();
      stubApi({ chatDelayMs: 20 });
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });

      const seen: ChatbotState[] = [];
      c.on('state-change', (s) => seen.push(s));

      const pending = c.sendMessage('hello');
      expect(seen).toHaveLength(1);
      expect(seen[0].messages.map((m) => m.message.content)).toEqual(['hello']);
      expect(seen[0].isLoading).toBe(true);

      await pending;
      const last = seen[seen.length - 1];
      expect(last.isLoading).toBe(false);
      expect(last.messages.map((m) => m.message.type)).toEqual(['human', 'ai']);
    });

    it('emits a message event for both the human and the AI message', async () => {
      seedVisitor();
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      const messages: ChatMessage[] = [];
      c.on('message', (m) => messages.push(m));
      await c.sendMessage('hello');
      expect(messages.map((m) => m.message.type)).toEqual(['human', 'ai']);
    });

    it('gives every message a distinct id even within the same millisecond', async () => {
      seedVisitor();
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      await c.sendMessage('one');
      await c.sendMessage('two');
      const ids = c.getState().messages.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('ignores blank input and trims what it sends', async () => {
      seedVisitor();
      const fetchMock = stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      await c.sendMessage('   ');
      expect(c.getState().messages).toHaveLength(0);
      await c.sendMessage('  padded  ');
      expect(c.getState().messages[0].message.content).toBe('padded');
      const chatCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/sdk/chat'))!;
      const body = JSON.parse(chatCall[1]!.body as string);
      expect(body.chatInput).toBe('padded');
      expect(body.visitorToken).toBe(VISITOR_TOKEN);
    });

    it('records the failure and releases the loading state', async () => {
      seedVisitor();
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: false, status: 500, statusText: 'Server Error', text: async () => 'boom',
      })));
      const errors: Error[] = [];
      c.on('error', (e) => errors.push(e));
      await c.sendMessage('hi');
      expect(errors).toHaveLength(1);
      expect(c.getState().isLoading).toBe(false);
      expect(c.getState().error).toContain('500');
    });

    it('recovers and can send again after a timeout', async () => {
      seedVisitor();
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k', requestTimeoutMs: 30 });
      vi.stubGlobal('fetch', vi.fn((_u: string, init: RequestInit) =>
        new Promise((_res, rej) => init.signal?.addEventListener('abort', () =>
          rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))))));
      await c.sendMessage('hangs');
      expect(c.getState().isLoading).toBe(false);
      expect(c.getState().error).toMatch(/timed out/i);

      stubApi();
      await c.sendMessage('works');
      expect(c.getState().messages.some((m) => m.message.content === 'AI reply')).toBe(true);
    });
  });

  describe('state snapshots', () => {
    it('does not mutate a snapshot taken earlier', async () => {
      seedVisitor();
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      const before = c.getState();
      await c.sendMessage('hi');
      expect(before.messages).toHaveLength(0);
      expect(before.messages).not.toBe(c.getState().messages);
    });
  });

  describe('resetSession', () => {
    it('only clears when closed, then returns to ai while keeping the visitor token', async () => {
      seedVisitor();
      stubApi({ chat: { text: 'done', sessionId: 's1', mode: 'closed' } });
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      await c.sendMessage('hi');
      expect(c.getState().mode).toBe('closed');
      const first = c.getState().visitorToken;
      let announced = false;
      c.on('session-reset', () => { announced = true; });

      c.resetSession();
      expect(c.getState().messages).toHaveLength(0);
      expect(c.getState().mode).toBe('ai');
      expect(c.getState().visitorToken).toBe(first);
      expect(announced).toBe(true);
    });

    it('is a no-op while the episode is still open', async () => {
      seedVisitor();
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      await c.sendMessage('hi');
      let announced = false;
      c.on('session-reset', () => { announced = true; });
      c.resetSession();
      expect(c.getState().messages.length).toBeGreaterThan(0);
      expect(announced).toBe(false);
    });
  });

  describe('requestHuman', () => {
    it('escalates from ai to waiting and emits events', async () => {
      seedVisitor();
      stubApi({
        ticketStatus: { mode: 'ai', conversationId: 'c1' },
        humanRequest: { mode: 'waiting', conversationId: 'c1' },
      });
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      const statuses: Array<{ mode: string }> = [];
      let requested = false;
      c.on('human-requested', () => { requested = true; });
      c.on('ticket-status', (s) => statuses.push(s));
      await c.requestHuman();
      expect(c.getState().mode).toBe('waiting');
      expect(requested).toBe(true);
      expect(statuses.some((s) => s.mode === 'waiting')).toBe(true);
    });

    it('does nothing when not in ai mode', async () => {
      seedVisitor();
      stubApi({
        ticketStatus: { mode: 'waiting', conversationId: 'c1' },
        humanRequest: { mode: 'human' },
      });
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      expect(c.getState().mode).toBe('waiting');
      await c.requestHuman();
      expect(c.getState().mode).toBe('waiting');
    });

    it('does nothing before a ticket exists', async () => {
      seedVisitor();
      stubApi({
        ticketStatus: { mode: 'ai' },
        humanRequest: { mode: 'waiting', conversationId: 'c1' },
      });
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      let requested = false;
      c.on('human-requested', () => { requested = true; });
      await c.requestHuman();
      expect(c.getState().mode).toBe('ai');
      expect(requested).toBe(false);
    });
  });

  describe('sendMessage modes', () => {
    it('refuses to send when the conversation is closed', async () => {
      seedVisitor();
      stubApi({ ticketStatus: { mode: 'closed' } });
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      await c.sendMessage('hi');
      expect(c.getState().messages).toHaveLength(0);
      expect(c.getState().error).toMatch(/closed/i);
    });

    it('does not append an empty AI bubble while waiting', async () => {
      seedVisitor();
      stubApi({
        ticketStatus: { mode: 'waiting' },
        chat: { text: '', sessionId: 's1', mode: 'waiting' },
      });
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      await c.sendMessage('still here');
      expect(c.getState().messages.map((m) => m.message.type)).toEqual(['human']);
      expect(c.getState().mode).toBe('waiting');
    });
  });

  describe('lifecycle', () => {
    it('removes the widget on destroy', async () => {
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      c.destroy();
      expect(hostCount()).toBe(0);
    });

    // destroy() used to call removeAllListeners(), silently killing subscriptions
    // owned by other components — every useChatbot() in the tree.
    it('keeps subscriptions that other code owns', async () => {
      stubApi();
      const c = new ChatbotCore();
      await c.init({ apiKey: 'k' });
      let seen = 0;
      c.on('state-change', () => { seen += 1; });
      c.destroy();
      c.open();
      expect(seen).toBeGreaterThan(0);
    });
  });

  describe('superseded init', () => {
    it('ignores a late visitor verify from a destroyed init', async () => {
      let release!: (value: unknown) => void;
      const held = new Promise((resolve) => { release = resolve; });
      let visitorCalls = 0;
      const ok = (data: unknown) => ({
        ok: true, status: 200, statusText: 'OK', text: async () => envelope(data),
      });
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        const u = String(url);
        if (u.includes('/sdk/config')) {
          return ok({ agentId: 'a', agentName: 'Bot', ready: true, blockReason: null });
        }
        if (u.includes('/sdk/visitor')) {
          visitorCalls += 1;
          return ok(visitorCalls === 1 ? await held : { valid: false, name: null });
        }
        if (u.includes('/sdk/ticket-status')) {
          return ok({ mode: 'ai' });
        }
        return ok({ text: 'r', sessionId: 's', mode: 'ai' });
      }));

      localStorage.setItem('onedeskpro_visitor_token:a', VISITOR_TOKEN);
      const first = new ChatbotCore();
      const firstInit = first.init({ apiKey: 'k' });
      first.destroy();

      localStorage.clear();
      const second = new ChatbotCore();
      await second.init({ apiKey: 'k' });
      release({ valid: true, name: 'Stale' });
      await firstInit;

      expect(second.getState().needsIdentify).toBe(true);
      expect(second.getState().visitorToken).toBeNull();
    });
  });
});
