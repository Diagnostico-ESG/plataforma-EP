# Identidade visual — Plataforma do EP

Redesenho aprovado em 2026-10-30 na `/concepcao-livre`, a partir das decisões do usuário em `.scratch/proposta-visual/decisoes.md`. Substitui a identidade de 2026-10-07 (barra azul, linha acesa, etiquetas cheias, setores em pastel); o histórico dela está em "Registro de mudanças", no fim. Fonte para o `/implementar-identidade`.

**Referências visuais (protótipos descartáveis, dados inventados):**

| Tela | Arquivo | Imagens |
|---|---|---|
| Quadro | `.scratch/proposta-visual/proposta-6.html` | `proposta-6-*.png` |
| Lista e cadastros (Setores, Macroprocessos, Histórico) | `.scratch/proposta-visual/lista-e-cadastros.html` | `cadastros-*.png` |
| Verso do cartão | `.scratch/proposta-visual/verso-3.html` | `verso-3-*.png` |

Os protótipos foram desenhados com texto base de 13px; **valem as medidas deste arquivo** (base 14px) quando divergirem. As análises que justificam as escolhas estão em `.scratch/analise-de-design-*2026-10-30.md`.

## Conceito

**Grafite e branco, cor em ponto.** A moldura é neutra: faixa lateral grafite, barra superior branca, fundo cinza-claro, cartões brancos. Cor viva só em pontos pequenos que carregam informação: o selo do setor, o ícone da etiqueta e o prazo. O azul tem dois papéis e nenhum outro:

- **Azul cheio:** só a ação principal da tela ("Cadastrar processo", "Registrar revisão"…), uma por tela.
- **Azul-claro com texto azul:** tudo que está escolhido ou ligado (segmento escolhido, filtro ativo, item da faixa lateral, opção em foco no menu, etapa atual na trilha).

## Paleta

### Base

| Token | Código | Uso |
|---|---|---|
| `grafite` | `#252B36` | Faixa lateral |
| `grafite-icone` | `#9AA3B2` | Ícones inativos na faixa lateral (5,6:1 sobre `grafite`) |
| `folha` | `#FFFFFF` | Barra superior, faixa de controles, cartões, tabelas, janelas, blocos |
| `fundo` | `#F3F4F7` | Área do quadro e das páginas |
| `fundo-cabecalho` | `#FAFBFC` | Cabeçalho de tabela, trilha do verso, linha de grupo recolhido |
| `fundo-grupo` | `#F6F7F9` | Linha de grupo na Lista agrupada |
| `linha` | `#E3E6EC` | Bordas de 1px |
| `linha-leve` | `#F0F2F5` | Divisórias internas (rodapé do cartão, linhas de tabela, itens de lista) |
| `linha-tracejada` | `#C3CAD8` | Avatar vazio ("sem responsável"), bloco tracejado |
| `texto` | `#1D2330` | Texto principal (15,7:1) |
| `texto-2` | `#5F6776` | Texto secundário, rótulos, descrições de coluna, "Sem responsável" (5,7:1 no branco, 5,2:1 no `fundo`) |
| `inativo` | `#9098A6` | **Só ícones e enfeites** (2,9:1: não serve para texto) |
| `azul` | `#3A5AFE` | Botão da ação principal (branco sobre ele: 5,2:1); ícone do título da tela; ícone do item ativo da faixa lateral |
| `azul-claro` | `#E8EDFF` | Fundo do escolhido ou ligado |
| `azul-escuro` | `#2A44C9` | Texto sobre `azul-claro` (6,5:1); iniciais do avatar do usuário logado |
| `trilha-feita` | `#6B7A99` | Tracinhos das etapas já feitas; linha entre etapas feitas no verso |
| `trilha-vazia` | `#E3E6EC` | Tracinhos das etapas futuras (`#D5DBE7` na trilha do verso) |

### Prazo (v1.5; tokens já definidos)

