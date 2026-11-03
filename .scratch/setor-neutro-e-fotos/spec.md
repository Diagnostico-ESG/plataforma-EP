# Sigla maior, Status e foto do responsável

Status: ready-for-agent

Funcionalidade 20 do `.scratch/projeto.md`, no modo curto do `/planejar` (2026-11-03). Demanda classificada no `/demanda` como mudança em `cadastros-basicos` e `processos-etapas`. Decisões no ADR 0039, que revê os ADRs 0030, 0031 e 0033 (cor do setor) e a regra "cartão sem avatar" (proposta 6, linha 80 de `.scratch/proposta-visual/decisoes.md`; identidade visual, linha 173), e no ADR 0040 (revisão do mesmo dia, segundo `/planejar` modo curto), que desfaz o setor neutro e o Status colorido do 0039. Onde as specs de `cadastros-basicos` e `processos-etapas` falarem de cor do setor, de "Etiquetas" ou de cartão sem avatar, vale esta. O nome da pasta (`setor-neutro-e-fotos`) fica como estava.

## A revisão (ADR 0040)

Visto o resultado, o selo cinza-azulado igual em todos os setores ficou sem graça, e os ícones de Status em três cores competiam com o selo do setor, agora colorido de novo. A revisão devolve ao selo do setor as 12 cores fortes de antes, em ciclo sobre o número da coluna `cor` (que o gatilho do banco nunca deixou de preencher), sem devolver a escolha de cor no cadastro nem o fundo tingido da coluna; e deixa os três ícones de Status no mesmo quase preto do texto, distinguidos só pela forma (círculo vazio, meio cheio, cheio). A sigla maior, o selo no cartão do Quadro por setor, o nome "Status", as pílulas de Situação e a foto do responsável ficam como foram entregues. Os itens 1 e 4 da solução abaixo já trazem a revisão.

## O problema

A cor própria de cada setor (12 cores fortes em ciclo sobre o número 1 a 30 gravado no banco) enfeita mais do que informa: com dezenas de setores a cor repete, e a sigla já identifica o setor. Ao mesmo tempo, o que o usuário precisa ler de relance está pequeno ou apagado: a sigla do setor é uma pílula minúscula, o ícone da etiqueta quase não se vê (e "A fazer" é cinza), a Situação do processo é texto sem cor, e o cartão não diz quem cuida a não ser pelo nome.

## A solução

1. **Cor do setor sem escolha (revisto pelo ADR 0040).** O selo de cada setor usa uma das 12 cores fortes da tabela original (bordô, laranja, mostarda, oliva, verde, petróleo, azul, roxo profundo, fúcsia, ameixa, rosa, grafite quente; sigla em branco, todas acima de 4,5:1), em ciclo sobre o número 1 a 30 da coluna `cor` de `setores`: 1 a 12 direto, 13 a 30 voltando ao começo, número inválido cai na primeira. A cor vale em todo selo: cartão, Lista, verso, cadastros de setor e de macroprocesso, e os cabeçalhos da coluna no Quadro por setor e da linha nas Linhas por setor. As opções de setor nas caixas de seleção voltam a mostrar o quadradinho da cor. Continuam fora a grade de cores do cadastro, a escolha de cor e a regra "primeira cor livre" na tela: quem dá o número é o gatilho do banco, e a tela só o lê. O fundo tingido da coluna continua fora; a coluna inativa continua distinguida pela pílula "Inativo".
2. **Sigla maior.** A pílula da sigla do setor cresce (fonte de 11px para 13px, preenchimento de 1×7px para 3×10px) no cartão, na Lista, no verso e nos cadastros.
3. **Sigla no cartão do Quadro por setor.** O cartão volta a mostrar o selo do setor também nesse quadro (hoje o omite porque a coluna o diz), para ficar igual aos outros quadros. Nas Linhas por setor do Quadro por etapa, a sigla já aparece na linha e o cartão continua sem repeti-la.
4. **Status, e não Etiquetas.** "Etiqueta" passa a se chamar **Status** em tudo que o usuário lê (legenda do Quadro, campo do verso, `title` e texto do leitor de tela), com os mesmos três valores (A fazer, Iniciado, Finalizado; Em andamento é uma Situação do processo, não um Status). "Situação" do processo continua com esse nome; a legenda do Quadro e o campo do verso deixam claro que Status é da etapa e Situação é do processo todo. O ícone do Status cresce (de 18px para 22px no cartão, de 14px para 18px com o nome). Pela revisão do ADR 0040, os três ícones ficam na cor do texto da tela (`--texto`, `#1d2330`) e se distinguem só pela forma: A fazer é o círculo vazio, Iniciado o meio cheio, Finalizado o cheio com a marca de feito. (A entrega anterior tinha A fazer laranja, Iniciado azul e Finalizado verde.)
5. **Situação em pílulas de cor.** Onde a Situação aparece como pílula (Lista, tela do setor, verso), cada valor ganha cor: Em andamento em azul claro, Suspenso em âmbar, Cancelado em vermelho claro, Concluído em verde (o que já existe). O texto continua na pílula, porque a cor sozinha não diz o valor. O cartão do Quadro não ganha pílula nova: continua mostrando só "Suspenso".
6. **Foto do responsável no cartão e na Lista.** O cartão do Quadro mostra, na linha do responsável, a foto do Google (ou o círculo com a inicial, o `Avatar` de 24px já existente), seguida de "Você" para quem está logado ou do nome; "Sem responsável" ganha o círculo tracejado. Na Lista, a coluna do responsável ganha o mesmo avatar antes do nome. No Quadro por responsável e nas Linhas por responsável o cartão continua sem repetir o responsável.

