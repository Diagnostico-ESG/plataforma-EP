# Desvios de redesenho-do-quadro

## 2026-11-02 — /polir (tickets 01 a 05)

**Auditoria (`/impeccable audit`):** o detector rodou nos 48 arquivos de tela e estilo que o redesenho mexeu e achou 0 problemas, mais 1 aviso. A miniatura do verso foi vista na vitrine local (módulos falsos) a 1366×768.

**Corrigido:**
- [P2, acessibilidade] Texto "Sem imagem (.png) nesta versão" e "Não foi possível carregar a imagem." herdavam o cinza do ícone (`--icone-inativo`), sem contraste de texto sobre o fundo do quadro. Passaram ao `--texto-2` (`VersaoEmDestaque.css`).
- [P3, consistência] A data da etapa na trilha usava `font-size: 10px`, fora da escala de tipos do `DESIGN.md`; passou a `--tam-selo` (11px). Trilha conferida na vitrine: continua cabendo em uma linha (`Etapas.css`).
- [P3, clareza] O botão da miniatura ganhou a dica "Abrir o .png inteiro" e o cursor de mão (era lupa, mas o clique abre uma aba).

**Deixado de fora:**
- Imagem corrompida que o navegador não consegue decodificar deixa o quadro vazio em vez de mostrar o aviso de erro. O servidor só entrega o .png enviado pelo EP, e o caso não está nos critérios; trate se aparecer.
- Imagem real não vista: a vitrine devolve texto no lugar do .png, então só o texto alternativo apareceu. O visual com a imagem de verdade, o tamanho de 11rem × 8rem para um fluxograma largo e o login real ficam como ressalva para o `/ship`.
- Celular: o verso é janela fixa de 880 × 740, uso interno em desktop (PRODUCT.md); responsivo não foi tratado.

## 2026-11-02 — /ship (revisão do diff desde `marco/2026-10-31-inicio-redesenho-do-quadro`)

Revisão de padrões e de spec sobre os 25 commits da funcionalidade (dois revisores independentes).

**Corrigido, cada um com teste de regressão:**
- Arrastar um cartão até a borda do Quadro com Linhas não rolava o Quadro (só o Quadro sem Linhas rolava). `MatrizDoQuadro` passou a receber o mesmo tratamento (`App.linhasDoQuadro.test.tsx`).
- O botão [Registrar publicação] do cabeçalho do verso sumia se a leitura das revisões falhasse, sem relação com a regra da etapa. Agora só a revisão e a aprovação esperam essa leitura (`App.publicarSemRevisoes.test.tsx`).
- Imagem baixada que o navegador não consegue desenhar deixava o quadro da miniatura vazio. Agora mostra "Não foi possível carregar a imagem." (`App.miniaturaDoFluxograma.test.tsx`). Isso fecha o item que o `/polir` tinha deixado de fora.

**Deixado como está, por decisão já registrada ou por não ser defeito (a confirmar por você nas "Decisões a confirmar"):**
- Rótulo "Etapa" no seletor do Agora no lugar de "Mover para" (história 66), pílula de situação fora do cabeçalho (história 62) e [Registrar revisão] só enquanto a passagem não tem revisão (história 63): decisões do `plano-04.md`.
- História 72: sem versão, a frase "Nenhuma versão enviada ainda" fica acima e [Enviar versão] na linha do título da seção, não dentro do quadro da miniatura.
- História 42: na Lista, o filtro da coluna Situação continua existindo quando o controle Situação está em "Todos" (volta sem Cancelado). Há duas formas de filtrar por situação; o teste existente prova esse comportamento de propósito.
- História 41: o aviso para leitor de tela do cartão esmaecido diz "Processo de outra pessoa." também para o processo sem responsável (o esmaecimento vale para os dois).
- Os dois [Limpar filtros] diferem: o do painel de Filtros limpa só os filtros, o da frase de vazio também volta a Situação para Todos.
- Extras que ninguém pediu: o painel de Filtros fecha também ao sair com Tab, e a Lista tem [Limpar filtros] na faixa.

**Padrões (só juízo, nenhuma violação dura; nada mudado por ora):** `ColunaDoQuadro` e `QuadroDeProcessos` ficam grandes e repassam o mesmo grupo de props (`ContextoDoQuadro` seria o nome de um tipo para elas); o número `4000` do aviso "Solte o cartão na mesma linha." está solto em `QuadroDeProcessos`; a decisão "Você" aparece em `CartaoDoProcesso` e em `MatrizDoQuadro`; o filtro de processos da linha se repete em duas células da `MatrizDoQuadro`; `LinhasDoQuadro` e `TipoDeLinha` se sobrepõem; `enderecoDosProcessos.ts` (193 linhas) guarda endereço, filtros e rótulos de tela. Vão para o backlog.

**Revisão de segurança do código (2026-11-02):** o `/security-review` rodou, mas não achou mudanças a revisar (a `main` já estava integrada); foi feita a revisão de reserva, menos completa, sobre o código desde o marco de início. Parâmetros de endereço (`linhas`, `destacar`, `mostrar` e filtros) viram valores fixos sem chegar a HTML, endereço ou banco; o endereço guardado em `sessionStorage` só é gravado pelo próprio aplicativo (só alterável com XSS já existente); a miniatura mostra o .png por `<img>` com endereço `blob:` liberado ao fechar. Nenhum achado. `security-auditor` não rodou: o `package.json` não mudou e `.scratch/security.md` já existe.

**Correção das Linhas do Quadro (2026-11-03, bug visto pelo usuário no app real):** o Quadro por etapa com Linhas por Setor aparecia quebrado (cabeçalhos com larguras soltas, selo e contagem da linha espalhados, cartões desalinhados). Causa: `Matriz.css` define `.quadro-matriz { display: grid }` e `Quadro.css` define `.quadro-colunas { display: flex; overflow-y: hidden }`, com a mesma força; o `Quadro.css` é carregado depois (`QuadroDeProcessos.tsx` importa a matriz antes dele) e vencia, tanto no desenvolvimento quanto no build (confirmado na ordem do CSS gerado). A spec estava certa; o código divergia dela desde o commit `ad3b831` (o critério `[visual]` 15 foi só presumido na vitrine). Correção: seletor `.quadro-colunas.quadro-matriz`, com teste de regressão (`Matriz.css.test.ts`, que lê o texto do CSS porque o jsdom não monta a cascata) e `Matriz` na lista `css.include` do `vite.config.ts`. Marco `marco/2026-11-03-antes-correcao-linhas-do-quadro`. **Presumido:** o resultado na tela com o login real (critério `[visual]` 15) não foi visto. Risco de uso anotado pela revisão: arrastar um cartão até a borda de cima ou de baixo não rola a matriz na vertical (só a horizontal), em matriz alta.
