# Graph Report - onedesk-pro-chatbot-sdk  (2026-09-16)

## Corpus Check
- 52 files · ~18,498 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 556 nodes · 760 edges · 32 communities (31 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `08d850d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ChatWidget
- core/package.json
- chatbot-core.ts
- react/src/index.ts
- packages/react/package.json
- shared-types/package.json
- demo/react/package.json
- devDependencies
- package.json
- ChatbotCore
- tasks
- shared-types/src/index.ts
- compilerOptions
- session-manager.ts
- packages/react/tsconfig.json
- @onedeskpro/chatbot-core
- core/tsconfig.json
- demo/react/tsconfig.json
- devDependencies
- chatbot-core.test.ts
- shared-types/tsconfig.json
- Onedesk Pro Chatbot SDK
- @onedeskpro/chatbot-react
- @onedeskpro/chatbot-types

## God Nodes (most connected - your core abstractions)
1. `ChatWidget` - 40 edges
2. `ChatbotCore` - 29 edges
3. `ApiClient` - 14 edges
4. `compilerOptions` - 11 edges
5. `buildMessageEl()` - 10 edges
6. `react` - 10 edges
7. `scripts` - 8 edges
8. `useChatbot()` - 8 edges
9. `keywords` - 7 edges
10. `EventEmitter` - 7 edges

## Surprising Connections (you probably didn't know these)
- `bubble()` --calls--> `buildMessageEl()`  [EXTRACTED]
  packages/core/src/__tests__/markdown.test.ts → packages/core/src/widget/render.ts
- `ChatbotCore` --references--> `ApiClient`  [EXTRACTED]
  packages/core/src/chatbot-core.ts → packages/core/src/api-client.ts
- `ChatbotCore` --references--> `SdkSocket`  [EXTRACTED]
  packages/core/src/chatbot-core.ts → packages/core/src/sdk-socket.ts
- `ChatbotCore` --references--> `ChatWidget`  [EXTRACTED]
  packages/core/src/chatbot-core.ts → packages/core/src/widget/widget.ts
- `Conversation()` --calls--> `useChatbot()`  [EXTRACTED]
  packages/react/src/__tests__/useChatbot.test.tsx → packages/react/src/hooks/useChatbot.ts

## Import Cycles
- None detected.

## Communities (32 total, 1 thin omitted)

### Community 0 - "ChatWidget"
Cohesion: 0.07
Nodes (30): bubble(), WidgetInternals, buildE164Phone(), DIAL_COUNTRIES, DialCountry, findDialCountry(), arrowRightIcon(), botIcon() (+22 more)

### Community 1 - "core/package.json"
Cohesion: 0.05
Nodes (43): author, bugs, url, dependencies, @onedeskpro/chatbot-types, socket.io-client, description, exports (+35 more)

### Community 2 - "chatbot-core.ts"
Cohesion: 0.08
Nodes (17): ApiClient, ApiClientOptions, ChatbotRequestError, isApiError(), isChatbotRequestError(), DEFAULTS, definedOnly(), extractAgentText() (+9 more)

### Community 3 - "react/src/index.ts"
Cohesion: 0.09
Nodes (20): Tab, CONFIG_ROWS, DefaultWidgetDemo(), HeadlessDemo(), HOOK_FIELDS, ChatbotProvider(), ChatbotProviderProps, ChatbotHeadless() (+12 more)

### Community 4 - "packages/react/package.json"
Cohesion: 0.05
Nodes (40): author, bugs, url, dependencies, @onedeskpro/chatbot-core, @onedeskpro/chatbot-types, description, exports (+32 more)

### Community 5 - "shared-types/package.json"
Cohesion: 0.05
Nodes (38): author, bugs, url, description, devDependencies, tsup, typescript, exports (+30 more)

### Community 6 - "demo/react/package.json"
Cohesion: 0.06
Nodes (30): dependencies, @onedeskpro/chatbot-core, @onedeskpro/chatbot-react, @onedeskpro/chatbot-types, react, react-dom, devDependencies, @types/react (+22 more)

### Community 7 - "devDependencies"
Cohesion: 0.07
Nodes (30): devDependencies, jsdom, react, react-dom, @testing-library/dom, @testing-library/jest-dom, @testing-library/react, @types/react (+22 more)

### Community 8 - "package.json"
Cohesion: 0.08
Nodes (23): description, devDependencies, turbo, typescript, vitest, turbo, typescript, vitest (+15 more)

### Community 10 - "tasks"
Cohesion: 0.13
Nodes (16): ^build, dependsOn, outputs, cache, cache, persistent, dist/**, $schema (+8 more)

### Community 11 - "shared-types/src/index.ts"
Cohesion: 0.12
Nodes (15): ApiError, ApiResponse, ChatbotBlockReason, ChatbotEventMap, ChatbotInitOptions, ChatbotState, ChatbotTicketMode, ChatMessage (+7 more)

### Community 12 - "compilerOptions"
Cohesion: 0.13
Nodes (14): DOM, DOM.Iterable, ES2020, compilerOptions, declaration, declarationMap, esModuleInterop, lib (+6 more)

### Community 13 - "session-manager.ts"
Cohesion: 0.22
Nodes (4): readStored(), removeStored(), VisitorTokenManager, writeStored()

### Community 14 - "packages/react/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, outDir, rootDir, exclude, extends, include, src (+4 more)

### Community 15 - "@onedeskpro/chatbot-core"
Cohesion: 0.17
Nodes (11): Also exported, API, `ChatbotCore`, Events — `ChatbotEventMap`, Install, License, Notes, @onedeskpro/chatbot-core (+3 more)

### Community 16 - "core/tsconfig.json"
Cohesion: 0.17
Nodes (11): compilerOptions, outDir, rootDir, exclude, extends, include, src, src/**/*.test.ts (+3 more)

### Community 17 - "demo/react/tsconfig.json"
Cohesion: 0.18
Nodes (10): compilerOptions, jsx, noEmit, types, extends, include, src, ../../tsconfig.base.json (+2 more)

### Community 18 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, jsdom, typescript, vite, vite-plugin-dts, vitest, jsdom, typescript (+3 more)

### Community 19 - "chatbot-core.test.ts"
Cohesion: 0.29
Nodes (4): envelope(), RouteOverrides, shadowRoots, stubApi()

### Community 20 - "shared-types/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src, ../../tsconfig.base.json

### Community 21 - "Onedesk Pro Chatbot SDK"
Cohesion: 0.25
Nodes (7): Development, License, Onedesk Pro Chatbot SDK, Packages, Quick start, Releasing, Tests

### Community 22 - "@onedeskpro/chatbot-react"
Cohesion: 0.29
Nodes (6): Custom UI, Exports, Install, License, @onedeskpro/chatbot-react, Usage

### Community 23 - "@onedeskpro/chatbot-types"
Cohesion: 0.40
Nodes (4): Exports, Install, License, @onedeskpro/chatbot-types

## Knowledge Gaps
- **236 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+231 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ChatWidget` connect `ChatWidget` to `ChatbotCore`, `chatbot-core.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `ChatbotCore` connect `ChatbotCore` to `ChatWidget`, `chatbot-core.ts`, `chatbot-core.test.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `react` connect `react/src/index.ts` to `packages/react/package.json`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _236 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ChatWidget` be split into smaller, more focused modules?**
  _Cohesion score 0.06846635367762129 - nodes in this community are weakly interconnected._
- **Should `core/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `chatbot-core.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07822410147991543 - nodes in this community are weakly interconnected._