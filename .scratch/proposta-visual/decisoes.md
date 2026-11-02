# Redesenho visual: decisões e estado (2026-10-30)

Resultado da sessão de conversa de 2026-10-30. Os protótipos são descartáveis, em HTML, com dados inventados. **Este é o único documento do redesenho:** diz qual proposta vale, o que o usuário decidiu e, na seção "Estado de cada decisão", o que já está no app e o que falta.

## O que vale

| Tela | Arquivo de referência | Imagens |
|---|---|---|
| Quadro | `proposta-6.html` | `proposta-6-*.png` |
| Lista e cadastros (Setores, Macroprocessos, Histórico) | `lista-e-cadastros.html` | `cadastros-*.png` |
| Verso do cartão | `verso-3.html` | `verso-3-*.png` |

As propostas 1 a 5 do quadro, `quadro.html`, a verso-1 e a verso-2 são etapas do caminho; não valem como referência.

Análises que justificam as escolhas:
- `.scratch/analise-de-design-2026-10-30.md`
- `.scratch/analise-de-design-lista-e-cadastros-2026-10-30.md`
- `.scratch/analise-de-design-verso-do-cartao-2026-10-30.md`

## Regras decididas pelo usuário

1. **Estrutura:** a de hoje (barra em cima, faixa lateral estreita só com ícones), mas com cores neutras: faixa lateral grafite escura e barra superior branca. A barra azul cheia sai.
2. **Cor viva só em pontos pequenos dentro do conteúdo.** As cores pastel dos setores, consideradas infantis, saem.
   - **Setor:** selo com a sigla em branco sobre cor forte. Paleta sem vermelho, âmbar, verde e azul, que dizem prazo e situação.
   - **Prazo:** vermelho quando atrasado, laranja quando perto de vencer.
3. **Selecionado ou ligado:** azul-claro com texto azul. O **azul cheio é só da ação principal** da tela ("Cadastrar processo", "Registrar revisão" etc.).
4. **Etiqueta da etapa só por ícone, sem texto:** ○ A fazer, ◐ Iniciado (azul), ✓ Finalizado (verde). Nome ao passar o mouse e para leitor de tela; legenda uma vez só no cabeçalho do quadro.
5. **Etiqueta ≠ situação do processo** (`CONTEXT.md`). Situação é em andamento, suspenso, cancelado ou concluído. Na Lista, "Em andamento" aparece discreto e as exceções em destaque.
6. **Muitos ícones:** um por etapa, um por informação do cartão (responsável, versão, dias, prazo, arquivos).
7. **Cabeçalho do quadro em faixa própria**, com altura fixa e nada mudando de lugar quando um filtro liga. Os filtros ficam num botão "Filtros" com contador.
8. **Quadro:**
   - O cartão mostra o nome do processo em destaque e a versão no rodapé.
   - "Destacar os meus" esmaece os cartões dos outros em vez de escondê-los.
   - O interruptor **"Linhas: Nenhuma | Setor | Responsável"** separa os cartões em faixas.
   - Nas linhas por setor, só a sigla, com o nome ao passar o mouse.
9. **Verso do cartão (verso-3):**
   - Enxuto, sem abas, com tamanho fixo de cerca de 880 × 740. O usuário fixou que o verso não cresce.
   - Trilha horizontal das etapas com nomes.
   - Etiqueta em três ícones e responsável com "Trocar".
   - Avisos lado a lado.
   - Miniatura grande do fluxograma, com os arquivos em lista vertical.
   - Anotações com o dobro do espaço.
   - **Histórico no menu "···"**, abrindo no lugar do processo com "Voltar ao processo".

## Em aberto ou para depois

- **Matriz.** Etapas nas colunas e setores nas linhas: registrada no `backlog.md`. O interruptor "Linhas" da proposta 6 já é o primeiro passo dela. Tirar o "Quadro por setor" só depois de ver o uso.
- **Possível defeito no histórico do processo:** os registros "Moveu o processo" não mostram a etapa de → para (visto em 2026-10-30, causa não investigada).
- **DESIGN.md.** Refeito em 2026-10-30 para a identidade nova.

## Revisto na `/concepcao-livre` (2026-10-30)

- **Regra 2, cores do setor:** o usuário liberou vermelho, âmbar, verde e azul para os selos. Ficaram 12 cores fortes (vermelho trocado por bordô, para não se confundir com o prazo atrasado), em ciclo sobre os números 1 a 30 do banco, sem migração.
- **Escala:** base de 14px (os protótipos usam 13px; o app usava 15px).
- A identidade completa está em `.scratch/identidade-visual.md`.

## Estado de cada decisão (atualizado em 2026-11-02)

Este é o **único documento** da redesenho: o que foi decidido (acima) e o que já está no código ou falta (aqui). Ao concluir algo, mude a coluna "Estado" e a data. O resto do projeto fica no `backlog.md`.

**Feito** = no código e conferido. **Falta** = ainda não existe na tela.

