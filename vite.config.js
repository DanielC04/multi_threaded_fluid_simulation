import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    headers: {
      // need those to enable SharedArrayBuffer
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
