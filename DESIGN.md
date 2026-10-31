---
name: Plataforma do EP
description: Quadro de etapas do Escritório de Processos, em grafite e branco, com cor viva só em pontos que carregam informação.
colors:
  grafite: "#252b36"
  grafite-icone: "#9aa3b2"
  folha: "#ffffff"
  fundo: "#f3f4f7"
  fundo-cabecalho: "#fafbfc"
  fundo-grupo: "#f6f7f9"
  linha: "#e3e6ec"
  linha-leve: "#f0f2f5"
  linha-tracejada: "#c3cad8"
  texto: "#1d2330"
  texto-2: "#5f6776"
  icone-inativo: "#9098a6"
  azul: "#3a5afe"
  azul-claro: "#e8edff"
  azul-escuro: "#2a44c9"
  trilha-feita: "#6b7a99"
  trilha-vazia: "#e3e6ec"
  atraso: "#d1293d"
  vence: "#b45309"
  atraso-texto: "#8f1d2c"
  atraso-fundo: "#fdecee"
  vencendo-texto: "#7a4a00"
  vencendo-fundo: "#fff6e5"
  aprovado-texto: "#166a4d"
  aprovado-fundo: "#e6f4ef"
  neutra-texto: "#4a5163"
  neutra-fundo: "#eef0f4"
  etiqueta-finalizado: "#16a34a"
typography:
  pagina:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.45
  tela:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.45
  cartao:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
  coluna:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.45
  base:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  secundario:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  rotulo:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.45
  selo:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.3px"
  mono:
    fontFamily: "'IBM Plex Mono', ui-monospace, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 500
    fontFeature: "tnum"
rounded:
  canto: "8px"
  canto-botao: "6px"
  canto-macro: "2px"
  canto-amostra: "5px"
  canto-selo: "4px"
  canto-janela: "12px"
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
    height: "34px"
  botao-principal-hover:
    backgroundColor: "{colors.azul-escuro}"
    textColor: "{colors.folha}"
  botao-secundario:
    backgroundColor: "{colors.folha}"
    textColor: "{colors.texto}"
    typography: "{typography.base}"
    rounded: "{rounded.canto-botao}"
    padding: "0 12px"
    height: "34px"
  botao-ligado:
    backgroundColor: "{colors.azul-claro}"
    textColor: "{colors.azul-escuro}"
    typography: "{typography.base}"
    rounded: "{rounded.canto-botao}"
    height: "34px"
  segmento-opcao-escolhida:
    backgroundColor: "{colors.azul-claro}"
    textColor: "{colors.azul-escuro}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.canto-selo}"
  faixa-lateral:
    backgroundColor: "{colors.grafite}"
    width: "{spacing.largura-faixa}"
  faixa-item:
    backgroundColor: "transparent"
    textColor: "{colors.grafite-icone}"
    rounded: "{rounded.canto-botao}"
    size: "40px"
  faixa-item-ativo:
    backgroundColor: "{colors.azul-claro}"
    textColor: "{colors.azul}"
  barra-superior:
    backgroundColor: "{colors.folha}"
    textColor: "{colors.texto}"
    height: "52px"
  cartao:
    backgroundColor: "{colors.folha}"
    textColor: "{colors.texto}"
    rounded: "{rounded.canto}"
    padding: "12px 14px"
  selo-do-setor:
    textColor: "{colors.folha}"
    typography: "{typography.selo}"
    rounded: "{rounded.canto-selo}"
    padding: "1px 7px"
  pilula-neutra:
    backgroundColor: "{colors.neutra-fundo}"
    textColor: "{colors.neutra-texto}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.canto-selo}"
    padding: "2px 8px"
  pilula-aprovado:
    backgroundColor: "{colors.aprovado-fundo}"
    textColor: "{colors.aprovado-texto}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.canto-selo}"
    padding: "2px 8px"
  aviso-atraso:
    backgroundColor: "{colors.atraso-fundo}"
    textColor: "{colors.atraso-texto}"
    typography: "{typography.secundario}"
    rounded: "{rounded.canto-botao}"
    padding: "7px 10px"
  aviso-pendencia:
    backgroundColor: "{colors.vencendo-fundo}"
    textColor: "{colors.vencendo-texto}"
    typography: "{typography.secundario}"
    rounded: "{rounded.canto-botao}"
    padding: "7px 10px"
  avatar-iniciais:
    backgroundColor: "{colors.azul-claro}"
    textColor: "{colors.azul-escuro}"
    rounded: "{rounded.redondo}"
    size: "24px"
---

# Design System: Plataforma do EP

