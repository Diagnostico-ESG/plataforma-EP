# Identidade visual — Plataforma do EP

Aprovada em 2026-10-07 na `/concepcao-livre`. Fonte para o `/implementar-identidade`.

## Conceito

**Quadro de etapas com linhas acesas.** Visual de ferramenta de gestão de fluxos: fundo azul-acinzentado claro, cartões brancos, linhas quase invisíveis no geral e uma linha azul "acesa" só no que está em foco (cartão escolhido, aba ativa, etapa atual, campo com foco). Cor só onde há informação: alertas em pílulas, tipos de registro em barrinhas, macroprocessos em quadradinhos.

Inspiração: estilo dos editores de fluxo e quadros de processo que o usuário mostrou (Workato e Pipefy). Só cores e formatos; nenhum logotipo, nome ou marca deles entra no produto.

## Paleta

| Token | Código | Uso |
|---|---|---|
| `azul` | `#3A5AFE` | Cor principal: barra superior, botões principais, "+" da coluna, linha acesa (seleção, aba ativa, etapa atual, foco), links. Branco sobre ele: 5,2:1 |
| `azul-claro` | `#E8EDFF` | Fundo de pílula informativa, filtro ativo, item selecionado |
| `azul-escuro` | `#2A44C9` | Texto sobre `azul-claro` (6,5:1) e iniciais do avatar |
| `azul-avatar` | `#D9DFFF` | Fundo do avatar sem foto (iniciais em `azul-escuro`, 5,8:1) |
| `fundo` | `#EDF1F9` | Fundo da área de trabalho (quadro, visão do setor) |
| `folha` | `#FFFFFF` | Cartões, painel, faixa lateral, tabelas, formulários |
| `linha` | `#E1E6EF` | Bordas e divisórias (discretas, 1px) |
| `linha-tracejada` | `#C3CAD8` | Bloco "+ Cadastrar…", coluna vazia, borda tracejada |
| `barra-coluna` | `#D5DBE7` (trilho) / `#9AA6BE` (preenchimento) | Barrinha sob o nome da coluna |
| `texto` | `#1E2433` | Texto principal |
| `texto-2` | `#5D6577` | Texto secundário, ícones de navegação inativos (5,9:1 no branco, 5,2:1 no `fundo`) |
| `icone-inativo` | `#8C93A3` | Ícones da faixa lateral inativos (decorativos, sempre com rótulo acessível) |

**Pílulas de situação** (texto / fundo, todas acima de 5:1):

| Situação | Texto | Fundo |
|---|---|---|
| Atraso ("3d atraso") | `#A8263A` | `#FCE1E4` |
| Prazo vencendo ("vence 2d") | `#8A5A00` | `#FFE9C7` |
| Informativa ("Em andamento", "Aguarda revisor", "atual") | `#2A44C9` | `#E8EDFF` |
| Aprovado / concluída | `#22703A` | `#DDF3E1` |
| Histórica / realizada anteriormente / neutra | `#4A5163` | `#EEF0F4` |

**Caixas de aviso:** ajuda `#EEF2FF` com borda `#C9D3FF`; pendência `#FFF6E5` com borda `#F3D28F`; texto em `texto`.

**Barrinha por tipo de registro** (3px à esquerda do item, cor decorativa; o tipo também vem escrito ou no ícone):

| Tipo | Cor |
|---|---|
| Fluxograma (.bpmn, .png, .bpm) | `#8CC4EA` |
| Relatório (.docx, .pdf) | `#B7A5EC` |
| Reunião | `#E9CF7A` |
| E-mail (.eml) | `#F2A08C` |
| Versão histórica | `#C3CAD8` |

**Cores dos macroprocessos** (quadradinho no cartão e etiqueta com o nome; sem vermelho, âmbar ou verde, que já significam situação): `#8E4EC6` violeta, `#0797B9` ciano, `#D6409F` magenta, `#5B5BD6` índigo, `#7A8B2E` oliva, `#A0663A` cobre. O quadradinho sempre tem o nome do macroprocesso como rótulo acessível. Nota: as amostras da conversa usavam vermelho e verde nos quadradinhos; trocado aqui para não confundir com atraso e aprovado.

**Ícones do rodapé do cartão:** relógio `#C77700` (dias na etapa), documento `#22703A` (versões), setas `#3A5AFE` (rodadas de revisão), sempre acompanhados do número.

Só tema claro. Tema escuro fica fora (não pedido).

## Tipografia

- **Source Sans 3** (400, 600, 700) para toda a interface.
- **IBM Plex Mono** (400, 500) para siglas, versões (V3, V1F), nomes de arquivo no padrão SIGLA_VERSÃO_NOME, número do E-protocolo, datas e contagens.
- Arquivos de fonte guardados no projeto (sem depender do Google Fonts em produção). Licença aberta (OFL) nas duas.

