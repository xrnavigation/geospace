import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/geometry.ts',
      name: 'geometry',
      formats: ['es', 'umd']
    }
  }
})