Fonte de verdade das decisões: `.scratch/identidade-visual.md` (redesenho aprovado em 2026-10-30). Este arquivo descreve o que está em código.

## Overview

**Creative North Star: "O Quadro Silencioso"**

Ferramenta de trabalho diário para uma equipe pequena que acompanha processos etapa por etapa. A moldura é neutra: faixa lateral grafite, barra superior branca, fundo cinza-claro e cartões brancos. A cor viva aparece só em três pontos pequenos que carregam informação: o selo do setor, o ícone da etiqueta da etapa e o prazo. O olho para nesses pontos e em um único azul cheio por tela, que diz o que fazer em seguida.

A densidade é de ferramenta: base de 14px, passos de 4 a 32px, controles de 34px. Códigos que a equipe confere (versão, dias, prazo, datas, nomes de arquivo, contagens) usam fonte mono com números tabulares. Só tema claro, para uso em computador a partir de 1366×768; o celular funciona, sem ser o alvo.

**Key Characteristics:**
- Azul com dois papéis e nenhum outro: **azul cheio** só na ação principal da tela (uma por tela) e **azul-claro com texto azul-escuro** em tudo que está escolhido ou ligado.
- Cartões, tabelas e blocos são planos: borda de 1px em `linha`, sem sombra. Sombra só no que flutua (menus e janelas).
- O prazo é sempre ícone de calendário mais texto; a etiqueta é ícone com nome acessível; a situação é texto. Nunca só cor.

## Colors

### Neutras (a moldura)
- **Grafite** (`#252b36`): faixa lateral. Ícones inativos em `grafite-icone` (`#9aa3b2`).
- **Folha** (`#ffffff`): barra superior, cartões, tabelas, janelas, blocos.
- **Fundo** (`#f3f4f7`): área do quadro e das páginas. `fundo-cabecalho` (`#fafbfc`) no cabeçalho de tabela; `fundo-grupo` (`#f6f7f9`) nas linhas de grupo.
- **Linha** (`#e3e6ec`): bordas de 1px. `linha-leve` (`#f0f2f5`) nas divisórias internas; `linha-tracejada` (`#c3cad8`) em "sem responsável" e blocos vazios.
- **Texto** (`#1d2330`) e **texto-2** (`#5f6776`, 5,7:1 no branco). `icone-inativo` (`#9098a6`) é só para ícones e enfeites, nunca texto.

### Azul
- **Azul** (`#3a5afe`): botão da ação principal, ícone do título da tela, ícone do item ativo da faixa lateral. Branco sobre ele: 5,2:1.
- **Azul-claro** (`#e8edff`) com **azul-escuro** (`#2a44c9`, 6,5:1): segmento escolhido, filtro ativo, item da faixa lateral, opção em foco nos menus e nas caixas de seleção, avatar do usuário.

### Prazo e avisos
- **Atraso** (`#d1293d`) e **vence** (`#b45309`): ícone e texto do prazo; "Excluir" nos menus.
- Avisos de atraso e erro: `#8f1d2c` sobre `#fdecee`. Pendência: `#7a4a00` sobre `#fff6e5`.

### Situação do processo
"Em andamento" é o normal e aparece sem destaque (texto cinza). As exceções ganham selo de 4px: Suspenso e Cancelado em `#4a5163` sobre `#eef0f4`; Concluído em `#166a4d` sobre `#e6f4ef`.

### Etiqueta da etapa
Só ícone, 18px no cartão: A fazer é círculo com contorno cinza; Iniciado é círculo com a metade direita azul; Finalizado é círculo verde (`#16a34a`) com visto branco.

### Cor do setor
Selo com a sigla em branco sobre uma de **12 cores fortes**, em ciclo sobre o número de 1 a 30 que o banco guarda (`src/cadastros/corDoSetor.ts`): bordô, laranja, mostarda, oliva, verde, petróleo, azul, roxo profundo, fúcsia, ameixa, rosa e grafite quente. Todas passam de 4,5:1 com a sigla branca. A cor do setor só existe no selo e no quadradinho das caixas de seleção; coluna e cabeçalho não levam cor de setor.

### Named Rules
- **Cor em ponto.** Cor viva só em selo, ícone de etiqueta e prazo. Fora disso, grafite, branco e cinza.
- **Um azul cheio por tela.** Se há dois, um deles é secundário.
- **Cor nunca sozinha.** Prazo, etiqueta e situação sempre trazem ícone, texto ou forma.

## Typography

**Fonte principal:** Source Sans 3 (400, 600, 700), guardada no projeto (licença OFL). **Fonte de dados:** IBM Plex Mono (400, 500).

