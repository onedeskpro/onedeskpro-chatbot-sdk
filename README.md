# Onedesk Pro Chatbot SDK

Embeddable chatbot SDK for [Onedesk Pro](https://onedeskpro.com). A framework-independent core plus a React layer on top.

## Packages

| Package | Description |
| --- | --- |
| [`@onedeskpro/chatbot-core`](packages/core) | Chat engine, session manager, API client, and a self-contained widget. Works anywhere, including via script tag. |
| [`@onedeskpro/chatbot-react`](packages/react) | `ChatbotProvider`, `ChatbotWidget`, and the `useChatbot` hook. |
| [`@onedeskpro/chatbot-types`](packages/shared-types) | Shared TypeScript types. Types only, no runtime. |

## Quick start

React:

```bash
npm install @onedeskpro/chatbot-react
```

```tsx
import { ChatbotProvider, ChatbotWidget } from '@onedeskpro/chatbot-react';

<ChatbotProvider apiKey="your-onedesk-pro-api-key">
  <App />
  <ChatbotWidget />
</ChatbotProvider>;
```

Anything else:

```bash
npm install @onedeskpro/chatbot-core
```

```ts
import { ChatbotCore } from '@onedeskpro/chatbot-core';

const chatbot = new ChatbotCore();
await chatbot.init({ apiKey: 'your-onedesk-pro-api-key' });
```

See each package README for the full API.

## Development

```bash
pnpm install
pnpm build       # build all packages via turbo
pnpm dev         # rebuild on change
pnpm type-check
pnpm test        # vitest, jsdom environment
```

The React demo lives in [`demo/react`](demo/react).

### Tests

`packages/core` covers the session manager, the API client, the markdown renderer,
and the `ChatbotCore` lifecycle; `packages/react` drives the provider and the
`useChatbot` hook through React Testing Library. Both run under jsdom.

Two areas are worth keeping honest as the SDK grows:

- **The markdown renderer** writes AI output via `innerHTML`, so its suite asserts
  against a parsed DOM — no `on*` attributes, no live elements, no non-http
  schemes — rather than pattern-matching the HTML string.
- **`init()` is async at several points**, and each await is its own race. The
  supersession tests hold one request open so a superseded run is genuinely
  mid-flight when the live one starts; without that they pass vacuously.

## Releasing

Versions are kept in lockstep across the three packages. To cut a release:

```bash
pnpm release:version 0.2.0   # bump all three packages
pnpm build
pnpm release                 # publish to npm
```

`pnpm publish` rewrites the `workspace:*` dependencies to real version ranges, so publish with pnpm — not `npm publish`.

## License

MIT © Typetech IT
