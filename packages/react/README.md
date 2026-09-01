# @onedeskpro/chatbot-react

React SDK for the [Onedesk Pro](https://onedeskpro.com) chatbot. Wraps [`@onedeskpro/chatbot-core`](https://www.npmjs.com/package/@onedeskpro/chatbot-core) in a provider, a drop-in widget, and a `useChatbot` hook for fully custom UI.

## Install

```bash
npm install @onedeskpro/chatbot-react
```

Requires React 18 or later as a peer dependency.

## Usage

Wrap your app in `ChatbotProvider` and render `ChatbotWidget`:

```tsx
import { ChatbotProvider, ChatbotWidget } from '@onedeskpro/chatbot-react';

export default function App() {
  return (
    <ChatbotProvider apiKey="your-onedesk-pro-api-key" theme="auto">
      <YourApp />
      <ChatbotWidget />
    </ChatbotProvider>
  );
}
```

`ChatbotProvider` accepts every `ChatbotInitOptions` field as a prop — `apiKey`, `apiBaseUrl`, `chatbotName`, `primaryColor`, `theme`, `position`, `welcomeMessage`, `placeholder`, `autoOpen`, `sessionId`. Only `apiKey` is required.

The components are client-side; in Next.js App Router they carry `'use client'` already, so importing them from a server component is fine as long as the provider itself renders on the client.

## Custom UI

`useChatbot` gives you the whole conversation state and controls:

```tsx
import { useChatbot } from '@onedeskpro/chatbot-react';

function SupportPanel() {
  const { messages, isLoading, isReady, sendMessage, resetSession } = useChatbot();

  if (!isReady) return null;

  return (
    <div>
      {messages.map((m) => (
        <p key={m.id}>{m.message.content}</p>
      ))}
      <button onClick={() => sendMessage('Hello')} disabled={isLoading}>
        Send
      </button>
      <button onClick={resetSession}>New conversation</button>
    </div>
  );
}
```

`useChatbot` returns `messages`, `isOpen`, `isLoading`, `isReady`, `blockReason`, `error`, `sessionId`, `sendMessage`, `open`, `close`, `toggle`, and `resetSession`.

For custom chrome around the built-in behavior, `ChatbotHeadless` takes `renderLauncher` and `renderWindow` render props instead of shipping any markup of its own.

## Exports

`ChatbotProvider`, `ChatbotWidget`, `ChatbotHeadless`, `useChatbot`, `ChatbotContext`, plus the `ChatbotInitOptions`, `ChatbotState`, `ChatMessage`, and `ChatbotEventMap` types.

## License

MIT © Typetech IT
