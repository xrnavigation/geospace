import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'geometry',
      fileName: (format: string) => {
        if (format === 'cjs') return 'geometry.cjs'
        return `geometry.${format}.js`
      },
      formats: ['es', 'cjs', 'umd']
    },
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
})
