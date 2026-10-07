---
name: Plataforma do EP
description: Quadro de etapas do Escritório de Processos, com uma única linha azul acesa no que está em foco.
colors:
  azul: "#3a5afe"
  azul-claro: "#e8edff"
  azul-escuro: "#2a44c9"
  azul-avatar: "#d9dfff"
  fundo: "#edf1f9"
  folha: "#ffffff"
  linha: "#e1e6ef"
  linha-tracejada: "#c3cad8"
  barra-coluna-trilho: "#d5dbe7"
  barra-coluna: "#9aa6be"
  texto: "#1e2433"
  texto-2: "#5d6577"
  icone-inativo: "#8c93a3"
  branco-sobre-azul-borda: "rgb(255 255 255 / 45%)"
  branco-sobre-azul-hover: "rgb(255 255 255 / 16%)"
  atraso-texto: "#a8263a"
  atraso-fundo: "#fce1e4"
  vencendo-texto: "#8a5a00"
  vencendo-fundo: "#ffe9c7"
  aprovado-texto: "#22703a"
  aprovado-fundo: "#ddf3e1"
  neutra-texto: "#4a5163"
  neutra-fundo: "#eef0f4"
  ajuda-fundo: "#eef2ff"
  ajuda-borda: "#c9d3ff"
  pendencia-fundo: "#fff6e5"
  pendencia-borda: "#f3d28f"
  tipo-fluxograma: "#8cc4ea"
  tipo-relatorio: "#b7a5ec"
  tipo-reuniao: "#e9cf7a"
  tipo-email: "#f2a08c"
  macro-violeta: "#8e4ec6"
  macro-ciano: "#0797b9"
  macro-magenta: "#d6409f"
  macro-indigo: "#5b5bd6"
  macro-oliva: "#7a8b2e"
  macro-cobre: "#a0663a"
  icone-dias: "#c77700"
typography:
  pagina:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.45
  painel:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.45
  coluna:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.45
  base:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  secundario:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
  rotulo:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.5px"
  mono:
    fontFamily: "'IBM Plex Mono', ui-monospace, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  canto: "6px"
  canto-botao: "4px"
  canto-macro: "2px"
  redondo: "999px"
spacing:
  esp-1: "4px"
  esp-2: "8px"
  esp-3: "12px"
  esp-4: "16px"
  esp-5: "24px"
  esp-6: "32px"
  largura-faixa: "56px"
components:
  botao-principal:
    backgroundColor: "{colors.azul}"
    textColor: "{colors.folha}"
    typography: "{typography.base}"
    rounded: "{rounded.canto-botao}"
    padding: "0 12px"
    height: "32px"
  botao-principal-hover:
    backgroundColor: "{colors.azul-escuro}"
    textColor: "{colors.folha}"
  botao-secundario:
    backgroundColor: "{colors.folha}"
    textColor: "{colors.texto}"
    typography: "{typography.base}"
    rounded: "{rounded.canto-botao}"
    padding: "0 12px"
    height: "32px"
  botao-icone:
    backgroundColor: "transparent"
    rounded: "{rounded.canto-botao}"
    size: "32px"
  pilula-atraso:
    backgroundColor: "{colors.atraso-fundo}"
    textColor: "{colors.atraso-texto}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.redondo}"
    padding: "2px 8px"
  pilula-vencendo:
    backgroundColor: "{colors.vencendo-fundo}"
    textColor: "{colors.vencendo-texto}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.redondo}"
    padding: "2px 8px"
  pilula-informativa:
    backgroundColor: "{colors.azul-claro}"
    textColor: "{colors.azul-escuro}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.redondo}"
    padding: "2px 8px"
  pilula-aprovado:
    backgroundColor: "{colors.aprovado-fundo}"
    textColor: "{colors.aprovado-texto}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.redondo}"
    padding: "2px 8px"
  pilula-neutra:
    backgroundColor: "{colors.neutra-fundo}"
    textColor: "{colors.neutra-texto}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.redondo}"
    padding: "2px 8px"
  avatar-iniciais:
    backgroundColor: "{colors.azul-avatar}"
    textColor: "{colors.azul-escuro}"
    rounded: "{rounded.redondo}"
    size: "24px"
  barra-superior:
    backgroundColor: "{colors.azul}"
    textColor: "{colors.folha}"
    height: "52px"
  alternancia-opcao:
    backgroundColor: "transparent"
    textColor: "{colors.folha}"
    typography: "{typography.secundario}"
    rounded: "{rounded.redondo}"
    padding: "3px 12px"
  alternancia-opcao-ativa:
    backgroundColor: "{colors.folha}"
    textColor: "{colors.azul}"
  faixa-lateral:
    backgroundColor: "{colors.folha}"
    width: "{spacing.largura-faixa}"
  faixa-item:
    backgroundColor: "transparent"
    textColor: "{colors.icone-inativo}"
    rounded: "{rounded.canto}"
    size: "40px"
  faixa-item-hover:
    backgroundColor: "{colors.fundo}"
    textColor: "{colors.texto-2}"
  faixa-item-ativo:
    backgroundColor: "{colors.azul-claro}"
    textColor: "{colors.azul}"
  bloco-tracejado:
    backgroundColor: "transparent"
    rounded: "{rounded.canto}"
    padding: "32px 24px"
    width: "420px"
