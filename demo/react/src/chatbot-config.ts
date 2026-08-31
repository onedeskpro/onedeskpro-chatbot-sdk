import { DEFAULT_API_BASE_URL } from '@onedeskpro/chatbot-core';

export const CHATBOT_API_KEY = import.meta.env['VITE_CHATBOT_API_KEY'] ?? '';

/** Demo override via `.env.local`; falls back to the SDK default API origin. */
export const CHATBOT_API_BASE_URL =
  import.meta.env['VITE_CHATBOT_API_BASE_URL'] ?? DEFAULT_API_BASE_URL;
