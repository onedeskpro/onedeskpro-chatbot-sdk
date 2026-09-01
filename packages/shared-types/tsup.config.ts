import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  // Match the .js (ESM) / .cjs (CJS) layout used by the core and react packages
  outExtension: ({ format }) => ({ js: format === 'esm' ? '.js' : '.cjs' }),
});