---

# Design System: Plataforma do EP

## Overview

**Creative North Star: "O Quadro de Etapas com Linha Acesa"**

Ferramenta de trabalho diário para uma equipe pequena que acompanha processos etapa por etapa. O mundo é um quadro calmo: área de trabalho azul-acinzentada clara, folhas brancas com bordas de 1px quase invisíveis e um único traço azul de 2px, a linha acesa, que marca o que está em foco ou é atual (área ativa da faixa lateral hoje; cartão escolhido, etapa atual, aba ativa e campo com foco quando essas peças existirem). Todo o resto fica quieto para que os alertas de prazo saltem.

A densidade é de ferramenta: base de 13px, passos de espaçamento de 4 a 32px, controles de 32px de altura. A cor saturada aparece só onde carrega informação (situação, tipo de registro, macroprocesso); o azul principal fica reservado à barra superior, à ação principal e à linha acesa. Códigos que a equipe confere (siglas, versões, datas, contagens) usam fonte mono com números tabulares.

A direção foi fixada pelo brief aprovado (`.scratch/identidade-visual.md`, 2026-10-07). A inspiração são editores de fluxo e quadros de processo, só em cor e forma. Recusa explícita: o painel administrativo genérico de cartões com sombra e cores espalhadas. Só tema claro.

**Estado da construção.** O que já existe em código: tokens, fontes, ícones SVG próprios, botões, pílulas, avatar, moldura (faixa lateral + barra superior) e o estado vazio do Quadro. Cartões, colunas, painel de detalhe, caminho de etapas, barrinhas de tipo, quadradinhos de macroprocesso, caixas de aviso e animações estão definidos no brief e, em parte, já como tokens; nas seções abaixo aparecem marcados como **(planejado)**.

**Key Characteristics:**
- Um único destaque azul de 2px (linha acesa) acompanha o foco; nada mais compete com ele.
- Folhas brancas planas com borda de 1px em `linha`; sem sombra em nada que não flutue.
- Cor saturada só com significado, e sempre acompanhada de texto ou rótulo acessível.
- Escala de texto fechada em seis tamanhos (11 a 20px), base 13px.
- Ícones desenhados no projeto: traço 1,75 numa grade de 24, cantos e pontas arredondados.

## Colors

Neutros frios azul-acinzentados com um azul elétrico como única voz, e uma família de pares texto/fundo pastel reservada às situações.

### Primary
- **Azul Elétrico** (`azul`): barra superior, botão principal, linha acesa e contorno de foco. Branco sobre ele tem 5,2:1. Também é a cor do ícone "rodadas" no rodapé do cartão (`icone-rodadas`, planejado).
- **Azul Névoa** (`azul-claro`): fundo do item ativo da faixa lateral, da pílula informativa e da seleção de texto.
- **Azul Tinta** (`azul-escuro`): hover do botão principal, texto sobre `azul-claro` (6,5:1), texto da pílula informativa e iniciais do avatar.
- **Azul Lavanda** (`azul-avatar`): fundo do avatar sem foto (iniciais em `azul-escuro`, 5,8:1).

### Secondary
Pares de situação, sempre texto escuro sobre fundo pastel da mesma família, todos acima de 5:1:
- **Atraso** (`atraso-texto` / `atraso-fundo`): prazo estourado.
- **Vencendo** (`vencendo-texto` / `vencendo-fundo`): prazo perto do fim.
- **Informativa** (`informativa-texto` / `informativa-fundo`, apelidos de `azul-escuro` / `azul-claro`): andamento, aguarda revisor, versão atual.
- **Aprovado** (`aprovado-texto` / `aprovado-fundo`): concluída, aprovada. `icone-versoes` (planejado) é apelido de `aprovado-texto`.
- **Neutra** (`neutra-texto` / `neutra-fundo`): histórica, realizada anteriormente.

