# Análise de skills e plugins do DevFlow — 2026-11-06

Fontes: registro de melhorias (200 entradas), transcrições das 228 sessões do projeto (invocações da ferramenta de skills e comandos digitados) e a configuração de plugins. Contagem de uso é indício, não medida de valor.

| Peça | Uso | Papel e problemas | Veredito |
|-|-|-|-|
| claude-mem | 25 avisos de cota esgotada desde meados de outubro | Projeto andou sem ele; os arquivos (`.scratch`, `proximo-passo`, `/situação`, handoff) levaram a continuidade. Gravou capturas com dado pessoal; 322 MB locais | Retirar |
| superpowers `writing-plans` / `executing-plans` | 75 / 73 | Espinha do `/executar-complexo`; cerca de 10 registros de sobreposição à mão (subagentes, worktree, ledger, pasta `docs/superpowers/`) | Virar regra (`plano.md`) |
| `finishing-a-development-branch` | 26 | Merge ao fim do ticket; origem do problema do `-d` | Virar regra |
| `brainstorming`, `systematic-debugging` | 3 e 3 | Uso raro | Virar regra ou retirar |
| Matt `grill-with-docs` (`grilling`, `domain-modeling`) | 34 | Gerou `CONTEXT.md` e 44 ADRs | Manter |
| `to-spec`, `to-tickets` | 36 e 30 | 17 specs, 98 tickets; pedido de menos tickets 3 vezes; revisão à mão em 19/10 funcionou | Virar regra, com cautela (2ª rodada) |
| `implement` | 34 | 7 linhas, 34 paradas de digitação | Virar regra |
| `code-review` | 57 | Achou coisa real; rodou duas vezes por feature | Manter, uma vez só |
| `handoff` | 10 | Fina; `proximo-passo.md` já cobre | Virar regra |
| `wayfinder` | 3 | Útil nas iniciativas grandes | Manter |
| Impeccable | 49 | Detector quase sempre limpo; defeito real veio da leitura do CSS e de 800 px; sem tela/login a auditoria foi só por código | Manter, mais enxuto (vitrine) |
| `security-auditor` | 1 | Script falha no Windows; cai-se em `npm audit --json` | Virar regra |
| `/security-review` embutido | 34 | Diff vazio em feature já integrada (cerca de 8 registros) | Revisão própria como padrão |
| Apple Design Skill | 0 | `/concepcao-premium` nunca rodou | Retirar |
| `frontend-design` | 3 | Base do `/concepcao-livre` | Opcional |
| Ponytail | hook em toda sessão | Sem evidência de problema nem benefício; conflito teórico de formato com a regra de explicar termos | Decisão do usuário |
| `typesafe`, `project-artifact`, MCPs GitHub e Supabase | 0 no DevFlow (MCPs: 1 sessão cada); GitHub falha com 400 | Só ruído | Fora do DevFlow |

## Gargalos
1. Paradas de digitação: `implement` (34), `to-spec` e `to-tickets` (66), `/security-review` (34), `handoff` (10).
2. Superpowers de plano e execução pedindo o que o protocolo proíbe.
3. claude-mem sem cota.
4. Impeccable sem tela para abrir.
5. `code-review` duplicado e `/security-review` com diff vazio.

## Fundamentais
`grill-with-docs`, `code-review`, `writing-plans` e `executing-plans` (como disciplina), Impeccable no que faz de verdade e os arquivos de `.scratch`.

## Candidatos a arquivo de regra (ordem de retorno)
1. `implement`. 2. `writing-plans`, `executing-plans`, `finishing-a-development-branch` (`plano.md`). 3. `to-spec` e `to-tickets` (manter a sabatina como skill). 4. `/security-review` como revisão própria padrão. 5. `handoff` e `security-auditor`.

## Substituto do claude-mem
Arquivos de `.scratch` e `/situação` (já fazem), memória automática nativa e busca nas transcrições do app desktop. Sem substituto pesado.

## Proposta v2.1 da cópia mestra
Retirar claude-mem e Apple Design; `implement`, plano, revisão e handoff/auditor como regras; `to-spec` e `to-tickets` numa segunda rodada. Aguarda decisão do usuário.
