# Task 5 Report — SDK types + ApiClient + socket.io-client

**Date:** 2026-09-16  
**Repo:** `onedesk-pro-chatbot-sdk`  
**Status:** Complete

## Summary

Added ticket-mode shared types, `ApiClient.requestHuman` / `fetchTicketStatus`, and an `SdkSocket` helper for the `/sdk` Socket.IO namespace. ChatbotCore mode machine and widget UI were intentionally left for Tasks 6–7 (only `mode: 'ai'` default on state + agent message type widen for compile safety).

## Changes

| Area | Files |
|------|--------|
| Types | `packages/shared-types/src/index.ts` — `ChatbotTicketMode`, `TicketStatusData`, `ChatResponseData.mode`, `ChatMessage` `agent` type, `ChatbotState.mode`, events `human-requested` / `ticket-status` |
| Dep | `packages/core/package.json` + lockfile — `socket.io-client@^4.8.1` |
| HTTP | `packages/core/src/api-client.ts` — `requestHuman`, `fetchTicketStatus` |
| Socket | `packages/core/src/sdk-socket.ts` — `SdkSocket`, `resolveSdkSocketUrl` |
| Exports | `packages/core/src/index.ts`, `packages/react/src/index.ts` |
| Compile glue | `chatbot-core.ts` default `mode: 'ai'`; widget `buildMessageEl` accepts `agent` (renders as AI until Task 7) |
| Tests | `public-api.test.ts` updated for new runtime exports |

## Commit

```
feat(sdk): add ticket mode types, human-request client, and /sdk socket helper
```

## Verify

- `pnpm --filter @onedeskpro/chatbot-types build` — pass
- `pnpm --filter @onedeskpro/chatbot-core type-check` — pass
- `pnpm --filter @onedeskpro/chatbot-core build` — pass
- `pnpm --filter @onedeskpro/chatbot-core test` — 60/60 pass
- `pnpm --filter @onedeskpro/chatbot-react type-check` — pass

## Concerns / follow-ups

1. **Task 6** must wire `SdkSocket` in ChatbotCore (connect after identify, handlers for `ticket:status` / `message:receive`, `requestHuman()`, mode-aware `sendMessage`, disconnect on destroy).
2. **`message:receive` payload** is typed as `unknown` in `SdkSocket` — Task 6 needs to map inbox-shaped payloads to `ChatMessage` with `type: 'agent'`.
3. **IIFE bundle size** grew (~socket.io-client bundled for CDN); acceptable for v1, revisit externalization later if needed.
4. **Agent bubble UI** still uses AI styling until Task 7.
5. Brief’s `fetchTicketStatus` header arg order was wrong vs existing `request()` signature; implemented as 5th arg (`extraHeaders`), matching `verifyVisitor`.

## Out of scope (as required)

- ChatbotCore mode machine
- Widget request-human / banners / closed UX