| Token | Código | Uso |
|---|---|---|
| `atraso` | `#D1293D` | Ícone e texto do prazo atrasado (5,1:1); item "Excluir" dos menus |
| `vence` | `#B45309` | Ícone e texto do prazo perto de vencer (5,0:1). O `#C2620A` dos protótipos dá 4,2:1 e não passa no AA |

O prazo é sempre ícone de calendário + texto ("27/10 · há 3 dias"), nunca só cor.

### Etiqueta da etapa (só ícone, 18px no cartão)

| Etiqueta | Desenho |
|---|---|
| A fazer | ○ círculo com contorno 2px `#9098A6` |
| Iniciado | ◐ círculo com contorno 2px e metade direita preenchida em `#3A5AFE` |
| Finalizado | ✓ círculo cheio `#16A34A` com visto branco (gráfico: 3,3:1, acima do mínimo de 3:1) |

Sem texto no cartão: o nome vem ao passar o mouse (`title`) e para o leitor de tela (`aria-label="Etiqueta: Iniciado"`). A legenda (ícone 14px + nome, 12px `texto-2`) aparece uma vez, à direita da faixa de controles do Quadro. No verso, a etiqueta se troca por um segmento de três botões de ícone (escolhido em `azul-claro`).

### Situação do processo (selo discreto, 12px seminegrito, canto 4px)

Etiqueta ≠ situação (`CONTEXT.md`). "Em andamento" é o normal e aparece sem destaque (texto `texto-2` ou nada); as exceções ganham selo:

| Situação | Texto | Fundo |
|---|---|---|
| Suspenso | `#4A5163` | `#EEF0F4` (6,9:1) |
| Concluído | `#166A4D` | `#E6F4EF` (5,8:1) |
| Cancelado | `texto-2` | `#F3F4F6` |

### Avisos (verso e formulários)

| Aviso | Texto | Fundo |
|---|---|---|
| Atraso / erro | `#8F1D2C` | `#FDECEE` (7,7:1) |
| Pendência (ex.: revisor deveria ser outra pessoa) | `#7A4A00` | `#FFF6E5` (7,0:1) |

Ícone de alerta à esquerda, 12–13px, canto 6px, respiro 7×10px. Lado a lado quando houver dois.

### Cor do setor (selo)

Selo com a sigla: 11px negrito, espaçamento 0,3px, **texto branco sobre cor forte**, canto 4px, respiro 1×7px. O nome do setor vem ao passar o mouse e para o leitor de tela. **12 cores**, todas com a sigla branca acima de 4,5:1:

| Nº | Cor | Código | Contraste |
|---|---|---|---|
| 1 | Bordô | `#881337` | 9,6 |
| 2 | Laranja | `#C2410C` | 5,2 |
| 3 | Mostarda | `#A16207` | 4,9 |
| 4 | Oliva | `#606000` | 6,6 |
| 5 | Verde | `#15803D` | 5,0 |
| 6 | Petróleo | `#0E7490` | 5,4 |
| 7 | Azul | `#1D4ED8` | 6,7 |
| 8 | Roxo profundo | `#5B21B6` | 9,0 |
| 9 | Fúcsia | `#C026D3` | 4,7 |
| 10 | Ameixa | `#804878` | 6,7 |
| 11 | Rosa | `#DB2777` | 4,6 |
| 12 | Grafite quente | `#57534E` | 7,6 |

- Escolhidas pela distância percebida entre cores (CIEDE2000): os pares mais próximos são azul × roxo profundo (13,7), laranja × mostarda (16,3), ameixa × fúcsia (17,8) e ameixa × bordô (18,0); todos os outros passam de 18.
- **Ligação com o banco:** `setores.cor` continua de 1 a 30 (sem migração). A tela mostra a cor `((cor - 1) % 12) + 1` desta tabela; a grade de escolha no cadastro do setor mostra só as 12. Setores podem repetir cor; quem identifica é a sigla.
- Vermelho, verde e azul aparecem aqui por decisão do usuário (2026-10-30), revendo a regra 2 do `decisoes.md`. O bordô é escuro para não se confundir com o prazo atrasado; o azul do selo (`#1D4ED8`) é mais escuro que o da ação principal.
- Setor inativo: selo em `#EEF0F4` com sigla em `#4A5163`.
- A cor do setor só existe no selo (e no quadradinho das caixas de seleção). Cabeçalhos de coluna, fundos de coluna e faixas de cartão não levam cor de setor.

