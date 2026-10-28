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
- 2026-10-27 — Caixas de seleção personalizáveis (spec `caixas-de-selecao`). **Padrão para toda caixa de seleção nova:** é sempre um `<select>` nativo, sem biblioteca. O estilo da lista aberta é um só, em `src/styles/caixas.css` (`appearance: base-select`, valendo no Chrome e no Edge; Firefox e Safari ficam com a caixa comum, sem perda): lista com `--folha`, borda `--linha`, canto `--canto`, sombra `--sombra-flutuante`; opção de 32px; foco e passar o mouse com `--azul-claro`; opção escolhida e foco com a linha acesa (2px `--azul` à esquerda, o respiro já reservado); sem a marca de seleção do navegador; opção desabilitada em `--texto-2`; modo de contraste forçado com `Highlight`. A caixa fechada (borda, fundo, fonte) segue nas regras de cada tela. **Só acabamento:** `<option>` de texto puro. **Com visual próprio:** usar `OpcaoDaCaixa` (`src/components/OpcaoDaCaixa.tsx`) com `cor` (quadradinho do macroprocesso, de `corDoMacroprocesso`) ou `pessoa` (Avatar de 20px, em modo `decorativo`: as iniciais saem por CSS e não entram no texto da opção, para a busca por digitação do navegador continuar achando a opção), ou o selo da etiqueta (`EtiquetaDoProcesso`) dentro da `<option>`; e pôr `<BotaoDaCaixa />` como primeiro filho do `<select>`, que faz a caixa fechada repetir esse visual. A marca é enfeite (`aria-hidden`): o nome da opção é só o texto. Opção com visual vem de dados que a tela já carregou (`cor`, `pessoa` nas opções), sem busca própria.
- 2026-10-27 — Visual do cartão e cor do setor (demanda `visual-do-cartao`, ADR 0030). Revê "barra só cinza" e "cor só onde há informação". **Cor do setor:** paleta fixa de 30 cores claras, na ordem de distribuição: 1. coral claro #F8C4C4; 2. água claro #C4F8ED; 3. rosa claro #F8C4D9; 4. menta claro #C4F8D9; 5. orquídea claro #F8C4ED; 6. verde claro #C4F8C4; 7. lilás claro #EDC4F8; 8. pistache claro #D9F8C4; 9. lavanda claro #D9C4F8; 10. limão claro #EDF8C4; 11. pervinca claro #C4C4F8; 12. areia claro #F8EDC4; 13. azul claro #C4D9F8; 14. pêssego claro #F8D9C4; 15. céu claro #C4EDF8; 16. limão médio #DAE7A6; 17. pervinca médio #A6A6E7; 18. areia médio #E7DAA6; 19. azul médio #A6C0E7; 20. pêssego médio #E7C0A6; 21. céu médio #A6DAE7; 22. coral médio #E7A6A6; 23. água médio #A6E7DA; 24. rosa médio #E7A6C0; 25. menta médio #A6E7C0; 26. orquídea médio #E7A6DA; 27. verde médio #A6E7A6; 28. lilás médio #DAA6E7; 29. pistache médio #C0E7A6; 30. lavanda médio #C0A6E7. Sempre em degradê horizontal do tom para um tom um pouco mais escuro da mesma cor, em todo lugar onde a sigla aparece (faixa do cartão, título da coluna por setor, selos da Lista, do verso e dos cadastros, setor envolvido, quadradinho das caixas de seleção); sigla em `texto` (#1E2433), contraste AA nas duas pontas. **Faixa do cartão:** de lado a lado no topo; sigla maior e centralizada (por etapa e por responsável); nome do processo em destaque, 16px negrito, no agrupamento por setor. **Barra de etapas:** faixa contínua lisa, 8px, cantos redondos, trilho cinza claro, preenchida até a etapa atual em degradê do azul claro (#C9D3FF) ao azul escuro (`azul` → #2238C8). **Etiquetas vivas:** A fazer fundo #6A3FD9, texto e bolinha brancos (6,3:1), a de maior destaque; Em andamento fundo #FFC27A, texto #5E2C00, bolinha #C85F00 (7,2:1); Concluído fundo #9EE0B4, texto #0D4A22, bolinha #178A3E (6,8:1). Pílulas de Situação sem mudança.
- 2026-10-28 — Coluna tingida e etiquetas fortes (demanda `visual-do-cartao`, ADR 0031). Revê o acréscimo de 2026-10-27 em dois pontos. **Quadro por setor:** a cor sai do cartão (sem faixa; o nome volta ao corpo, 15px seminegrito, à esquerda) e vai para a coluna: fundo do tom do setor misturado com branco (perto de 30%), na altura toda, cantos arredondados; cabeçalho no degradê do setor de lado a lado, sigla 18px negrito centralizada, nome do setor e contagem em `texto` (o `texto-2` não tem AA sobre os tons médios). Setor inativo: coluna em cinza claro dos tokens, sem a cor. Por etapa e por responsável, a faixa com a sigla fica. **Etiquetas fortes**, texto e bolinha brancos: A fazer #BE185D (6,0:1), Em andamento #4338CA (7,9:1), Finalizado (antes Concluído) #0F766E (5,5:1); fora da paleta dos setores e das pílulas de Situação.
- 2026-10-28 — Ajustes do Quadro e da Lista (demanda `ajustes-quadro-lista`, ADR 0032). Revê o acréscimo anterior de 2026-10-28 em dois pontos. **Etiqueta Em andamento:** fundo âmbar cheio #F59E0B, texto e bolinha #451A03 (7,0:1); é a única com letra escura. **Quadro por setor:** o fundo tingido vai só até o último cartão; a coluna vazia fica só com o cabeçalho colorido, com a frase abaixo sobre o fundo da página. Títulos das colunas centralizados também por etapa e por responsável, com a contagem à direita.