### Tertiary (planejado: tokens definidos, sem peça construída)
- **Barrinha por tipo de registro** (`tipo-fluxograma`, `tipo-relatorio`, `tipo-reuniao`, `tipo-email`; `tipo-historica` é apelido de `linha-tracejada`): traço de 3px à esquerda do item; decorativa, o tipo também vem escrito ou no ícone.
- **Macroprocessos** (`macro-violeta`, `macro-ciano`, `macro-magenta`, `macro-indigo`, `macro-oliva`, `macro-cobre`): quadradinho no cartão e etiqueta com nome, sempre com o nome como rótulo acessível.
- **Âmbar dos dias** (`icone-dias`): ícone de relógio no rodapé do cartão, sempre com o número ao lado.
- **Caixas de aviso** (`ajuda-fundo` + `ajuda-borda`; `pendencia-fundo` + `pendencia-borda`): texto sempre em `texto`.

### Neutral
- **Papel Frio** (`fundo`): fundo da área de trabalho e hover dos itens da faixa lateral.
- **Folha** (`folha`): faixa lateral, botões secundários, texto sobre azul, e (planejado) cartões, painel, tabelas e formulários.
- **Linha** (`linha`): bordas e divisórias de 1px, borda direita da faixa lateral, borda do botão secundário.
- **Linha Tracejada** (`linha-tracejada`): borda tracejada do bloco vazio, hover da borda do botão secundário, cor da barra de rolagem.
- **Trilho e preenchimento da coluna** (`barra-coluna-trilho`, `barra-coluna`; planejado): barrinha de proporção sob o nome da coluna.
- **Tinta** (`texto`): texto principal.
- **Tinta Secundária** (`texto-2`): texto secundário e hover dos ícones da faixa (5,9:1 no branco, 5,2:1 no `fundo`).
- **Ícone em Repouso** (`icone-inativo`): ícones inativos da faixa lateral; decorativos, sempre com rótulo acessível (cerca de 3,1:1 no branco, acima do mínimo de 3:1 para elementos de interface).
- **Branco sobre azul** (`branco-sobre-azul-borda`, `branco-sobre-azul-hover`): borda da alternância Quadro | Lista e hover dos ícones da barra.

### Named Rules
**A Regra da Linha Acesa.** O traço azul de 2px (`--linha-acesa`) marca só o que está em foco ou é atual, um por região. Ele compensa o respiro para nada "pular" de lugar.

**A Regra da Cor com Significado.** Cor saturada só onde diz algo: situação nas pílulas, tipo nas barrinhas, macroprocesso nos quadradinhos, contagens no rodapé do cartão. Vermelho, âmbar e verde ficam com a situação (e com os ícones de dias e versões no rodapé do cartão, que o brief liga a prazo e aprovação); por isso macroprocessos e barrinhas de tipo não usam nenhum deles. A cor nunca fala sozinha: sempre há texto ou rótulo acessível.

**A Regra do Branco Translúcido.** Sobre a barra azul, branco translúcido só em borda e em hover de ícone, nunca como fundo atrás de texto: derrubaria o contraste do texto branco.

**A Regra do Arquivo Único.** Códigos de cor só existem em `src/styles/tokens.css`; todo o resto usa as variáveis.

## Typography

**Fonte da interface:** Source Sans 3 (com system-ui, sans-serif), 400 a 700, arquivo variável guardado em `public/fonts/`.
**Fonte mono:** IBM Plex Mono (com ui-monospace, Consolas, monospace), 400 e 500, guardada em `public/fonts/`.

**Character:** Uma sans humanista e legível em tamanhos pequenos para a interface densa, e uma mono técnica para tudo que a equipe confere caractere a caractere. Ambas OFL, servidas pelo próprio projeto.

### Hierarchy
- **Página** (700, 20px): título de página (setor, administração). Planejado.
- **Painel** (700, 16px): "EP" na barra superior; título do painel de detalhe (planejado).
- **Coluna** (600, 14px): título da barra superior, título do estado vazio; título de coluna (planejado).
- **Base** (400 ou 600, 13px, altura de linha 1,45): texto corrente da interface e rótulo dos botões (600); nome do processo no cartão em 600 (planejado).
- **Secundário** (400, 12px): texto secundário e metadados; as opções da alternância Quadro | Lista usam este tamanho em 600.
- **Rótulo** (600, 11px, espaçamento 0,5px, MAIÚSCULAS): texto das pílulas (decisão do brief) e rótulo de seção, quando o rótulo é o próprio título da seção ("ETAPAS DO SETOR", planejado).
- **Mono** (400/500, 11 a 12px, números tabulares): siglas, versões (V3, V1F), nomes de arquivo SIGLA_VERSÃO_NOME, número do E-protocolo, datas e contagens. Classe utilitária `.mono` e elemento `code`.