### Tipo de arquivo (verso)

Selo mono 9px negrito, texto branco, 38px de largura: BPMN `#4F46E5`, PNG `#0E7490`, BPM `#6B7A99`, DOCX `#2A44C9`, PDF `#881337`, EML `#C2410C`. Sempre ao lado do nome do arquivo.

### Avatar

Círculo: 20px (cartão, quando aparece), 24px (listas, tabelas, histórico), 32px (barra superior). Com foto: a foto recortada, com o nome como texto alternativo. Sem foto: até duas iniciais, 600; usuário logado em `azul-escuro` sobre `azul-claro`, os outros em `#4A5163` sobre `#E9ECF1`. Sem responsável: círculo vazio com borda tracejada `linha-tracejada`. Vários no mesmo item: sobrepostos, borda branca de 2px, "+N" do quarto em diante.

Só tema claro.

## Tipografia

- **Source Sans 3** (400, 600, 700) para toda a interface.
- **IBM Plex Mono** (400, 500) para números e códigos: contagens, versão (V3), dias ("4d"), datas, prazo, nomes de arquivo, número do E-protocolo.
- Arquivos de fonte já guardados no projeto (licença OFL); nada novo.
- Títulos de seção do verso em maiúsculas pequenas (12px, 700, espaçamento 0,4px, `texto-2`), como no protótipo aprovado; em nenhum outro lugar.

**Escala (base 14px, decidida pelo usuário em 2026-10-30):**

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| `tam-selo` | 11px | 700 | Sigla do selo do setor; contador do botão Filtros (mono 500) |
| `tam-rotulo` | 12px | 400–700 | Legenda, rótulo de campo (600), descrição da coluna, cabeçalho de tabela (700), texto do segmento (600), dados do rodapé do cartão (mono 500), título de seção do verso |
| `tam-secundario` | 13px | 400–600 | Linha do responsável no cartão, metadados, itens de menu, avisos, texto de tabela |
| `tam-base` | 14px | 400 / 600 | Base da interface; botões (600); nome do processo na Lista (600) |
| `tam-coluna` | 15px | 700 | Nome da etapa no cabeçalho da coluna; título de bloco |
| `tam-cartao` | 16px | 600 | Nome do processo no cartão (linha 1,3) |
| `tam-tela` | 18px | 700 | Título da tela na barra superior; título de janela |
| `tam-verso-titulo` | 20px | 700 | Nome do processo no verso |
| `tam-pagina` | 21px | 700 | Título de página de cadastro (Setor, Macroprocesso) |

Altura de linha 1,45 no geral. Nenhum texto abaixo de 11px, exceto o selo de tipo de arquivo (9px mono negrito, sempre acompanhado do nome).

## Espaçamento e forma

- Passos: 4, 8, 12, 16, 24px. Margem lateral das áreas: 24px. Entre colunas do quadro: 14px. Entre cartões: 10px. Respiro do cartão: 12×14px, com 8px entre linhas.
- Cantos: 8px em cartão, tabela, bloco e menu; 6px em botão, campo, segmento, item da faixa lateral e aviso; 4px em selo e opção do segmento; 12px nas janelas (verso, "Novo processo", cadastros curtos); pílulas de contador e avatares redondos.
- Bordas de 1px em `linha`. Cartões e tabelas **sem sombra**.
- Sombra só no que flutua: menus `0 8px 24px rgb(29 35 48 / 12%), 0 2px 6px rgb(29 35 48 / 8%)`; janelas `0 24px 60px rgb(29 35 48 / 30%)`, com véu `rgb(29 35 48 / 45%)` atrás.
- Foco do teclado: contorno de 2px em `azul` com 2px de afastamento, em todo elemento clicável.
- Ícones: traço próprio em SVG (sem pacote), 24×24 de desenho, traço 1,75, pontas redondas; 16px no geral, 14px no rodapé do cartão, 18–20px na faixa lateral e no título da tela. Cor herdada do texto ao lado; `inativo` quando decorativos.

