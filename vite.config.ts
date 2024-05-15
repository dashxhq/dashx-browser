// Based on https://vitejs.dev/guide/build.html#library-mode

import path from "path"
import dts from "vite-plugin-dts"
import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  build: {
    lib: {
      entry: [resolve(__dirname, "./src/index.ts")],
      name: "dashx-browser",
      fileName: (format) => `index.${format}.js`,
    },
    sourcemap: false,
    emptyOutDir: true,
  },
  plugins: [ dts({ rollupTypes: true })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
