import type {
  ChatbotEventMap,
  ChatbotInitOptions,
  ChatbotState,
  ChatMessage,
  SdkConfigResponse,
} from '@onedeskpro/chatbot-types';
import { ApiClient, DEFAULT_REQUEST_TIMEOUT_MS } from './api-client';
import { DEFAULT_API_BASE_URL } from './constants';
import { EventEmitter } from './event-emitter';
import { SessionManager } from './session-manager';
import { ChatWidget } from './widget/widget';

type Listener<K extends keyof ChatbotEventMap> =
  ChatbotEventMap[K] extends void ? () => void : (payload: ChatbotEventMap[K]) => void;

const DEFAULTS = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  chatbotName: 'AI Assistant',
  primaryColor: '#2563EB',
  theme: 'auto' as const,
  position: 'bottom-right' as const,
  welcomeMessage: '',
  placeholder: 'Type your message…',
  autoOpen: false,
  sessionId: '',
  requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
};

/**
 * Drop keys whose value is `undefined` so they cannot overwrite a default.
 * Callers routinely spread optional config through — `apiBaseUrl={process.env.X}`
 * with X unset would otherwise land as an explicit `undefined`.
 */
function definedOnly(options: ChatbotInitOptions): Partial<ChatbotInitOptions> {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as Partial<ChatbotInitOptions>;
}

/** Monotonic ids for locally-created messages — `Date.now()` collides within a tick. */
let nextLocalId = 0;
const localMessageId = (): number => Date.now() * 1000 + (nextLocalId++ % 1000);

export class ChatbotCore {
  private apiClient!: ApiClient;
  private emitter = new EventEmitter();
  private session = new SessionManager();
  private widget: ChatWidget | null = null;
  private options!: Required<ChatbotInitOptions>;
  private callerSetName = false;
  /**
   * Bumped by every init() and by destroy(). An async init compares the token it
   * started with against this before touching anything, so a superseded run — a
   * React StrictMode remount, or a caller re-initialising — quietly stands down
   * instead of racing the live one.
   */
  private initToken = 0;

  private _state: ChatbotState = {
    isOpen: false,
    isLoading: false,
    isReady: false,
    blockReason: null,
    messages: [],
    sessionId: null,
    error: null,
  };

  /**
   * The single place state is written. Replaces `_state` rather than mutating it
   * and announces the change, so subscribers (React especially) stay in sync with
   * everything — not just the transitions that have a dedicated event.
   */
  private setState(patch: Partial<ChatbotState>): void {
    this._state = { ...this._state, ...patch };
    this.emitter.emit('state-change', this._state);
  }

  async init(options: ChatbotInitOptions): Promise<void> {
    if (!options.apiKey) {
      throw new Error('[onedeskpro-chatbot] `apiKey` is required to initialise the chatbot.');
    }

    const token = ++this.initToken;

    // Re-initialising must not orphan the previous widget in the DOM.
    this.widget?.destroy();
    this.widget = null;

    this.callerSetName = options.chatbotName !== undefined;
    this.options = { ...DEFAULTS, ...definedOnly(options) } as Required<ChatbotInitOptions>;

    this.apiClient = new ApiClient({
      baseUrl: this.options.apiBaseUrl,
      apiKey: this.options.apiKey,
      timeoutMs: this.options.requestTimeoutMs,
    });

    const sessionId = this.session.init(this.options.sessionId || undefined);
    this.setState({ sessionId });

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.widget = new ChatWidget(this.options, {
        onSend: (text) => void this.sendMessage(text),
        onOpen: () => {
          this.setState({ isOpen: true });
          this.emitter.emit('open');
        },
        onClose: () => {
          this.setState({ isOpen: false });
          this.emitter.emit('close');
        },
        onReset: () => this.resetSession(),
      });
    }

    const config = await this.fetchConfig();
    if (token !== this.initToken) return;

    if (config && !this.callerSetName && config.agentName.trim()) {
      this.options.chatbotName = config.agentName;
    }
    const blockReason = config?.blockReason ?? null;
    this.setState({ blockReason, isReady: blockReason === null });

    if (blockReason) {
      this.widget?.showBlocked(blockReason);
    } else {
      this.widget?.readyToChat(this.options);
      await this.loadHistory(token);
      if (token !== this.initToken) return;
    }

    this.emitter.emit('ready');
  }

  /** Returns null on failure — a network blip must not block the user from trying. */
  private async fetchConfig(): Promise<SdkConfigResponse | null> {
    try {
      return await this.apiClient.fetchConfig();
    } catch {
      return null;
    }
  }

  async sendMessage(text: string): Promise<void> {
    const sessionId = this.session.get();
    if (!this.apiClient || !sessionId) {
      throw new Error('[onedeskpro-chatbot] Call init() before sendMessage().');
    }

    const content = text.trim();
    if (!content || this._state.isLoading) return;

    const optimistic: ChatMessage = {
      id: localMessageId(),
      sessionId,
      message: { type: 'human', content },
    };
    this.setState({
      messages: [...this._state.messages, optimistic],
      isLoading: true,
      error: null,
    });
    this.widget?.appendMessage(optimistic);
    this.widget?.setLoading(true);
    this.emitter.emit('message', optimistic);

    try {
      const response = await this.apiClient.sendMessage({ chatInput: content, sessionId });

      const aiMsg: ChatMessage = {
        id: localMessageId(),
        sessionId,
        message: { type: 'ai', content: response.text },
      };
      this.setState({ messages: [...this._state.messages, aiMsg], isLoading: false });
      this.widget?.appendMessage(aiMsg);
      this.emitter.emit('message', aiMsg);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.setState({ error: error.message, isLoading: false });
      this.emitter.emit('error', error);
    } finally {
      // State already settled above; the widget still needs its spinner cleared
      // on both paths.
      this.widget?.setLoading(false);
    }
  }

  private async loadHistory(token: number): Promise<void> {
    const sessionId = this.session.get();
    if (!sessionId) return;
    try {
      const messages = await this.apiClient.fetchHistory(sessionId);
      if (token !== this.initToken) return;
      this.setState({ messages });
      if (messages.length > 0) this.widget?.setMessages(messages);
    } catch {
      // History load failure is non-fatal
    }
  }

  on<K extends keyof ChatbotEventMap>(event: K, listener: Listener<K>): () => void {
    return this.emitter.on(event, listener);
  }

  resetSession(): void {
    if (!this._state.isReady) return;
    const newId = this.session.reset();
    this.setState({ sessionId: newId, messages: [], error: null });
    this.widget?.clearMessages(this.options.chatbotName);
    this.emitter.emit('session-reset');
  }

  open(): void { this.widget?.open(); }
  close(): void { this.widget?.close(); }
  toggle(): void { this.widget?.toggle(); }

  getState(): Readonly<ChatbotState> {
    return { ...this._state };
  }

  /**
   * Unmounts the widget and cancels any in-flight init. Subscriptions are left
   * alone on purpose: they belong to whoever registered them, and tearing them
   * down here would silently kill listeners this instance does not own — every
   * useChatbot() in the tree, for one. They are released with the instance.
   */
  destroy(): void {
    this.initToken++;
    this.widget?.destroy();
    this.widget = null;
    this.setState({ isOpen: false, isLoading: false, isReady: false });
  }
}
