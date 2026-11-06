# Itens ainda não testados num projeto real — DevFlow v3.2

Como usar: ao terminar um comando, leia o bloco dele e o bloco "Qualquer momento". Para cada item que aconteceu nesta execução e ainda não tem entrada em `.scratch/melhorias-protocolo.md`, acrescente uma entrada com a data, o item, o que era esperado e o que aconteceu. Quem avalia se funcionou sou eu.

Os itens da v1.x que um projeto real já exercitou (trava de git, funil de planejamento e execução, regras de banco com login, perfis e arquivos, `/ship` com os passos de revisão) saíram desta lista na v2.0. Ficaram os que continuam sem evidência e todo o que a v2.0 acrescentou.

O `/situação` só lê e não registra nada.

## Qualquer momento

- Custo desligado por padrão e "Custo ligado" na seção de ajustes do projeto.
- `.claude/regras/execucao.md` e `.claude/regras/interface.md` lidos quando o comando manda.
- Commit por caminho (`git add <arquivos>`) com duas sessões na mesma pasta.
- `.scratch/proximo-passo.md` gravado ao fim de cada etapa e lido pelo `/situação`.
- Comando pronto para copiar ao pedir sessão nova: `/situação` e o comando da etapa, cada um num bloco, com o modelo, e o mesmo texto no `proximo-passo.md`.

## /projeto

- Pergunta "o que as pessoas usam hoje no lugar" e "dados atuais para trazer".
- Aviso de outra pilha de front-end (Next.js, Vue, Angular).

## /setup

- Passo 0: `gh --version` e `.nvmrc`.
- Passo 4: `test.exclude` com `.claude/modelos/**`.
- Passo 6a: vitrine (`npm run vitrine`, `src/lib/acesso.ts`, `grep` no `dist/`).
- Passo 7: teste da porta do banco para escolher o ciclo B ou C; item k (testes e migrações pelo GitHub Actions) do zero; modelos `migracoesPendentes`, `relatorio-tap` e `travaDoProjeto`.
- Passo 8: `.gitattributes` e workflow `verificacao.yml`.
- Passo 10: configuração das skills do Matt Pocock pronta no pacote, sem rodar a skill de setup.
- Passo 12: pre-commit com `vitest related` no lint-staged e sem `npm test` inteiro.

## /concepcao-livre e /implementar-identidade

- Imagens de referência, limite de rodadas e quadro comparativo; modo "consolidar protótipos aprovados"; estilo dos controles na identidade.
- Teste só dos arquivos tocados durante a implementação da identidade.

## /planejar

- Caminho "spec ainda não executada que volta a mudar" e "desistir antes da spec".
- Confirmação dos padrões e decisões antes de devolver o comando; fatias verticais e tickets enxutos; pergunta principal por tela.

## /executar-simples e /executar-complexo

- Envio da branch antes do `git branch -d`; versão falsa na vitrine por ticket de tela; ciclo C de banco com o workflow.

## /polir

- Vitrine como base da auditoria; achado que muda comportamento indo para ticket ou backlog.

## /ship

- Regra de retomada; "só bloqueia o que o passo 12 lista"; revisão de reserva quando a branch já é a principal; conferência de que `dist/` não leva `src/vitrine/`.
- Passo 7 lendo "Conferências do /ship" de `banco.md`; roteiros de produção lidos de `producao.md`.
- Roteiros de produção (banco, site, backup e restauração, revisão para produção): sem confirmação nesta lista.

## Banco, /planejar e /ship (v2.0.2)

- Seção "Desempenho e edição simultânea" de `banco.md`: índice, `select *`, N+1 e coluna `versao` com teste do conflito.
- Checagens da interface antes do `/security-review` (passo 4 do `/ship`).
- Pergunta de edição simultânea e de colunas de busca na seção Modelo de dados do `/planejar`.
- Roteiro "Operação depois da publicação" (alerta de erro, quem avisa, pós-mortem de uma página).
- `auditoria-prontidao.md`: rascunho, nunca executado.

## /rapido

- Condição de entrada e saída no meio do trabalho; ficha de 10 a 15 linhas como única parada.
- TDD pela regra de `tdd.md` (ver o teste falhar) sem o `/implement`; convivência com as skills de TDD de terceiros, que continuam ativas.
- Uma só revisão de código; marca `Entregue em` e marco de entrega sem passar pelo `/ship`; tempo medido contra a estimativa de 25 a 35 minutos.

## /demanda, /voltar e /situação

- `/demanda`: lista de itens, exploração livre, pacote misto, infraestrutura e ferramentas, teste instável.
- `/voltar`: sem confirmação nesta lista, nem em projeto sem banco.

## /ship e /setup (v3.0)

- Auditoria de pacotes do passo 3 do `/ship` feita com `npm audit --json` e `npm audit --omit=dev --json`, sem a skill `security-auditor`: relatório por severidade, separação entre produção e desenvolvimento, `fixAvailable` e `isSemVerMajor`.
- Projeto sem claude-mem do começo ao fim: continuidade só pelos arquivos de `.scratch/` e pelo `/situação`; handoff só nos três casos do `CLAUDE.md`.

## /planejar, /executar-simples e /ship (v3.1)

- `/planejar`: spec escrita pelo Claude pela regra de `spec-e-tickets.md`, sem o `to-spec` (ponto de teste confirmado antes, modelo de nove seções, numeração continuada numa spec existente, decisões novas confirmadas).
- `/planejar`: tickets escritos pelo Claude, sem o `to-tickets` (primeira proposta enxuta, lista mostrada antes de gravar, numeração depois dos concluídos, conferência final).
- `/executar-simples` sem o `implement`: TDD pela regra de `tdd.md`, uma revisão de código e as linhas `Concluído em` ou `Implementado em`, numa sessão só, sem parada.
- `/ship`, passo 4, e revisão para produção, passo 7: revisão de segurança por `revisao-seguranca.md` (subagente de leitura, filtro de confiança 8, relatório em português), sem o `/security-review`.
