# Auditoria de dependências (npm audit), 2026-11-05

Gerada na revisão de pré-produção (`/ship`, roteiro "Revisão de segurança para produção", passo 7). O script da skill `security-auditor` falha no Windows (`2>/dev/null`), então rodei `npm audit --json` direto. Sobrescreve a versão anterior.

## Resumo

- **Dependências de produção** (as que vão ao navegador: `@supabase/supabase-js`, `react`, `react-dom`): `npm audit --omit=dev` → **0 vulnerabilidades**.
- **Projeto inteiro:** 16 achados (14 moderados, 2 altos, 0 críticos), **todos em ferramentas de desenvolvimento** (ESLint, typescript-eslint, madge e suas dependências; `undici` entra por `jsdom`, usado só nos testes; `zod` por `eslint-plugin-react-hooks`). Nada disso é empacotado no site nem roda no servidor.
- **Altos:** `undici` (negação de serviço por memória no parser de EventSource; contorno de SRI com algoritmo em maiúsculas) e `zod` (esgotamento de memória ao validar coleções enormes). Ambos só no ambiente de desenvolvimento e de teste; correção disponível (`npm audit fix`), a aplicar quando convier, sem urgência para produção.

## Achados (nome do pacote, severidade, tipo)

| Pacote | Severidade | Dependência | Título | Aviso |
| --- | --- | --- | --- | --- |
| @eslint/config-array | moderate | indireta | (herdada) |  |
| @typescript-eslint/eslint-plugin | moderate | indireta | (herdada) |  |
| @typescript-eslint/parser | moderate | indireta | (herdada) |  |
| @typescript-eslint/type-utils | moderate | indireta | (herdada) |  |
| @typescript-eslint/typescript-estree | moderate | indireta | (herdada) |  |
| @typescript-eslint/utils | moderate | indireta | (herdada) |  |
| dependency-tree | moderate | indireta | (herdada) |  |
| detective-typescript | moderate | indireta | (herdada) |  |
| detective-vue2 | moderate | indireta | (herdada) |  |
| eslint | moderate | direta | (herdada) |  |
| madge | moderate | direta | (herdada) |  |
| minimatch | moderate | indireta | minimatch has potential denial of service via globparts amplification | https://github.com/advisories/GHSA-g3hv-75wg-m249 |
| precinct | moderate | indireta | (herdada) |  |
| typescript-eslint | moderate | direta | (herdada) |  |
| undici | high | indireta | undici vulnerable to Denial of Service via unbounded memory in the Eve | https://github.com/advisories/GHSA-4qv8-2p9j-2685 |
| zod | high | indireta | Zod can exhaust memory while validating oversized constrained collecti | https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 |

## Decisão

Nenhuma correção bloqueia a produção. Atualizar as ferramentas de desenvolvimento fica no backlog (`npm audit fix` cobre os dois altos; os outros herdam de `eslint`/`madge`, que podem pedir atualização de versão maior).