## Histórias de usuário

1. Como Integrante do EP, quero ver cada setor com a sua cor forte, igual em todas as telas, para reconhecê-lo de relance (revisto pelo ADR 0040; antes, a mesma cor neutra para todos).
2. Como Integrante ou Administrador, quero que o cadastro do setor não peça mais escolher cor, para cadastrar mais depressa.
3. Como Integrante do EP, quero a sigla do setor em pílula maior no cartão, na Lista e no verso, para lê-la sem esforço.
4. Como Integrante do EP, quero a sigla do setor também no cartão do Quadro por setor, para o cartão ser igual nos três quadros.
5. Como Integrante do EP, quero ver "Status" (e não "Etiquetas") com ícones maiores, para lê-los de relance.
6. Como Integrante do EP, quero os três ícones de Status no mesmo quase preto, diferentes só pela forma, para que não disputem a atenção com a cor do setor (revisto pelo ADR 0040; antes, "A fazer" em laranja).
7. Como Integrante do EP, quero a Situação do processo em pílula colorida (azul, âmbar, vermelho, verde), para achar de relance os suspensos e cancelados.
8. Como Integrante do EP, quero a foto (ou a inicial) de quem cuida no cartão do Quadro e na Lista, mantendo "Você" para mim, para saber a quem o processo pertence sem ler nomes.
9. Como pessoa que usa leitor de tela, quero que o Status e a Situação continuem sendo ditos com texto, e que a foto no cartão não faça o nome ser lido duas vezes.
10. Como Consulta, quero ver as mesmas telas, sem o campo de cor no cadastro, que eu já não alterava.

## Decisões de implementação

- **Cor do setor (revisão do ADR 0040):** volta um módulo puro com a tabela das 12 cores e a função do ciclo (o `corDoSetor.ts` apagado no commit `5ae9029` serve de ponto de partida, sem `nomeDaAmostra` nem `coresEmUso`, que eram da grade). `SeloDoSetor` e a opção de setor da caixa de seleção voltam a receber o número da cor e a aplicá-lo pela variável `--cor-do-setor`; o token `--selo-do-setor` sai. `GradeDeCores` continua fora.
- **Dados (revisão do ADR 0040):** as consultas voltam a ler `cor` de `setores` (lista de setores e setores envolvidos), e `Setor` e os tipos dos setores envolvidos voltam a ter `cor: number`. A tela continua sem enviar `cor` ao gravar: o gatilho do banco dá o número ao setor novo, e editar um setor não o muda. Nenhuma migração; produção não é afetada.
- **Status (revisão do ADR 0040):** `--etiqueta-a-fazer`, `--etiqueta-iniciado` e `--etiqueta-finalizado` passam a valer `var(--texto)`; os desenhos não mudam. O visto do Finalizado continua branco sobre o círculo cheio.
- **Cartão por setor:** `oQueOCartaoRepete` passa a repetir o selo sempre, exceto nas Linhas por setor. O cabeçalho da coluna deixa de ter fundo colorido; o fundo tingido da coluna sai.
- **Avatar no cartão:** reaproveita `Avatar` (foto do Google, sem envio do referrer, círculo com iniciais quando a foto falha) e `AvatarVazio`; vale a mesma regra do verso (`FotoDoResponsavel`). Os dados do responsável do processo na lista já trazem `fotoUrl`. Nenhuma consulta nova.
- **Textos:** a troca de "Etiqueta(s)" por "Status" inclui o valor acessível ("Status: A fazer") e a legenda ("Legenda do status"). Os nomes internos de código e o valor gravado no banco não mudam. O mesmo vale para as frases escritas no código que a pessoa lê (processo parado, histórico "Mudou o status", recusas de mover): dizem "status". Mensagens escritas dentro do banco não mudam (sem migração).
- **Registros de apoio:** acréscimo datado em `.scratch/identidade-visual.md` (setor neutro, Status, avatar no cartão) e atualização da tabela de `.scratch/proposta-visual/decisoes.md` (linha do avatar).

