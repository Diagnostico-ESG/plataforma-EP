# Auditoria de dependências (npm audit), 2026-11-10

Gerada no `/ship` de `importacao-dados-atuais` (passo 3), com `npm audit --json` e `npm audit --omit=dev --json`. Sobrescreve a versão de 2026-11-05. O `package.json` só mudou na configuração do pre-commit (atualização do DevFlow); nenhuma dependência nova.

## Resumo

- **Dependências de produção** (as que vão ao navegador: `@supabase/supabase-js`, `react`, `react-dom`): `npm audit --omit=dev` → **0 vulnerabilidades**.
- **Projeto inteiro:** 11 achados (9 moderados, 2 altos, 0 críticos), **todos em ferramentas de desenvolvimento**. `undici` entra pelo `jsdom`, usado só nos testes; `zod` entra pelo `eslint-plugin-react-hooks`; o resto vem da cadeia do `eslint` e do `typescript-eslint`. Nada disso é empacotado no site nem roda no servidor. Os achados do `madge` da linha de base anterior sumiram.
- **Altos:**
  - `undici` 8.11.2: negação de serviço e outros oito avisos, corrigidos na 8.12.2.
  - `zod` 4.6.5: esgotamento de memória ao validar coleções enormes, corrigido na 4.6.6.
  - Os dois só no ambiente de desenvolvimento e de teste, com correção disponível sem versão maior (`fixAvailable: true`).

## Achados

| Pacote | Severidade | Tipo | Faixa afetada | Aviso | Correção |
| --- | --- | --- | --- | --- | --- |
| undici | alta | desenvolvimento (indireta, `jsdom`) | 8.0.0 a 8.12.1 | GHSA-4qv8-2p9j-2685, GHSA-f72v-6w45-q472, GHSA-xjj6-f33q-929c, GHSA-4w7w-5xrc-9h26, GHSA-2m5v-pch6-74hx, GHSA-qrxm-fqhp-jwvm, GHSA-9fm3-97px-rjf6, GHSA-55wc-3pg8-jfw6 | disponível, sem versão maior |
| zod | alta | desenvolvimento (indireta, `eslint-plugin-react-hooks`) | abaixo de 4.6.6 | GHSA-mrhx-c7xc-m3w5 | disponível, sem versão maior |
| minimatch | moderada | desenvolvimento (indireta) | 7.0.0 a 11.0.0 | GHSA-g3hv-75wg-m249 | via `eslint` 9.39.5, versão maior |
| eslint | moderada | desenvolvimento (direta) | 10.0.0-alpha.0 em diante | herdada de minimatch | `eslint` 9.39.5, versão maior |
| @eslint/config-array | moderada | desenvolvimento (indireta) | 0.23.0 em diante | herdada de minimatch | disponível |
| typescript-eslint e @typescript-eslint/* (5 pacotes) | moderada | desenvolvimento | 6.16.0 a 8.72.2 | herdada de minimatch | `typescript-eslint` 8.36.0, versão maior |

## Decisão

Nenhum achado real (crítico ou alto em dependência de produção). Atualizar as ferramentas de desenvolvimento fica no backlog. O `npm audit fix` sem `--force` cobre os dois altos. Os moderados pedem versão maior do `eslint` e do `typescript-eslint`, e essa troca de dependência pede marco antes.
