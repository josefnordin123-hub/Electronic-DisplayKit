import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

// https://vitejs.dev/config/
// The cloudflare() plugin is what stops `wrangler deploy` from treating this
// as an unconfigured Vite project and re-running its auto-scaffold flow on
// every single build (which kept regenerating a wrangler.jsonc that hit a
// known Cloudflare bug — see wrangler.jsonc's own comment and
// DEVOPS-SETUP.md §6.2/§6.3 for the full story). Per Cloudflare's own docs,
// this plugin also owns configuring `assets.directory` automatically, so
// wrangler.jsonc deliberately does not set that field itself.
export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    // WebSerial requires a secure context (HTTPS) or localhost.
    // Vite's dev server on localhost satisfies the "secure context" rule,
    // so no extra HTTPS config is needed for local development.
    port: 5173,
    fs: {
      // src/lib/serialConnect.ts and src/lib/displayTypes.ts import types
      // directly from ../../../protocol/schema.ts (the shared, sibling
      // /protocol/ directory — see protocol/README.md: "import directly
      // from the webserial-tool frontend as the TypeScript source of
      // truth"). Vite's default dev-server file-serving restriction only
      // allows the project root and its ancestors' lockfile boundary, which
      // would 403 that import at dev-server request time even though
      // TypeScript/Rollup happily resolve it at build time. Widen it to the
      // repo root (one level up) so `npm run dev` can actually serve it.
      // UNVERIFIED — written without a working Node/npm in this
      // environment; confirm `npm run dev` can load the app at all before
      // trusting this.
      allow: ['..'],
    },
  },
});
