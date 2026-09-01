import '@testing-library/jest-dom/vitest';
import React, { StrictMode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatbotProvider } from '../ChatbotProvider';
import { ChatbotHeadless } from '../ChatbotWidget';
import { useChatbot } from '../hooks/useChatbot';

const envelope = (data: unknown) => JSON.stringify({ statusCode: 200, message: 'ok', data });
const ok = (data: unknown) => ({ ok: true, status: 200, statusText: 'OK', text: async () => envelope(data) });

/** Stub the SDK endpoints; the chat reply can be held open to inspect mid-flight state. */
function stubApi({ holdReply = false } = {}) {
  let release!: (text: string) => void;
  const held = new Promise<string>((resolve) => { release = resolve; });
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url);
    if (u.includes('/sdk/config')) return ok({ agentId: 'a', agentName: 'Bot', ready: true, blockReason: null });
    if (u.includes('/sdk/chat-history')) return ok([]);
    return ok({ text: holdReply ? await held : 'AI reply', sessionId: 's1' });
  }));
  return { release: (text = 'AI reply') => release(text) };
}

function Conversation() {
  const { messages, isLoading, isReady, sendMessage } = useChatbot();
  return (
    <div>
      <span data-testid="ready">{String(isReady)}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <ul>
        {messages.map((m) => <li key={m.id}>{m.message.type}: {m.message.content}</li>)}
      </ul>
      <button onClick={() => void sendMessage('hello')}>send</button>
    </div>
  );
}

const renderChat = (ui = <Conversation />, wrapper: 'strict' | 'plain' = 'plain') => {
  const tree = <ChatbotProvider apiKey="k">{ui}</ChatbotProvider>;
  return render(wrapper === 'strict' ? <StrictMode>{tree}</StrictMode> : tree);
};

describe('useChatbot', () => {
  beforeEach(() => { localStorage.clear(); document.body.innerHTML = ''; });
  afterEach(() => vi.unstubAllGlobals());

  it('throws a helpful error outside a provider', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Conversation />)).toThrow(/ChatbotProvider/);
    quiet.mockRestore();
  });

  it('becomes ready once init resolves', async () => {
    stubApi();
    renderChat();
    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
  });

  // The bug this package shipped with: the optimistic message and the loading
  // flip emitted no event, so React rendered nothing until the reply arrived.
  it('shows the user message and the spinner before the reply arrives', async () => {
    const { release } = stubApi({ holdReply: true });
    renderChat();
    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));

    await act(async () => { screen.getByText('send').click(); });

    expect(screen.getByText('human: hello')).toBeTruthy();
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.queryByText(/^ai:/)).toBeNull();

    await act(async () => { release(); });
    await waitFor(() => expect(screen.getByText('ai: AI reply')).toBeTruthy());
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('keeps working through a StrictMode double mount', async () => {
    const { release } = stubApi({ holdReply: true });
    renderChat(<Conversation />, 'strict');
    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));

    await act(async () => { screen.getByText('send').click(); });
    expect(screen.getByText('human: hello')).toBeTruthy();

    await act(async () => { release(); });
    await waitFor(() => expect(screen.getByText('ai: AI reply')).toBeTruthy());
  });

  it('mounts exactly one widget under StrictMode', async () => {
    stubApi();
    renderChat(<Conversation />, 'strict');
    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    expect(document.querySelectorAll('#onedeskpro-chatbot-host')).toHaveLength(1);
  });

  it('removes the widget when the provider unmounts', async () => {
    stubApi();
    const { unmount } = renderChat();
    await waitFor(() => expect(document.querySelectorAll('#onedeskpro-chatbot-host')).toHaveLength(1));
    unmount();
    expect(document.querySelectorAll('#onedeskpro-chatbot-host')).toHaveLength(0);
  });

  it('surfaces a send failure without leaving the UI stuck loading', async () => {
    stubApi();
    function WithError() {
      const { error, isLoading, sendMessage } = useChatbot();
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="error">{error ?? ''}</span>
          <button onClick={() => void sendMessage('hi')}>send</button>
        </div>
      );
    }
    renderChat(<WithError />);
    await waitFor(() => expect(document.querySelectorAll('#onedeskpro-chatbot-host')).toHaveLength(1));

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, statusText: 'Server Error', text: async () => 'boom' })));
    await act(async () => { screen.getByText('send').click(); });

    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('500'));
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});

describe('ChatbotHeadless', () => {
  beforeEach(() => { localStorage.clear(); document.body.innerHTML = ''; });
  afterEach(() => vi.unstubAllGlobals());

  it('drives custom UI through render props', async () => {
    const { release } = stubApi({ holdReply: true });
    render(
      <ChatbotProvider apiKey="k">
        <ChatbotHeadless
          renderLauncher={({ toggle }) => <button onClick={toggle}>launch</button>}
          renderWindow={({ messages, isLoading, sendMessage }) => (
            <div>
              <span data-testid="count">{messages.length}</span>
              <span data-testid="loading">{String(isLoading)}</span>
              <button onClick={() => void sendMessage('from headless')}>go</button>
            </div>
          )}
        />
      </ChatbotProvider>,
    );

    expect(screen.getByText('launch')).toBeTruthy();
    await waitFor(() => expect(document.querySelectorAll('#onedeskpro-chatbot-host')).toHaveLength(1));

    await act(async () => { screen.getByText('go').click(); });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await act(async () => { release(); });
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
  });
});
