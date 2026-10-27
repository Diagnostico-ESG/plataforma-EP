
## 2026-10-27 — /polir (impeccable audit + polish)

Auditoria sobre os 9 arquivos de interface da funcionalidade (confirmação de arquivos, "⋯" e janela Editar número, avisos): o detector não achou nada; nota 18/20 (acessibilidade 3, desempenho 4, responsivo 3, tema 4, integridade 4). Feita por leitura do código, sem ver a tela (vitrine local desatualizada; a tela só abre com o login).

**Corrigido**
- [P2] Os avisos da janela "Editar número" estavam em 12px, menores que a prévia logo acima. Passaram ao tamanho normal do corpo (`Versoes.css`, `.formulario-de-versao-avisos`).

**Deixado de fora**
- [P3] O aviso usa `role="status"` e o leitor de tela o lê quando o texto muda. Aceitável: a frase só muda quando muda o caso.
- [P3] `[visual]` em 1366×768 da janela com prévia e avisos (e dos demais critérios visuais da funcionalidade) segue presumido, porque a tela só abre com o login real.

## 2026-10-27 — /ship (code-review, banco, segurança)

**Divergências da spec (spec atualizada):** os avisos da edição do número saem em lista com uma só pergunta "Gravar assim mesmo?" (a spec trazia a pergunta em cada frase); ganharam a variante "ficará antes da…"; valem só para a versão editada; na aprovada citam o número antigo.

**Achado do /code-review, corrigido:** `editar_numero_da_versao` conferia o número esperado antes da trava do processo; duas edições simultâneas passavam as duas e a segunda sobrescrevia a primeira. Migração nova `20261027160000_editar_numero_relendo_apos_a_trava` (trava primeiro, número relido depois), aplicada no desenvolvimento pelo workflow; "Testes de banco" verde, teste 65 com 53 ok. Sem teste de regressão da corrida (o pgTAP roda numa sessão só).

**Achados do /code-review deixados de fora:** a função do servidor não conferir `arquivado_em` (processo arquivado sempre está concluído, que ela já recusa); `VersoesFalso.ts` com 323 linhas e o hook `useConfirmacaoDeArquivos` acima de 40 só contando comentários (o ESLint conta sem eles e passa); letra do tipo (F/P) repetida em poucos pontos; nomes "Trava" no código (vai ao backlog); corrida Drive/banco entre duas edições que se cruzem no meio da renomeação (improvável com 6 usuários; a função devolve os nomes se algo falha).

**Revisão de segurança do código:** o `/security-review` comparou a `main` com a `main` (só uma spec no diff); foi feita a revisão de reserva (subagente, leitura das migrações, da função `arquivos-no-drive` e de `_shared/renumerar.ts`/`decisao.ts`), sem achados de confiança 8 ou mais. Não foram lidos `chamador.ts`, `pastas.ts`, `versoesSupabase.ts`, os hooks do movimento e `recusasDoBanco.ts`. Observação de confiança baixa, fora do diff: `acoes.ts:196` (backlog).

**Sem achados:** dependência circular, migração destrutiva, tipos desatualizados, chave secreta, view sem `security_invoker`, `security definer` sem `search_path` vazio. `package.json` não mudou (sem `security-auditor`). `enable_signup = true` no `[auth]` é a decisão do ADR 0001 (o banco barra quem não está autorizado).
