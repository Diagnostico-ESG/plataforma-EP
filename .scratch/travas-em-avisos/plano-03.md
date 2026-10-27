# Editar número da versão (ticket 03) — plano de execução

> Gravado durante a execução, na ordem em que as tarefas foram feitas. Requisitos: ticket `.scratch/travas-em-avisos/issues/03-editar-numero-da-versao.md`, spec `.scratch/documentos-versoes/spec.md` (seção "Travas em avisos") e ADR 0028.

**Regras do banco que valem** (`.claude/regras/banco.md`, lido em 2026-10-27): teste de banco antes da migração; migração não destrutiva e nova para consertar a já aplicada; função sem `security definer`; função do servidor confere quem chamou antes de tocar o Drive, com a decisão num arquivo puro testado no Vitest; recusas em `P0001 "motivo:valor"`.

**Isolamento:** este ticket roda numa worktree (execução em paralelo com o ticket 01, pedida pelo usuário), na branch `claude/travas-03-editar-numero-5c3afc`. O Docker não sobe nesta máquina (falta o WSL), então o pgTAP rodou no workflow "Testes de banco" do GitHub e a migração foi aplicada pelo workflow "Migrar banco de desenvolvimento".

## Fora deste ticket (não fazer)

Os avisos amarelos (ticket 04); a confirmação de arquivos ao mover (ticket 01); renomear o .pdf guardado de uma aprovação trocada (histórico).

## Tarefas

- [x] **1. Banco: teste e migração.** `supabase/tests/65_editar_numero_da_versao.test.sql` (53 asserções: perfis, situações, entrada, tipo, nomes, evento, aprovada, escrita direta) e `20261027140000_editar_numero_da_versao.sql` (função `editar_numero_da_versao`, privilégios de coluna, gatilhos com a marca `ep.renumerando`). Correção pela migração nova `20261027150000_numero_so_pela_funcao_com_42501.sql`: a escrita direta continua recusada com 42501, como os testes 27, 30 e 60. Teste: workflow "Testes de banco" (65 com 53 ok; 27, 30, 60 e 46 passam).
- [x] **2. Função do servidor.** `_shared/renumerar.ts` (decisão pura: entrada, número, nomes) com `renumerar.test.ts` (perfil, situação, entrada, nome); `arquivos-no-drive/renumeracao.ts` (renomeia no Drive com a conferência de pasta, grava com o token de quem pediu, devolve os nomes se algo falha); `Acao` ganhou `renumerar`.
- [x] **3. Módulo de versões.** `editarNumero(versaoId, numeroEsperado, numeroNovo)` no módulo real (teste com cliente simulado), na falsa (recusas e falha do Drive) e as frases novas em `recusasDeVersoes.ts`.
- [x] **4. Tela.** "⋯" ao lado do rótulo (`AcaoEditarNumero`, reaproveita o `MenuDeAcoes`) e janela `JanelaDoNumeroDaVersao` (reaproveita `JanelaDeEdicao` e o campo do número); prévia e regras em `versoes/numeroDaVersao.ts`. Teste: `App.editarNumeroDaVersao.test.tsx`.
- [x] **5. Histórico.** "Alterou o número da V{antes} para V{depois}" em `historicoDosCadastros.ts`.
- [x] **6. Registros.** Ticket, `AMBIENTES.md`, `melhorias-protocolo.md`.