## Layout

### Moldura (todas as telas)

Grade de três faixas, sem mudança de lugar entre telas:

- **Faixa lateral** (56px, `grafite`, altura toda): marca "EP" no topo (quadrado 32px, `azul`, texto branco 13px, canto 6px); itens de 40×40px só com ícone, com dica ao passar o mouse e rótulo acessível (Processos, Setores, Painel, Administração; Ajuda no pé). Item ativo: fundo `azul-claro`, ícone `azul`.
- **Barra superior** (52px, `folha`): à esquerda o ícone da tela em `azul` + título (18px, 700); à direita busca, avisos e avatar do usuário logado (32px). Sem a alternância Quadro | Lista aqui.
- **Faixa de controles** (56px, `folha`, borda inferior `linha`, altura fixa): ação principal à esquerda (azul cheio), depois os controles de visão. **Nada muda de lugar quando um filtro liga**: os filtros moram num botão "Filtros" com contador (pílula mono 11px, `azul-claro` → fundo branco quando o botão está ligado). Separadores verticais de 1×22px em `linha` entre grupos.

### Controles

- **Botão:** 34px de altura, 0×12px, 14px seminegrito, canto 6px. Comum: `folha` com borda `linha`. Principal: `azul` com texto branco. Ligado: `azul-claro` sem borda, texto `azul-escuro`. Leve: sem borda nem fundo, texto `texto-2`. Só ícone: 34×34px.
- **Segmento** (Linhas, Agrupar por, Mostrar): contêiner `fundo` com borda `linha`, respiro 2px, canto 6px; opções 12px seminegrito em `texto-2`; escolhida em `azul-claro` com texto `azul-escuro`. Rótulo à esquerda em 12px `texto-2`.
- **Menu "···"** (flutuante, 200–220px): itens 13px com ícone, respiro 8×10px; item em foco em `azul-claro`/`azul-escuro`; separador `linha`; "Excluir" e ações destrutivas no fim, em `atraso`. Esc fecha e devolve o foco ao botão.
- **Campo:** 34px, borda `linha`, canto 6px, rótulo 12px seminegrito `texto-2` acima; obrigatório com asterisco em `atraso`.
- **Caixa de seleção:** continua o `<select>` nativo com `appearance: base-select` (`src/styles/caixas.css`, padrão de 2026-10-27), agora com a regra nova: opção em foco ou escolhida em `azul-claro` com texto `azul-escuro` (sai a linha acesa à esquerda); o quadradinho de cor das opções de setor usa a cor do selo.

### Quadro (`proposta-6.html`)

- Faixa de controles: [Cadastrar processo] · [Quadro ▾] · "Linhas" com segmento **Nenhuma | Setor | Responsável** · separador · [Filtros (n)] · [Destacar os meus] · legenda das três etiquetas à direita.
- **Coluna por etapa** (cerca de 300px): cabeçalho com o nome da etapa numa plaqueta branca (borda `linha`, canto 6px, ícone da etapa + nome 15px negrito), contagem em mono 12px colada, ações discretas à direita ("+" só na primeira coluna, "···"). Abaixo, descrição da etapa em 12px `texto-2`. A coluna em si é o fundo; sem cor de setor.
- **Cartão:** linha 1 com selo do setor à esquerda e ícone da etiqueta à direita; nome do processo (16px, 600); linha do responsável com ícone de pessoa (13px; "Você" para o usuário logado; "Sem responsável" em `texto-2`); rodapé separado por `linha-leve`, em mono 12px `texto-2`, com ícone + valor: versão, dias na etapa, prazo (na cor do prazo), arquivos. Sem avatar no cartão por etapa (o responsável já está escrito).
- **Destacar os meus:** os cartões dos outros ficam com opacidade 0,38; nada some.
- **Linhas por Setor ou por Responsável:** o quadro vira grade (etapas nas colunas, setores ou responsáveis nas linhas), em `folha` com bordas `linha`; cabeçalhos em `fundo-cabecalho`. Na linha por setor, só o selo com a sigla (nome ao passar o mouse) e a contagem; o cartão perde o selo (a linha já diz o setor). Na linha por responsável, avatar + nome; o cartão perde o avatar. Linhas podem ser recolhidas ("recolhido · 3 processos"). Cartão compacto: canto 6px, nome 14px.
- O quadro rola para o lado quando há mais colunas que a tela.

