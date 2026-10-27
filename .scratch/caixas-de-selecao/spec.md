# Caixas de seleção

Spec do modo curto do `/planejar` (2026-10-27). Origem: `/demanda` de 2026-10-27, opção B.

## Como resolve

Hoje as 17 caixas de seleção da plataforma (em 11 componentes) usam a caixa comum do sistema. Fechada, ela segue mais ou menos a identidade, mas a lista aberta é a cinza do Windows, sem as cores e a fonte da plataforma. A mudança liga a caixa de seleção personalizável do próprio navegador (a regra de CSS `appearance: base-select`, que deixa estilizar também a lista aberta; existe no Chrome e no Edge) em todas elas, com o acabamento da identidade: fonte, cantos, borda, sombra flutuante da lista e linha acesa em azul na opção marcada e no foco. As caixas que têm algo a mostrar exibem o visual real de cada opção: a etiqueta aparece como o selo do cartão, o macroprocesso com a sua marca de cor e o responsável com o Avatar. No Firefox e no Safari, que ainda não têm esse recurso, a caixa comum continua funcionando como hoje. Não entra dependência nova nem menu feito do zero, e a caixa continua sendo um `<select>`, então teclado, leitor de tela e formulários seguem como estão.

## Decisões das perguntas

1. **Etapa:** só o acabamento da identidade, sem marca própria. As etapas não têm cor (a barra do cartão é cinza de propósito), e o verso já mostra a barra logo acima.
2. **Macroprocesso:** cada opção ganha a marca de cor do macroprocesso, a mesma do cartão (`corDoMacroprocesso`), sem cor nova.
3. **Responsável:** cada pessoa aparece com o Avatar de sempre (foto da conta Google, ou iniciais na falta dela), o mesmo componente do cartão e do verso.

## As caixas e o tratamento de cada uma

| Caixa | Onde | Tratamento |
|-|-|-|
| Etiqueta | verso do cartão (`CorpoDoAgora`) | selo com a cor e o formato do cartão (`EtiquetaDoProcesso`) |
| Etapa | verso do cartão (`CorpoDoAgora`) | acabamento |
| Responsável ("Trocar") | verso do cartão (`TrocaDoResponsavel`) | Avatar + nome; "Ninguém por enquanto" só com o texto; o inativo segue desabilitado, com "(Inativo)" |
| Filtro Responsável | Quadro e Lista (`FiltrosDosProcessos`) | Avatar + nome; "Todos" só com o texto |
| Filtro Macroprocesso | Quadro e Lista (`FiltrosDosProcessos`) | marca de cor + nome; "Todos" só com o texto |
| Demais filtros (Setor, Etapa atual, Tipo, Situação, Arquivados) | Quadro e Lista (`FiltrosDosProcessos`) | acabamento |
| Macroprocesso | formulário do processo (`CamposDoProcesso`) | marca de cor + nome |
| Setor, Origem, Tipo, Processo pai | formulário do processo (`CamposDoProcesso`) | acabamento |
| Tipo, Processo pai | janela de reclassificação (`JanelaDeReclassificacao`) | acabamento |
| Fase, Posição da etapa nova, Perfil | Administração (`CampoDaFase`, `CamposDaEtapaNova`, `SeletorDePerfil`) | acabamento |
| Categoria, Setor a pôr, Item do histórico | Cadastros (`FormularioDeMacroprocesso`, `PorSetor`, `ListaDoHistorico`) | acabamento |

Escolhas padrão (não perguntadas): a caixa fechada mostra o mesmo visual da opção escolhida (o selo, a marca ou o Avatar), e a lista aberta mostra o visual em todas as opções. Caixa desabilitada fica com o aspecto apagado que já tem.

## Estados de tela

As caixas não buscam dados por conta própria: as opções vêm das listas que a tela já carregou, e os estados de carregando, vazio e erro de cada tela ficam como estão. Opção com foto que falha cai nas iniciais, como o Avatar já faz.

## Critérios de pronto

- [ ] As 17 caixas da tabela usam a caixa personalizável, com um só estilo compartilhado (no modelo de `src/styles/botoes.css`), sem dependência nova e com as cores só por tokens de `src/styles/tokens.css`.
- [ ] A caixa continua sendo um `<select>`: valores, nomes acessíveis, opções desabilitadas e o que se grava ao escolher ficam iguais (os testes atuais passam sem mudar o que provam).
- [ ] O filtro Responsável recebe a foto de cada pessoa junto do nome (as opções dos filtros hoje só trazem id e nome); teste da função que monta as opções.
- [ ] O "Trocar" do responsável mantém o foco ao abrir e fechar e o Esc fechando só a lista, não o verso.
- [ ] [visual] No Chrome, a lista aberta usa a fonte, os cantos, a borda e a sombra flutuante da identidade, e a opção marcada e o foco têm a linha acesa em azul.
- [ ] [visual] No Chrome, a etiqueta aparece como o selo do cartão, fechada e aberta; o macroprocesso com a marca de cor; o responsável com o Avatar.
- [ ] [visual] No Firefox (ou num navegador sem o recurso), as caixas aparecem como a caixa comum, legíveis e funcionando, sem quebrar o leiaute.
- [ ] [visual] No modo de contraste forçado do Windows, as caixas e a opção marcada continuam visíveis.
- [ ] Entrada nova em `.scratch/identidade-visual.md` descrevendo o padrão das caixas de seleção, para as caixas futuras o seguirem.

## Pontos de atenção para a execução

- O jsdom dos testes não desenha a caixa personalizável; os testes provam comportamento, e a aparência se confere no navegador (`[visual]`).
- O conteúdo rico dentro de `<option>` (selo, Avatar) e o elemento `<selectedcontent>` (que repete na caixa fechada o visual da opção escolhida) dependem de o React 19.3 aceitá-los sem aviso. Se não aceitar, pare e me mostre as opções antes de qualquer contorno.
