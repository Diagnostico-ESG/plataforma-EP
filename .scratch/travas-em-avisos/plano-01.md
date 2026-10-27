# Plano do ticket 01: Confirmação de arquivos (travas-em-avisos)

Execução do [ticket 01](issues/01-confirmacao-de-arquivos-avancar-ou-cancelar.md); requisitos na seção "Travas em avisos" da spec de `documentos-versoes` e no ADR 0028. Regras de `.claude/regras/banco.md` que valem: migração por `supabase/migrations`, teste pgTAP antes, função sem `security definer`, tipos junto. Sem Docker nesta máquina: pgTAP pelo workflow "Testes de banco" e migração pelo "Migrar banco de desenvolvimento".

- [x] 1. Banco: `59_trava_de_arquivos.test.sql` passa ao modelo novo (aceita e registra `sem_arquivos`); migração `20261027120000_confirmacao_de_arquivos.sql` (`private.arquivos_que_faltam_na_ida`, `mover_processo`). Tipos: assinatura inalterada, nada a regenerar.
- [x] 2. Decisão pura `travasQueFaltam`/`travasDaIda` devolve todas as etapas que faltam, em ordem (`travaDeArquivos.ts`).
- [x] 3. Textos da pergunta e do histórico (`frasesDaConfirmacaoDeArquivos.ts`), com teste.
- [x] 4. Hook `useMovimentoDoProcesso` (`confirmacao`, `avancarSemArquivos`) e `JanelaDaConfirmacaoDeArquivos`; saem `JanelaDaTrava` e `moverDepoisDoEnvio`.
- [x] 5. Histórico "Moveu para … sem …" (`historicoDosCadastros.ts`).
- [x] 6. Saem `trava_piloto`, `trava_tecnica` e `autor_da_versao` (recusas e frases); falsa de processos guarda `semArquivos` em vez de recusar.
- [x] 7. Testes `App.confirmacaoDeArquivos` (lista do Agora e arrastar), `npm test`, lint e tipos.
- [x] 8. Workflows: migração aplicada no desenvolvimento e "Testes de banco" verde na branch.
