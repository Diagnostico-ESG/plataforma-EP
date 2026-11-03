# Setor neutro, Status colorido e foto do responsável

Status: ready-for-agent

Funcionalidade 20 do `.scratch/projeto.md`, no modo curto do `/planejar` (2026-11-03). Demanda classificada no `/demanda` como mudança em `cadastros-basicos` e `processos-etapas`. Decisões no ADR 0039, que revê os ADRs 0030, 0031 e 0033 (cor do setor) e a regra "cartão sem avatar" (proposta 6, linha 80 de `.scratch/proposta-visual/decisoes.md`; identidade visual, linha 173). Onde as specs de `cadastros-basicos` e `processos-etapas` falarem de cor do setor, de "Etiquetas" ou de cartão sem avatar, vale esta.

## O problema

A cor própria de cada setor (12 cores fortes em ciclo sobre o número 1 a 30 gravado no banco) enfeita mais do que informa: com dezenas de setores a cor repete, e a sigla já identifica o setor. Ao mesmo tempo, o que o usuário precisa ler de relance está pequeno ou apagado: a sigla do setor é uma pílula minúscula, o ícone da etiqueta quase não se vê (e "A fazer" é cinza), a Situação do processo é texto sem cor, e o cartão não diz quem cuida a não ser pelo nome.

## A solução

1. **Setor sem cor própria.** Todo selo de setor usa uma cor só, cinza-azulado neutro (referência `#475569`, sigla em branco, contraste AA). Some a grade de cores do cadastro do setor, a escolha de cor e a regra "primeira cor livre" na tela. A coluna `cor` de `setores` continua no banco e é ignorada pela tela (sem migração; o gatilho do banco segue dando valor a setor novo). O cabeçalho da coluna no Quadro por setor deixa de ser colorido, e o fundo tingido da coluna sai; a coluna inativa continua distinguida pela pílula "Inativo".
2. **Sigla maior.** A pílula da sigla do setor cresce (fonte de 11px para 13px, preenchimento de 1×7px para 3×10px) no cartão, na Lista, no verso e nos cadastros.
3. **Sigla no cartão do Quadro por setor.** O cartão volta a mostrar o selo do setor também nesse quadro (hoje o omite porque a coluna o diz), para ficar igual aos outros quadros. Nas Linhas por setor do Quadro por etapa, a sigla já aparece na linha e o cartão continua sem repeti-la.
4. **Status, e não Etiquetas.** "Etiqueta" passa a se chamar **Status** em tudo que o usuário lê (legenda do Quadro, campo do verso, `title` e texto do leitor de tela), com os mesmos três valores (A fazer, Em andamento, Finalizado). "Situação" do processo continua com esse nome; a legenda do Quadro e o campo do verso deixam claro que Status é da etapa e Situação é do processo todo. O ícone do Status cresce (de 18px para 22px no cartão, de 14px para 18px com o nome) e o de **A fazer** passa de cinza a **laranja** (`#EA580C`); Em andamento (azul) e Finalizado (verde) ficam como estão.
5. **Situação em pílulas de cor.** Onde a Situação aparece como pílula (Lista, tela do setor, verso), cada valor ganha cor: Em andamento em azul claro, Suspenso em âmbar, Cancelado em vermelho claro, Concluído em verde (o que já existe). O texto continua na pílula, porque a cor sozinha não diz o valor. O cartão do Quadro não ganha pílula nova: continua mostrando só "Suspenso".
6. **Foto do responsável no cartão e na Lista.** O cartão do Quadro mostra, na linha do responsável, a foto do Google (ou o círculo com a inicial, o `Avatar` de 24px já existente), seguida de "Você" para quem está logado ou do nome; "Sem responsável" ganha o círculo tracejado. Na Lista, a coluna do responsável ganha o mesmo avatar antes do nome. No Quadro por responsável e nas Linhas por responsável o cartão continua sem repetir o responsável.

## Histórias de usuário

1. Como Integrante do EP, quero ver todos os setores com a mesma cor neutra, para a cor não competir com o que importa.
2. Como Integrante ou Administrador, quero que o cadastro do setor não peça mais escolher cor, para cadastrar mais depressa.
3. Como Integrante do EP, quero a sigla do setor em pílula maior no cartão, na Lista e no verso, para lê-la sem esforço.
4. Como Integrante do EP, quero a sigla do setor também no cartão do Quadro por setor, para o cartão ser igual nos três quadros.
5. Como Integrante do EP, quero ver "Status" (e não "Etiquetas") com ícones maiores, para lê-los de relance.
6. Como Integrante do EP, quero o ícone de "A fazer" em laranja, para distingui-lo do cinza de "sem informação" e do azul de "Em andamento".
7. Como Integrante do EP, quero a Situação do processo em pílula colorida (azul, âmbar, vermelho, verde), para achar de relance os suspensos e cancelados.
8. Como Integrante do EP, quero a foto (ou a inicial) de quem cuida no cartão do Quadro e na Lista, mantendo "Você" para mim, para saber a quem o processo pertence sem ler nomes.
9. Como pessoa que usa leitor de tela, quero que o Status e a Situação continuem sendo ditos com texto, e que a foto no cartão não faça o nome ser lido duas vezes.
10. Como Consulta, quero ver as mesmas telas, sem o campo de cor no cadastro, que eu já não alterava.