**Escala:**

| Tamanho | Peso | Uso |
|---|---|---|
| 12px | 600, maiúsculas, espaçamento 0,5px | Rótulo de seção ("ETAPAS DO SETOR"), texto de pílula |
| 13px | 400 | Texto secundário, metadados, mono de códigos (12–13px) |
| 15px | 400 / 600 | Base da interface; nome do processo no cartão (600) |
| 16px | 600 | Título de coluna, título da barra superior |
| 16px | 700 | Nome na barra superior ("EP"), título do painel |
| 22px | 700 | Título de página (setor, administração) |

## Espaçamento e forma

- Passos: 4, 8, 12, 16, 24, 32px. Entre cartões: 8px. Entre colunas: 12px. Respiro interno de cartão: 8–10px; de painel: 14–16px.
- Cantos: 6px em cartões, campos e painéis; 4px em botões, quadradinhos de sigla e caixas de aviso; 2px nos quadradinhos de macroprocesso; pílulas e avatares totalmente redondos.
- Bordas de 1px na `linha`. **Linha acesa:** 2px em `azul`, compensando o respiro para nada "pular".
- Sombra só no que flutua (painel de detalhe, menus, formulário de cadastro): sombra suave e baixa. Cartões não têm sombra.
- Foco do teclado: contorno de 2px em `azul` com 2px de afastamento, em todo elemento clicável.

## Layout

- **Faixa lateral de ícones** (56px, `folha`, borda direita na `linha`): Quadro, Lista, Setores, Reuniões, Painel, Administração. Ícone ativo em `azul`; todos com rótulo acessível e dica ao passar o mouse.
- **Barra superior** (`azul`, texto branco): "EP", título da tela, alternância em pílula **Quadro | Lista** (selecionado: fundo branco, texto `azul`), ícones de filtro e usuário à direita, avatar do usuário logado.
- **Quadro de processos (tela principal de Processos):**
  - Uma coluna por etapa do processo, a partir da primeira etapa que é de cada processo (Modelagem, Revisão interna, Revisão pelo setor, Aprovação…). As etapas de nível setor (Identificação, Sensibilização, Levantamento) **não** viram colunas; ficam na visão do setor.
  - Cabeçalho da coluna: nome, contagem em mono, barrinha de proporção; o círculo azul "+" só na primeira coluna.
  - Coluna vazia: bloco tracejado com texto.
  - Com mais colunas que a tela, o quadro rola para o lado; uma indicação discreta mostra que há colunas fora da vista.
- **Cartão do processo:** quadradinho(s) de macroprocesso no topo; nome (15px, 600); sigla do setor e versão em mono; pílula de situação quando houver (atraso, vencendo, aguarda revisor, aprovado com número do E-protocolo); rodapé com ícones e contagens (dias na etapa, versões, rodadas) e avatar do responsável à direita. Cartão escolhido: linha acesa.
- **Painel de detalhe (abre à direita ao clicar num cartão ou numa linha):** o quadro fica esmaecido atrás e o cartão continua aceso. Cabeçalho com quadradinho da sigla (fundo `azul`), nome, macroprocesso e responsável, pílula de situação e botão fechar. Abaixo, o **caminho de etapas** ("✓ Ident. → ✓ Sensib. → … → **Rev. setor** → Aprov.": feitas com ✓ em `texto`, atual em `azul` com sublinhado aceso, futuras em `texto-2`). Abas: Documentos, Revisões, Reuniões, Histórico (ativa com sublinhado aceso). Abaixo de 900px de largura, o painel ocupa a tela inteira.
- **Aba Documentos:** filtros em pílula (Todos, Fluxogramas, Relatórios), botão "Enviar nova versão"; caixa de pendência quando um fluxograma não tem o relatório da mesma versão; prévia do fluxograma atual com "Abrir visualizador"; versões da mais nova para a mais antiga (V3 com pílula "atual", anteriores "substituída", V1F com cadeado e pílula "histórica · somente leitura"); cada arquivo numa linha com barrinha do tipo, nome em mono, data, avatar de quem enviou e botão baixar; rodapé "Versões nunca se apagam".
- **Lista:** a mesma informação do quadro em tabela compacta, para filtrar, ordenar e exportar; clicar na linha abre o mesmo painel.
- **Visão do setor:** cabeçalho (sigla, nome, etiquetas dos macroprocessos com o quadradinho da cor, responsável com avatar); três números (processos, atrasados, aprovados); "Etapas do setor" em três cartões (situação em pílula; "realizada anteriormente" mostra a anotação obrigatória; a etapa atual com linha acesa); abaixo, em duas colunas, "Processos do setor" (linhas com quadradinho, etapa atual em mono e pílula) e "Reuniões" (itens com barrinha de reunião e bloco tracejado "+ Registrar reunião").
- Uso em computador; celular é opcional.

