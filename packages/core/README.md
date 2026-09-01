# @onedeskpro/chatbot-core

Framework-independent core for the [Onedesk Pro](https://onedeskpro.com) chatbot. Ships the chat engine, the session manager, the API client, and a self-contained widget you can drop into any page — no framework required.

Using React? Install [`@onedeskpro/chatbot-react`](https://www.npmjs.com/package/@onedeskpro/chatbot-react) instead.

## Install

```bash
npm install @onedeskpro/chatbot-core
```

## Usage

```ts
import { ChatbotCore } from '@onedeskpro/chatbot-core';

const chatbot = new ChatbotCore();

await chatbot.init({
  apiKey: 'your-onedesk-pro-api-key',
  chatbotName: 'Support',
  primaryColor: '#4f46e5',
  theme: 'auto',            // 'light' | 'dark' | 'auto'
  position: 'bottom-right', // 'bottom-right' | 'bottom-left'
  welcomeMessage: 'Hi! How can we help?',
  autoOpen: false,
});
```

`init` mounts the widget and connects to the Onedesk Pro API. Only `apiKey` is required.

### Script tag / CDN

The IIFE build exposes a `window.OnedeskProChatbot` global:

```html
<script src="https://unpkg.com/@onedeskpro/chatbot-core"></script>
<script>
  OnedeskProChatbot.init({ apiKey: 'your-onedesk-pro-api-key' });
</script>
```

`OnedeskProChatbot.getInstance()` returns the `ChatbotCore` created by `init`, or `null`.

## API

### `ChatbotCore`

| Method | Description |
| --- | --- |
| `init(options)` | Mounts the widget and loads remote config. Returns a promise. |
| `sendMessage(text)` | Sends a message and appends the reply. Returns a promise. |
| `open()` / `close()` / `toggle()` | Control widget visibility. |
| `resetSession()` | Clears the conversation and starts a new session. |
| `getState()` | Returns a readonly `ChatbotState` snapshot. |
| `on(event, listener)` | Subscribes to an event. Returns an unsubscribe function. |
| `destroy()` | Unmounts the widget and releases listeners. |

### Options — `ChatbotInitOptions`

| Option | Type | Default |
| --- | --- | --- |
| `apiKey` | `string` | **required** |
| `apiBaseUrl` | `string` | `https://api.onedeskpro.com` |
| `chatbotName` | `string` | from remote config |
| `primaryColor` | `string` | theme default |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` |
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` |
| `welcomeMessage` | `string` | — |
| `placeholder` | `string` | — |
| `autoOpen` | `boolean` | `false` |
| `sessionId` | `string` | generated and persisted |
| `requestTimeoutMs` | `number` | `30000` |

### Events — `ChatbotEventMap`

| Event | Payload | Fires when |
| --- | --- | --- |
| `message` | `ChatMessage` | A message is added — human and AI alike. |
| `state-change` | `ChatbotState` | Any state changes, including `isLoading` while a reply is in flight. |
| `ready` | — | Init finished and readiness has been checked. |
| `open` / `close` | — | The panel is shown or hidden. |
| `error` | `Error` | A send failed, including on timeout. |
| `session-reset` | — | The conversation was cleared. |

Prefer `state-change` when you are mirroring state into your own UI — it is the only event that covers every transition.

```ts
const off = chatbot.on('message', (msg) => console.log(msg.message.content));
off(); // unsubscribe
```

## Also exported

`ApiClient`, `EventEmitter`, `SessionManager`, `DEFAULT_API_BASE_URL`, `DEFAULT_REQUEST_TIMEOUT_MS`, the `ChatbotRequestError` type, and every type from `@onedeskpro/chatbot-types`.

## Notes

Requests abort after `requestTimeoutMs` (30s by default) and surface as an `error` event with `code: 'TIMEOUT'`, so a hung network never leaves the widget stuck. Errors thrown by the client carry `status` and a structured `apiError`.

Session ids persist in `localStorage` where it is available and fall back to in-memory when it is not — private browsing, blocked site data, or a sandboxed iframe.

## License

MIT © Typetech IT
