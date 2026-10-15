import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // O primeiro teste de cada arquivo de interface paga a carga do App inteiro (passa de 400 ms sozinho); sob a bateria cheia, ou com outra sessão usando a máquina, estourava os 5 s padrão.
    testTimeout: 15000,
    // Por padrão o Vitest devolve CSS vazio; estes arquivos precisam vir inteiros para os testes das cores das mensagens.
    css: { include: /(Administracao|Moldura|Cadastros|JanelaDeConfirmacao)\.css/ },
    setupFiles: ['./src/configurarTestes.ts'],
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