### Named Rules
**A Regra da Escala Fechada.** Seis tamanhos (`--tam-rotulo` a `--tam-pagina`), nenhum fora deles. Hierarquia vem de peso e cor antes de tamanho.

**A Regra do Mono para o que se Confere.** Todo código, versão, data ou contagem vai em IBM Plex Mono com números tabulares; texto corrido nunca.

## Layout

A moldura é uma grade de duas linhas e duas colunas: barra superior azul ocupando toda a largura (altura mínima de 52px), faixa lateral de ícones à esquerda (`largura-faixa`) e área de trabalho rolável em `fundo`. O "EP" da barra tem a mesma largura da faixa, de modo que a marca fica exatamente sobre a coluna de ícones.

Na barra superior, da esquerda para a direita: marca, título da tela (corta com reticências), alternância Quadro | Lista e, empurrados para a direita, os ícones de filtro e de conta, separados por 16px. Na faixa lateral, itens de 40px empilhados com 4px de intervalo e 12px de respiro no topo.

Ritmo de espaçamento em passos de 4, 8, 12, 16, 24 e 32px. Do brief (planejado): 8px entre cartões, 12px entre colunas, 8 a 10px de respiro interno de cartão, 14 a 16px no painel; o quadro rola para o lado quando há mais colunas que a tela; abaixo de 900px o painel de detalhe ocupa a tela inteira.

Uso principal em computador; celular é opcional. Abaixo de 480px a barra superior aperta os intervalos para 8px e o bloco vazio passa a ter 16px de margem, sem esconder nenhum controle.

## Elevation & Depth

Plano por padrão. A profundidade vem de tom (folha branca sobre `fundo` azul-acinzentado) e de borda de 1px em `linha`, nunca de sombra. Nada construído até agora usa sombra.

### Shadow Vocabulary
- **Flutuante** (`--sombra-flutuante`, duas camadas suaves e baixas na cor de `texto`): só no que flutua sobre o quadro: painel de detalhe, menus, formulário de cadastro. Definida, ainda sem uso (planejado).

### Named Rules
**A Regra do Plano por Padrão.** Cartões, colunas e faixas não têm sombra. Sombra existe só em superfície que flutua sobre outra.

## Shapes

Cantos discretos e hierarquizados pelo tamanho da peça: 6px (`canto`) em itens da faixa lateral, bloco vazio e, planejado, cartões, campos e painéis; 4px (`canto-botao`) em botões e, planejado, quadradinhos de sigla e caixas de aviso; 2px (`canto-macro`, planejado) nos quadradinhos de macroprocesso; totalmente redondo em pílulas, alternância e avatares.

Bordas sempre de 1px: sólida em `linha` nas folhas; tracejada em `linha-tracejada` em espaço vazio que convida a uma ação (estado vazio do quadro; coluna vazia e "+ Registrar…", planejado). A linha acesa é a única borda de 2px.

Os ícones seguem a mesma forma: SVG próprio em grade de 24, traço 1,75, pontas e junções arredondadas, cantos internos de 1,5 a 2, cor herdada do texto.

## Components

### Buttons
Classes sobre o `<button>` nativo, firmes e compactos.
- **Shape:** canto de 4px (`canto-botao`), altura mínima de 32px, respiro lateral de 12px, ícone e texto com 8px de intervalo; texto em 13px, 600.
- **Principal:** fundo `azul`, texto `folha`; hover escurece para `azul-escuro`.
- **Secundário:** fundo `folha`, borda de 1px em `linha`, texto `texto`; hover escurece a borda para `linha-tracejada`.
- **Só ícone:** 32 × 32px, transparente, sempre com `aria-label`. O hover hoje só existe dentro da barra superior (fundo `branco-sobre-azul-hover`).
- **Transições:** cor de fundo e de borda em 150ms com `--curva-saida`.
- **Desativado:** opacidade 0,5 e cursor de proibido.

### Foco
Contorno de 2px em `azul` com 2px de afastamento em todo elemento clicável (`:focus-visible`). **Desvio registrado:** dentro da barra superior azul o contorno vira branco (`folha`), porque azul sobre azul sumiria.