## Decisões de implementação

- **Módulo `corDoSetor.ts`, `GradeDeCores`, `coresEmUso` e as variáveis `--cor-do-setor`:** saem. O selo passa a usar um token único (cor do selo do setor) em `tokens.css`. `SeloDoSetor` e a opção da caixa de seleção deixam de receber `cor`. O quadradinho de cor das opções de setor nas caixas de seleção sai (com uma cor só não informa).
- **Dados:** `Setor.cor`, `DadosDoSetor.cor` e os campos `cor` dos setores envolvidos deixam de ser lidos e enviados pela tela e pelas consultas; a coluna do banco e os tipos gerados ficam como estão. Nenhuma migração; produção não é afetada.
- **Cartão por setor:** `oQueOCartaoRepete` passa a repetir o selo sempre, exceto nas Linhas por setor. O cabeçalho da coluna deixa de ter fundo colorido; o fundo tingido da coluna sai.
- **Avatar no cartão:** reaproveita `Avatar` (foto do Google, sem envio do referrer, círculo com iniciais quando a foto falha) e `AvatarVazio`; vale a mesma regra do verso (`FotoDoResponsavel`). Os dados do responsável do processo na lista já trazem `fotoUrl`. Nenhuma consulta nova.
- **Textos:** a troca de "Etiqueta(s)" por "Status" inclui o valor acessível ("Status: A fazer") e a legenda ("Legenda do status"). Os nomes internos de código e o valor gravado no banco não mudam.
- **Registros de apoio:** acréscimo datado em `.scratch/identidade-visual.md` (setor neutro, Status, avatar no cartão) e atualização da tabela de `.scratch/proposta-visual/decisoes.md` (linha do avatar).

## Decisões de teste

- Ponto de teste: a tela inteira, nos testes de tela com as implementações falsas, um comportamento por teste.
- Saem os testes do módulo da cor do setor, da grade de cores e de `App.corDoSetorNoQuadro.test.tsx`. Entram: o cadastro do setor sem escolha de cor; o cartão do Quadro por setor com a sigla; o cartão com avatar (foto, iniciais, "Você", sem responsável); a Lista com avatar; o texto "Status" na legenda e no verso; a Situação em pílula com o texto de cada valor.
- O teste `App.cartaoDoQuadro.test.tsx:162` (cartão sem avatar) passa a exigir o avatar. As cores em si não se testam no jsdom e ficam nos critérios `[visual]`.
- Os testes de banco não mudam (nenhuma migração).

## Critérios de pronto

1. Nenhuma tela mostra, pede ou grava cor de setor; o cadastro salva nome, sigla e observações como antes.
2. O selo do setor é igual em todas as telas, maior que antes, e a sigla passa de 4,5:1 sobre a cor neutra.
3. O cartão do Quadro por setor mostra o selo; as Linhas por setor continuam sem repeti-lo.
4. Nenhum texto visível diz "Etiqueta" no lugar de Status; Situação segue como está.
5. O cartão mostra avatar ou iniciais mais "Você"/nome, ou o círculo tracejado com "Sem responsável"; a Lista mostra o avatar antes do nome.
6. A pílula de Situação mostra o texto de cada valor, com contraste AA.
7. `npm test`, typecheck e lint passam.
8. `[visual]` Selo neutro e maior no cartão, na Lista, no verso e nos cadastros; cabeçalho da coluna por setor sem cor.
9. `[visual]` Ícones do Status maiores, com "A fazer" laranja, Em andamento azul e Finalizado verde, distinguíveis de relance.
10. `[visual]` Pílulas de Situação nas quatro cores; cartão com foto do Google real e "Você" no app com o login.

Estados de tela: não mudam (carregando, vazio e erro seguem como estão; a foto que falha cai nas iniciais).

## Fora do escopo

- Migração do banco ou remoção da coluna `cor` (backlog, se um dia incomodar).
- Pílula de Situação no cartão do Quadro (decidido não fazer).
- Renomear "Situação" ou os valores do Status.
- Os itens adiados em `.scratch/proximo-passo.md` (bug do histórico, nome do setor ao passar o mouse, divisão do `Quadro.css`).

Implementado em 2026-11-03 (commit a5eba6e)
