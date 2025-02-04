import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/geometry.ts',
      name: 'geometry',
      fileName: (format) => `geometry.${format}.js`,
      formats: ['es', 'umd']
    },
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
})
