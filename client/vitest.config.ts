import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Historical emitted .js tests must not run a second copy of the suite.
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
  }),
)
