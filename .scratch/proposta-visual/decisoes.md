# Redesenho visual: decisões do usuário (2026-10-30)

Resultado da sessão de conversa de 2026-10-30. São protótipos descartáveis em HTML, com dados inventados; nada foi implementado no app. Este arquivo diz qual proposta vale e o que o usuário decidiu.

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
- **DESIGN.md.** Descreve a identidade antiga (barra azul, cores pastel); precisa ser refeito para a nova direção.