### Chips (pílulas de situação)
- **Style:** totalmente redondas, 2px × 8px de respiro, texto 11px, 600, MAIÚSCULAS, espaçamento 0,5px, sem quebra de linha; cada situação com seu par texto/fundo, sem borda. **Desvio registrado:** o texto em maiúsculas segue a tabela de tipografia do brief.
- **State:** cinco variantes (atraso, vencendo, informativa, aprovado, neutra). O texto é obrigatório no componente: a situação nunca é dita só pela cor.

### Alternância Quadro | Lista
Pílula segmentada na barra superior: contorno de 1px em `branco-sobre-azul-borda` com 1px de respiro, opções transparentes em texto branco 12px, 600; a opção pressionada vira fundo `folha` com texto `azul`. Estado comunicado por `aria-pressed`.

### Avatar
- Círculo em três tamanhos: 20px (cartão), 24px (listas), 32px (cabeçalhos).
- Com foto: recortada no círculo, nome como texto alternativo.
- Sem foto: até duas iniciais em 600, `azul-escuro` sobre `azul-avatar`, com tamanho de 0,42 do diâmetro e o nome completo como rótulo acessível.
- Vários no mesmo item, sobrepostos com borda branca de 2px e "+N" do quarto em diante (planejado).

### Navigation
- **Faixa lateral:** fundo `folha`, borda direita em `linha`, ícones de 20px em itens de 40px com canto de 6px. Repouso em `icone-inativo`; hover em `texto-2` sobre `fundo`; área atual em `azul` sobre `azul-claro`, com a linha acesa de 2px encostada na borda direita da faixa (8px de recuo em cima e embaixo). Cada item tem rótulo acessível e dica ao passar o mouse; a área atual leva `aria-current="page"`.
- **Barra superior:** fundo `azul`, texto `folha`, "EP" em 16px/700, título em 14px/600. **Desvio registrado:** à direita aparece o ícone de conta no lugar do avatar do usuário logado, até existir o login (backlog).

### Bloco tracejado (estado vazio)
Bloco centralizado de até 420px, borda tracejada de 1px em `linha-tracejada`, canto de 6px, 32px × 24px de respiro, sem fundo próprio. Título em 14px/600 com quebra equilibrada, frase de orientação em `texto-2` e o botão principal da próxima ação. Textos seguem o brief: dizem o que houve e o que fazer, sem "por favor" nem exclamação.

### Peças planejadas (definidas no brief, ainda não construídas)
- **Cartão do processo:** folha branca, borda `linha`, canto 6px, sem sombra; hover escurece a borda em 150ms; escolhido ganha a linha acesa.
- **Coluna de etapa:** nome, contagem em mono, barrinha de proporção (`barra-coluna-trilho` / `barra-coluna`); "+" circular azul só na primeira coluna; coluna vazia em bloco tracejado.
- **Painel de detalhe:** desliza da direita em 200ms enquanto o quadro esmaece; usa `--sombra-flutuante`.
- **Caminho de etapas:** feitas em `texto` com marca de concluída, atual em `azul` com sublinhado aceso, futuras em `texto-2`.
- **Abas:** ativa com sublinhado aceso.
- **Mudança de etapa:** breve brilho da linha acesa (300ms).

Com `prefers-reduced-motion`, toda transição e animação vira troca instantânea (já aplicado globalmente).

## Do's and Don'ts

### Do:
- **Do** usar só as variáveis de `src/styles/tokens.css`; nenhum código de cor fora dele.
- **Do** reservar `azul` para barra superior, ação principal, linha acesa e foco.
- **Do** marcar o que está em foco ou é atual com a linha acesa de 2px em `azul`, uma por região.
- **Do** acompanhar toda cor de significado com texto ou rótulo acessível.
- **Do** escrever siglas, versões, datas e contagens em IBM Plex Mono com números tabulares.
- **Do** usar borda tracejada em `linha-tracejada` para espaço vazio que convida a uma ação.
- **Do** desenhar ícones novos no `Icone.tsx`: SVG em grade de 24, traço 1,75, pontas arredondadas.
- **Do** trocar o contorno de foco para branco sobre fundo `azul`.

### Don't:
- **Don't** pôr sombra em cartões, colunas ou faixas; sombra só no que flutua.
- **Don't** usar vermelho, âmbar ou verde em macroprocessos, barrinhas de tipo ou decoração; esses tons dizem situação.
- **Don't** pôr branco translúcido como fundo atrás de texto na barra azul.
- **Don't** criar tamanhos de texto fora da escala de seis passos.
- **Don't** usar caractere de texto como ícone (✓, →, ★); o ícone é sempre SVG do `Icone.tsx`.
- **Don't** adicionar pacote de ícones ou de fontes sem ADR.