## Decisões de teste

- Ponto de teste: a tela inteira, nos testes de tela com as implementações falsas, um comportamento por teste.
- Revisão do ADR 0040: volta o teste do módulo da cor (ciclo de 1 a 30, número inválido, sigla acima de 4,5:1 em todas as 12); o selo e a opção da caixa recebem a variável da cor do setor; o cadastro continua sem escolha de cor e sem enviar `cor`; `etiquetasVivas.test.ts` passa a exigir os três tokens em `var(--texto)`.
- Na entrega anterior saíram os testes do módulo da cor do setor, da grade de cores e de `App.corDoSetorNoQuadro.test.tsx`. Entram: o cadastro do setor sem escolha de cor; o cartão do Quadro por setor com a sigla; o cartão com avatar (foto, iniciais, "Você", sem responsável); a Lista com avatar; o texto "Status" na legenda e no verso; a Situação em pílula com o texto de cada valor.
- O teste `App.cartaoDoQuadro.test.tsx:162` (cartão sem avatar) passa a exigir o avatar. As cores em si não se testam no jsdom e ficam nos critérios `[visual]`.
- Os testes de banco não mudam (nenhuma migração).

## Critérios de pronto

1. Nenhuma tela pede nem grava cor de setor; o cadastro salva nome, sigla e observações como antes. (Revisão do ADR 0040: a tela volta a mostrar a cor.)
2. O selo de cada setor tem a cor do ciclo sobre o seu número, a mesma em todas as telas (cabeçalhos do Quadro incluídos), maior que antes, e a sigla passa de 4,5:1 sobre todas as 12 cores; as opções de setor nas caixas de seleção mostram o quadradinho da cor.
3. O cartão do Quadro por setor mostra o selo; as Linhas por setor continuam sem repeti-lo.
4. Nenhum texto visível diz "Etiqueta" no lugar de Status; Situação segue como está.
5. O cartão mostra avatar ou iniciais mais "Você"/nome, ou o círculo tracejado com "Sem responsável"; a Lista mostra o avatar antes do nome.
6. A pílula de Situação mostra o texto de cada valor, com contraste AA.
7. `npm test`, typecheck e lint passam.
8. `[visual]` Selo colorido e maior no cartão, na Lista, no verso, nos cadastros e nos cabeçalhos; a coluna do Quadro por setor sem fundo tingido. (Revisto pelo ADR 0040; antes, selo neutro.)
9. `[visual]` Ícones do Status maiores, os três no quase preto do texto, distinguíveis de relance só pela forma. (Revisto pelo ADR 0040; antes, laranja, azul e verde.)
10. `[visual]` Pílulas de Situação nas quatro cores; cartão com foto do Google real e "Você" no app com o login.

Estados de tela: não mudam (carregando, vazio e erro seguem como estão; a foto que falha cai nas iniciais).

## Fora do escopo

- Migração do banco ou remoção da coluna `cor` (a revisão do ADR 0040 volta a usá-la).
- Devolver a escolha de cor no cadastro, a grade de cores ou o fundo tingido da coluna (revisão do ADR 0040).
- Pílula de Situação no cartão do Quadro (decidido não fazer).
- Renomear "Situação" ou os valores do Status.
- Os itens adiados em `.scratch/proximo-passo.md` (bug do histórico, nome do setor ao passar o mouse, divisão do `Quadro.css`).

Implementado em 2026-11-03 (commit a5eba6e)

Entregue em 2026-11-03 (commit a973441), com ressalva: critérios [visual] 8 a 10 de setor-neutro-e-fotos presumidos no app real (selo neutro e maior, ícones do Status, pílulas de Situação e foto do Google no cartão não vistos com o login; só o código e os testes conferidos)

Implementado em 2026-11-03 (commit 12d7604)

Entregue em 2026-11-03 (commit e863a5c), com ressalva: critérios [visual] 8 e 9 da revisão do ADR 0040 presumidos no app real (cores dos selos, cabeçalho do Quadro por setor sem moldura e ícones de Status no quase preto vistos só numa vitrine local com módulos falsos, pelos estilos calculados, sem captura de tela e sem o login); critério [visual] 10 segue presumido; revisão de segurança dispensada (a mudança só volta a ler a coluna cor do próprio banco e muda estilos, sem login, permissão, dado pessoal, dado de fora ou migração)
