// Based on https://vitejs.dev/guide/build.html#library-mode

import dts from 'vite-plugin-dts'
import { defineConfig } from 'vite'
import { resolve } from 'path'

const buildTarget = process.env.BUILD_TARGET

export default defineConfig(buildTarget === 'sw' ? {
  build: {
    target: 'es2015',
    lib: {
      entry: resolve(__dirname, './src/sw-helper.ts'),
      name: 'DashXServiceWorker',
      fileName: (format) => `sw-helper.${format}.js`,
    },
    sourcemap: false,
    emptyOutDir: false,
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
  plugins: [ dts({ rollupTypes: false, include: [ 'src/sw-helper.ts' ] }) ],
} : {
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
