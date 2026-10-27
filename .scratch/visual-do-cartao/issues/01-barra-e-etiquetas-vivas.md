# 01: Barra de etapas e etiquetas com cor viva

**What to build:** o cartão deixa de parecer "sem vida" sem esperar pela cor do setor. A barra da etapa vira uma faixa contínua lisa, sem divisões, que se preenche da esquerda até a etapa atual em degradê do azul claro ao azul escuro, sobre um trilho cinza claro (em Não iniciados só o primeiro trecho; em Concluídos, cheia). Ela aparece onde já aparece: cartão do Quadro por responsável e por setor, coluna "Etapa atual" da Lista e Processos do setor; continua fora do Quadro por etapa. O texto "Nome · n de N" e o nome acessível "Etapa n de N: Nome" não mudam. A etiqueta ganha cor viva: A fazer em violeta cheio com texto e bolinha brancos, Em andamento em laranja vivo, Concluído em verde vivo, no cartão, na Lista e nas opções da etiqueta no Agora. As pílulas de Situação ficam como estão. Sem mudança no banco. Regras completas na seção "Visual do cartão" da spec de `processos-etapas` (histórias 25 a 43) e no ADR 0030; tons e medidas no acréscimo de 2026-10-27 em `.scratch/identidade-visual.md`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A função da barra devolve a fração preenchida (posição sobre total, Concluídos cheia) com o texto e o nome acessível de hoje; os estados de bloco deixam de existir; testes unitários em Não iniciados, no meio, em Concluídos e com etapa desativada no catálogo.
- [ ] O componente da barra desenha trilho e preenchimento em degradê (8px, cantos redondos); os lugares que o usam não mudam; testes de tela da barra (cartão, Lista, Processos do setor) passam com o texto e o nome acessível.
- [ ] Os três pares de tokens da etiqueta (fundo, texto, bolinha) passam aos valores da identidade, com contraste AA; testes das etiquetas no cartão, na Lista e no Agora conferem texto e cor de cada valor.
- [ ] Pílulas de Situação, selo e faixa do processo parado sem mudança.
- [ ] `npm test` verde.
- [ ] `[visual]` A barra é uma faixa lisa em degradê azul, cheia em Concluídos, sem estourar a largura no cartão, na Lista e em Processos do setor.
- [ ] `[visual]` A fazer em violeta cheio é a etiqueta mais destacada do cartão; Em andamento e Concluído vivos, sem confundir com as pílulas de Situação.
