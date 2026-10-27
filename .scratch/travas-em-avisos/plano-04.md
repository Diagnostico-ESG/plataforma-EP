# Avisos da edição do número (ticket 04) — plano de execução

> Requisitos: ticket `.scratch/travas-em-avisos/issues/04-avisos-da-edicao-do-numero.md`, spec `.scratch/documentos-versoes/spec.md` (seção "Travas em avisos", decisão 5) e ADR 0028. Sem banco, sem função do servidor: só tela. Branch comum `travas-em-avisos`, sem worktree.

## Fora deste ticket (não fazer)

Segunda janela de confirmação; impedir a gravação; avisar sobre a versão seguinte que perde a anterior (a spec avisa só da versão editada).

## Tarefas

- [x] **1. Função pura.** `avisosDoNumero(versoes, versao, numeroNovo)` em `src/versoes/avisosDoNumero.ts`, com `avisosDoNumero.test.ts`: ordem dos tipos (depois/antes), salto em sequência, aprovada, avisos juntos, saltos entre históricas e piloto sem aviso. (critério 1 do ticket)
- [x] **2. Janela.** `JanelaDoNumeroDaVersao` recebe `versoes` e mostra os avisos em amarelo enquanto se digita, com "Gravar assim mesmo?" uma vez; `AcaoEditarNumero`, `VersaoEmDestaque` e `ListaDeVersoes` passam `versoes`. CSS no `Versoes.css` com os tokens `--pendencia-*`. (critérios 2 e 3)
- [x] **3. Testes de tela.** `App.avisosDoNumero.test.tsx`: cada aviso, avisos juntos, gravar com os avisos à vista. (critério 4)
- [x] **4. Conferência.** `npm test`, lint, typecheck; `[visual]` 1366×768 (critério 5).

## Registros da execução

- `npm test` 3.019 passando, lint e typecheck limpos.
- **`[visual]` presumido:** a janela com a prévia e os avisos em 1366×768 não foi vista (a vitrine local está desatualizada e a tela só abre com o login real). O CSS só acrescenta uma caixa com os tokens `--pendencia-*` de cima de [Gravar].
- **Decisões do plano, a confirmar na leitura:** (1) a pergunta "Gravar assim mesmo?" aparece uma vez, depois da lista, e não ao fim de cada aviso (a spec traz a pergunta em cada frase; o ticket, sem ela); (2) quando o número novo fica *antes* de uma versão de tipo posterior, a frase é "A V2 ficará antes da V3P." (a spec só traz o caso "depois"); (3) o aviso de salto vale só para a versão editada, não para a seguinte que perde a anterior; (4) na aprovada o aviso cita o número antigo, que é o que o E-protocolo cita.