| # | Decisão | Estado | O que falta |
|---|---|---|---|
| 1 | Moldura grafite e branca (faixa lateral escura, barra superior branca) | Feito (2026-10-31) | — (barra de cima com título, busca e sino "Em breve" e avatar; faixa lateral com Processos, Setores, Painel e Ajuda "Em breve" e Administração; ticket 01 do redesenho-do-quadro) |
| 2 | Selo do setor em branco sobre cor forte (12 cores) | Parcial | Nome do setor ao passar o mouse e para o leitor de tela vale no cartão e nas Linhas por setor; falta na Lista, no cabeçalho do verso e nas linhas de grupo (conferido no código em 2026-11-02) |
| 2 | Prazo em vermelho (atrasado) e laranja (perto de vencer) | Parcial | Dias parado e relatório pendente já são ícone + texto sem fundo (2026-10-30). O prazo em si entra com os prazos da v1.5 (backlog) |
| 3 | Azul-claro para escolhido; azul cheio só na ação principal | Feito | — |
| 4 | Etiqueta só por ícone, com legenda uma vez no cabeçalho | Feito (2026-10-31) | — (legenda na faixa de controles, fora da Lista) |
| 5 | Situação em selo discreto (exceções em destaque) | Feito | — |
| 6 | Ícones: um por etapa e um por informação do cartão | Parcial | Ícone por etapa feito em 2026-10-31 (ticket 03). Falta o contador de arquivos (exige a contagem na view do banco; backlog, 2026-10-31) |
| 7 | Faixa de controles de 56px com botão "Filtros" e contador | Feito (2026-10-31) | — (ticket 01) |
| 8 | Cartão com nome em destaque e versão no rodapé | Feito (2026-10-31) | — ("Você" no cartão, ticket 03) |
| 8 | "Destacar os meus" (esmaece, não esconde) | Feito (2026-10-31) | — (ticket 02, ADR 0037) |
| 8 | Interruptor "Linhas: Nenhuma \| Setor \| Responsável" | Feito (2026-10-31) | — (ticket 03) |
| 8 | Nas linhas por setor, só a sigla com nome ao passar o mouse | Feito (2026-10-31) | — (ticket 03) |
| 9 | Verso: janela fixa 880 × 740, trilha de etapas, avisos lado a lado | Feito | — |
| 9 | Verso enxuto: sem abas, miniatura grande, anotações com o dobro do espaço, histórico no "···" | Feito (2026-11-02) | — (tickets 04 e 05). "Versões anteriores" e "Outros anexos" ficaram empilhados, não lado a lado como na verso-3 (backlog, 2026-11-01) |
| — | Cabeçalho da coluna: plaqueta só com o nome, contagem, "+" e "⋮", descrição abaixo | Feito (2026-10-31) | — (ícone da etapa no ticket 03) |
| — | Avatar: iniciais cinza para os outros, "sem responsável" tracejado, tamanhos 20/24/32 | Feito (2026-10-30) | O tracejado aparece no Agora do verso; o cartão do Quadro segue com o texto "Sem responsável" (decisão da spec: cartão sem avatar) |
| — | Trilha de 8 tracinhos (atual azul, feitas cinza-azulado) | Feito (2026-10-30) | — |
| — | "Mostrar" num segmento (Em andamento \| Concluídos \| Cancelados \| Todos) | Feito (2026-10-31) | — (virou o controle "Situação: Todos \| Em andamento \| Suspensos \| Concluídos \| Cancelados" na Lista e no Quadro por setor, ticket 02) |
| — | Criar setor numa janela de 520px | Feito (2026-10-30) | — |
| — | Selo de tipo de arquivo em mono; quadradinho do macroprocesso sai das caixas | Feito (2026-11-01) | — (no verso, com a lista de arquivos do verso enxuto) |
| — | Lista, cadastros e histórico (tabela, grupos, cabeçalhos) | Feito | — |
| — | DESIGN.md refeito | Parcial | `.impeccable/design.json` ainda descreve a identidade antiga (sem mudança desde 2026-10-07; falta o `/impeccable document`) |

Nada da tabela foi visto com o login real: os critérios `[visual]` 14 a 18 do redesenho seguem presumidos (ressalva da entrega de 2026-11-02).

### Como seguir, nesta ordem

1. **`/demanda` — acabamento visual, sem mudar regra** (feito em 2026-10-30, salvo prazo e contador de arquivos, que dependem da view do banco): selo com nome, rodapé do cartão com ícones, avatar, cabeçalho da coluna, trilha de tracinhos.
2. **`/executar-simples` — ajustes pequenos** (feito em 2026-10-30; classificado no `/demanda` do mesmo dia): quadradinho do macroprocesso sai das caixas, selo do tipo de arquivo em mono, legenda das etiquetas no cabeçalho do Quadro, janela de 520px para criar setor. Os nomes das etiquetas já estavam feitos.
3. **`/planejar` — uma funcionalidade só, "Quadro igual à proposta 6"** (feito: funcionalidade `redesenho-do-quadro`, cinco tickets, entregue em 2026-11-02; mudança em funcionalidade existente): faixa de controles com "Filtros", "Linhas", "Destacar os meus" (esmaecer em vez de esconder) e "Mostrar" em segmento com Cancelados (os dois mudam regra já decidida e pedem ADR novo), barra superior e faixa lateral novas, verso enxuto, ícone por etapa (exige migração no Catálogo). Fonte: este arquivo + `proposta-6.html`, `verso-3.html` e `.scratch/identidade-visual.md` (valem as medidas dele, base 14px).
4. **Manutenção, sem mudança visual** (falta, conferido em 2026-11-02): dividir o `Quadro.css` (544 linhas), ADR das 12 cores em `corDoSetor.ts` (a decisão só está em `.scratch/identidade-visual.md`), `/impeccable document`. A conversão da cor 1–30 → 1–12 já é uma função só (`corDoSetor`).

**Fora do redesenho:** possível defeito no histórico ("Moveu o processo" sem as etapas de → para; `/demanda`, bug), e o que depende de você (olhar o app com o login real, conferir o Catálogo de etapas, escolher o responsável inicial de cada etapa).
