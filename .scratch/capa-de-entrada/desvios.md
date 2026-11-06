# Desvios — capa-de-entrada

## 2026-11-06 — /executar-simples e revisão

- O botão "Entrar com a conta institucional" ficou mais alto (44px, fonte 15px), como na prévia aprovada; a spec dizia "igual ao de hoje" (texto e comportamento continuam iguais).
- Tamanhos novos `--tam-capa-titulo` (34px) e `--tam-capa-frase` (17px) em `tokens.css`, fora da escala das telas de dentro, só para a capa.
- Azul dentro da ilustração (linha tracejada, contorno do cartão em destaque, avatar "meu", uma pílula): exceção à regra do azul, registrada em `.scratch/identidade-visual.md` (Registro de mudanças, 2026-11-06).
- O Vitest devolvia vazio o CSS da tela de entrada (lista `css.include` do `vite.config.ts`), e o teste das cores passava sem conferir; `TelaDeEntrada` entrou na lista.

## 2026-11-06 — /polir (audit 17/20 e polish)

Corrigidos:
- [P2] O Status dos cartões da capa era desenhado à parte (metade esquerda cheia; concluído sem visto) e destoava do ícone da plataforma. Agora usa o desenho real (`DesenhoDaEtiqueta`, exportado de `EtiquetaDoProcesso.tsx`).
- [P3] Fonte de 20px do selo EP fora da escala: volta a `var(--tam-painel)`.
- [P3] Canto de 10px das colunas da ilustração fora da escala: `var(--canto)`.

Deixados de fora:
- [P3] Em janelas com menos de cerca de 700px de altura, o Quadro da ilustração fica mais cortado embaixo (posição fixa). É decorativo e não atrapalha o login.

Conferido: 1440×900 igual à prévia `capa-b.png`; 390px sem rolagem lateral, com a ilustração escondida (medido no navegador). Presumido: as mensagens de recusa e de falha vistas na tela a 1366×768 (só pelo teste da tela, que confere a falha dentro da coluna do login; sem login real não dá para provocá-las no app).

## 2026-11-06 — troca da ilustração (variante M), depois do /polir

- Por decisão do usuário, depois de ver o resultado no app, a ilustração da capa troca da variante B (Quadro inclinado com as 8 etapas em ícone) pela M: fluxograma em marca d'água ocupando o painel (alto, meio e baixo), linha azul tracejada e três colunas de frente, com 3, 2 e 1 cartões, cada uma terminando no último cartão, cabeçalho liso sem ícone e fundo opaco com sombra. A spec foi atualizada no mesmo arquivo; a prévia aprovada passa a ser `capa-m.png`. Variantes vistas e recusadas no caminho: F a L (`previa.html?v=f` a `?v=l`).
- A coluna do login, os textos, o botão e as mensagens não mudam. A linha `Implementado em` anterior (commit e76b6a3) vale para a variante B; a nova implementação grava a sua.

## 2026-11-06 — /polir da variante M (audit 18/20 e polish)

Corrigido:
- [P2] Entre 900 e cerca de 1100px de largura de janela, o quadro de três colunas encostava nas bordas do painel da ilustração (a 920px, 2px de folga). Abaixo de 1100px ele passa a `scale(0.9)`: a 920px, 50px de folga de cada lado (medido no navegador).

Deixado de fora:
- [P3] Cabeçalho das colunas com 30px de altura, fora da escala de espaçamento: é a medida da prévia aprovada e só existe na ilustração.

Conferido: 1440×900 e 1366×768 iguais a `capa-m.png`; 920×640 e 1280×600 sem corte nem rolagem lateral. Presumido (continua): as mensagens de recusa e de falha vistas na tela a 1366×768.

## 2026-11-06 — /ship

- Revisão de código do diff inteiro (desde `marco/2026-11-06-inicio-capa-de-entrada`, só os arquivos da capa): sem violação dura, sem requisito faltando e sem código morto. Pontos de julgamento deixados como estão:
  - sombra nas colunas e nos cartões da ilustração, quando a identidade diz "cartões sem sombra": é a profundidade da prévia aprovada e vale só dentro da ilustração decorativa (registrado agora em `.scratch/identidade-visual.md`);
  - o quadro fica em `scale(1.1)` nas telas largas (medida da prévia `capa-m.png`, não citada na spec) e em `scale(0.9)` abaixo de 1100px (do `/polir`);
  - medidas soltas que repetem tokens (15px do botão, cantos de 4px e 6px na ilustração) e a seta do alto que termina sem forma, herdada do desenho da B;
  - os testes de CSS acham as regras por expressão regular (frágil a reformatação; aceito, porque o jsdom não calcula layout).
- Revisão de segurança do código dispensada: a mudança é só aparência da tela de entrada (componentes de desenho e CSS), sem mexer no login, nas permissões, em dado pessoal, em dado que chega de fora nem no banco. As mensagens de recusa continuam vindo de `mensagemDaRecusa`, sem mudança.
- `security-auditor` não rodou: `package.json` não mudou e `.scratch/security.md` existe.
