import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.claude/worktrees', 'src/types/database.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      complexity: ['error', 10],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Componentes .tsx ficam fora: são divididos por responsabilidade, não por tamanho de função.
    files: ['src/**/*.ts'],
    ignores: ['**/*.test.ts', 'src/hooks/**'],
    rules: {
      'max-lines-per-function': ['error', { max: 20, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Hooks reúnem estado e efeitos de uma tela; com 20 linhas levavam a juntar instruções só para caber.
    files: ['src/hooks/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
    },
  },
])
