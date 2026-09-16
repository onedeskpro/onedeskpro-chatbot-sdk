import type {
  ChatbotEventMap,
  ChatbotInitOptions,
  ChatbotState,
  ChatMessage,
  IdentifyRequest,
  SdkConfigResponse,
} from '@onedeskpro/chatbot-types';
import { ApiClient, DEFAULT_REQUEST_TIMEOUT_MS, isChatbotRequestError } from './api-client';
import { DEFAULT_API_BASE_URL } from './constants';
import { EventEmitter } from './event-emitter';
import { VisitorTokenManager } from './session-manager';
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
  private visitorTokens = new VisitorTokenManager();
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
    needsIdentify: true,
    blockReason: null,
    messages: [],
    visitorToken: null,
    visitorName: null,
    error: null,
    mode: 'ai',
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

    this.setState({
      visitorToken: null,
      visitorName: null,
      needsIdentify: true,
      messages: [],
      error: null,
    });

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.widget = new ChatWidget(this.options, {
        onSend: (text) => void this.sendMessage(text),
        onIdentify: (payload) => void this.submitIdentify(payload),
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

    let config: SdkConfigResponse | null = null;
    let configError: unknown = null;
    try {
      config = await this.apiClient.fetchConfig();
    } catch (error) {
      configError = error;
    }
    if (token !== this.initToken) return;

    if (configError) {
      this.handleConfigError(configError);
      this.emitter.emit('ready');
      return;
    }

    if (!config) {
      this.emitter.emit('ready');
      return;
    }

    if (!this.callerSetName && config.agentName.trim()) {
      this.options.chatbotName = config.agentName;
    }
    const blockReason = config.blockReason ?? null;
    this.setState({ blockReason, isReady: blockReason === null, error: null });

    if (blockReason) {
      this.widget?.showBlocked(blockReason);
    } else {
      this.visitorTokens.setScope(config.agentId);
      await this.resolveVisitorGate(token);
      if (token !== this.initToken) return;
    }

    this.emitter.emit('ready');
  }

  /**
   * Maps `/sdk/config` failures: missing Connected Channels becomes `no-agent`,
   * other 403s show the API message, and 401/network stay as `state.error`.
   */
  private handleConfigError(error: unknown): void {
    const requestError = isChatbotRequestError(error) ? error : null;
    const message =
      requestError?.apiError.message ??
      (error instanceof Error ? error.message : 'Failed to load chatbot config.');
    const code = requestError?.apiError.code;
    const status = requestError?.status;

    if (code === 'agent_not_assigned') {
      this.setState({ isReady: false, blockReason: 'no-agent', error: message });
      this.widget?.showBlocked('no-agent');
      return;
    }

    if (status === 403) {
      this.setState({ isReady: false, blockReason: null, error: message });
      this.widget?.showBlocked(null, message);
      return;
    }

    this.setState({ isReady: false, blockReason: null, error: message });
  }

  private async resolveVisitorGate(token: number): Promise<void> {
    const stored = this.visitorTokens.get();
    if (stored) {
      try {
        const result = await this.apiClient.verifyVisitor(stored);
        if (token !== this.initToken) return;
        if (result.valid) {
          this.enterChat(stored, result.name);
          return;
        }
      } catch {
        // Treat verify failure as unknown visitor.
      }
      this.visitorTokens.clear();
    }

    this.setState({ needsIdentify: true, visitorToken: null, visitorName: null });
    this.widget?.showIdentifyForm(this.options);
  }

  private enterChat(visitorToken: string, visitorName: string | null): void {
    this.visitorTokens.set(visitorToken);
    this.setState({
      visitorToken,
      visitorName,
      needsIdentify: false,
      messages: [],
      error: null,
    });
    this.widget?.readyToChat(this.options);
  }

  async submitIdentify(payload: IdentifyRequest): Promise<void> {
    if (!this.apiClient || this._state.isLoading || !this._state.isReady) return;

    const name = payload.name.trim();
    const phone = payload.phone.trim();
    if (!name || !phone) return;

    this.setState({ isLoading: true, error: null });
    this.widget?.setIdentifyLoading(true);

    try {
      const response = await this.apiClient.identify({
        name,
        phone,
        ...(payload.email?.trim() ? { email: payload.email.trim() } : {}),
      });
      this.enterChat(response.visitorToken, name);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.setState({ error: error.message });
      this.widget?.showIdentifyError(error.message);
      this.emitter.emit('error', error);
    } finally {
      this.setState({ isLoading: false });
      this.widget?.setIdentifyLoading(false);
    }
  }

  async sendMessage(text: string): Promise<void> {
    const visitorToken = this.visitorTokens.get() ?? this._state.visitorToken;
    if (!this.apiClient || !visitorToken) {
      throw new Error('[onedeskpro-chatbot] Identify before sendMessage().');
    }

    const content = text.trim();
    if (!content || this._state.isLoading || this._state.needsIdentify) return;

    const optimistic: ChatMessage = {
      id: localMessageId(),
      sessionId: visitorToken,
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
      const response = await this.apiClient.sendMessage({
        chatInput: content,
        visitorToken,
      });

      const aiMsg: ChatMessage = {
        id: localMessageId(),
        sessionId: response.sessionId,
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

  on<K extends keyof ChatbotEventMap>(event: K, listener: Listener<K>): () => void {
    return this.emitter.on(event, listener);
  }

  resetSession(): void {
    if (!this._state.isReady || this._state.needsIdentify) return;
    this.setState({ messages: [], error: null });
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
    this.setState({ isOpen: false, isLoading: false, isReady: false, needsIdentify: true });
  }
}
