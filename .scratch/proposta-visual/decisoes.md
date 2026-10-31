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

## Estado de cada decisão (atualizado em 2026-10-30)

Este é o **único documento** da redesenho: o que foi decidido (acima) e o que já está no código ou falta (aqui). Ao concluir algo, mude a coluna "Estado" e a data. O resto do projeto fica no `backlog.md`.

**Feito** = no código e conferido. **Falta** = ainda não existe na tela.

| # | Decisão | Estado | O que falta |
|---|---|---|---|
| 1 | Moldura grafite e branca (faixa lateral escura, barra superior branca) | Feito | Barra superior só com título, busca, sino e avatar (sem Quadro \| Lista); faixa lateral com Processos, Setores, Painel, Administração e Ajuda (itens 9 e 16 abaixo) |
| 2 | Selo do setor em branco sobre cor forte (12 cores) | Feito (2026-10-30) | Nome do setor ao passar o mouse e para o leitor de tela já vale no cartão do Quadro; falta na Lista, no verso e nas linhas de grupo (a lista de processos não traz o nome do setor) |
| 2 | Prazo em vermelho (atrasado) e laranja (perto de vencer) | Parcial | Dias parado e relatório pendente já são ícone + texto sem fundo (2026-10-30). Falta o prazo em si: o cartão não recebe essa data (exige mudar a view do banco) |
| 3 | Azul-claro para escolhido; azul cheio só na ação principal | Feito | — |
| 4 | Etiqueta só por ícone, com legenda uma vez no cabeçalho | Parcial | Ícone feito; falta a legenda na faixa de controles e decidir os nomes "Iniciado/Finalizado" (código diz "Em andamento/Concluído") |
| 5 | Situação em selo discreto (exceções em destaque) | Feito | — |
| 6 | Ícones: um por etapa e um por informação do cartão | Parcial | Ícones do rodapé do cartão (dias, relatório) feitos em 2026-10-30. Faltam o ícone por etapa (o catálogo não guarda ícone) e o contador de arquivos (o cartão não recebe a contagem; exige a view do banco) |
| 7 | Faixa de controles de 56px com botão "Filtros" e contador | Falta | Hoje são cinco seletores soltos num bloco branco |
| 8 | Cartão com nome em destaque e versão no rodapé | Parcial | Responsável como "Você" |
| 8 | "Destacar os meus" (esmaece, não esconde) | Falta | Hoje "Só os meus" filtra e esconde |
| 8 | Interruptor "Linhas: Nenhuma \| Setor \| Responsável" | Falta | Hoje "Agrupar por: Etapa \| Responsável \| Setor" troca a visão inteira |
| 8 | Nas linhas por setor, só a sigla com nome ao passar o mouse | Falta | Depende de "Linhas" |
| 9 | Verso: janela fixa 880 × 740, trilha de etapas, avisos lado a lado | Feito | — |
| 9 | Verso enxuto: sem abas, miniatura grande, anotações com o dobro do espaço, histórico no "···" | Falta | Estrutura do verso ainda é a antiga |
| — | Cabeçalho da coluna: plaqueta só com o nome, contagem, "+" e "⋮", descrição abaixo | Parcial | Descrição fora da plaqueta feita em 2026-10-30; falta o ícone da etapa |
| — | Avatar: iniciais cinza para os outros, "sem responsável" tracejado, tamanhos 20/24/32 | Feito (2026-10-30) | O tracejado aparece no Agora do verso; o cartão do Quadro segue com o texto "Sem responsável" (decisão da spec: cartão sem avatar) |
| — | Trilha de 8 tracinhos (atual azul, feitas cinza-azulado) | Feito (2026-10-30) | — |
| — | "Mostrar" num segmento (Em andamento \| Concluídos \| Cancelados \| Todos) | Falta | — |
| — | Criar setor numa janela de 520px | Falta | Hoje é página de formulário |
| — | Selo de tipo de arquivo em mono; quadradinho do macroprocesso sai das caixas | Falta | — |
| — | Lista, cadastros e histórico (tabela, grupos, cabeçalhos) | Feito | — |
| — | DESIGN.md refeito | Feito (2026-10-30) | `.impeccable/design.json` ainda descreve a identidade antiga (`/impeccable document`) |

### Como seguir, nesta ordem

1. **`/demanda` — acabamento visual, sem mudar regra** (feito em 2026-10-30, salvo prazo e contador de arquivos, que dependem da view do banco): selo com nome, rodapé do cartão com ícones, avatar, cabeçalho da coluna, trilha de tracinhos.
2. **`/demanda` — ajustes pequenos**: "Destacar os meus", "Mostrar" em segmento, janela de novo setor, nomes das etiquetas, quadradinho do macroprocesso, ícone/legenda.
3. **`/planejar` — uma funcionalidade só, "Quadro igual à proposta 6"**: faixa de controles com "Filtros", "Linhas", barra superior e faixa lateral novas, verso enxuto, ícone por etapa. Fonte: este arquivo + `proposta-6.html`, `verso-3.html` e `.scratch/identidade-visual.md` (valem as medidas dele, base 14px).
4. **Manutenção, sem mudança visual**: dividir o `Quadro.css` (passou de 300 linhas), ADR das 12 cores em `corDoSetor.ts`, uma função só para a conversão da cor 1–30 → 1–12, `/impeccable document`.

**Fora do redesenho:** possível defeito no histórico ("Moveu o processo" sem as etapas de → para; `/demanda`, bug), e o que depende de você (olhar o app com o login real, conferir o Catálogo de etapas, escolher o responsável inicial de cada etapa).
