// vite.config.ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "file:///Users/typetechit/onedesk-pro-chatbot-sdk/node_modules/.pnpm/vite@5.4.21/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/typetechit/onedesk-pro-chatbot-sdk/node_modules/.pnpm/vite-plugin-dts@4.5.4_rollup@4.62.0_typescript@5.9.3_vite@5.4.21/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/typetechit/onedesk-pro-chatbot-sdk/packages/core/vite.config.ts";
var vite_config_default = defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL("src/index.ts", __vite_injected_original_import_meta_url)),
      name: "OnedeskProChatbot",
      formats: ["es", "cjs", "iife"],
      fileName: (format) => {
        if (format === "iife") return "index.iife.js";
        if (format === "es") return "index.js";
        return "index.cjs";
      }
    },
    rollupOptions: {
      // Zero external deps — self-contained for CDN IIFE build
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdHlwZXRlY2hpdC9vbmVkZXNrLXByby1jaGF0Ym90LXNkay9wYWNrYWdlcy9jb3JlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdHlwZXRlY2hpdC9vbmVkZXNrLXByby1jaGF0Ym90LXNkay9wYWNrYWdlcy9jb3JlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90eXBldGVjaGl0L29uZWRlc2stcHJvLWNoYXRib3Qtc2RrL3BhY2thZ2VzL2NvcmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCdzcmMvaW5kZXgudHMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgIG5hbWU6ICdPbmVkZXNrUHJvQ2hhdGJvdCcsXG4gICAgICBmb3JtYXRzOiBbJ2VzJywgJ2NqcycsICdpaWZlJ10sXG4gICAgICBmaWxlTmFtZTogKGZvcm1hdCkgPT4ge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnaWlmZScpIHJldHVybiAnaW5kZXguaWlmZS5qcyc7XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdlcycpIHJldHVybiAnaW5kZXguanMnO1xuICAgICAgICByZXR1cm4gJ2luZGV4LmNqcyc7XG4gICAgICB9LFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgLy8gWmVybyBleHRlcm5hbCBkZXBzIFx1MjAxNCBzZWxmLWNvbnRhaW5lZCBmb3IgQ0ROIElJRkUgYnVpbGRcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgZHRzKHtcbiAgICAgIGluc2VydFR5cGVzRW50cnk6IHRydWUsXG4gICAgICByb2xsdXBUeXBlczogdHJ1ZSxcbiAgICB9KSxcbiAgXSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1VixTQUFTLHFCQUFxQjtBQUNyWCxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFNBQVM7QUFGc00sSUFBTSwyQ0FBMkM7QUFJdlEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLE1BQ0gsT0FBTyxjQUFjLElBQUksSUFBSSxnQkFBZ0Isd0NBQWUsQ0FBQztBQUFBLE1BQzdELE1BQU07QUFBQSxNQUNOLFNBQVMsQ0FBQyxNQUFNLE9BQU8sTUFBTTtBQUFBLE1BQzdCLFVBQVUsQ0FBQyxXQUFXO0FBQ3BCLFlBQUksV0FBVyxPQUFRLFFBQU87QUFDOUIsWUFBSSxXQUFXLEtBQU0sUUFBTztBQUM1QixlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0Y7QUFBQSxJQUNBLGVBQWU7QUFBQTtBQUFBLElBRWY7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixrQkFBa0I7QUFBQSxNQUNsQixhQUFhO0FBQUEsSUFDZixDQUFDO0FBQUEsRUFDSDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
