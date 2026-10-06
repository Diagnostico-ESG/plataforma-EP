import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, '.claude/worktrees/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary'],
      include: ['src/**'],
      exclude: ['src/types/database.ts'],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
})
