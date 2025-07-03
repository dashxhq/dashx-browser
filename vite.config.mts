// Based on https://vitejs.dev/guide/build.html#library-mode

import dts from 'vite-plugin-dts'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'es2015',
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: 'dashx-browser',
      fileName: (format) => `index.${format}.js`,
    },
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
  plugins: [ dts({ rollupTypes: true }) ],
})
