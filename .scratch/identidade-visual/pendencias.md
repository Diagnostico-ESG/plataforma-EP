# Pendências da identidade visual (2026-10-30)

A identidade "Grafite e branco, cor em ponto" já está no código e polida. Este arquivo lista **só o que falta dela**, na ordem em que deve ser feito. Marque `[x]` e a data ao concluir. Outras coisas do projeto ficam no `.scratch/backlog.md`.

## Passo 1 — `/demanda` (lote de acabamento visual, sem mudar regra)

Rode `/demanda` e cole: "Acabamento visual da identidade nova: itens 1 a 5 de `.scratch/identidade-visual/pendencias.md`".

- [ ] 1. **Selo do setor com nome:** ao passar o mouse e para o leitor de tela, o selo diz o nome do setor (hoje só a sigla).
- [ ] 2. **Rodapé do cartão:** dias e prazo com ícone, o prazo em vermelho (atrasado) ou laranja (perto de vencer), no lugar das pílulas com fundo; contador de arquivos.
- [ ] 3. **Avatar:** iniciais dos outros usuários em cinza (`#4A5163` sobre `#E9ECF1`), "sem responsável" com círculo tracejado, tamanhos 20/24/32.
- [ ] 4. **Cabeçalho da coluna:** plaqueta só com o nome da etapa e a descrição abaixo dela, em cinza.
- [ ] 5. **Trilha de 8 tracinhos:** etapa atual em azul, etapas feitas em cinza-azulado, futuras em cinza-claro (hoje é uma cor só).

## Passo 2 — `/demanda` (ajustes pequenos de comportamento)

Um `/demanda` por item, ou todos juntos se o `/demanda` achar que cabem.

- [ ] 6. **"Destacar os meus":** esmaece os cartões dos outros, em vez de esconder (hoje "Só os meus" filtra).
- [ ] 7. **"Mostrar" em um segmento só:** Em andamento | Concluídos | Cancelados | Todos (hoje só "Todos | Concluídos").
- [ ] 8. **Criar setor numa janela** de 520px (hoje é uma página de formulário).
- [ ] 9. **Navegação:** tirar Quadro | Lista da barra superior e juntar "Quadro" e "Lista" num item "Processos" da faixa lateral.
- [ ] 10. **Nomes das etiquetas:** a identidade diz "Iniciado" e "Finalizado"; o código diz "Em andamento" e "Concluído". Conferir com o `CONTEXT.md` e decidir qual vale.
- [ ] 11. **Quadradinho de cor do macroprocesso** nas caixas de seleção: tirar, como a identidade manda.

## Passo 3 — `/planejar` (comportamento novo maior; pede spec)

Rode `/planejar` com: "Quadro com interruptor Linhas, botão Filtros e verso enxuto, conforme `.scratch/identidade-visual/pendencias.md`". É uma funcionalidade só, porque as três partes se tocam.

- [ ] 12. **Interruptor "Linhas: Nenhuma | Setor | Responsável":** as etapas ficam sempre nas colunas; setor e responsável viram faixas. Substitui "Agrupar por" e o "Quadro por setor".
- [ ] 13. **Botão "Filtros" com contador**, numa faixa de controles de 56px de altura fixa, branca, só com borda inferior (hoje são cinco seletores soltos).
- [ ] 14. **Verso enxuto:** sem abas, miniatura grande do fluxograma, anotações com o dobro do espaço, histórico no menu "···" com "Voltar ao processo".
- [ ] 15. **Ícone por etapa do catálogo:** o catálogo não guarda ícone; decidir como guardar (até lá, ícone genérico).
- [ ] 16. **Selo de tipo de arquivo** (BPMN, PNG, PDF…) em mono, e **busca e avisos** na barra superior.

## Passo 4 — manutenção (sem mudança visual; pode ficar para um intervalo)

- [ ] 17. Dividir o `src/components/processos/Quadro.css` (passou de 300 linhas) em Quadro e Lista.
- [ ] 18. ADR curto: as 12 cores do setor ficam em `src/cadastros/corDoSetor.ts` (ligadas ao número do banco), e não em `tokens.css`.
- [ ] 19. Concentrar numa função a conversão da cor 1–30 do banco para 1–12 da tela (hoje em `corDoSetor`, `coresEmUso` e `GradeDeCores`).
- [ ] 20. `/impeccable document`: o `.impeccable/design.json` ainda descreve a identidade antiga.

## Fora desta lista (já existiam)

- Possível defeito no histórico: "Moveu o processo" sem as etapas de → para (`/demanda`, bug).
- Seus: olhar o app com o login real; conferir o Catálogo de etapas; escolher o responsável inicial de cada etapa.