## Avatar (foto ou iniciais)

- Círculo em três tamanhos: 20px (cartão), 24px (listas), 32px (cabeçalhos).
- Com foto: a foto recortada no círculo, com o nome da pessoa como texto alternativo.
- Sem foto: até duas iniciais, 600, em `azul-escuro` sobre `azul-avatar`, com o nome completo como rótulo acessível.
- Vários no mesmo item: sobrepostos com borda branca de 2px; do quarto em diante, "+N".
- Só usuários da plataforma têm foto; responsáveis dos setores aparecem com iniciais. O envio e a guarda da foto são funcionalidade (ver `.scratch/backlog.md`, item de 2026-10-07).

## Elemento marcante

O **quadro de etapas com a linha acesa**: colunas por etapa, cartões brancos discretos e um único destaque azul de 2px que acompanha o foco do usuário do quadro ao painel (cartão escolhido → etapa atual no caminho → aba ativa). Todo o resto fica quieto para os alertas de prazo saltarem.

## Movimento

- Painel de detalhe desliza da direita (200ms, suave); quadro esmaece junto.
- Passar o mouse num cartão: a borda escurece levemente (150ms).
- Mudança de etapa: o cartão aparece na coluna nova com um breve brilho da linha acesa (300ms).
- Com `prefers-reduced-motion`, tudo vira troca instantânea.

## Acessibilidade

- WCAG 2.2 AA: contrastes conferidos acima; situação sempre com texto (nunca só cor).
- Uso completo pelo teclado: cartões focáveis, Enter abre o painel, Esc fecha e devolve o foco ao cartão.
- Mover o processo de etapa por botão ("Avançar etapa", "Voltar etapa" com motivo), não só por arrastar.
- Ícones sem texto levam rótulo acessível.

## Textos-padrão

Sem "por favor", sem exclamação, sem pedir desculpa; dizer o que houve e o que fazer.

**Carregando** (sempre nomear o que carrega; usar cartões-fantasma ou linhas-fantasma no formato do conteúdo, não um círculo girando):
- "Carregando processos…"
- "Carregando documentos…"
- "Carregando o setor…"

**Vazio:**
- Quadro sem processos: "Nenhum processo cadastrado ainda. Cadastre o primeiro ou importe a planilha atual." [Cadastrar processo]
- Coluna vazia: "Nenhum processo nesta etapa."
- Com filtros: "Nenhum processo com esses filtros." [Limpar filtros]
- Documentos: "Nenhuma versão enviada. Envie o fluxograma (.bpmn e .png) para começar." [Enviar versão]
- Reuniões: "Nenhuma reunião registrada com este setor." [Registrar reunião]
- Histórico: "Nenhuma alteração registrada ainda."
- Perfil Consulta: os mesmos textos, sem o botão.

**Erro:**
- Ao carregar: "Não foi possível carregar os processos. Verifique a conexão e tente de novo." [Tentar de novo]
- Ao salvar: "A alteração não foi salva: {motivo}. Seus dados continuam no formulário."
- Perfil: "Seu perfil (Consulta) não permite editar processos. Peça a um administrador para mudar seu perfil."
- Nome de arquivo: "O arquivo "{nome}" não segue o padrão SIGLA_VERSÃO_NOME (exemplo: SET_V6_NOME DO PROCESSO)."
- Revisor: "O revisor precisa ser outra pessoa: você enviou esta versão."
- Etapa: "Esta etapa só começa quando a anterior estiver concluída, realizada anteriormente ou dispensada."

## Para o `/implementar-identidade`

- Tokens acima viram variáveis CSS num único arquivo; nenhum código de cor espalhado.
- Fontes e ícones: guardar os arquivos no projeto. Se a implementação quiser um pacote de ícones ou de fontes, isso é dependência nova e pede ADR curto; ícones em SVG próprio também servem.
- Arrastar cartões não entra na identidade: a primeira versão usa botões; arrastar é decisão do `/planejar` de "Processos e etapas" (exigiria biblioteca e ADR).
- Os detalhes de cada tela (campos, permissões por perfil) vêm das specs do `/planejar`.

## Registro de mudanças

- 2026-10-14 — Escala da interface: fontes +2px (rótulo 12, secundário 13, base 15, coluna 16, painel 18, página 22) e larguras +15% em tokens (`--largura-conteudo` 1280px, `--largura-formulario` 550px, `--largura-coluna-quadro` 310px). Decisão do usuário; fonte, paleta e estrutura não mudaram.
