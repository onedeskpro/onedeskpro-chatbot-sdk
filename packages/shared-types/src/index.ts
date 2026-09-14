// ─── Init Options ─────────────────────────────────────────────────────────────

export interface ChatbotInitOptions {
  apiKey: string;
  apiBaseUrl?: string;
  chatbotName?: string;
  primaryColor?: string;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
  placeholder?: string;
  autoOpen?: boolean;
  /** @deprecated Visitor tokens replace client session ids. Ignored when present. */
  sessionId?: string;
  /** Abort an API request that has not responded in this many ms. Defaults to 30000. */
  requestTimeoutMs?: number;
}

// ─── API Shapes ────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  code: string;
  timestamp: string;
  path: string;
}

export interface IdentifyRequest {
  name: string;
  phone: string;
  email?: string;
}

export interface IdentifyResponseData {
  visitorToken: string;
}

export interface VisitorVerifyResponse {
  valid: boolean;
  name: string | null;
}

export interface ChatRequest {
  chatInput: string;
  visitorToken: string;
}

export interface ChatResponseData {
  text: string;
  sessionId: string;
}

export interface ChatMessage {
  id: number;
  sessionId: string;
  message: {
    type: 'human' | 'ai';
    content: string;
  };
}

// ─── Readiness ────────────────────────────────────────────────────────────────

export type ChatbotBlockReason = 'no-prompt' | 'no-collections' | 'no-directories' | null;

export interface SdkConfigResponse {
  agentId: string;
  agentName: string;
  ready: boolean;
  blockReason: ChatbotBlockReason;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type ChatbotEventMap = {
  /** Fired for every message added to the conversation, human and AI alike. */
  message: ChatMessage;
  /**
   * Fired whenever any part of the state changes — including the ones no other
   * event covers, such as `isLoading` flipping while a reply is in flight.
   * Carries the new state so subscribers do not have to call `getState()`.
   */
  'state-change': ChatbotState;
  open: void;
  close: void;
  error: Error;
  'session-reset': void;
  ready: void;
};

// ─── State ────────────────────────────────────────────────────────────────────

export interface ChatbotState {
  isOpen: boolean;
  isLoading: boolean;
  isReady: boolean;
  needsIdentify: boolean;
  blockReason: ChatbotBlockReason;
  messages: ChatMessage[];
  visitorToken: string | null;
  visitorName: string | null;
  error: string | null;
}