### Hierarchy
- **Página** (21px, 700): título de página de cadastro. **Tela** (18px, 700): título na barra superior e de janela.
- **Cartão** (16px, 600): nome do processo no cartão. **Coluna** (15px, 700): nome da etapa e título de bloco.
- **Base** (14px, 400/600): interface e botões. **Secundário** (13px): responsável, metadados, itens de menu, avisos, tabelas.
- **Rótulo** (12px, 400–700): legendas, rótulos de campo, cabeçalho de tabela, segmentos. **Selo** (11px, 700): sigla do setor.
- **Mono** (12px, 500): rodapé do cartão, contagens, versão, dias, datas.

### Named Rules
- **Nada abaixo de 11px**, exceto o selo de tipo de arquivo (9px mono, sempre com o nome ao lado).
- **Maiúsculas só nos títulos de seção do verso.**

## Layout

Grade de três faixas, igual em todas as telas: **faixa lateral** de 56px (grafite, marca "EP" em quadrado azul no topo, itens de 40px só com ícone e dica); **barra superior** de 52px (ícone da tela em azul + título, conta à direita); área de trabalho em `fundo`. A faixa de controles do Quadro e da Lista é uma folha branca com borda, sem sombra. O Quadro tem colunas de 300px, 14px entre elas, 10px entre cartões, e rola para o lado. Passos de espaçamento: 4, 8, 12, 16, 24 e 32px.

## Elevation & Depth

Cartões, tabelas e blocos não têm sombra. Flutuam apenas:
- **Menus e caixas abertas:** `0 8px 24px rgb(29 35 48 / 12%), 0 2px 6px rgb(29 35 48 / 8%)`.
- **Janelas** (verso do cartão, confirmações): `0 24px 60px rgb(29 35 48 / 30%)` sobre véu `rgb(29 35 48 / 45%)`.

## Shapes

Cantos de 8px em cartão, tabela, bloco e menu; 6px em botão, campo, segmento, item da faixa lateral e aviso; 4px em selo e opção de segmento; 12px nas janelas; pílulas de contador e avatares redondos. Ícones desenhados no projeto (SVG, traço 1,75, pontas redondas), sem pacote externo.

## Components

### Buttons
34px de altura, 14px seminegrito. **Principal:** azul cheio, texto branco, um por tela. **Comum:** branco com borda `linha`. **Ligado:** `azul-claro` com texto `azul-escuro`. **Leve:** sem borda nem fundo. Só ícone: 34×34px com `aria-label`.

### Segmento
Contêiner `fundo` com borda `linha`, respiro de 2px; opções em 12px seminegrito `texto-2`; a escolhida em `azul-claro`. Serve para Quadro | Lista, "Agrupar por", "Mostrar" e as abas de página.

### Cartão do Quadro
Linha de cima com o selo do setor (ausente no Quadro por setor) e o ícone da etiqueta à direita; nome do processo; linha do responsável com ícone de pessoa ("Sem responsável" em cinza); rodapé em mono separado por `linha-leve`. O processo parado ganha borda vermelha inteira. O cartão do processo aberto leva borda azul.

### Menus e caixas de seleção
Itens de 34px, 13px; item em foco ou escolhido em `azul-claro` com `azul-escuro`; separador `linha`; ações destrutivas no fim, em `atraso`. A caixa de seleção continua o `<select>` nativo com `appearance: base-select`.

### Foco
Contorno de 2px em `azul` com 2px de afastamento, em todo elemento clicável.

### Verso do cartão
Janela de até 880px de largura e 740px de altura, canto de 12px, que não cresce além disso (o que sobra rola por dentro); o "Agora" é um bloco branco com borda comum e o único botão azul cheio da janela.

### Tabelas e Lista
Tabela branca com borda `linha` e canto de 8px; cabeçalho em `fundo-cabecalho` (12px, 700, `texto-2`); divisórias `linha-leve`. O nome do processo é seminegrito em `texto`, sublinhado ao passar o mouse, nunca azul de link. A etapa vem com uma trilha de oito tracinhos. Linhas de grupo em `fundo-grupo`.

## Do's and Don'ts

### Do:
- Use azul cheio só na ação principal e azul-claro para tudo que está escolhido ou ligado.
- Mostre prazo com ícone e texto; etiqueta com ícone e nome acessível.
- Deixe a cor do setor no selo e em nenhum outro lugar.
- Use mono para versão, dias, datas e contagens.

### Don't:
- Não ponha sombra em cartão, tabela ou bloco.
- Não use `inativo` (`#9098a6`) em texto: dá 2,9:1.
- Não pinte coluna, cabeçalho ou faixa de cartão com cor de setor.
- Não use borda lateral colorida como marca de destaque.
