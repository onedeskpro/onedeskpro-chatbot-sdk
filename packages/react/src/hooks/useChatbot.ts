'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChatbotBlockReason, ChatMessage, ChatbotState } from '@onedeskpro/chatbot-types';
import { useChatbotContext } from '../context';

export interface UseChatbotReturn {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  isReady: boolean;
  blockReason: ChatbotBlockReason;
  error: string | null;
  sessionId: string | null;
  sendMessage: (text: string) => Promise<void>;
  open: () => void;
  close: () => void;
  toggle: () => void;
  resetSession: () => void;
}

export function useChatbot(): UseChatbotReturn {
  const instance = useChatbotContext();

  const [state, setState] = useState<ChatbotState>(() => instance.getState());

  useEffect(() => {
    // `state-change` fires for every state transition, so one subscription keeps
    // React in sync with all of them — including the optimistic user message and
    // the `isLoading` flip, which have no event of their own.
    const off = instance.on('state-change', (next) => setState({ ...next }));

    // The instance may have moved on between the useState initialiser and this
    // effect (init() is async), so re-read once on subscribe.
    setState({ ...instance.getState() });

    return off;
  }, [instance]);

  const sendMessage = useCallback(
    (text: string) => instance.sendMessage(text),
    [instance],
  );
  const open = useCallback(() => instance.open(), [instance]);
  const close = useCallback(() => instance.close(), [instance]);
  const toggle = useCallback(() => instance.toggle(), [instance]);
  const resetSession = useCallback(() => instance.resetSession(), [instance]);

  return {
    messages: state.messages,
    isOpen: state.isOpen,
    isLoading: state.isLoading,
    isReady: state.isReady,
    blockReason: state.blockReason,
    error: state.error,
    sessionId: state.sessionId,
    sendMessage,
    open,
    close,
    toggle,
    resetSession,
  };
}