### Lista e cadastros (`lista-e-cadastros.html`)

- **Lista:** tabela em `folha` com borda `linha` e canto 8px; cabeçalho e faixa de controles fixos ao rolar; cabeçalho 12px negrito `texto-2` em `fundo-cabecalho` (coluna filtrada em `azul-escuro`). Linhas de altura uniforme (texto numa linha só, cortado com reticências); nome do processo 14px seminegrito em `texto` (sublinhado ao passar o mouse, nunca azul de link); etapa como ícone + nome (13px) sobre a trilha de 8 tracinhos (22×4px, feitos `trilha-feita`, atual `azul`, futuros `trilha-vazia`); responsável como avatar 24px + nome numa linha; situação só nas exceções. A coluna do agrupamento ativo some. "Mostrar: Em andamento | Concluídos | Cancelados | Todos" num segmento só; "Abrir todos / Fechar todos" junto do "Agrupar por". Ao trocar o agrupamento, volta ao topo.
- **Grupos:** linha `fundo-grupo`, 14px negrito, com contagem mono; subgrupo recuado 40px, 13px seminegrito `texto-2`.
- **Setores e Macroprocessos (listas):** mesma tabela; linha inteira clicável com destaque ao passar o mouse; busca por sigla ou nome; colunas sem conteúdo (Situação, Código) só aparecem quando informam (ex.: selo "Inativo" ao lado do nome).
- **Cadastro aberto (Setor, Macroprocesso):** página de até 1100px; cabeçalho com botão voltar (34px), título 21px e ações à direita (principal + "···"); blocos brancos (canto 8px, respiro 18×20px) com título 15px negrito; campos em duas colunas (2fr 1fr). Grade de 12 cores do setor: amostras 34×24px, canto 5px, número mono abaixo; escolhida com anel `azul` de 2px afastado 2px.
- **Criar** (setor, macroprocesso, processo) é sempre numa **janela** (520px, canto 12px): título 16px negrito com fechar, corpo com respiro 18×20px, rodapé com ações à direita.
- **Histórico:** eventos em grade (quando | quem | o quê), destacando só o campo que mudou: antes riscado em `inativo`, depois em `texto` negrito.

### Verso do cartão (`verso-3.html`)

- Janela de **tamanho fixo, cerca de 880 × 740**, que não cresce (o conteúdo que sobra rola dentro das seções), canto 12px, sobre o véu. Branca opaca desde o primeiro quadro, inclusive carregando.
- **Topo:** selo do setor + nome do processo (20px, 700) + à direita "···" e fechar; abaixo, dados em 13px `texto-2` (macroprocesso, situação, dias na etapa, prazo).
- **Trilha horizontal das etapas** com nomes, num bloco `fundo-cabecalho` com canto 10px: bolas de 28px ligadas por linha de 2px; feitas com ícone em `#EEF0F4`/`#4A5163`; atual em `azul-claro` com borda e ícone `azul` e nome em `azul-escuro` negrito ("desde 28/10"); futuras com borda `#D5DBE7`. Nome 12px, data mono 11px.
- **Agora:** etiqueta em segmento de três ícones; responsável numa pílula (avatar + nome) com botão "Trocar"; "Mover para ▾"; a **próxima ação da etapa** sempre em azul cheio, sempre no mesmo lugar. Avisos lado a lado.
- **Corpo, sem abas:** miniatura grande do fluxograma (cerca de 360×196px, borda `linha`, fundo `#FBFCFE`) com os arquivos em lista vertical ao lado (selo do tipo, nome seminegrito, tamanho 12px `texto-2`, ícone baixar); versões anteriores e reuniões recolhidas lado a lado; **Anotações** com o dobro do espaço (caixa de pelo menos 96px).
- **Histórico no menu "···"**: abre no lugar do conteúdo do processo, com "Voltar ao processo" no topo; eventos agrupados por dia.

