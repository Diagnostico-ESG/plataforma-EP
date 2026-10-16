# 04: Versões históricas (V5F)

**Como resolve a sua parte.** Muitos processos já tiveram versões na primeira etapa do trabalho, antes da plataforma, com o sufixo F no nome (V5F). Este ticket deixa a equipe registrá-las à mão, com o número digitado e os arquivos que existirem (basta o .bpm), para que o processo comece de onde realmente começou e a primeira versão nova continue a numeração (V5F → V6). A versão histórica é somente leitura e só pode ser registrada enquanto o processo não tem versão nova.

**What to build:** função do banco que grava a versão histórica com os arquivos e os gatilhos das regras dela; ação `registrar` da função do servidor para histórica; [Registrar versão histórica] no módulo e na seção Versões. Spec: histórias 14 a 21 e 45 (histórica registrada).

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [x] Banco: testes antes da migração: histórica com número digitado aceita; número repetido recusado; histórica depois de versão nova recusada; histórica só com .bpm aceita, só com .png recusada, com .bpmn e .png aceita; etapa nula; versão nova depois de V5F recebe V6; relatório opcional só na criação; registrar gera um evento.
- [x] [Registrar versão histórica] aparece para Administrador e Integrante, com o processo em andamento, só enquanto não há versão nova; abre o formulário com o número (inteiro maior que zero) e os arquivos.
- [x] A versão histórica aparece com o rótulo `V{n}F`, sem etapa, sem [Substituir] e sem a marca "relatório pendente"; o nome dos arquivos leva o F.
- [x] Cada recusa vira mensagem na tela; testes de interface com a falsa cobrindo registrar uma e várias, o botão sumindo depois da versão nova e as recusas.

## Registro da execução (2026-10-15)

- **Critério 1 (banco):** `supabase/tests/28_versoes_historicas.test.sql` (35 casos), escrito antes da migração (#78, vermelho: função inexistente). Migração `20261016012547_versoes_historicas`, ensaiada (#80) e aplicada pelo workflow (#18); depois, os 29 arquivos verdes (#81), o 27 com 52 de 52 e o 28 com 35 de 35. Cobre: número digitado aceito e repetido recusado; histórica depois de versão nova recusada; só .bpm aceita, só .png, só .bpmn e só relatório recusados, .bpmn com .png aceita; etapa nula; V5F seguida de V6; relatório só na criação (depois, `versao_historica_somente_leitura`); um evento `registrar_historica` por registro; as células de perfis, processo fora de andamento, inativo e visitante.
- **Critérios 2 a 4 (tela):** `src/App.registrarVersaoHistorica.test.tsx` (24 casos) e o caso novo de `App.versoesNoHistorico.test.tsx`, com o aplicativo inteiro e a `VersoesFalso`: botão para Administrador e Integrante, sumindo com a Consulta, o processo parado e a versão nova; formulário com o número, a dica e a prévia `V5F`; número inválido e arquivos insuficientes mantêm o botão desabilitado; registrar uma e várias; V5F → V6; as recusas (número repetido, histórica depois de versão nova, falha de arquivo), o progresso e o cancelamento; a versão aparece como `V5F`, sem etapa, com "Histórica · somente leitura" e sem botões.
- **Servidor:** `registrar` lê `historica` (ausente = falso) e chama `registrar_versao_historica`; testado no Vitest (`registro.test.ts`). A ação em si (Deno) só se prova de ponta a ponta.
- **Prova real no Drive: pendente** (roteiro do usuário). O `prova-do-drive.mjs` já tem o passo da histórica.
- **`[visual]`:** a marca "Histórica · somente leitura" e o formulário não foram conferidos olhando a tela.
- **Sem a linha `Concluído em`**, até a prova do Drive (ver `desvios.md`).

## Fecho (2026-10-16)

- **Prova real:** o passo da histórica está no script do Integrante, relatado OK pelo usuário (saída não colada). A saída do Consulta não o exercita. Registrado como presumido a partir do relato.

Concluído em 2026-10-16 (commit 0bf5327)
