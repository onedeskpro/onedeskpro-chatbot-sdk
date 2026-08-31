import type {
  ApiError,
  ApiResponse,
  ChatMessage,
  ChatRequest,
  ChatResponseData,
  SdkConfigResponse,
} from '@onedeskpro/chatbot-types';

interface ApiClientOptions {
  baseUrl: string;
  apiKey: string;
}

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    const init: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url.toString(), init);
    const json = (await res.json()) as ApiResponse<T> | ApiError;

    if (!res.ok) {
      const err = json as ApiError;
      const error = Object.assign(new Error(err.message || 'Request failed'), { apiError: err });
      throw error;
    }

    return (json as ApiResponse<T>).data;
  }

  async sendMessage(payload: ChatRequest): Promise<ChatResponseData> {
    return this.request<ChatResponseData>('POST', '/sdk/chat', payload);
  }

  async fetchHistory(sessionId: string): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>('GET', '/sdk/chat-history', undefined, { sessionId });
  }

  async fetchConfig(): Promise<SdkConfigResponse> {
    return this.request<SdkConfigResponse>('GET', '/sdk/config');
  }
}