### Telas ainda sem protótipo

Painel (Planilhas), Administração (Usuários, Catálogo de etapas) e Reuniões seguem a mesma moldura e os mesmos controles. Abas de página: um padrão só, no segmento acima, com o título da tela na barra superior e sem repetir o nome da aba logo abaixo. Catálogo de etapas: setas ↑↓ como ícones, "Editar" visível, "Desativar" e "Excluir" no "···".

## Elemento marcante

**O quadro silencioso.** Num campo de grafite, branco e cinza, o olho só para em três tipos de ponto colorido: o selo do setor, o ícone da etiqueta e o prazo. Um único azul cheio por tela diz o que fazer em seguida. "Destacar os meus" usa a mesma lógica ao contrário: esmaece o resto, sem esconder nada.

## Movimento

- Janela do verso: aparece com véu em 200ms (opacidade e leve escala); fecha igual.
- "Destacar os meus" e troca de "Linhas": transição de opacidade de 150ms; nada desliza.
- Menus: aparecem em 120ms.
- Passar o mouse em cartão e linha de tabela: borda ou fundo escurece levemente (150ms).
- Com `prefers-reduced-motion`, tudo vira troca instantânea.

## Acessibilidade

- WCAG 2.2 AA: contrastes conferidos acima; `inativo` nunca em texto; etiqueta, prazo e situação nunca só por cor (ícone com nome acessível, texto ou forma).
- Uso completo pelo teclado: cartões focáveis, Enter abre o verso, Esc fecha e devolve o foco ao cartão; Esc fecha menus.
- Mover o processo por botão ("Mover para ▾"), não só arrastando.
- Ícones sem texto levam rótulo acessível e dica ao passar o mouse.
- Uso em computador, a partir de 1366×768; celular é opcional.

## Textos-padrão

Sem "por favor", sem exclamação, sem pedir desculpa; dizer o que houve e o que fazer.

**Carregando** (nomear o que carrega; blocos-fantasma no formato do conteúdo, opacos, sem círculo girando):
- "Carregando processos…"
- "Carregando o processo…"
- "Carregando documentos…"
- "Carregando setores…"
- "Carregando o histórico…"

**Vazio:**
- Quadro sem processos: "Nenhum processo cadastrado ainda. Cadastre o primeiro." [Cadastrar processo]
- Coluna vazia: "Nenhum processo nesta etapa."
- Com filtros ou "Mostrar": "Nenhum processo com esses filtros." [Limpar filtros]
- Lista de setores: "Nenhum setor cadastrado ainda." [Cadastrar setor]
- Busca sem resultado: "Nada encontrado para "{termo}"."
- Documentos: "Nenhuma versão enviada. Envie o fluxograma (.bpmn e .png) para começar." [Enviar versão]
- Reuniões: "Nenhuma reunião registrada com este setor." [Registrar reunião]
- Anotações: "Nenhuma anotação neste processo."
- Histórico: "Nenhuma alteração registrada ainda." [Voltar ao processo]
- Perfil Consulta: os mesmos textos, sem o botão.

**Erro:**
- Ao carregar: "Não foi possível carregar os processos. Verifique a conexão e tente de novo." [Tentar de novo]
- Ao salvar: "A alteração não foi salva: {motivo}. Seus dados continuam no formulário."
- Perfil: "Seu perfil (Consulta) não permite editar processos. Peça a um administrador para mudar seu perfil."
- Nome de arquivo: "O arquivo "{nome}" não segue o padrão SIGLA_VERSÃO_NOME (exemplo: SET_V6_NOME DO PROCESSO)."
- Revisor: "O revisor precisa ser outra pessoa: você enviou esta versão."
- Etapa: "Esta etapa só começa quando a anterior estiver concluída, realizada anteriormente ou dispensada."

## Para o `/implementar-identidade`

- Tokens deste arquivo em `src/styles/tokens.css`, num único ponto; nenhum código de cor espalhado. Saem os tokens que deixam de existir (barra azul, etiquetas cheias, degradê da barra de etapas, 30 cores pastel, fundo tingido da coluna por setor, macroprocessos coloridos, barrinhas por tipo de registro) depois que nada mais os usa.
- A paleta do setor muda em `src/cadastros/corDoSetor.ts` (12 cores, ciclo sobre 1–30); o banco não muda.
- Ícones em SVG próprio, como nos protótipos; sem pacote novo. Fontes já estão no projeto.
- Ligar um ícone a cada etapa do catálogo (que é configurável): se o catálogo não tiver como guardar isso, a decisão vai para o `/planejar`; até lá, um ícone genérico de etapa.
- O que é comportamento novo, e não só visual (interruptor "Linhas", "Destacar os meus", botão "Filtros" com contador, verso enxuto com o histórico no "···", "Mostrar" num segmento só, janela para criar setor), pode precisar de spec: separar o que é identidade do que é funcionalidade, e mandar o resto para o `/planejar` ou o `/demanda`.
- `DESIGN.md` descreve a identidade antiga e precisa ser refeito para esta.
- Fora daqui: a **Matriz** (backlog) e o possível defeito do histórico "Moveu o processo" sem as etapas (ver `decisoes.md`).

## Registro de mudanças

- 2026-10-30 — **Redesenho** (`/concepcao-livre`, a partir de `.scratch/proposta-visual/decisoes.md`). Substitui a identidade de 2026-10-07 e os acréscimos abaixo: moldura grafite e branca no lugar da barra azul; azul cheio só na ação principal e azul-claro para o escolhido, no lugar da linha acesa; etiqueta só por ícone; setor em selo com 12 cores fortes (cor viva só em ponto); base 14px. Decisões do usuário nesta sessão: vermelho, âmbar, verde e azul liberados para os setores (revê a regra 2 do `decisoes.md`), com bordô no lugar do vermelho; 12 cores; base 14px (revê a escala de 2026-10-14).
- 2026-10-28 — Cor sólida do setor (ADR 0033): cor lisa no tom claro da paleta de 30. *Substituído em 2026-10-30.*
- 2026-10-28 — Ajustes do Quadro e da Lista (ADR 0032): etiqueta Em andamento em âmbar cheio; fundo tingido só até o último cartão. *Substituído em 2026-10-30.*
- 2026-10-28 — Coluna tingida e etiquetas fortes (ADR 0031). *Substituído em 2026-10-30.*
- 2026-10-27 — Visual do cartão e cor do setor (ADR 0030): paleta de 30 cores claras, faixa no cartão, barra de etapas em degradê, etiquetas vivas. *Substituído em 2026-10-30.*
- 2026-10-27 — Caixas de seleção personalizáveis (spec `caixas-de-selecao`): `<select>` nativo com `appearance: base-select`, `OpcaoDaCaixa`, `BotaoDaCaixa`. *Continua valendo*, com a cor de foco e de escolhida revista em 2026-10-30 (seção Controles).
- 2026-10-14 — Escala da interface: fontes +2px (base 15) e larguras +15%. *Revisto em 2026-10-30 (base 14).*
- 2026-10-07 — Identidade inicial: "Quadro de etapas com linhas acesas" (barra azul `#3A5AFE`, linha acesa de 2px, pílulas de situação, quadradinhos de macroprocesso). *Substituída em 2026-10-30.*
