# Processos e etapas

Status: ready-for-agent

**Como resolve o problema (desde 2026-10-23, Andamento livre; cartão e verso ajustados em 2026-10-25; visualização por setores em 2026-10-26; macroprocesso fora da frente do cartão em 2026-10-27; visual do cartão, com a cor do setor, em 2026-10-27; coluna tingida por setor e etiquetas fortes em 2026-10-28).** Hoje o andamento de cada processo fica espalhado entre planilhas e o Power BI, sem saber com certeza em que etapa cada um está, quem cuida dele nem o que mudou. Com esta funcionalidade, a equipe do EP cadastra na plataforma cada processo e subprocesso, ligado ao setor dono e a um macroprocesso. O processo entra na etapa **Não iniciados** e anda pelo catálogo de etapas como um cartão no Planner: qualquer integrante o leva a qualquer etapa, para a frente ou para trás, pela lista de etapas ou arrastando o cartão, sem motivo e sem trava de sequência. A etapa atual tem uma **etiqueta** (A fazer, Em andamento ou Finalizado), e o processo tem um **responsável**, que passa a ser quem o move. Quem termina a sua parte marca Finalizado, e o próximo vê e pega o processo. O processo termina na etapa **Concluídos**. O histórico guarda cada mudança de etapa, etiqueta e responsável, e o processo que fica mais de 7 dias na mesma etapa ganha um aviso. As seções "Coluna tingida e etiquetas fortes" (2026-10-28), "Visual do cartão" (2026-10-27), "Visualização por setores" (2026-10-26), "Cartão e verso" (2026-10-25) e "Andamento livre", logo abaixo, descrevem o modelo atual e valem sobre o resto desta spec no que divergirem; a mais nova vale sobre a mais antiga. O texto que segue a ela é o registro das entregas anteriores.

**Cor sólida do setor (mudança de 2026-10-28, spec própria).** A funcionalidade 13, `.scratch/cor-solida-do-setor/spec.md` (ADR 0033), troca o degradê da cor do setor pela cor lisa no tom claro: selo, faixa do cartão, cabeçalho da coluna por setor e quadradinho das caixas de seleção de setor. Onde esta spec fala em "degradê do setor" ou nas "duas pontas do degradê", vale aquela. A barra de etapas continua em degradê azul, e o fundo tingido da coluna não muda.

**Como resolvia antes de 2026-10-23.** A equipe registrava o andamento etapa por etapa, da Modelagem piloto em diante, num caminho que o administrador configura no catálogo de etapas. A área Processos mostra o trabalho vivo num Quadro, com uma coluna por etapa, e o arquivo completo numa Lista com busca pelo nome e filtros; ao abrir um processo, o **verso do cartão**, uma janela central em duas colunas, mostra primeiro o que há para fazer agora (a etapa atual, quem cuida dela e um único botão principal), depois o caminho de etapas e os arquivos, e ao lado o contexto do processo; o que é raro (histórico, editar, reclassificar, suspender, cancelar, excluir) fica num menu. No Quadro, cada cartão mostra de relance onde o processo está (uma barra com um pedaço por etapa) e só ganha selo quando há algo a dizer (processo parado, relatório pendente, etapa sem responsável, reunião próxima, versão, subprocessos); arrastar o cartão para a coluna seguinte conclui a etapa, e a equipe pode agrupar o Quadro por responsável ou ver só os processos que estão com ela. O banco impõe a sequência das etapas, a situação do processo, as regras de reclassificação e o registro de cada mudança no histórico. As funcionalidades seguintes (reuniões, documentos, revisões, prazos e painel) se apoiam nesse andamento.

Decisões de origem: `.scratch/processos-etapas/sabatina.md` (sabatina de 2026-10-13, três rodadas), `CONTEXT.md` (seções "Setores" e "Processos") e ADR 0004 (mudar o catálogo muda o caminho dos processos em andamento). Mudança de 2026-10-18 (parte 1 da iniciativa experiencia-do-quadro, `.scratch/experiencia-do-quadro/sabatina-parte-1.md`, ADR 0013): saem as etapas do setor, a coluna "Aguardando o setor", os responsáveis do setor e o nível do catálogo; a primeira etapa passa a se chamar Modelagem piloto; o processo ganha a data da reunião (spec de `reunioes`). Mudança de 2026-10-18 (parte 2, `.scratch/experiencia-do-quadro/sabatina-parte-2.md`, ADR 0014): resolver a etapa atual (concluir, dispensar ou registrar como realizada anteriormente) já **avança**, ou seja, inicia a próxima etapa pendente com o responsável escolhido na mesma janela; voltar também escolhe o responsável; [Assumir] em etapa sem responsável; quem enviou a versão mais recente não pode ser escolhido como responsável da Revisão interna. Mudança de 2026-10-19 (parte 3, "Verso do cartão", `.scratch/experiencia-do-quadro/sabatina-parte-3.md`, sem ADR nem mudança no banco): o painel lateral vira o verso do cartão, uma janela central em duas colunas com o cartão "Agora"; o Novo processo, o Editar e o Histórico abrem dentro dela; a Lista ganha busca pelo nome. Mudança de 2026-10-19 (parte 4, "Cartão do Quadro", `.scratch/experiencia-do-quadro/sabatina-parte-4.md`, sem ADR): o cartão do Quadro ganha a barra de progresso e os selos; arrastar o cartão para a coluna de destino abre a janela de avanço da parte 2; o Quadro ganha "Agrupar por: Etapa | Responsável" e "Só os meus"; a view `processos_com_andamento` ganha campos, por migração não destrutiva; `CONTEXT.md` ganha "Processo parado". Mudança de 2026-10-23 ("Anotações do processo", `.scratch/processos-etapas/sabatina-anotacoes.md`, ADR 0021): o verso ganha, no alto da coluna direita, as **Anotações**, um texto livre e único por processo, guardado sozinho enquanto se escreve, sem histórico, com recusa quando outra pessoa alterou antes; `CONTEXT.md` ganha "Anotações".

## Ajustes do Quadro e da Lista (mudança de 2026-10-28)

Demanda de 2026-10-28, planejada no `/planejar` modo curto (`ajustes-quadro-lista`); ADR 0032; acréscimo datado em `.scratch/identidade-visual.md`. Vale sobre a seção "Coluna tingida e etiquetas fortes" e o resto desta spec no que divergir. Sem mudança no banco.

**Como resolve o problema.** Depois da coluna tingida, a tela ainda tinha seis arestas. No Quadro por etapa e por responsável, os títulos das colunas ficavam à esquerda, enquanto no Quadro por setor ficavam centralizados. A etiqueta Em andamento, em índigo, lia como "azul" e não como "em movimento"; um âmbar cheio diz isso melhor. No Quadro por setor, a cor na altura toda pintava grandes áreas vazias, e os setores sem processo apareciam misturados aos que têm, obrigando a procurar onde há trabalho. Na Lista, a coluna Etiqueta ocupava espaço com uma informação de uso do Quadro, e alguns nomes apareciam centralizados. Agora os títulos ficam centralizados em todo agrupamento, a etiqueta Em andamento fica âmbar, a cor da coluna vai só até o último cartão, os setores vazios vão para o fim, a Lista perde a coluna Etiqueta e todos os nomes ficam à esquerda.

### O que muda

- **Título das colunas no Quadro por etapa e por responsável:** o título fica centralizado na coluna, como no Quadro por setor; a contagem continua à direita, na mesma linha do título, sem passar por cima de título longo. O nome acessível da coluna não muda.
- **Etiqueta Em andamento:** fundo âmbar cheio `#F59E0B`, texto e bolinha marrom-escuros `#451A03` (7,0:1). É a única das três com letra escura (o branco não tem contraste AA sobre o âmbar). A fazer (magenta) e Finalizado (verde-petróleo) não mudam. Vale em todo lugar onde a etiqueta aparece (cartão e opções da etiqueta no Agora). Só mudam os três tokens de cor de Em andamento; o componente não muda.
- **Altura da cor no Quadro por setor:** o fundo tingido da coluna vai só até o fim do último cartão (com a mesma folga de baixo que as outras colunas têm), não mais até a base do Quadro. A coluna **vazia** fica só com o cabeçalho colorido, sem área tingida, e a frase de coluna vazia aparece logo abaixo, sobre o fundo da página. O setor inativo segue a mesma regra, em cinza.
- **Ordem das colunas no Quadro por setor:** primeiro os setores que têm ao menos um cartão **na tela** (depois dos filtros e de "Só os meus"), em ordem alfabética de sigla; depois os vazios, também em ordem de sigla. Ao ligar ou desligar um filtro, as colunas mudam de lugar para manter os vazios no fim. O setor inativo entra na regra como os outros (ele só aparece quando tem processo). Com o filtro Setor, a coluna é uma só, como hoje.
- **Lista:** sai a coluna Etiqueta. As colunas ficam Nome, Tipo, Setor, Macroprocesso, Etapa atual, Responsável, Situação. A etiqueta continua no cartão do Quadro e no Agora do verso.
- **Coluna Nome da Lista:** todas as linhas alinhadas à esquerda, inclusive o nome que quebra em mais de uma linha, o que tem processo pai ("↳ …") e o que tem selo de parado. Causa provável, a confirmar na execução: o nome está dentro de um botão (`cadastros-abrir`), e o navegador centraliza o texto de botão quando ele quebra de linha.

### Estados de tela

Sem mudança: a tela não passa a carregar nada novo. Carregando, sem processos e com erro seguem como hoje (a Lista carregando passa a ter uma coluna a menos nas linhas fantasma). A coluna vazia do Quadro por setor mostra o cabeçalho colorido e a frase abaixo.

### Critérios de pronto

1. No Quadro por setor, as colunas com cartão vêm antes das vazias, cada grupo em ordem de sigla; com "Só os meus" ou outro filtro, um setor sem cartão visível vai para o grupo dos vazios.
2. A Lista não tem a coluna Etiqueta (cabeçalho, linhas e linhas fantasma do carregando).
3. Teste de contraste: o texto da etiqueta Em andamento tem pelo menos 4,5:1 sobre o âmbar; A fazer e Finalizado seguem com o branco acima de 4,5:1.
4. `[visual]` No Quadro por etapa e por responsável, o título de cada coluna fica centralizado, com a contagem à direita, inclusive com título longo.
5. `[visual]` A etiqueta Em andamento aparece em âmbar cheio com letra escura, no cartão e no Agora, e se distingue da pílula "vencendo" (âmbar claro).
6. `[visual]` No Quadro por setor, a cor de cada coluna vai até o fim do último cartão; a coluna vazia mostra só o cabeçalho colorido e a frase abaixo, sobre o fundo da página.
7. `[visual]` Na Lista, todos os nomes ficam alinhados à esquerda, inclusive nome longo que quebra de linha, com processo pai e com selo de parado.

## Coluna tingida e etiquetas fortes (mudança de 2026-10-28)

Demanda de 2026-10-28 pelo `/demanda` (mudança em funcionalidade existente, `visual-do-cartao`), planejada no modo curto; ADR 0031; acréscimo datado em `.scratch/identidade-visual.md`. Maquetes aprovadas em `.scratch/visual-do-cartao/imagens/`: `maquete-por-setor.html` (opção B), `maquete-altura-da-cor.html` (opção A) e `maquete-etiquetas.html` (opção 2, com magenta e índigo trocados). Vale sobre a seção "Visual do cartão" e o resto desta spec no que divergir. Sem mudança no banco.

**Como resolve o problema.** No Quadro por setor, a cor do setor estava no lugar errado: cada cartão tinha uma faixa larga colorida com o nome do processo em 16px, centralizado, e o título da coluna, que é o que diz de qual setor se trata, ficava quase sem cor. Com cartões de vários tons lado a lado, a tela pesava e o nome do processo se lia pior que no Quadro por etapa. Agora a cor sai do cartão e vai para a coluna: o cabeçalho é uma faixa colorida de ponta a ponta com a sigla centralizada, a coluna inteira ganha um fundo claro do mesmo tom, e o cartão fica branco e igual ao do Quadro por etapa. Além disso, as etiquetas tinham tons claros (laranja, verde) da mesma família das cores dos setores e sumiam dentro da coluna tingida. Elas passam a ter fundo forte com letra branca, em cores que não existem na paleta dos setores nem nas pílulas de prazo. A etiqueta Concluído passa a se chamar **Finalizado**, para não se confundir com a etapa Concluídos.

### O que muda

- **Coluna do Quadro por setor:** a coluna inteira, na altura toda do Quadro e mesmo vazia, ganha um fundo claro do tom do setor (o tom misturado com branco, perto de 30% do tom), com cantos arredondados. O cabeçalho é uma faixa no degradê do setor (o mesmo do selo), de lado a lado da coluna, colada no alto dela: a sigla em destaque (18px, negrito) centralizada, o nome do setor centralizado abaixo e a contagem à direita. O nome do setor e a contagem no cabeçalho ficam em `texto` (escuro), não em `texto-2`, porque o cinza médio não tem contraste AA sobre os tons médios da paleta. A frase da coluna vazia continua, sobre o fundo tingido.
- **Setor inativo:** a coluna dele (que só aparece quando ainda tem processo) fica em **cinza**, sem a cor do setor: cabeçalho e fundo nos cinzas claros dos tokens existentes, com o cabeçalho um tom acima do fundo, e a pílula "Inativo" no cabeçalho como hoje. Muda o que a seção "Visual do cartão" dizia ("A coluna de setor inativo mantém a marca 'inativo' e a sua cor").
- **Cartão no Quadro por setor:** sai a faixa larga com o nome. O nome do processo volta ao corpo do cartão, igual ao Quadro por etapa e por responsável (15px, seminegrito, alinhado à esquerda). O cartão não leva sigla nem cor do setor; o resto (barra da etapa, selos, rodapé, faixa vermelha do parado) fica como está.
- **Quadro por etapa e por responsável:** sem mudança. O cartão continua com a faixa larga com a sigla, porque ali a coluna não diz o setor.
- **Etiquetas, em todo lugar onde aparecem** (cartão, coluna Etiqueta da Lista, opções da etiqueta no Agora): fundo forte, texto e bolinha brancos. **A fazer** magenta `#BE185D` (6,0:1), **Em andamento** índigo `#4338CA` (7,9:1), **Finalizado** verde-petróleo `#0F766E` (5,5:1). Só mudam os tokens de cor; o componente não muda.
- **Nome da etiqueta:** o valor guardado no banco continua `concluido`; só o rótulo exibido muda de "Concluído" para "Finalizado", num único ponto (`ROTULO_DA_ETIQUETA`). Aparece assim no cartão, na Lista, no Agora e no histórico, inclusive nas entradas antigas (o rótulo se monta na hora de exibir). A etapa **Concluídos** e a situação "Concluído" do processo (Lista, filtros, planilhas dos dashboards) não mudam.

### Estados de tela

Sem mudança: a tela não passa a carregar nada novo. Carregando, sem processos e com erro seguem como hoje; a coluna vazia fica tingida, com a frase.

### Critérios de pronto

1. No Quadro por setor, o cartão mostra o nome do processo no corpo, como no Quadro por etapa, sem faixa colorida e sem repetir o nome.
2. No Quadro por setor, o cabeçalho de cada coluna traz a sigla e o nome do setor; o nome acessível da coluna continua o mesmo (sigla, nome e, no inativo, "inativo").
3. No Quadro por etapa e por responsável, o cartão continua com a faixa com a sigla.
4. As etiquetas mostram "A fazer", "Em andamento" e "Finalizado" no cartão, na Lista, no Agora e no histórico; a etapa Concluídos e a situação "Concluído" continuam com o nome de hoje.
5. Teste de contraste: o texto branco tem pelo menos 4,5:1 sobre o fundo de cada etiqueta.
6. `[visual]` No Quadro por setor, cada coluna é uma faixa colorida até a base do Quadro, inclusive vazia, com o cabeçalho em degradê de lado a lado e a sigla centralizada, legível nas 30 cores.
7. `[visual]` A coluna de setor inativo fica cinza, com a pílula "Inativo", e se distingue das coloridas.
8. `[visual]` As etiquetas em magenta, índigo e verde-petróleo se destacam sobre o cartão branco e não se confundem com as pílulas de Situação nem com as cores dos setores.

## Visual do cartão (mudança de 2026-10-27)

Demanda visual-do-cartao (`.scratch/visual-do-cartao/demanda.md`), decidida na sabatina `.scratch/visual-do-cartao/sabatina.md` e no ADR 0030; acréscimo datado em `.scratch/identidade-visual.md` (tons, medidas e contrastes). Termo no `CONTEXT.md`: **Cor do setor**. A cor em si (coluna, paleta, escolha no formulário do setor) está na seção "Cor do setor" da spec de `cadastros-basicos`, que é a que vale para ela; esta seção trata do que muda na área Processos. Vale sobre a "Macroprocesso fora da frente do cartão", a "Visualização por setores", a "Cartão e verso" e o resto desta spec no que divergir.

**Como resolve o problema.** O cartão do Quadro é todo cinza: a barra de etapas é cinza de propósito, as etiquetas têm cor suave e a sigla do setor é um texto miúdo no topo. Numa coluna cheia, a equipe não reconhece o setor de relance e o cartão "parece sem vida". Agora cada cartão ganha no topo uma faixa na cor do setor, a barra de etapas vira uma faixa azul em degradê que se enche até a etapa atual, e a etiqueta que pede ação (A fazer) salta aos olhos. A cor do setor acompanha a sigla também na Lista, no verso e nas caixas de seleção de setor.

### O que muda no resto desta spec

- **Frente do cartão (ADR 0029, revisto):** a linha do topo com a sigla miúda vira uma faixa colorida de lado a lado. No agrupamento por setor ela não some mais: leva o nome do processo. Substitui o primeiro item da seção "Macroprocesso fora da frente do cartão" e a frase "a sigla do setor sai do cartão" da "Visualização por setores" (a sigla continua fora: no lugar dela entra o nome).
- **Barra da etapa:** deixa de ser blocos cinza (seção "Cartão e verso", histórias 18 a 20 e 24, e o critério `[visual]` da barra). Onde aparece não muda.
- **Etiquetas:** deixam de ser "cor suave" (seção "Cartão e verso", história 25 e o critério `[visual]` das etiquetas).
- **Fica como está:** as pílulas de Situação (Suspenso, atraso, aprovado, tipo), o selo e a faixa vermelha à esquerda do processo parado, o selo da modelagem, o avatar no rodapé, o quadradinho do macroprocesso no verso, a coluna Macroprocesso da Lista, os nomes de arquivo e os textos corridos (histórico, avisos, opções "SIGLA — Nome do processo" dos processos pai), que continuam só texto.

### Solução

- **Faixa do setor no cartão:** no topo do cartão do Quadro, de lado a lado, uma faixa na cor do setor em degradê (do tom da cor, à esquerda, para um tom um pouco mais escuro dela, à direita). Nos agrupamentos por etapa e por responsável, a faixa leva a sigla maior e centralizada, e o nome do processo segue no corpo do cartão como hoje. No agrupamento por setor, a faixa leva o nome do processo em destaque (16px, negrito), e o nome sai do corpo do cartão; a sigla já está no título da coluna.
- **Título da coluna no agrupamento por setor:** a sigla em destaque ganha o mesmo selo colorido em degradê; o nome do setor continua abaixo, sem cor. A coluna de setor inativo mantém a marca "inativo" e a sua cor.
- **Selo do setor:** a sigla em texto escuro sobre a cor do setor em degradê, pequeno, no cabeçalho do verso (no lugar da sigla de hoje) e na coluna Setor da Lista.
- **Caixas de seleção de setor:** o filtro Setor (Quadro e Lista) e o campo Setor do formulário do processo (Novo processo e Editar) mostram, antes do texto de cada opção, um quadradinho na cor do setor em degradê, como o quadradinho do macroprocesso.
- **Barra da etapa:** uma faixa contínua lisa, sem divisões, com cantos redondos, sobre um trilho cinza claro. Ela se preenche da esquerda até a etapa atual, em degradê do azul claro ao azul escuro; a ponta mais escura marca onde o processo está. Em Não iniciados, só o primeiro trecho (1 de N); em Concluídos, cheia. O texto "Nome da etapa · n de N" continua acima e o nome acessível continua "Etapa n de N: Nome". Aparece onde aparece hoje: cartão do Quadro agrupado por responsável e por setor, coluna "Etapa atual" da Lista e Processos do setor; continua fora do Quadro agrupado por etapa.
- **Etiquetas vivas:** A fazer em violeta cheio, com texto e bolinha brancos (é a de maior destaque, por ser a que pede ação); Em andamento em laranja vivo, com texto marrom-escuro; Concluído em verde vivo, com texto verde-escuro. Todas com contraste AA. Vale no cartão, na coluna Etiqueta da Lista e nas opções da etiqueta no Agora.

### Histórias de usuário

#### Faixa do setor no cartão

1. Como Integrante do EP, quero que cada cartão do Quadro tenha no topo uma faixa na cor do setor, de lado a lado, para reconhecer o setor de relance numa coluna cheia.
2. Como Integrante do EP, quero que, no Quadro agrupado por etapa, a faixa traga a sigla do setor maior e centralizada, para ler a sigla sem esforço.
3. Como Integrante do EP, quero que, no Quadro agrupado por responsável, a faixa também traga a sigla maior e centralizada, porque a coluna não diz o setor.
4. Como Integrante do EP, quero que, no Quadro agrupado por setor, a faixa traga o nome do processo em destaque, no lugar da sigla, para não repetir a sigla que já está no título da coluna.
5. Como Integrante do EP, quero que, no agrupamento por setor, o nome do processo não apareça duas vezes no cartão (faixa e corpo), para o cartão não ficar redundante.
6. Como Integrante do EP, quero que, nos agrupamentos por etapa e por responsável, o nome do processo continue no corpo do cartão como hoje, para não mudar a leitura que já conheço.
7. Como Integrante do EP, quero que a faixa use a cor gravada no cadastro do setor, a mesma em todo lugar, para associar cor e setor com o tempo.
8. Como Integrante do EP, quero que a faixa seja em degradê do tom da cor para um tom um pouco mais escuro dela, para combinar com a barra de etapas.
9. Como Integrante do EP, quero que a sigla e o nome na faixa fiquem em texto escuro com contraste AA nas duas pontas do degradê, para ler em qualquer cor da paleta.
10. Como Integrante do EP, quero que um processo de setor inativo continue com a cor do setor na faixa, para o cartão não mudar só porque o setor foi desativado.
11. Como Integrante do EP, quero que o processo parado continue com a faixa vermelha na borda esquerda e o selo de dias, junto com a faixa do setor no topo, para o alerta não se perder no meio da cor.
12. Como Integrante do EP, quero que a faixa do setor não se confunda com as pílulas de Situação (atraso em vermelho, aprovado em verde), por ficar sempre no topo e de lado a lado, para não ler cor de setor como alerta.
13. Como pessoa que usa leitor de tela, quero que o cartão continue anunciado pelo nome do processo e pela sigla do setor, sem anunciar a cor, para a faixa não acrescentar ruído.
14. Como pessoa que não distingue cores, quero que a sigla esteja sempre escrita na faixa (ou o título da coluna, no agrupamento por setor), para nunca depender da cor para saber o setor.
15. Como Integrante do EP, quero que o nome longo de um processo na faixa quebre linha dentro dela, sem estourar a largura do cartão, para ler o nome inteiro.

#### Coluna, verso, Lista e caixas de seleção

16. Como Integrante do EP, quero que o título da coluna no Quadro agrupado por setor mostre a sigla sobre a cor do setor, com o nome abaixo, para ligar a coluna à cor dos cartões.
17. Como Integrante do EP, quero que a coluna de um setor inativo com processo continue marcada "inativo" e com a cor dele, para reconhecê-la como hoje.
18. Como Integrante do EP, quero ver no cabeçalho do verso a sigla do setor sobre a cor dele, para saber o setor ao abrir o processo.
19. Como Integrante do EP, quero ver na coluna Setor da Lista a sigla sobre a cor do setor, para varrer a Lista por setor como varro o Quadro.
20. Como Integrante do EP, quero ver um quadradinho da cor do setor antes de cada opção do filtro Setor, para achar o setor pela cor.
21. Como Integrante do EP, quero ver o mesmo quadradinho no campo Setor do Novo processo e do Editar, para escolher o setor certo de relance.
22. Como pessoa que usa leitor de tela, quero que o quadradinho e a cor do selo não entrem no nome da opção nem do selo, para a leitura continuar só pelo texto.
23. Como Integrante do EP, quero que, quando o cadastro troca a cor de um setor, a nova cor apareça no Quadro, na Lista e no verso na próxima vez que carregam, sem nada a fazer nos processos.
24. Como Consulta, quero ver as mesmas cores do setor no Quadro, na Lista e no verso, sem poder trocá-las, para acompanhar como a equipe.

#### Barra da etapa

25. Como Integrante do EP, quero que a barra da etapa seja uma faixa contínua que se preenche até a etapa atual, para ver de relance o quanto o processo andou.
26. Como Integrante do EP, quero que o preenchimento vá do azul claro ao azul escuro, com a ponta mais escura na etapa atual, para a barra ter vida sem precisar de divisões.
27. Como Integrante do EP, quero que a barra não tenha divisões entre etapas, para continuar legível com 8 ou mais etapas num cartão estreito.
28. Como Integrante do EP, quero continuar lendo "Nome da etapa · n de N" acima da barra, para saber a posição exata.
29. Como Integrante do EP, quero que o processo em Não iniciados tenha só o primeiro trecho preenchido, para reconhecer o processo que ainda não começou.
30. Como Integrante do EP, quero que o processo em Concluídos tenha a barra cheia, para reconhecer o processo terminado.
31. Como Integrante do EP, quero que o trilho vazio seja cinza claro, para distinguir o que falta do que já foi.
32. Como Integrante do EP, quero que a barra continue fora do Quadro agrupado por etapa, para não repetir o que a coluna diz.
33. Como Integrante do EP, quero a mesma barra no cartão por responsável e por setor, na Lista e em Processos do setor, para ler a posição igual em todo lugar.
34. Como Integrante do EP, quero que a barra do suspenso e do cancelado continue mostrando a etapa onde ele parou, ao lado da pílula da situação, como hoje.
35. Como pessoa que usa leitor de tela, quero que a barra continue lida como "Etapa n de N: Nome", para ter a mesma informação sem ver o preenchimento.
36. Como Integrante do EP, quero que a barra conte só as etapas ativas, como hoje, para a posição bater com as colunas do Quadro.

#### Etiquetas

37. Como Integrante do EP, quero que a etiqueta A fazer seja violeta cheio com texto branco, para o que pede ação saltar aos olhos.
38. Como Integrante do EP, quero que Em andamento seja laranja vivo e Concluído verde vivo, com texto escuro do mesmo tom, para separar de relance o que anda do que terminou.
39. Como Integrante do EP, quero que nenhuma outra pílula use o violeta, para ele significar só "A fazer".
40. Como Integrante do EP, quero as mesmas cores no cartão, na coluna Etiqueta da Lista e nas opções da etiqueta no Agora, para ler a etiqueta igual em todo lugar.
41. Como pessoa que não distingue cores, quero que a etiqueta continue com o texto ao lado da bolinha, para não depender da cor.
42. Como pessoa com baixa visão, quero que o texto de cada etiqueta tenha contraste AA com o fundo, para ler sem esforço.
43. Como Integrante do EP, quero que as pílulas de Situação (Suspenso, atraso, aprovado, tipo) fiquem como estão, para os alertas não perderem o destaque no meio de tudo colorido.

### Decisões de implementação

#### Interface

- **Paleta num único ponto:** um módulo puro da cor do setor recebe o número da cor (1 a 30) e devolve o par de tons do degradê (o tom da paleta e o tom um pouco mais escuro, calculado por uma regra fixa, a mesma para as 30). É o único lugar do código com os tons; o número fora de 1 a 30 cai na cor 1 (rede de segurança: o banco já recusa). Fica em `cadastros` ou num lugar comum às duas áreas, porque processos e cadastros o usam. Os tons são os do acréscimo de 2026-10-27 em `.scratch/identidade-visual.md`.
- **Selo do setor:** um componente compartilhado (sigla sobre a cor em degradê, texto escuro) em dois tamanhos: o pequeno (verso, Lista, título da coluna e cadastros) e o da faixa do cartão. A cor é enfeite: o componente não acrescenta nada ao nome acessível.
- **Cartão:** a linha do topo com a sigla vira a faixa. O cartão já sabe se o Quadro está agrupado por etapa; passa a saber também se está agrupado por setor, para escolher entre sigla na faixa (etapa e responsável) e nome na faixa (setor, com o nome fora do corpo).
- **Título da coluna por setor:** a sigla do título passa a usar o selo pequeno; o nome do setor e a marca "inativo" ficam como estão.
- **Caixas de seleção de setor:** as opções passam a usar `OpcaoDaCaixa` com `cor` (o degradê da cor do setor) e `BotaoDaCaixa`, no padrão das caixas personalizáveis (`.scratch/identidade-visual.md`, 2026-10-27). A cor vem dos setores que a tela já carregou, sem busca própria.
- **Barra:** a função da barra passa a devolver a fração preenchida (posição sobre total; Concluídos cheia) junto com o texto e o nome acessível que já devolve; os estados de bloco (anteriores, atual, seguintes) deixam de existir. O componente da barra passa a desenhar o trilho e o preenchimento em degradê; os lugares que o usam não mudam.
- **Etiqueta:** só os três pares de tokens de cor (fundo, texto, bolinha) mudam, para os valores do acréscimo de 2026-10-27; o componente e os lugares onde aparece não mudam.
- **Estados de carregamento, vazio e erro:** nenhuma tela nova; Quadro, Lista, verso e formulários mantêm os seus estados de hoje (carregando, vazio, erro com "Tentar de novo", inclusive falha de conexão). A cor chega junto com os dados que já são lidos; se não chegar (dado antigo em cache da tela), vale a cor 1.

#### Modelo de dados

- **A cor viaja com a sigla:** a view `processos_com_andamento` ganha a coluna `setor_cor` (o número da cor do setor dono), ao lado de `setor_sigla`, recriada com `security_invoker = true`. É dela que o Quadro, a Lista e o verso tiram a cor. A leitura dos setores da Lista de processos (`listarProcessos`) passa a trazer também `cor`, para o título das colunas por setor e o filtro Setor. Os tipos da tela (`db:types`) acompanham.
- **Migração:** não destrutiva, só recria a view com a coluna nova; vem depois da migração da coluna `setores.cor` (spec de `cadastros-basicos`), e as duas podem ser uma só.
- **Quem pode o quê:** sem mudança. A view lê com o perfil de quem chama; `setores` já é lida por todo usuário ativo; visitante e desativado continuam sem ler nada.
- **Dado pessoal:** nenhum novo.

### Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos (classe CSS de cor só onde a cor é o próprio comportamento, como no teste das etiquetas de hoje).
- **Interface (ponto de teste principal: a tela inteira).** Vitest com Testing Library, renderizando o aplicativo inteiro com as falsas nomeadas (`ProcessosFalso` e `CadastrosFalso` passam a ter a cor de cada setor). Cobre:
  - a faixa com a sigla no cartão por etapa e por responsável, e com o nome do processo (sem o nome no corpo) por setor (arte anterior: `App.cartaoDoQuadro`, `App.agruparPorSetor`);
  - o título da coluna por setor com o selo e o nome, inclusive a coluna de setor inativo;
  - o selo do setor no verso e na coluna Setor da Lista (`App.versoDoCartao`, `App.lista`);
  - o quadradinho nas opções do filtro Setor e do campo Setor do processo, sem a cor no nome da opção;
  - a cor trocada no cadastro aparecendo no Quadro depois de recarregar;
  - a barra com o texto "Nome · n de N" e o nome acessível de hoje, em Não iniciados, numa etapa do meio e em Concluídos;
  - as etiquetas com o texto e a cor de cada valor no cartão, na Lista e no Agora.
- **Funções puras:** a da barra (fração em Não iniciados, no meio, em Concluídos, com etapa desativada no catálogo; arte anterior: `barraDoCartao`) e a da paleta (30 cores distintas, número fora da faixa cai na 1, e o contraste do texto escuro de pelo menos 4,5:1 nas duas pontas do degradê, para as 30 cores).
- **Tradução entre o banco e a tela:** o teste de `listaDeProcessosSupabase` e o da linha do processo (`processoDaLinha`) com o cliente simulado passam a ler `setor_cor` e a `cor` dos setores.
- **Banco:** pgTAP: a view entrega `setor_cor` igual à cor do setor dono, para cada perfil que lê (Administrador, Integrante, Consulta) e nada para desativado e visitante; os gerais `00_rls_ligada` e `10_privilegios_padrao` continuam passando. O teste vem antes da migração e falha sem ela. Rodam no Docker local e pelo GitHub Actions ("Testes de banco") na conferência final.
- Todos os processos e setores dos testes são inventados.

### Fora do escopo desta parte

- Cor nas pílulas de Situação e no tipo do processo.
- Cor do setor nos nomes de arquivo, no histórico, nos avisos e nas opções de processo pai ("SIGLA — Nome").
- Barra no Quadro agrupado por etapa.
- Seção "Sobre" do verso: o dado "Setor" continua texto (o selo fica no cabeçalho).
- Processos do setor (página do setor): a sigla já é a da página; nada muda além da barra.
- Planilhas dos dashboards: a cor não vai ao pacote.

### Decisões tomadas ao escrever esta seção, a confirmar na leitura

1. A cor chega ao Quadro, à Lista e ao verso pela view `processos_com_andamento` (coluna nova `setor_cor`), e não por uma busca à parte: a sigla já vem por ali.
2. O tom mais escuro do degradê é calculado em código por uma regra fixa, e não listado à mão; um teste confere o contraste nas duas pontas para as 30 cores.
3. No agrupamento por setor o nome sai do corpo do cartão, para não aparecer duas vezes.
4. O quadradinho entra no Novo processo e no Editar, que usam o mesmo campo Setor. A janela de Reclassificar não tem campo Setor (só troca o tipo e o processo pai), então não leva o quadradinho (corrigido na entrega, 2026-10-27; ver `desvios.md` de visual-do-cartao).
5. A seção "Sobre" do verso continua com o setor em texto.

### Divergência com `.scratch/especificacao.md`

Nenhuma: a especificação não trata de cores, da barra de etapas nem das etiquetas.

### Critérios conferidos olhando a tela

- `[visual]` A faixa do setor ocupa o topo do cartão de lado a lado, em degradê, com a sigla maior e centralizada (por etapa e por responsável) ou o nome do processo em 16px negrito (por setor), legível nas 30 cores, inclusive com nome longo.
- `[visual]` A faixa vermelha do processo parado continua visível à esquerda, junto com a faixa do setor no topo.
- `[visual]` O título da coluna por setor, o selo no verso e na Lista e o quadradinho das caixas de seleção mostram a mesma cor do cartão, sem estourar a largura.
- `[visual]` A barra é uma faixa lisa de 8px, cantos redondos, trilho cinza claro e preenchimento do azul claro ao azul escuro, cheia em Concluídos, no cartão, na Lista e em Processos do setor.
- `[visual]` A etiqueta A fazer em violeta cheio com texto branco é a mais destacada do cartão; Em andamento laranja e Concluído verde vivos, sem confundir com as pílulas de Situação.

### Critérios de pronto

- A faixa, os selos, o quadradinho, a barra e as etiquetas seguem a Solução, nos lugares listados, e a cor trocada no cadastro aparece em todos eles.
- `npm test` verde, com os testes desta seção; testes de banco verdes no Docker local e no "Testes de banco".

## Macroprocesso fora da frente do cartão (mudança de 2026-10-27)

Demanda de 2026-10-27 (`/demanda`), ADR 0029. **Como resolve o problema:** o macroprocesso na frente do cartão do Quadro só repetia, em cada cartão, algo que o macroprocesso já diz pelo lugar onde o trabalho acontece e que se vê no verso; poluía um cartão que precisa ser varrido de relance. A frente passa a mostrar só o que ajuda a decidir o que fazer.

- **Frente do cartão:** a linha do topo traz só a sigla do setor, e some quando o Quadro está agrupado por setor (a sigla já está no título da coluna), em vez de ficar uma linha vazia. O nome do macroprocesso sai da frente. Substitui o que a história 20 dizia.
- **Fica como está:** o verso do cartão (cabeçalho com o quadradinho da cor e o nome do macroprocesso, história 110), a coluna "Macroprocesso" da Lista, o filtro Macroprocesso, o formulário de cadastro e de edição do processo.
- **Sem mudança nos dados:** nenhuma tabela, política ou migração. É só a tela do Quadro.
- **Critérios de pronto:** (1) o cartão do Quadro não mostra o nome do macroprocesso, em nenhum agrupamento; (2) com o Quadro agrupado por setor o cartão não tem linha de topo vazia; (3) o verso continua mostrando o macroprocesso; (4) a Lista e o filtro continuam como estavam; (5) `[visual]` o cartão sem a linha do topo fica com espaçamento regular e os cartões da coluna continuam alinhados.

## Confirmação de arquivos (mudança de 2026-10-27)

Demanda travas-em-avisos; ADR 0028. Mover o processo para a frente da Modelagem piloto ou da Relatório e modelagem técnica sem os arquivos delas deixa de ser recusado: a tela pergunta, com [Enviar arquivos agora] [Avançar mesmo assim] [Cancelar], pela lista do Agora e ao arrastar o cartão, e o evento do movimento guarda o que faltava ("Moveu para Revisão interna sem o relatório"). Quando a pergunta aparece não muda. A descrição completa (pergunta, fluxo, `mover_processo`, testes) está na seção "Travas em avisos" da spec de `documentos-versoes`, que é a que vale. A frase da seção "Andamento livre", "A única trava é a chegada a Concluídos", volta a ser verdadeira.

## Visualização por setores (mudança de 2026-10-26)

Parte 5 da iniciativa quadro-livre, planejada no modo curto do `/planejar` (uma tela, sem regra de negócio nova, sem mudança no banco). Decisões de origem: as cinco perguntas desta seção, respondidas pelo usuário em 2026-10-26, e o mapa `.scratch/quadro-livre/mapa.md` (parte 5). Sem ADR novo nem termo novo no `CONTEXT.md`. Esta seção vale sobre a "Cartão e verso", a "Andamento livre" e o resto desta spec no que divergir.

**Como resolve o problema.** O Quadro já mostra o trabalho por etapa e por pessoa, mas a equipe também precisa ver o andamento de cada setor de uma vez, sem filtrar setor por setor. O "Agrupar por" do Quadro ganha a opção **Setor**: uma coluna por setor ativo, mesmo sem processo, com a sigla em destaque e o nome embaixo, em ordem de sigla. Cada cartão mostra a barra da etapa e a etiqueta, como no Quadro por responsável, e não se arrasta: a troca de setor continua pela reclassificação do verso.

### Solução

- **Agrupar por:** "Etapa | Responsável | Setor". A escolha fica no endereço (`agrupar=setor`), como a de responsável, e só vale no Quadro.
- **Colunas:** uma por setor ativo, em ordem alfabética da sigla, mesmo vazia. Título com a sigla em destaque e o nome do setor menor, abaixo. Setor inativo só ganha coluna enquanto tiver processo no Quadro, marcada "inativo" como a coluna de responsável desativado, na mesma ordem de sigla.
- **Processos em cada coluna:** os mesmos do Quadro de hoje (em andamento, suspensos e os de Concluídos não arquivados), cada um na coluna do setor dono, em ordem de nome.
- **Cartão:** igual ao do Quadro por responsável: barra da etapa ("Nome · 2 de 8") e etiqueta; o avatar de quem cuida continua no rodapé, e com ele o selo "Sem responsável" quando não há ninguém (a coluna não diz quem cuida); a sigla do setor sai do cartão, porque a coluna já diz.
- **Sem arrastar:** no Quadro por setor nenhum cartão se arrasta; clicar abre o verso, como hoje.
- **Filtros:** com o filtro Setor escolhido, só a coluna desse setor. Com os outros filtros (Macroprocesso, Responsável, Só os meus, busca), todas as colunas dos setores ativos continuam, mesmo as que ficarem vazias. Quando nenhum processo passa nos filtros, vale a mensagem de "nenhum processo" de hoje.
- **Coluna vazia:** "Nenhum processo deste setor no Quadro.", no estilo da coluna vazia de hoje.

### Histórias de usuário

1. Como Integrante do EP, quero escolher "Agrupar por: Setor" no Quadro, para ver o andamento de cada setor de uma vez.
2. Como Integrante do EP, quero uma coluna por setor ativo, em ordem de sigla, mesmo sem processo, para ver também os setores que ainda não têm nada em andamento.
3. Como Integrante do EP, quero ver no título da coluna a sigla em destaque e o nome do setor abaixo, para reconhecer o setor sem decorar as siglas.
4. Como Integrante do EP, quero ver a coluna de um setor inativo que ainda tem processo, marcada "inativo", para nenhum processo sumir do Quadro.
5. Como Integrante do EP, quero que o setor inativo sem processo não ganhe coluna, para o Quadro não mostrar setor que já não se usa.
6. Como Integrante do EP, quero que cada cartão mostre a barra da etapa e a etiqueta, para saber onde cada processo do setor está.
7. Como Integrante do EP, quero os cartões de cada coluna em ordem de nome, como nas outras colunas do Quadro.
8. Como Integrante do EP, quero que o cartão não se arraste agrupado por setor, para não trocar o setor dono de um processo por engano.
9. Como Integrante do EP, quero que, com o filtro Setor escolhido, só a coluna desse setor apareça.
10. Como Integrante do EP, quero que, com os outros filtros ou "Só os meus", as colunas dos setores ativos continuem, mesmo vazias.
11. Como Integrante do EP, quero que o agrupamento por setor fique no endereço, para voltar, recarregar ou compartilhar a página e continuar nele.
12. Como Consulta, quero agrupar por setor e abrir os cartões, sem arrastar, como nos outros agrupamentos.
13. Como pessoa que usa leitor de tela, quero que cada coluna seja anunciada pela sigla e pelo nome do setor (e "inativo", quando for), para saber em que coluna estou.

### Decisões de implementação

#### Interface

- **Opção nova:** `AgruparQuadroPor` ganha `'setor'`; `AgruparPor` ganha o botão "Setor"; o endereço lê e grava `agrupar=setor` (só no Quadro), como faz com `responsavel`.
- **Colunas:** uma função pura nova em `colunasDoQuadro.ts`, `colunasPorSetor`, ao lado de `colunasPorResponsavel`, recebe os setores e os processos já filtrados e devolve as colunas pela regra da Solução. A coluna ganha o subtítulo (nome do setor) para o título em duas linhas.
- **Cartão:** o que hoje é "agrupado por responsável" no cartão (barra no lugar do nome da etapa, sem selo de responsável, sem arrastar) passa a valer para todo agrupamento que não é por etapa; no agrupamento por setor, a sigla sai e o avatar fica.
- **Setores na Lista de processos:** `listarProcessos` passa a ler também os setores (id, sigla, nome, ativo), em paralelo com as linhas e o catálogo; `ListaDeProcessos` ganha `setores`. A falsa `ProcessosFalso` acompanha.
- **Estados de carregamento, vazio e erro:** os do Quadro de hoje. A falha ao ler os setores é falha ao carregar os processos (mesma mensagem e "Tentar de novo", inclusive falha de conexão). Sem nenhum processo cadastrado, vale o Quadro vazio de hoje.

#### Modelo de dados

Nenhuma mudança: sem tabela, coluna, view, política nem migração. A tabela `setores` já pode ser lida por todo usuário ativo (política "setores: ativo lê"), que é quem vê o Quadro. Nenhum dado pessoal novo.

### Decisões de teste

- **Interface (a tela inteira):** um teste novo `App.agruparPorSetor` (arte anterior: `App.agruparPorResponsavel`) cobre o botão Setor, as colunas em ordem de sigla com sigla e nome, a coluna vazia, o setor inativo com e sem processo, os cartões com barra e etiqueta e sem sigla, nada arrastável, o filtro Setor com uma coluna só, Só os meus com as colunas vazias mantidas, o endereço ao recarregar e a Consulta.
- **Funções puras:** `colunasPorSetor` (ordem de sigla, setor vazio, inativo com e sem processo, cancelado e arquivado fora) e o endereço (`agrupar=setor` lido e gravado, ignorado na Lista).
- **Tradução entre o banco e a tela:** o teste de `listaDeProcessosSupabase` com o cliente simulado passa a conferir a leitura dos setores e a falha dela.
- Todos os processos e setores dos testes são inventados.

### Fora do escopo desta parte

- Arrastar entre setores (trocar o setor dono continua pela reclassificação).
- Agrupar por macroprocesso.
- Ordem dos cartões pela etapa.

### Decisões tomadas ao escrever esta seção, a confirmar na leitura

1. A sigla sai do cartão no Quadro por setor, pela mesma razão da barra no Quadro por etapa: a coluna já diz. O avatar de quem cuida fica, porque a coluna não diz.
2. O setor inativo com processo entra na mesma ordem de sigla dos ativos, não no fim.
3. O texto da coluna vazia é "Nenhum processo deste setor no Quadro."

### Divergência com `.scratch/especificacao.md`

Nenhuma.

### Critérios conferidos olhando a tela

- `[visual]` As colunas por setor mostram a sigla em destaque e o nome menor abaixo, sem estourar a largura da coluna, inclusive com nome longo.
- `[visual]` A marca "inativo" da coluna de setor segue a da coluna de responsável desativado.

### Critérios de pronto

- "Agrupar por: Setor" monta as colunas pela regra da Solução, com os filtros como descritos, e o endereço guarda a escolha.
- `npm test` verde, com os testes desta seção.

## Cartão e verso (mudança de 2026-10-25)

Parte 2 da iniciativa quadro-livre. Decisões de origem: `.scratch/quadro-livre/sabatina-parte-2.md` e o esboço `.scratch/quadro-livre/esboco-cartao.html` (opção A). Sem ADR novo. Termo no `CONTEXT.md`: **Data da modelagem piloto** (substitui **Reunião**). Esta seção vale sobre a "Andamento livre" e o resto desta spec no que divergir.

**Como resolve o problema.** Depois do Andamento livre, a equipe vê o processo andar pelas etapas, mas o cartão ainda fala a língua antiga: a data se chama "reunião", a etiqueta é uma pílula cinza igual às outras, a barra repete no Quadro por etapa o que a coluna já diz e falta onde a coluna não diz a etapa, e o processo parado tem o mesmo âmbar que a etiqueta Em andamento passaria a ter. Esta parte ajusta o cartão e o verso: a data passa a ser a **Data da modelagem piloto**, sugerida com o dia do cadastro; a barra em blocos, com o nome e a posição da etapa, aparece só onde a etapa não está dita (Quadro por responsável, Lista e Processos do setor); as etiquetas ganham cor suave própria; o processo parado ganha um aviso vermelho que salta aos olhos; e as Anotações ganham espaço para escrever.

### O que muda no resto desta spec

- "Reunião" e "data da reunião", onde aparecerem nesta spec e nas telas, passam a ser "Data da modelagem piloto". A coluna `processos.data_da_reuniao` passa a `processos.data_da_modelagem_piloto`.
- A barra de progresso do cartão (parte 4 de experiencia-do-quadro e decisão 13 do Andamento livre) sai do Quadro por etapa e muda de desenho.
- O selo âmbar de processo parado vira vermelho suave, com faixa na borda do cartão, e aparece também na Lista.
- A etiqueta deixa de ser "pílula neutra" (critério `[visual]` do Andamento livre): ganha cor por valor.

### Solução

- **Data da modelagem piloto:** o mesmo dado da antiga reunião, com o nome novo em toda a plataforma. O formulário de Novo processo abre com a data de hoje preenchida; a pessoa altera ou apaga, e ela continua opcional. No verso, a seção "Data da modelagem piloto" mostra "12/11/2026 · próxima" ou "· realizada", como a antiga Reunião. No cartão, o selo "Modelagem 12/11" ou "Modelagem hoje" aparece só enquanto a data é hoje ou futura e o processo está em Não iniciados ou na Modelagem piloto. O histórico, inclusive nos eventos antigos, diz "Data da modelagem piloto".
- **Barra da etapa:** um bloco por etapa ativa do catálogo, de Não iniciados a Concluídos. Os blocos das etapas antes da atual ficam em cinza cheio, o da atual meio cheio e os seguintes vazios; em Concluídos, todos cheios. Acima dos blocos, "Nome da etapa · 2 de 8". Só cinza neutro, sem azul. Aparece no cartão do Quadro agrupado por responsável (no lugar do nome da etapa no rodapé), na coluna "Etapa atual" da Lista e na de Processos do setor. Sai do cartão do Quadro agrupado por etapa.
- **Etiquetas:** pílula com uma bolinha da cor antes do texto: A fazer em cinza, Em andamento em laranja suave, Concluído em verde suave. Aparece no cartão e na coluna Etiqueta da Lista. No Agora, a etiqueta continua uma lista de escolha.
- **Processo parado:** o selo "12 dias nesta etapa" passa a vermelho suave, e o cartão ganha uma faixa vermelha na borda esquerda. O mesmo selo aparece ao lado do nome na Lista e continua no Agora. As regras de quando vale (mais de 7 dias, fora de Não iniciados, de Concluídos, de suspensos e de cancelados) não mudam.
- **Anotações:** o campo começa com cerca de 7 linhas (o triplo de hoje); o máximo continua em cerca de 12 linhas, e depois rola por dentro.

### Histórias de usuário

#### Data da modelagem piloto

1. Como Integrante do EP, quero que o formulário de Novo processo já venha com a data de hoje na Data da modelagem piloto, para não digitar a data no caso mais comum, em que o processo nasce da reunião com o setor.
2. Como Integrante do EP, quero alterar a data sugerida antes de salvar, para marcar uma modelagem piloto que ainda vai acontecer ou que aconteceu em outro dia.
3. Como Integrante do EP, quero apagar a data sugerida antes de salvar, para cadastrar um processo cuja modelagem piloto ainda não foi marcada.
4. Como Integrante do EP, quero ver no verso a seção "Data da modelagem piloto" com a data e "· próxima" ou "· realizada", para saber de relance se o encontro já aconteceu.
5. Como Integrante do EP, quero marcar, alterar ou apagar a Data da modelagem piloto no verso, como fazia com a reunião, para manter a data certa depois do cadastro.
6. Como Integrante do EP, quero ver no cartão o selo "Modelagem 12/11" quando a data é futura e o processo está em Não iniciados ou na Modelagem piloto, para lembrar do encontro que vem.
7. Como Integrante do EP, quero ver "Modelagem hoje" no cartão no dia da data, para não esquecer o encontro do dia.
8. Como Integrante do EP, quero que o selo some quando a data passa, para o cartão só falar do que ainda vai acontecer.
9. Como Integrante do EP, quero que o selo some quando o processo sai de Não iniciados e da Modelagem piloto, mesmo com a data futura, para o cartão não trazer uma notícia que já não importa naquela etapa.
10. Como Integrante do EP, quero que o histórico diga "Data da modelagem piloto" nas mudanças da data, inclusive nas feitas antes da troca de nome, para ler o histórico numa língua só.
11. Como Consulta, quero ver a Data da modelagem piloto no verso e o selo no cartão, sem conseguir alterar, para acompanhar o processo sem mexer nele.
12. Como Integrante do EP, quero que a Data da modelagem piloto continue chegando às planilhas dos dashboards como antes, para os dashboards não perderem a data.
13. Como Administrador, quero que os processos do desenvolvimento que estavam sem data continuem sem data depois da troca de nome, para nenhum dado ser inventado.

#### Barra da etapa

14. Como Integrante do EP, quero que o cartão do Quadro agrupado por etapa não traga a barra, para não repetir o que a coluna já diz.
15. Como Integrante do EP, quero ver no cartão do Quadro agrupado por responsável a barra com "Nome da etapa · 2 de 8", para saber em que etapa está cada processo da pessoa.
16. Como Integrante do EP, quero ver na coluna "Etapa atual" da Lista a barra com o nome e a posição, para comparar de relance o quanto cada processo andou.
17. Como Integrante do EP, quero ver a mesma barra na lista de Processos do setor, para ter a mesma leitura na página do setor.
18. Como Integrante do EP, quero que os blocos antes da etapa atual fiquem cheios, o da atual meio cheio e os seguintes vazios, para ver a posição sem ler o número.
19. Como Integrante do EP, quero que o processo em Concluídos tenha todos os blocos cheios, para reconhecer o processo terminado.
20. Como Integrante do EP, quero que o processo em Não iniciados tenha só o primeiro bloco meio cheio, para reconhecer o processo que ainda não começou.
21. Como Integrante do EP, quero que a barra conte só as etapas ativas, para a posição bater com as colunas do Quadro.
22. Como Integrante do EP, quero que a barra do suspenso e do cancelado mostre a etapa onde ele parou, ao lado da pílula da situação, para saber onde ele vai continuar.
23. Como pessoa que usa leitor de tela, quero que a barra seja lida como "Etapa 2 de 8: Relatório e modelagem técnica", para ter a mesma informação sem ver os blocos.
24. Como Integrante do EP, quero que a barra seja cinza, sem azul, para ela não competir com os botões e os links da plataforma.

#### Etiquetas

25. Como Integrante do EP, quero ver A fazer em cinza, Em andamento em laranja suave e Concluído em verde suave no cartão, para separar de relance o que espera, o que anda e o que terminou.
26. Como Integrante do EP, quero as mesmas cores na coluna Etiqueta da Lista, para ler a Lista como leio o Quadro.
27. Como pessoa que não distingue cores, quero que a etiqueta continue com o texto ao lado da bolinha, para não depender da cor.
28. Como Integrante do EP, quero que a etiqueta no Agora continue uma lista de escolha, para mudá-la como hoje.

#### Processo parado

29. Como Integrante do EP, quero que o processo parado tenha o selo "12 dias nesta etapa" em vermelho suave, para ele não se confundir com a etiqueta Em andamento.
30. Como Integrante do EP, quero que o cartão do processo parado tenha uma faixa vermelha na borda esquerda, para achá-lo numa coluna cheia sem ler os selos.
31. Como Integrante do EP, quero ver o selo de parado ao lado do nome na Lista, para achar os parados também lá.
32. Como Integrante do EP, quero continuar vendo o selo de parado no Agora, agora em vermelho suave, para a cor ser a mesma em todo lugar.
33. Como Integrante do EP, quero que o processo com 7 dias na etapa não tenha selo nem faixa, e o com 8 tenha, para o limite continuar o de hoje.
34. Como Integrante do EP, quero que o processo em Não iniciados, em Concluídos, suspenso ou cancelado nunca ganhe selo nem faixa, para o aviso só aparecer onde há trabalho parado.

#### Anotações

35. Como Integrante do EP, quero que o campo das Anotações comece com cerca de 7 linhas, para escrever sem o campo parecer apertado.
36. Como Integrante do EP, quero que o campo das Anotações pare de crescer em cerca de 12 linhas e role por dentro, para o verso não ficar comprido demais.

### Decisões de implementação

#### Interface

- **Data da modelagem piloto no verso:** o componente da antiga Reunião troca de nome e de textos ("Data da modelagem piloto", "Marcar data", "Alterar data", "A Data da modelagem piloto não foi salva: …"), sem mudar o comportamento de leitura e edição. A Consulta e o arquivado só leem.
- **Novo processo:** o campo "Data da modelagem piloto" entra no formulário de Novo processo (hoje a data só se marca no verso), preenchido com o hoje de Brasília (o mesmo `hojeEmBrasilia` dos dias na etapa), editável e apagável. O Editar continua sem o campo: a data se altera no verso.
- **Selo do cartão:** o selo da reunião passa a selo da modelagem, com texto "Modelagem {DD/MM}" ou "Modelagem hoje", e a condição ganha a etapa atual: só em Não iniciados ou na Modelagem piloto (pelos códigos das etapas). A cor de destaque do selo (a borda à esquerda) segue a de hoje.
- **Histórico:** o rótulo do campo da data no histórico passa a "Data da modelagem piloto", lido tanto com a chave nova como com a antiga, para os eventos gravados antes da migração (que não são reescritos).
- **Barra:** a função da barra passa a devolver também o texto visível "Nome · {posição} de {total}"; os estados dos blocos ficam (anteriores, atual, seguintes), com o desenho novo: anteriores cinza cheio, atual meio cheio, seguintes vazios com borda. Um único componente de barra, com o texto acima, serve o cartão do Quadro por responsável, a Lista e Processos do setor (e, depois, a parte 5). O cartão recebe se o Quadro está agrupado por etapa e, nesse caso, não mostra a barra.
- **Etiqueta:** um componente de etiqueta (bolinha e texto), com três tokens de cor novos em pares de fundo e texto, tirados do esboço (cinza, laranja suave e verde suave), conferidos com contraste mínimo de 4,5:1 no texto. Usado no cartão e na Lista.
- **Processo parado:** o selo de dias passa ao tom de atraso (vermelho suave, tokens já existentes `--atraso-fundo` e `--atraso-texto`); o cartão com o selo ganha uma classe que desenha a faixa na borda esquerda. A Lista mostra o mesmo selo ao lado do nome, pela mesma regra dos selos (uma função só decide se o processo está parado).
- **Anotações:** só a altura mínima do campo muda, para cerca de 7 linhas; o máximo e a rolagem ficam.
- **Estados de carregamento, vazio e erro:** nenhuma tela nova. O formulário de Novo processo, o verso, o Quadro, a Lista e Processos do setor mantêm os seus estados de hoje (carregando, vazio, erro com tentar de novo, inclusive falha de conexão). A falha ao salvar a data no verso mostra "A Data da modelagem piloto não foi salva: {motivo}.", e a do cadastro segue a mensagem de falha do cadastro de hoje.

#### Modelo de dados

- **Coluna renomeada:** `processos.data_da_reuniao` (date, opcional) passa a `processos.data_da_modelagem_piloto` (date, opcional). Sem valor padrão no banco: a sugestão do dia é da tela. Os valores existentes são preservados pelo próprio rename; os nulos continuam nulos.
- **Permissão da coluna:** a coluna precisa de permissão de **criar** (`insert`) além da de alterar, porque o formulário de Novo processo a envia em toda criação (nula se o campo está vazio). A permissão por coluna não acompanha o rename sozinha para a criação: migração `20261027104500_criar_processo_com_data_da_modelagem` (bug de 2026-10-27, teste de banco 63).
- **Views e funções que leem a coluna:** a view `processos_com_andamento` (com `security_invoker = true`) e a função que monta o pacote das planilhas são recriadas com o nome novo, e a chave do pacote passa a `data_da_modelagem_piloto`. Os gatilhos de evento do processo passam a gravar a chave nova nos eventos seguintes; os eventos antigos ficam como estão.
- **Função das planilhas (Edge Function `planilhas-dos-dashboards`):** a validação e a leitura do pacote passam a usar a chave nova; a função precisa ser publicada de novo no desenvolvimento, pelo roteiro `docs/planilhas-publicar-a-funcao.md`, passo do usuário. Até a publicação, a atualização das planilhas recusa o pacote novo.
- **Quem pode o quê:** igual a hoje para a coluna. O privilégio por coluna de alterar acompanha o nome novo.

| Tabela e ação | Administrador | Integrante do EP | Consulta | Usuário desativado | Visitante sem login |
| --- | --- | --- | --- | --- | --- |
| `processos.data_da_modelagem_piloto`: ler | sim | sim | sim | não | não |
| `processos.data_da_modelagem_piloto`: preencher no cadastro | sim | sim | não | não | não |
| `processos.data_da_modelagem_piloto`: alterar ou apagar | sim (processo não arquivado) | sim (processo não arquivado) | não | não | não |

- **Dado pessoal:** nenhum novo.
- **Regras que o banco impõe:** as mesmas da antiga data da reunião (alterar só com o processo não arquivado; cada mudança vira evento), agora com o nome novo. Caso de teste: o teste da antiga data da reunião passa para o nome novo e prova as mesmas regras.
- **Migração:** não destrutiva (rename de coluna, com os dados preservados), mas muda um nome que a tela e a Edge Function leem: a tela, os tipos (`db:types`), a migração e a função mudam juntos.

### Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).** Vitest com Testing Library, renderizando o aplicativo inteiro com as falsas nomeadas, como nos testes `App.*` de hoje. O que cobre:
  - Novo processo com a data de hoje preenchida, salvando com ela, com outra data e com o campo vazio;
  - o verso com "Data da modelagem piloto", "· próxima" e "· realizada", marcar, alterar e apagar, a falha ao salvar e a Consulta só lendo (reescrita de `App.reuniaoDoProcesso`);
  - o selo "Modelagem {DD/MM}" e "Modelagem hoje" em Não iniciados e na Modelagem piloto, sumindo com a data passada e em outra etapa com a data futura;
  - o histórico com "Data da modelagem piloto" para um evento novo e para um antigo;
  - o cartão do Quadro por etapa sem barra, o do Quadro por responsável com a barra e o texto "Nome · n de N", a Lista e Processos do setor com a barra e o nome acessível;
  - as etiquetas no cartão e na Lista com o texto e a classe de cor de cada valor;
  - o processo parado com selo e faixa no cartão, selo na Lista e no Agora, com 7 dias sem nada e 8 com tudo, e nada em Não iniciados, Concluídos, suspenso e cancelado;
  - os testes de tela que procuram "Reunião" (`App.cartaoDoQuadro`, `App.quadro`, `App.lista`, `App.historicoNaJanela`, `App.cadastrarProcesso` e os outros que montam a data) passam para o nome novo.
- **Funções puras:** a barra (blocos e texto "Nome · n de N", Não iniciados, Concluídos, catálogo com etapa desativada) e os selos (modelagem por data e etapa, parado) ganham ou ajustam testes unitários pequenos. Arte anterior: `barraDoCartao`, `selosDoCartao`, `diasNaEtapa`, `textoDaReuniao`.
- **Tradução entre o banco e a tela:** os testes do módulo de processos real com o cliente simulado passam a ler e gravar `data_da_modelagem_piloto` (cadastro, leitura, linha da Lista). Arte anterior: `gravarProcessoSupabase`, `lerProcessoSupabase`, `listaDeProcessosSupabase`, `processoDaLinha`.
- **Planilhas:** os testes do pacote em Deno/Vitest (`planilhasPacote`, `planilhasInterna`, cenário e exemplos) passam à chave nova, incluindo a recusa de data fora do formato.
- **Banco:** pgTAP. O teste `32_data_da_reuniao` vira o teste da Data da modelagem piloto (mesmas regras, nome novo) e falha antes da migração (coluna inexistente); o `17_processos` e o `44_pacote_das_planilhas` passam ao nome novo; mais os gerais `00_rls_ligada` e `10_privilegios_padrao`. Rodam no Docker local durante o desenvolvimento e pelo GitHub Actions ("Testes de banco") na conferência final.
- Todos os processos, setores e usuários dos testes são inventados.

### Fora do escopo desta parte

- Filtro "Só os parados" na Lista ou no Quadro.
- Data da modelagem piloto no Editar do processo (fica no verso).
- Reescrever os eventos antigos do histórico para a chave nova.
- Arquivos por etapa (parte 3), outros anexos (parte 4) e visualização por setores (parte 5), que reaproveita a barra desta parte.
- Prazos por etapa: v1.5.

### Decisões tomadas ao escrever esta seção, a confirmar na leitura

1. O campo entra no formulário de Novo processo (hoje a data só se marca no verso), porque "vem com a data de hoje" só faz sentido no cadastro; o Editar continua sem ele.
2. "Hoje" é o de Brasília, como nos dias na etapa.
3. Os eventos antigos do histórico não são reescritos; a tela lê a chave antiga e a nova com o mesmo rótulo.
4. O texto do selo é "Modelagem {DD/MM}" (curto, para caber no cartão), não "Data da modelagem piloto {DD/MM}".
5. A faixa do processo parado fica só no cartão do Quadro; na Lista, só o selo ao lado do nome.
6. A barra na Lista substitui o texto da coluna "Etapa atual" (o nome continua visível acima dos blocos), sem coluna nova.
7. A cor de destaque do selo da modelagem (borda à esquerda) continua a da antiga reunião.

### Divergência com `.scratch/especificacao.md`

Nenhuma nova. A especificação falava em reunião da modelagem piloto; o nome do dado muda, o sentido não.

### Critérios conferidos olhando a tela

- `[visual]` A barra em blocos segue o esboço A: blocos iguais, cinza, o atual meio cheio, "Nome · n de N" acima, sem azul, no cartão por responsável, na Lista e em Processos do setor, sem estourar a largura da coluna.
- `[visual]` As etiquetas aparecem como pílula com bolinha, A fazer cinza, Em andamento laranja suave e Concluído verde suave, legíveis e sem azul.
- `[visual]` O processo parado salta aos olhos no Quadro: faixa vermelha à esquerda e selo vermelho suave, sem confundir com o laranja de Em andamento.
- `[visual]` O campo das Anotações abre com cerca de 7 linhas e rola por dentro depois de cerca de 12, sem empurrar a janela do verso.
- `[visual]` O formulário de Novo processo mostra a Data da modelagem piloto alinhada aos outros campos.

## Andamento livre (mudança de 2026-10-23)

Parte 1 da iniciativa quadro-livre. Decisões de origem: `.scratch/quadro-livre/sabatina-parte-1.md`, o mapa `.scratch/quadro-livre/mapa.md` e os ADRs 0022 (andamento livre), 0023 (revisão e aprovação sem trava) e 0024 (Concluídos pede publicação ou explicação). O ADR 0022 substitui os ADRs 0004 e 0014 e a trava do ADR 0012. Termos no `CONTEXT.md`: Catálogo de etapas, Não iniciados, Etapa atual, Mover, Etiqueta, Processo parado, Responsável do processo, Assumir, Situação do processo, Concluídos e Arquivado.

A mesma mudança atualiza outras três specs. Cada uma tem a sua seção "Andamento livre (mudança de 2026-10-23)":

- `revisoes-aprovacao`: [Registrar revisão] e [Registrar aprovação], sem trava;
- `publicacao-e-arquivamento`: a chegada a Concluídos, Registrar publicação e o arquivamento de suspensos e cancelados;
- `exportacao-e-manutencao`: as fases pela posição no catálogo e os suspensos fora das planilhas.

Esta seção traz o modelo comum: mover, etiqueta, responsável, catálogo, processo parado, histórico, Quadro, Lista, verso e a conversão dos dados.

### O que deixa de valer no resto desta spec

O modelo de andamento por etapa sai inteiro. Saem a tabela `andamentos`, os status pendente, em andamento, concluída, dispensada e realizada anteriormente, iniciar, concluir, dispensar, "realizada anteriormente", voltar com motivo, corrigir datas, o responsável por etapa, a janela de avanço, obrigatória e opcional, e a regra "concluído = obrigatórias resolvidas".

- **Histórias substituídas:** 19, 29 a 44, 56 a 58, 68 a 72, 74, 89 a 107, 112 a 122, 141, 142, 144 a 146, 155 a 163 e 169 a 171. As histórias 20, 24, 25, 42, 43, 151 e 164 a 168 continuam valendo, com "responsável da etapa atual" lido como "responsável do processo".
- **Decisões de implementação:** saem a operação de iniciar etapa, a de concluir, dispensar e registrar como realizada anteriormente, a de corrigir as datas de uma etapa, a de mudar o responsável de uma etapa e a de voltar a uma etapa. Saem também a janela de avanço, as janelas de nota e a regra do arrastar para a "primeira pendente". Na parte do banco, saem as regras de sequência, de transição, de dispensa, de avanço, de voltar e de etapa nova entrando como pendente (ADR 0004), a trava do autor na escolha do responsável (ADR 0014) e as regras de estado da etapa.
- **Limite de processo parado:** passa de 15 para 7 dias, contados da entrada na etapa (não mais do início).

O que não está listado continua valendo: cadastro, edição, exclusão, reclassificação, situação, Anotações, busca, filtros, verso e histórico, com os ajustes abaixo.

### Solução

- **Catálogo:** começa em **Não iniciados** e termina em **Concluídos**, as duas fixas no lugar e no nome. Entre elas ficam as etapas de trabalho: Modelagem piloto, Relatório e modelagem técnica, Revisão interna, Validação com o setor, Aprovação pelo setor, Publicação e as que o Administrador acrescentar. Sai obrigatória/opcional.
- **Cadastro:** todo processo cadastrado entra em Não iniciados, com a etiqueta A fazer e sem responsável.
- **Mover:**
  - O processo vai para qualquer etapa ativa, pela lista "Etapa" do Agora ou arrastando o cartão no Quadro, sem motivo nem confirmação.
  - Ao mover, a etiqueta volta a A fazer, e quem moveu vira o responsável.
  - A única trava é a chegada a Concluídos, que pede a data da publicação ou a explicação de concluir sem publicação (spec de `publicacao-e-arquivamento`).
- **Etiqueta:** A fazer, Em andamento ou Concluído, escolhida no Agora a qualquer momento. Concluído quer dizer que a parte de quem estava na etapa terminou; não conclui o processo.
- **Responsável do processo:** um só por processo. Qualquer integrante o troca por outro ou por ninguém pelo "Trocar" do Agora, e [Assumir] põe a própria pessoa como responsável sem mover o processo.
- **Processo parado:** mais de 7 dias na mesma etapa ganha o selo âmbar "{n} dias nesta etapa", no cartão e no Agora. Não vale em Não iniciados nem em Concluídos, nem para suspensos e cancelados.
- **Suspenso e cancelado** congelam a etapa, a etiqueta e o responsável, e a tela diz por quê. Retomar devolve o processo à mesma etapa.
- **Histórico:** cada mudança de etapa, de etiqueta e de responsável vira um evento. Os eventos do modelo anterior (andamento de etapa e escolha de publicação) são apagados na migração (ADR 0022).
- **Consulta:** vê o Quadro, a Lista, a etapa, a etiqueta, o responsável e o histórico. Não arrasta, não tem as listas de escolha e não pode ser responsável. O banco recusa qualquer alteração dela.

### Histórias de usuário

#### Catálogo

200. Como Administrador, quero que o catálogo comece em Não iniciados e termine em Concluídos, para que todo processo tenha onde entrar e onde terminar.
201. Como Administrador, quero que Não iniciados e Concluídos não se renomeiem, não saiam do lugar, não se desativem nem se excluam, e que a tela não ofereça essas ações nelas, para que a entrada e a saída do Quadro nunca mudem.
202. Como Administrador, quero acrescentar uma etapa escolhendo a posição entre Não iniciados e Concluídos, com nome, código e fase do Regimento, para mudar o caminho do trabalho sem mexer em nenhum processo.
203. Como Administrador, quero que a etapa nova só acrescente uma coluna ao Quadro, sem mudar a etapa de nenhum processo.
204. Como Administrador, quero renomear e reordenar qualquer etapa de trabalho, inclusive as seis de fábrica, sem atravessar Não iniciados nem Concluídos.
205. Como Administrador, quero que a plataforma recuse desativar ou excluir uma etapa com processo dentro, dizendo quantos são, para que nenhum processo fique numa coluna escondida.
206. Como Administrador, quero excluir só a etapa por onde nenhum processo passou, e que a plataforma sugira desativar as outras.
207. Como Administrador, quero que as seis etapas com campos próprios (Modelagem piloto, Relatório e modelagem técnica, Revisão interna, Validação com o setor, Aprovação pelo setor e Publicação) não se desativem nem se excluam, com a frase dizendo por quê.
208. Como Administrador, quero que o catálogo não tenha mais obrigatória nem opcional, porque a ordem não obriga ninguém a seguir a sequência.
209. Como Administrador, quero reativar uma etapa desativada, que volta a ter coluna no Quadro, sem mexer em nenhum processo.
210. Como Administrador, quero ver no catálogo, ao lado de Não iniciados e de Concluídos, o selo "Fixa" no lugar dos botões.

#### Mover

211. Como integrante do EP, quero que o processo cadastrado entre em Não iniciados, com a etiqueta A fazer e sem responsável, porque ainda não começou.
212. Como integrante do EP, quero escolher a etapa do processo numa lista "Etapa" do Agora, com todas as etapas ativas na ordem do catálogo, para levá-lo para a frente ou para trás.
213. Como integrante do EP, quero que escolher a etapa na lista mova o processo na hora, sem confirmação, para o gesto ser tão rápido quanto no Planner.
214. Como integrante do EP, quero arrastar o cartão no Quadro para a coluna de qualquer etapa, para a frente ou para trás.
215. Como integrante do EP, quero que, enquanto arrasto, a coluna sob o cartão fique destacada, para saber onde ele vai cair.
216. Como integrante do EP, quero que soltar o cartão na própria coluna não grave nada.
217. Como integrante do EP, quero que, ao mover, a etiqueta volte a A fazer, porque o trabalho da etapa nova ainda não começou.
218. Como integrante do EP, quero passar a ser o responsável do processo que movo, em qualquer etapa, inclusive em Não iniciados e em Concluídos, porque quem move é quase sempre quem vai trabalhar nele.
219. Como integrante do EP, quero que a plataforma não peça motivo nem confira a sequência ao mover, porque a ordem das etapas é combinação da equipe.
220. Como integrante do EP, quero que a falha ao mover (inclusive por falta de conexão) mostre a mensagem de erro de gravação e deixe o processo onde estava, com o cartão de volta à coluna de origem.
221. Como integrante do EP, quero que o processo suspenso, cancelado ou arquivado não se mova: o cartão não se arrasta, a lista não aparece, a tela explica por quê e o banco recusa fora da tela.
222. Como integrante do EP, quero que só etapas ativas apareçam na lista e recebam o cartão.
223. Como integrante do EP que usa o teclado, quero mover pela lista "Etapa" do Agora, abrindo o verso com Enter no cartão, sem precisar arrastar.

#### Etiqueta

224. Como integrante do EP, quero marcar a etiqueta da etapa atual como A fazer, Em andamento ou Concluído, no Agora, gravando ao escolher, para dizer à equipe em que pé está a minha parte.
225. Como integrante do EP, quero ver a etiqueta no cartão do Quadro, na Lista e no Agora, para saber de relance o que está parado esperando alguém.
226. Como integrante do EP, quero que mudar a etiqueta não mude a etapa nem o responsável.
227. Como integrante do EP, quero que, em Concluídos, a etiqueta seja sempre Concluído, sem lista para mudá-la, porque ali o processo terminou.
228. Como integrante do EP, quero que a falha ao mudar a etiqueta mostre a mensagem de erro de gravação e deixe a etiqueta como estava.

#### Responsável

229. Como integrante do EP, quero trocar o responsável do processo pelo "Trocar" do Agora, entre os usuários ativos Administrador ou Integrante, ou deixá-lo sem ninguém, gravando ao escolher.
230. Como integrante do EP, quero [Assumir] o processo quando não sou o responsável, para me pôr como responsável com um clique, sem movê-lo.
231. Como integrante do EP, quero ver o responsável no cartão (a foto do Google), na Lista e no Agora.
232. Como integrante do EP, quero que o responsável que foi desativado apareça com "Inativo", sem poder ser escolhido de novo.
233. Como integrante do EP, quero um aviso amarelo no Agora quando o processo está na Revisão interna e o responsável é quem enviou a versão mais recente (fora as históricas), "{nome} enviou a V{n}; a revisão interna deveria ser de outra pessoa.", sem impedir nada, porque a regra do revisor virou combinação da equipe (ADR 0023).
234. Como Consulta, quero ver o responsável, sem "Trocar" nem [Assumir].

#### Processo parado

235. Como integrante do EP, quero que o processo com mais de 7 dias na mesma etapa ganhe o selo âmbar "{n} dias nesta etapa" no cartão e no Agora, para notar o que está demorando.
236. Como integrante do EP, quero que os dias contem da entrada na etapa, e que mudar só a etiqueta não zere a contagem.
237. Como integrante do EP, quero que Não iniciados, Concluídos, os suspensos e os cancelados não ganhem o selo, porque ali o tempo não é atraso.
238. Como integrante do EP, quero ver no Agora "há {n} dias nesta etapa" em cinza até 7 dias, e o selo âmbar a partir do oitavo.

#### Quadro, Lista e verso

239. Como integrante do EP, quero no Quadro uma coluna por etapa ativa, de Não iniciados a Concluídos, na ordem do catálogo.
240. Como integrante do EP, quero que o cartão mostre a etiqueta como pílula neutra com o texto ("A fazer", "Em andamento", "Concluído").
241. Como integrante do EP, quero que a barra do cartão tenha um pedaço por etapa ativa, com as anteriores à atual preenchidas e a atual destacada, para ver a posição do processo de relance.
242. Como integrante do EP, quero que "Agrupar por: Responsável" e "Só os meus" usem o responsável do processo e incluam os processos de Não iniciados e de Concluídos.
243. Como integrante do EP, quero na Lista as colunas etapa atual, etiqueta e responsável, e o filtro de etapa com Não iniciados e Concluídos.
244. Como integrante do EP, quero que o Agora mostre "Agora · etapa {n} de {total}", a etapa com a lista para mover, a etiqueta com a lista para mudar, e o responsável com "Trocar" e [Assumir].
245. Como integrante do EP, quero que, na Revisão interna, na Aprovação pelo setor, na Publicação e em Concluídos, o Agora traga os botões dos registros daquela etapa (specs de `revisoes-aprovacao` e de `publicacao-e-arquivamento`).
246. Como integrante do EP, quero ver na seção Etapas do verso a lista das etapas ativas, com a atual destacada e as que o processo já visitou marcadas, e abrir cada uma para ver quando o processo entrou e saiu dela.
247. Como Consulta, quero ver o Agora com a etapa, a etiqueta e o responsável em texto, sem listas nem botões.

#### Histórico

248. Como integrante do EP, quero ver no Histórico "Moveu de {etapa} para {etapa}", com quem moveu (que passou a ser o responsável), para saber o caminho real do processo.
249. Como integrante do EP, quero ver "Mudou a etiqueta: {de} → {para}" e "Mudou o responsável: {de} → {para}".
250. Como integrante do EP, quero que um movimento apareça como um só evento, com a etapa e o responsável, sem um segundo evento para a etiqueta que voltou a A fazer.
251. Como integrante do EP, quero que os eventos de iniciar, concluir, dispensar, "realizada anteriormente", voltar, avançar e trocar o responsável da etapa, e os de escolha de publicação, não apareçam mais, porque saíram com o modelo anterior (ADR 0022).
252. Como integrante do EP, quero que os outros eventos antigos (cadastro, edição, situação, reclassificação, catálogo, versões, revisões e aprovações) continuem como estão.

#### Conversão dos dados

253. Como integrante do EP, quero que os processos que já existem no desenvolvimento apareçam na etapa em que estavam, com a etiqueta e o responsável que correspondem, sem nada a fazer à mão.

#### Perfis

254. Como responsável pela plataforma, quero que o banco recuse mover, mudar a etiqueta e trocar o responsável vindos da Consulta, de usuário inativo e de visitante, mesmo fora da tela, e que inativo e visitante não leiam a etapa, a etiqueta nem as entradas e saídas.

### Decisões de implementação

#### Interface

- **Módulo de processos.** Saem iniciar etapa, concluir etapa, dispensar etapa, voltar para etapa, corrigir as datas da etapa, mudar o responsável da etapa e "não vai mais para publicação". Entram:
  - **mover o processo** (processo e etapa de destino; para Concluídos, também a data e o link da publicação ou a explicação de concluir sem publicação, ver `publicacao-e-arquivamento`);
  - **mudar a etiqueta** (processo e etiqueta);
  - **mudar o responsável do processo** (processo e usuário, ou nenhum; [Assumir] é mudar para si mesmo).

  A leitura do processo passa a trazer a etapa atual com a posição no catálogo, a etiqueta, a entrada na etapa, o responsável do processo e as entradas e saídas de cada etapa. A lista dos processos traz a etapa atual, a etiqueta, a entrada na etapa e o responsável.
- **Quadro:**
  - **Colunas:** uma por etapa ativa, na ordem do catálogo. Não iniciados é a primeira, e Concluídos a última, sempre visível (spec de `publicacao-e-arquivamento`).
  - **Cartões:** os processos em andamento, suspensos e concluídos que não estão arquivados, cada um na coluna da etapa atual. Os cancelados continuam só na Lista.
  - **Cartão:** a etiqueta (pílula neutra com o texto, sem azul; as cores ficam para a parte 2) e, no lugar do responsável da etapa, o avatar do responsável do processo.
  - **Barra:** um pedaço por etapa ativa; as anteriores à atual em cinza-escuro, a atual em `azul` e as seguintes em cinza-claro. Em Concluídos, toda preenchida. Nome acessível: "Etapa {n} de {total}: {etapa}". A barra em blocos com o nome fica para a parte 2.
  - **Selos:** "{n} dias nesta etapa" a partir de 8 dias (regra de processo parado); "Relatório pendente" com a etapa atual na Revisão interna ou depois dela e antes de Concluídos, pela ordem do catálogo; "Sem responsável"; "Sem publicação" em Concluídos sem a data (no lugar de "Não publicado"); depois Reunião, versão e subprocessos, como hoje.
- **Arrastar** (arrastar nativo do navegador, sem biblioteca, como na parte 4):
  - só Administrador e Integrante, só agrupado por etapa, e só o cartão de processo em andamento ou concluído não arquivado;
  - toda coluna recebe o cartão, e a coluna sob o cartão ganha o realce (fundo `azul-claro`, borda contínua de 1px em `azul` e sombra interna suave, com transição de 150 ms), e as demais colunas esmaecem;
  - soltar na própria coluna não grava;
  - soltar em Concluídos, sem a data da publicação registrada, abre a janela de chegada a Concluídos (spec de `publicacao-e-arquivamento`); Esc ou [Cancelar] devolvem o cartão;
  - soltar em qualquer outra coluna grava na hora, e o Quadro recarrega com o cartão na coluna nova;
  - a falha mostra a mensagem de erro de gravação, e o cartão volta;
  - por toque, o arrastar não acontece; o caminho é o verso.
- **Agora do verso** (processo em andamento ou concluído não arquivado):
  - rótulo "Agora · etapa {n} de {total}" (posição entre as etapas ativas);
  - **Etapa:** lista suspensa com as etapas ativas, na atual; escolher outra move na hora, e Concluídos sem a data registrada abre a janela de chegada;
  - **Etiqueta:** lista com A fazer, Em andamento e Concluído, gravando ao escolher; em Concluídos, só o texto "Concluído";
  - **Responsável:** avatar e nome (ou "Sem responsável"), "há {n} dias nesta etapa" (o selo âmbar a partir de 8 dias, fora de Não iniciados e de Concluídos), o "Trocar" (com quem está na tela primeiro, "(você)", e "Ninguém por enquanto" no fim) e [Assumir] quando quem está na tela não é o responsável;
  - **aviso do revisor:** na Revisão interna, quando o responsável é o autor da versão mais recente não histórica, o aviso amarelo da história 233, que some quando a condição deixa de valer;
  - **botões dos registros** da etapa atual: Revisão interna, Aprovação pelo setor e Publicação (specs de `revisoes-aprovacao` e de `publicacao-e-arquivamento`). O botão de registro é o principal quando existe; nas outras etapas, o Agora não tem botão principal;
  - **suspenso ou cancelado:** motivo, [Retomar] e [Arquivar], sem as listas (spec de `publicacao-e-arquivamento`);
  - **Consulta:** borda cinza e a frase "Em {etapa} · {etiqueta} · com {nome} há {n} dias" (ou "sem responsável"). Passado o limite de 7 dias, a frase não repete os dias: o selo âmbar já os diz (decisão da implementação, registrada no `desvios.md` em 2026-10-25). Os dias na etapa contam pelo "hoje" de Brasília, não pelo relógio de quem abre a tela.
- **Etapas do verso:** lista só de leitura das etapas ativas, com a atual com o ponto azul, as já visitadas com ✓ cinza e a data da última saída, e as nunca visitadas em cinza, sem marca. Clicar abre a gaveta, uma por vez, com as entradas e saídas do processo naquela etapa ("Entrou em {dd/mm/aaaa} · saiu em {dd/mm/aaaa}", da mais recente para a mais antiga, ou "Ainda não passou por esta etapa") e, na Revisão interna e na Aprovação pelo setor, os registros (spec de `revisoes-aprovacao`). Saem da gaveta [Corrigir datas], [Voltar a esta etapa], nota, "Trocar" e [Assumir].
- **Lista:**
  - **Colunas:** nome, tipo, setor, macroprocesso, etapa atual, etiqueta, responsável e situação.
  - **Filtros:** os de hoje. O filtro de etapa oferece todas as etapas ativas, inclusive Não iniciados e Concluídos.
- **Catálogo** (aba da Administração):
  - **Tabela:** nome, fase (vazia nas duas fixas, "—") e situação; Não iniciados e Concluídos com o selo "Fixa" e sem botões.
  - **Nova etapa:** nome, código, fase e posição entre as duas fixas.
  - **Editar:** nome e fase. Sai o campo obrigatória.
  - **Subir e Descer** não atravessam as fixas. Desativar, Reativar e Excluir continuam, com as recusas novas.
- **Mensagens de recusa novas,** vindas do banco e traduzidas pela interface:
  - "Este processo está {suspenso | cancelado}; retome-o para mudar a etapa, a etiqueta ou o responsável."
  - "A etapa {nome} está inativa."
  - "A etapa {nome} tem {n} processos; mova-os antes de {desativar | excluir}."
  - "A etapa {nome} já recebeu processos; desative-a em vez de excluir."
  - "As etapas Não iniciados e Concluídos não mudam de nome nem de lugar e não saem do catálogo."
  - "A etapa {nome} tem campos próprios e não pode ser desativada nem excluída."
  - "A etiqueta {valor} não existe; use A fazer, Em andamento ou Concluído."

  Saem as recusas de sequência, de etapa em andamento, de dispensa, de datas da etapa e a da trava do autor.
- **Estados:** os de hoje no Quadro, na Lista, no verso e no catálogo, inclusive o erro de conexão com [Tentar de novo]. As gravações de mover, etiqueta e responsável não abrem janela: a lista fica desabilitada enquanto grava, e a falha aparece em vermelho no Agora ("A alteração não foi salva: {motivo}.") ou, no Quadro, no aviso que já existe.
- **Histórico (textos):** "Moveu de {de} para {para}" (com o responsável no "depois"); "Mudou a etiqueta"; "Mudou o responsável"; "Desativou a etapa", "Reativou a etapa", "Acrescentou a etapa ao catálogo" e "Mudou a ordem do catálogo", como hoje. Saem os textos de andamento de etapa.

#### Modelo de dados

**Tipos:** novo `etiqueta_da_etapa` = `a_fazer`, `em_andamento` e `concluido`. Sai `status_da_etapa`, junto com `andamentos`.

**`etapas`:**
- sai a coluna `obrigatoria`;
- entram as etapas `nao_iniciados` ("Não iniciados"), com a menor ordem, e `concluidos` ("Concluídos"), com a maior;
- `fase` fica vazia nessas duas e obrigatória nas outras, por uma restrição que olha o código;
- as duas fixas não mudam de nome, de ordem, de fase nem de `ativa` e não se apagam;
- nenhuma etapa se coloca antes de Não iniciados nem depois de Concluídos;
- os oito códigos de fábrica (as duas fixas e as seis com campos próprios) não se desativam nem se apagam;
- etapa com processo na passagem aberta não se desativa nem se apaga, e a recusa traz a contagem;
- etapa com qualquer passagem, aberta ou fechada, não se apaga.

**`processos`:**
- nova coluna `responsavel_id`: uuid, referência a `usuarios`, opcional; usuário ativo Administrador ou Integrante, pelo gatilho que hoje confere o responsável da etapa;
- muda pela função de mover e por atualização direta da coluna (privilégio de coluna a logado);
- as colunas de publicação ficam na spec de `publicacao-e-arquivamento`.

**`passagens`** (nova, com RLS): cada estadia do processo numa etapa. A passagem aberta é a etapa atual: a etapa atual não se guarda em outro lugar ("não guarde o que se calcula").

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | uuid gerado | sim |
| processo_id | uuid, referência a `processos`, apaga junto | sim |
| etapa_id | uuid, referência a `etapas`, recusa apagar | sim |
| entrou_em | data e hora, preenchida pelo banco | sim |
| saiu_em | data e hora, preenchida pelo banco ao mover | não (vazia na passagem aberta) |
| etiqueta | etiqueta_da_etapa, padrão `a_fazer` | sim |
| concluido_em | data e hora em que a etiqueta virou Concluído nesta passagem, preenchida pelo banco; volta a vazia quando a etiqueta sai de Concluído | não |
| movido_por | uuid, referência a `usuarios`, quem moveu para cá, preenchido pelo banco | não (vazio no cadastro e na conversão) |

- Um índice único parcial garante uma só passagem aberta por processo.
- Um gatilho depois de incluir em `processos` abre a primeira passagem, em Não iniciados.
- Passagem fechada não muda.
- Na aberta, só a etiqueta muda, por atualização direta da coluna ou por função, à escolha da execução.
- Ninguém inclui nem apaga passagem direto: só a função de mover e o gatilho do cadastro.
- `concluido_em` serve à data de conclusão das fases nas planilhas (spec de `exportacao-e-manutencao`).

**Função `mover_processo(p_processo, p_etapa, p_data_da_publicacao, p_link_da_publicacao, p_explicacao_sem_publicacao)`.** Sem `security definer`; roda com a permissão de quem chama, e a RLS decide. Numa transação só:
- recusa processo suspenso, cancelado ou arquivado, e etapa inativa;
- com a etapa de destino igual à atual, não faz nada;
- fecha a passagem aberta (`saiu_em` agora) e abre outra no destino, com a etiqueta A fazer (em Concluídos, Concluído, com `concluido_em` agora) e `movido_por` igual a quem chama;
- põe quem chama como `responsavel_id`;
- aplica as regras de chegada a Concluídos e de saída de lá (spec de `publicacao-e-arquivamento`);
- gera um só evento de movimento.

**View `processos_com_andamento`.** É recriada (apagada e criada de novo, porque perde colunas), com `security_invoker = true`, o mesmo `revoke` de visitante e o `grant` de leitura a logado. Os nomes que outras partes leem continuam: `etapa_atual_id`, `etapa_atual_codigo`, `etapa_atual_nome`, `etapa_atual_ordem`, `responsavel_id`, `responsavel_nome`, `responsavel_foto_url`, `responsavel_ativo` e `situacao`. A função `arquivos-no-drive` e o gatilho das versões leem `situacao` e `etapa_atual_id` e não mudam.
- **Etapa atual:** a da passagem aberta.
- **Responsável:** o do processo.
- **`situacao`:** `concluido` quando a guardada é `em_andamento` e a etapa atual é `concluidos`; senão, a guardada.
- **Campos novos:** `etiqueta`, `entrou_na_etapa_em` e `etapa_atual_posicao` (a posição entre as etapas ativas), mais os de publicação da spec de `publicacao-e-arquivamento`.
- **Campos que saem:** `etapa_atual_status`, `etapa_atual_iniciada_em`, `caminho` e `vai_para_publicacao`.

**Eventos:**
- **Entidade nova `passagem`,** com o id do processo, para os filtros do histórico. O movimento leva no antes e no depois a etapa (nome e código) e o responsável; a mudança de etiqueta leva a etiqueta.
- **Responsável:** a mudança direta de `responsavel_id` gera evento do processo. A mudança feita dentro do movimento não gera, porque o evento do movimento já a leva.
- **Exclusão do processo:** o "antes" traz a etapa atual, a etiqueta e o responsável, no lugar da lista de andamentos.
- **Leitura:** todo perfil ativo lê os eventos novos.

**Dado pessoal:** `processos.responsavel_id` e `passagens.movido_por` apontam para usuários, cujo nome todo perfil ativo já vê. Nada novo vai às planilhas.

**Gravações com várias linhas** passam pelas funções do banco, sem `security definer`.

#### Quem pode o quê (cada célula vira um teste pgTAP)

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `passagens` ler | sim | sim | sim | não | não |
| mover (pela função) | sim | sim | não | não | não |
| `passagens` alterar a etiqueta da passagem aberta | sim | sim | não | não | não |
| `passagens` incluir, apagar ou alterar outra coluna direto | não (só a função e o gatilho) | não | não | não | não |
| `processos` alterar `responsavel_id` | sim | sim | não | não | não |
| `etapas` criar, renomear, reordenar, desativar e apagar (com as regras) | sim | não | não | não | não |
| `processos_com_andamento` ler os campos novos | sim | sim | sim | não | não |
| `eventos` de passagem e de responsável ler | sim | sim | sim | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Processo novo entra em Não iniciados, A fazer, sem responsável | gatilho depois de incluir | processo criado tem uma passagem aberta em `nao_iniciados`, etiqueta `a_fazer`, `responsavel_id` vazio |
| Uma só passagem aberta por processo | índice único parcial | segunda passagem aberta recusada |
| Mover vai a qualquer etapa ativa, para a frente ou para trás | `mover_processo` | de Não iniciados à Revisão interna aceito; da Aprovação à Modelagem piloto aceito; etapa inativa recusada |
| Mover fecha a passagem, abre outra com A fazer e põe quem move como responsável | `mover_processo` | depois de mover: passagem anterior com `saiu_em`, nova com `a_fazer`, `movido_por` e `responsavel_id` iguais a quem chamou |
| Mover para a própria etapa não muda nada | `mover_processo` | nenhuma passagem nova, nenhum evento |
| Suspenso, cancelado e arquivado não se movem nem mudam etiqueta e responsável | função e gatilhos | os três recusados em cada caso |
| Etiqueta só muda na passagem aberta; Concluído preenche `concluido_em`; sair de Concluído o esvazia | gatilho antes de alterar | etiqueta da passagem fechada recusada; Concluído → Em andamento esvazia a data |
| Em Concluídos a etiqueta é Concluído e não muda | função e gatilho | mudar a etiqueta em Concluídos recusado |
| Responsável é usuário ativo Administrador ou Integrante | gatilho que já existe, levado a `processos` | Consulta ou inativo recusados |
| Não iniciados e Concluídos fixos | gatilhos em `etapas` | renomear, mudar a ordem, desativar e apagar as duas recusados; etapa nova antes de Não iniciados ou depois de Concluídos recusada |
| Etapa com processo dentro não se desativa nem se apaga | gatilho em `etapas` | recusado com a contagem |
| Etapa com passagem não se apaga | referência de `passagens` recusa apagar | etapa por onde um processo passou: apagar recusado, desativar aceito |
| As seis etapas com campos próprios não se desativam nem se apagam | gatilho que já existe, ampliado às seis | desativar a Modelagem piloto recusado; renomear aceito |
| Fase vazia só nas duas fixas | restrição | etapa de trabalho sem fase recusada |
| Etapa nova não muda nenhum processo | `acrescentar_etapa` sem criar linhas por processo | etapa nova: nenhuma passagem criada |
| Cada movimento, etiqueta e troca de responsável vira evento; o movimento gera um só | gatilhos de evento | um evento por ação; mover não gera evento separado de responsável |
| Eventos do modelo anterior apagados; os outros ficam | migração | depois da migração: nenhum evento de `andamento` nem de escolha de publicação; os de cadastro, situação e versão continuam |

#### Regras de estado

```
cadastro ──▶ Não iniciados (A fazer, sem responsável)
etapa X ──mover (qualquer etapa ativa; quem move vira responsável)──▶ etapa Y (A fazer)
etapa Y ──mover para Concluídos (data da publicação ou explicação)──▶ Concluídos (Concluído)
etiqueta: A fazer ⇄ Em andamento ⇄ Concluído (só na passagem aberta; em Concluídos, fixa)
```

Suspenso e cancelado congelam a passagem aberta e o responsável; retomar não mexe neles. "Concluído" é estar em Concluídos, com a situação guardada em andamento. Os dias na etapa contam de `entrou_em` (dias de calendário no fuso de Brasília). Processo parado: mais de 7 dias, situação em andamento, fora de Não iniciados e de Concluídos.

#### Migração (destrutiva, ADR 0022)

A produção não existe; só se perdem dados inventados do desenvolvimento. Uma ou mais migrações novas, cada uma numa transação, com os gatilhos de evento desligados enquanto converte e apaga (`session_replication_role = replica`, como em 2026-10-18):

1. tipo, tabela `passagens` (com RLS, políticas e o `revoke` padrão) e a coluna `processos.responsavel_id`;
2. as etapas `nao_iniciados` e `concluidos`, com o catálogo renumerado (as atuais mantêm a ordem relativa entre as duas);
3. **conversão** de cada processo, numa passagem aberta:
   - **etapa:** a etapa atual de hoje, a em andamento ou a primeira pendente. A Modelagem piloto ainda pendente vai para Não iniciados, e o processo concluído vai para Concluídos;
   - **etiqueta:** Em andamento para quem tinha a etapa em andamento, A fazer para os outros e Concluído em Concluídos;
   - **responsável do processo:** o responsável da etapa atual;
   - **entrada:** o `iniciada_em` da etapa em andamento (meia-noite de Brasília) ou a hora da migração;
   - os arquivados continuam arquivados, e a publicação se converte pela spec de `publicacao-e-arquivamento`;
4. apaga os eventos do modelo anterior: entidade `andamento` e os de escolha de publicação, "não vai mais para publicação" e publicação registrada do modelo anterior;
5. apaga `andamentos`, `status_da_etapa`, `etapas.obrigatoria` e as funções e gatilhos do modelo anterior: iniciar, avançar, voltar, sequência, transição, dispensa, nota, uma em andamento, autor da Revisão interna, conclusão das etapas de revisão, criação de andamentos no cadastro e no catálogo, e "não vai mais para publicação";
6. recria a view, a função de acrescentar etapa (sem obrigatória), os gatilhos do catálogo e o estado guardado nos eventos do processo, com `responsavel_id`.

O teste de migração monta processos nos estados antigos (Modelagem piloto pendente, etapa em andamento com responsável, concluído, arquivado, suspenso) e confere a passagem, a etiqueta, o responsável e os eventos depois, ensaiado num teste temporário antes de aplicar. A migração vai pelo workflow "Migrar banco de desenvolvimento" e entra no registro de `supabase/AMBIENTES.md`.

### Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).** Vitest com Testing Library, renderizando o aplicativo inteiro com as falsas nomeadas. A falsa de processos troca os andamentos pelas passagens, imita `mover_processo`, a etiqueta, o responsável, o congelamento, a chegada a Concluídos e as recusas do catálogo, e aceita falhas programáveis. O que cobre:
  - cadastro em Não iniciados, A fazer, sem responsável;
  - mover pela lista do Agora para a frente e para trás, com a etiqueta voltando a A fazer e quem move virando responsável; a falha com o processo onde estava;
  - arrastar para qualquer coluna, a própria coluna sem gravar, o realce da coluna sob o cartão, a falha com o cartão de volta, nada arrastável para a Consulta, no suspenso, no arquivado e agrupado por responsável;
  - etiqueta no Agora, no cartão e na Lista; Concluídos sem lista de etiqueta;
  - "Trocar", [Assumir] para quem não é o responsável, "Ninguém por enquanto", responsável inativo;
  - o aviso do revisor na Revisão interna, aparecendo e sumindo;
  - processo parado com 7 dias (sem selo) e 8 (com selo), sem selo em Não iniciados, em Concluídos e no suspenso, e mudar a etiqueta sem zerar;
  - colunas de Não iniciados a Concluídos, a barra com o nome acessível, os selos novos;
  - Agrupar por responsável e Só os meus com o responsável do processo;
  - Lista com etapa, etiqueta e responsável, e o filtro de etapa;
  - Etapas do verso com a atual, as visitadas e a gaveta das entradas e saídas;
  - catálogo com as fixas sem botões, as recusas de desativar e excluir com processo dentro, a etapa nova entre as fixas, sem o campo obrigatória;
  - suspenso e cancelado congelados, com a explicação;
  - histórico com os eventos novos e sem os do modelo anterior;
  - Consulta só lendo;
  - os testes de tela do modelo anterior (`App.andamentoDoProcesso`, `App.avancoDaEtapa`, `App.arrastarParaConcluir`, `App.assumirEAutor`, `App.etapasDoVerso`, `App.voltarDatasResponsavel`, `App.catalogoNosProcessos`, `App.agoraDoVerso`, `App.cartaoDoQuadro`) são reescritos para o modelo novo ou apagados quando o comportamento saiu, mantendo o que continua valendo.
- **Tradução entre o banco e a tela.** Testes pequenos do módulo de processos real com o cliente simulado: as chamadas de mover, etiqueta e responsável; cada código de recusa novo virando a frase; as linhas da view com os campos novos. Arte anterior: `andamentosSupabase`, `processosSupabase`, `catalogoSupabase`.
- **Funções puras:** a barra a partir da posição, os selos (processo parado com 7 dias), as colunas do Quadro com as fixas e o destino do arrastar ganham testes unitários pequenos. Arte anterior: `barraDoCartao`, `selosDoCartao`, `colunasDoQuadro`, `destinoDoArrastar`, `diasNaEtapa`.
- **Banco.** pgTAP, um teste por célula da tabela "quem pode o quê" e um por regra, o teste da conversão e os testes gerais `00_rls_ligada` e `10_privilegios_padrao`. Os testes antigos do modelo anterior (`18`, `19`, `20`, `22`, `34`, `35`, `36`, `37` e os que montam processos pelos andamentos, como `27` a `30`, `38` a `41` e `44` a `50`) são reescritos para as passagens ou apagados quando a regra saiu. Os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco").
- Todos os processos, setores e usuários dos testes são inventados.

### Fora do escopo desta parte

- Cores das etiquetas, barra em blocos com o nome da etapa, desenho final do aviso de processo parado e Data da modelagem piloto: parte 2.
- Arquivos próprios de cada etapa, travas de arquivo na Modelagem piloto e na Modelagem técnica, envio opcional: parte 3 (ADR 0016).
- Outros anexos (parte 4) e visualização por setores (parte 5).
- Filtro por etiqueta na Lista; mover vários processos de uma vez; desfazer um movimento por botão (mover de volta faz isso).
- Prazos por etapa: v1.5 (o limite de processo parado é o número único 7).

### Decisões tomadas ao escrever esta seção, a confirmar na leitura

1. A etapa atual e a etiqueta ficam numa tabela de passagens, uma linha por estadia na etapa. A passagem aberta é a etapa atual. Ela dá a contagem de dias, as datas das fases nas planilhas e o "cada passagem pela Revisão interna tem o seu registro".
2. O processo cadastrado entra sem responsável: cadastrar não é mover.
3. Em Concluídos, a etiqueta é sempre Concluído e não muda, uma exceção a "volta a A fazer". Em Não iniciados, a etiqueta muda normalmente.
4. [Assumir] aparece sempre que quem está na tela não é o responsável. Antes, aparecia só quando não havia responsável.
5. Mover pela lista do Agora grava ao escolher, sem confirmação, como o "Trocar". A exceção é a chegada a Concluídos sem a data da publicação.
6. Um movimento gera um só evento, com a etapa e o responsável. A etiqueta que volta a A fazer não gera evento próprio.
7. Os dias na etapa são de calendário, contados da entrada. Suspender não desconta, e retomar não zera.
8. A seção Etapas do verso mostra só as etapas ativas. Uma etapa visitada que depois foi desativada aparece só no histórico.
9. Agrupar por responsável e Só os meus incluem os processos de Não iniciados e de Concluídos, que agora têm responsável.
10. Os cancelados continuam só na Lista.
11. O aviso do revisor fica no Agora enquanto a condição vale, em vez de aparecer só no momento de mover ou assumir.
12. Na conversão, cada processo ganha só a passagem atual: as passagens antigas não são reconstruídas a partir dos andamentos, que são dados inventados.
13. A barra tem um pedaço por etapa ativa, incluindo as duas fixas, até o redesenho da parte 2.

### Divergência com `.scratch/especificacao.md`

A especificação previa etapas em sequência obrigatória, com etapas opcionais dispensáveis e conclusão por etapa. O Andamento livre tira a sequência, as obrigatórias e a dispensa (ADR 0022), por decisão do usuário na sabatina de 2026-10-23.

### Critérios conferidos olhando a tela

- `[visual]` O Agora mostra, sem apertar a coluna, a etapa com a lista, a etiqueta com a lista e o responsável com "Trocar" e [Assumir]; na Consulta, a frase em texto.
- `[visual]` A etiqueta aparece como pílula neutra com texto no cartão e na Lista, sem azul e sem depender só de cor.
- `[visual]` Durante o arrastar, a coluna sob o cartão ganha fundo azul claro, borda contínua azul e sombra interna, e as demais colunas esmaecem; o cartão arrastado fica levemente apagado no lugar de origem.
- `[visual]` O Quadro com Não iniciados e Concluídos nas pontas mantém a largura fixa das colunas e a rolagem lateral de hoje.
- `[visual]` No catálogo, Não iniciados e Concluídos aparecem com o selo "Fixa", sem botões, alinhados com as outras linhas.
- `[visual]` O aviso do revisor no Agora é amarelo (aviso), não vermelho.

## Problema

O EP acompanha dezenas de processos de vários setores, cada um numa etapa diferente do mapeamento, mas não tem um lugar único que diga em que etapa cada processo está, quem é o responsável por ela, desde quando, e o que foi dispensado ou feito antes da plataforma existir. Processos viram subprocessos (e o contrário) no meio do caminho, e essa mudança não deixa rastro. Sem esse andamento registrado, não há como montar o painel nem os prazos, e não há como provar o que aconteceu com cada processo.

## Solução

- **Área Processos** (item "Quadro" e "Lista" da faixa lateral, alternância Quadro | Lista na barra superior):
  - o **Quadro** mostra os processos em andamento e os suspensos, cada um na coluna da etapa atual; o processo novo entra na coluna Modelagem piloto. Desde a parte 4 (2026-10-19), o cartão traz a barra de progresso e os selos, arrastar o cartão conclui a etapa, e o Quadro pode ser agrupado por responsável e filtrado por "Só os meus";
  - a **Lista** mostra todos os processos, de qualquer situação, numa tabela com busca pelo nome e filtros; é o lugar dos concluídos;
  - nos dois, [Cadastrar processo] para Administrador e Integrante, e clicar num cartão ou numa linha abre o **verso do cartão** (desde 2026-10-19).
- **Verso do cartão** (desde 2026-10-19, no lugar do painel lateral): janela central larga, com o Quadro ou a Lista escurecidos atrás. À esquerda, o trabalho: o cartão **Agora** (etapa atual, responsável ou [Assumir], dias na etapa e um único botão principal), as **Etapas** em linhas compactas (clicar abre o detalhe da etapa ali mesmo) e os **Arquivos** (a versão mais recente em destaque, com o que falta). À direita, o contexto: as **Anotações** do processo (desde 2026-10-23), a data da **Reunião** de modelagem piloto (spec de `reunioes`), **Sobre** (setor, macroprocesso, tipo, origem, contexto, observações) e a **Estrutura** (subprocessos ou o processo pai). O menu "⋯" do cabeçalho traz Histórico, Editar, Reclassificar, Suspender ou Retomar, Cancelar e Excluir. Novo processo, Editar e Histórico abrem dentro da mesma janela.
- **Avanço das etapas (desde 2026-10-18):** concluir, dispensar ou registrar como realizada anteriormente a etapa atual abre uma janela que pergunta "Quem fica com a próxima etapa?" e, ao confirmar, a próxima etapa pendente já entra em andamento com essa pessoa (ou sem ninguém, à espera de alguém assumir). Na etapa sem responsável, [Assumir] põe a própria pessoa como responsável com um clique.
- **Tela do setor** (área Setores, que já existe): ganha a lista dos processos do setor; clicar num deles leva à Lista filtrada pelo setor, com o verso aberto.
- **Catálogo de etapas** (área Administração, só para o administrador): a lista ordenada das etapas, com obrigatória ou opcional, e ativa.

A Consulta vê tudo sem nenhum botão de alteração. O banco impõe as regras: quem não pode alterar é recusado mesmo que tente fora da tela, e toda mudança vira evento no histórico. A exceção, desde 2026-10-23, são as Anotações: elas não geram evento (ADR 0021), e o que as protege é a recusa da gravação quando outra pessoa alterou o texto antes.

## Histórias de usuário

### Cadastro de processos

1. Como integrante do EP, quero cadastrar um processo com nome, setor, macroprocesso, tipo, origem, contexto e observações, para começar a acompanhar o seu mapeamento.
2. Como integrante do EP, quero que nome, setor e macroprocesso sejam obrigatórios, e contexto e observações opcionais.
3. Como integrante do EP, quero que o tipo venha marcado como "A classificar" e a origem como "Novo", para cadastrar rápido na identificação e decidir depois.
4. Como integrante do EP, quero escolher só setores e macroprocessos ativos ao cadastrar, para não ligar processo a cadastro extinto.
5. Como integrante do EP, quero que, se o setor escolhido ainda não for setor envolvido no macroprocesso, a tela me avise que ele será incluído e o banco o inclua ao salvar, com registro no histórico, para não precisar sair do cadastro do processo.
6. Como integrante do EP, quero que a plataforma recuse um nome de processo que já existe no mesmo setor, sem diferenciar maiúsculas e minúsculas, porque o nome entra no nome dos arquivos.
7. Como integrante do EP, quero poder usar o mesmo nome de processo em setores diferentes.
8. Como integrante do EP, quero cadastrar um subprocesso já indicando o processo pai, para registrar a estrutura de uma vez.
9. Como integrante do EP, quero que o subprocesso siga o macroprocesso do pai, sem poder escolher outro, para a estrutura ficar coerente.
10. Como integrante do EP, quero que o subprocesso possa ter um setor diferente do pai, e que esse setor seja incluído como setor envolvido no macroprocesso do pai se faltar.
11. Como integrante do EP, quero escolher como pai só processos do tipo "Processo", para não haver subprocesso de subprocesso nem pai "a classificar".
12. Como integrante do EP, quero editar nome, setor, macroprocesso, origem, contexto e observações de um processo a qualquer momento.
13. Como integrante do EP, quero mover um processo para outro macroprocesso na edição, com o setor incluído como envolvido no novo se faltar, e os subprocessos acompanhando o pai automaticamente.
14. Como integrante do EP, quero que o histórico guarde o "de → para" de cada campo editado, inclusive o macroprocesso.
15. Como integrante do EP, quero excluir um processo cadastrado por engano, depois de confirmar numa janela, e que o histórico guarde tudo o que ele tinha, inclusive as etapas.
16. Como integrante do EP, quero que o banco recuse excluir um processo que tem subprocessos e diga quantos são, para que nenhum subprocesso suma de carona.
17. Como integrante do EP, quero ver uma mensagem clara e os meus dados mantidos no formulário quando uma gravação falhar, para tentar de novo sem redigitar.

### Quadro e Lista

18. Como integrante do EP, quero ver no Quadro uma coluna por etapa, na ordem do catálogo, com os processos em andamento e suspensos na coluna da etapa atual, para enxergar o trabalho vivo.
19. Como integrante do EP, quero que o processo recém-cadastrado apareça direto na coluna Modelagem piloto, sem coluna de espera antes dela.
20. Como integrante do EP, quero que o cartão mostre o nome do processo, a sigla do setor (que não aparece quando o Quadro está agrupado por setor), o tipo (quando for subprocesso ou "a classificar") e o responsável da etapa atual (desde a parte 4, também a barra de progresso e os selos, histórias 141 em diante).
21. Como integrante do EP, quero ver os processos suspensos no Quadro com a pílula "Suspenso", para não esquecer o trabalho parado.
22. Como integrante do EP, quero que concluídos e cancelados saiam do Quadro e continuem na Lista.
23. Como integrante do EP, quero que o Quadro role para o lado quando houver mais colunas que a tela, com uma indicação de que há colunas fora da vista.
24. Como integrante do EP, quero ver na Lista todos os processos, com nome, tipo, setor, macroprocesso, etapa atual, responsável da etapa atual e situação.
25. Como integrante do EP, quero filtrar o Quadro e a Lista por setor, macroprocesso, etapa, tipo e responsável, e a Lista também por situação, para achar o que procuro.
26. Como integrante do EP, quero que os filtros fiquem no endereço da página, para recarregar ou compartilhar a mesma visão.
27. Como integrante do EP, quero ver na Lista, ao lado do subprocesso, o nome do processo pai.
28. Como integrante do EP, quero abrir o verso de um processo clicando no cartão ou na linha, com o quadro ou a lista escurecidos atrás (painel lateral até 2026-10-19).

### Andamento das etapas do processo

29. Como integrante do EP, quero ver no painel o caminho de etapas do processo, da Modelagem piloto em diante, cada uma com status, responsável, datas e nota.
30. Como integrante do EP, quero iniciar a etapa atual quando ela está pendente (a Modelagem piloto de um processo novo, ou depois de uma mudança no catálogo), com um clique e sem janela, para registrar que o trabalho nela começou. As demais etapas se iniciam sozinhas pelo avanço (histórias 89 em diante).
31. Como integrante do EP, quero que a plataforma recuse iniciar uma etapa enquanto a anterior não estiver resolvida (concluída, realizada anteriormente ou dispensada), explicando qual falta.
32. Como integrante do EP, quero iniciar a Modelagem piloto de um processo recém-cadastrado sem depender de nada do setor, porque identificação e sensibilização já foram feitas fora da plataforma.
33. Como integrante do EP, quero que cada processo tenha no máximo uma etapa em andamento.
34. Como integrante do EP, quero concluir a etapa em andamento e, na mesma janela, escolher quem fica com a próxima, que já se inicia (histórias 89 em diante).
35. Como integrante do EP, quero dispensar uma etapa opcional, com nota obrigatória, para registrar por que ela não será feita, e que a próxima já se inicie como no concluir.
36. Como integrante do EP, quero que a plataforma recuse dispensar uma etapa obrigatória.
37. Como integrante do EP, quero registrar qualquer etapa como "realizada anteriormente", com nota obrigatória, para os processos retomados que já fizeram parte do caminho fora da plataforma, e que a próxima já se inicie como no concluir.
38. Como integrante do EP, quero que a data de início e a de conclusão venham preenchidas com hoje e que eu possa corrigi-las na hora ou depois, para registrar quando o trabalho de fato aconteceu.
39. Como integrante do EP, quero que a plataforma recuse uma data no futuro e uma conclusão antes do início, mostrando a data recebida.
40. Como integrante do EP, quero voltar a uma etapa anterior, com motivo obrigatório: ela volta a "em andamento" e as seguintes já resolvidas voltam a "pendente", para refazer o trabalho quando algo mudou. Na mesma janela do motivo, quero escolher quem fica com a etapa reaberta, com o responsável atual dela já marcado.
41. Como integrante do EP, quero que o histórico guarde como cada etapa estava antes de voltar.
42. Como integrante do EP, quero escolher o responsável de qualquer etapa do processo entre os usuários ativos de perfil Administrador ou Integrante, e trocá-lo a qualquer momento.
43. Como integrante do EP, quero ver o responsável que foi desativado depois marcado como "Inativo" na etapa, sem poder escolhê-lo de novo.
44. Como integrante do EP, quero ver a etapa atual destacada no caminho, as resolvidas com ✓ e as futuras apagadas, como na identidade visual.

### Avanço e responsável (parte 2, 2026-10-18)

89. Como integrante do EP, quero que [Concluir] abra a janela "Quem fica com a próxima etapa?", com o título dizendo qual etapa se conclui e qual vem a seguir, para passar o trabalho adiante num gesto só.
90. Como integrante do EP, quero ver na janela os usuários ativos de perfil Administrador ou Integrante, cada um com o nome, e a opção "Ninguém por enquanto", para escolher quem segue ou deixar a etapa à espera.
91. Como integrante do EP, quero que a janela venha com o responsável que a próxima etapa já tem marcado e, se ela não tiver nenhum (ou ele não puder ser escolhido), comigo marcado, para confirmar com Enter no caso comum.
92. Como integrante do EP, quero que, ao confirmar, a etapa atual fique concluída e a próxima entre em andamento com a pessoa escolhida, com início hoje, tudo de uma vez, para o processo nunca ficar sem etapa em andamento por uma falha no meio.
93. Como integrante do EP, quero que, com "Ninguém por enquanto", a próxima etapa também entre em andamento, sem responsável, para alguém assumi-la depois.
94. Como integrante do EP, quero que "a próxima etapa" seja a primeira pendente depois da que resolvi, pulando as já resolvidas, para o avanço não reabrir o que já foi feito.
95. Como integrante do EP, quero que a próxima etapa opcional (Publicação) se inicie como qualquer outra, e que eu a dispense depois se ela não for feita.
96. Como integrante do EP, quero que, sem nenhuma etapa pendente depois da que resolvo, não haja janela de responsável, e que o processo fique concluído se todas as obrigatórias estiverem resolvidas.
97. Como integrante do EP, quero que as janelas de Dispensar e de Realizada anteriormente tragam, abaixo da nota, a mesma escolha de quem fica com a próxima etapa, para resolver e avançar num passo só.
98. Como integrante do EP, quero que Esc ou [Cancelar] feche a janela sem gravar nada: a etapa continua como estava.
99. Como integrante do EP, quero usar a janela só pelo teclado e com leitor de tela: o foco abre na opção marcada, as setas trocam de opção, Enter confirma e cada opção é lida com o nome da pessoa.
100. Como integrante do EP, quero ver no histórico dois registros do avanço, com o mesmo autor e a mesma hora: "Concluiu a etapa" (ou "Dispensou a etapa", ou "Registrou a etapa como realizada anteriormente") e "Iniciou a etapa", com o responsável, para saber quem passou o trabalho e para quem.
101. Como integrante do EP, quero [Assumir] numa etapa pendente ou em andamento que está sem responsável, para me pôr como responsável com um clique.
102. Como integrante do EP, quero continuar escolhendo e trocando o responsável de qualquer etapa pelo seletor, para qualquer integrante, como na história 42.
103. Como integrante do EP, quero que a plataforma não me deixe escolher como responsável da Revisão interna quem enviou a versão mais recente do processo (fora as versões históricas): a janela não mostra essa pessoa, o [Assumir] não aparece para ela, e o banco recusa a escolha pelo seletor ou fora da tela, porque ninguém revisa o próprio trabalho.
104. Como integrante do EP, quero que essa trava confira só o momento da escolha, para o revisor que corrige e envia uma versão nova continuar responsável pela Revisão interna.
105. Como integrante do EP, quero que, sem versão não histórica no processo, ninguém seja barrado da Revisão interna.
106. Como integrante do EP, quero que, quando quem conclui é o autor da versão mais recente e a próxima é a Revisão interna, a janela já venha com "Ninguém por enquanto" marcado (ou o responsável que a etapa já tem, se ele puder).
107. Como Consulta, quero ver quem é o responsável de cada etapa, sem [Assumir] nem a janela de avanço.

### Verso do cartão (parte 3, 2026-10-19)

108. Como integrante do EP, quero que o processo abra numa janela central larga, em duas colunas, para ver o processo inteiro de uma vez, sem rolar um painel estreito.
109. Como integrante do EP, quero que o endereço da página continue apontando para o processo aberto, para recarregar ou mandar o link a um colega e cair no mesmo processo.
110. Como integrante do EP, quero ver no cabeçalho a sigla do setor, o nome do processo, o macroprocesso (com o quadradinho da cor dele) e o tipo, para saber de relance de que processo se trata.
111. Como integrante do EP, quero que a situação apareça no cabeçalho só quando foge do normal (Suspenso, Cancelado, Concluído), para que a pílula chame a atenção quando importa.
112. Como integrante do EP, quero que o cartão "Agora", no alto da coluna esquerda, mostre a etapa atual, a posição dela no caminho ("etapa 2 de 6"), quem cuida dela e há quantos dias ela está em andamento, para saber o que há a fazer sem procurar.
113. Como integrante do EP, quero um único botão principal no Agora, com o nome da ação ([Iniciar Modelagem piloto], [Concluir Revisão interna]), para não ter dúvida sobre o próximo passo.
114. Como integrante do EP, quero Dispensar (só na etapa opcional) e Realizada anteriormente num "⋯" do Agora, para que as ações raras não disputem atenção com o botão principal.
115. Como integrante do EP, quero que o Concluir, o Dispensar e o Realizada anteriormente do Agora abram a mesma janela "Quem fica com a próxima etapa?" da parte 2.
116. Como integrante do EP, quero que, passados 15 dias na mesma etapa, o número de dias vire a pílula âmbar "{n} dias nesta etapa", com o mesmo texto do selo do cartão da parte 4, para notar o processo que está demorando.
117. Como integrante do EP, quero, na etapa atual sem responsável, o botão [Assumir] ao lado do principal, para me pôr como responsável com um clique.
118. Como integrante do EP, quero trocar o responsável da etapa atual pelo "Trocar" do Agora, numa lista suspensa em que eu apareço primeiro, com "(você)", e "Ninguém por enquanto" fica no fim, gravando ao escolher, sem confirmação.
119. Como integrante do EP, quero que o Agora de um processo suspenso ou cancelado mostre o motivo e [Retomar] como botão principal, para destravá-lo dali mesmo.
120. Como integrante do EP, quero que o Agora de um processo concluído diga "Concluído em {data}", para saber quando ele terminou.
121. Como integrante do EP, quero ver as etapas em linhas compactas, com um sinal para cada status (concluída, atual, pendente, opcional, dispensada, realizada anteriormente), a data e as iniciais de quem a resolveu, para ler o caminho de relance.
122. Como integrante do EP, quero clicar numa etapa e ver o detalhe dela abrir ali mesmo, embaixo da linha, com datas, nota, [Corrigir datas] e [Voltar a esta etapa], uma etapa aberta por vez, para não perder de vista em que ponto do caminho estou.
123. Como integrante do EP, quero ver a versão mais recente em destaque ("V2 · 02/10"), com os arquivos para baixar, e o que falta (a pílula "falta relatório" e o espaço tracejado [+ Acrescentar relatório] no lugar do relatório), para saber o que tapar e tapar no mesmo lugar.
124. Como integrante do EP, quero as versões anteriores recolhidas em "Versões anteriores (n)", [Enviar versão] visível e "Registrar versão histórica" num "⋯" da seção, para que o comum fique à mão e o raro não atrapalhe.
125. Como integrante do EP, quero ver e marcar a data da reunião de modelagem piloto na coluna direita, no próprio lugar, com "Alterar data" virando o campo de data.
126. Como integrante do EP, quero ver em "Sobre" o setor, o macroprocesso, o tipo, a origem, o contexto e as observações, com textos longos cortados em 4 linhas e "Ler mais", e sem os campos vazios.
127. Como integrante do EP, quero ver os subprocessos (com a etapa atual de cada um e a situação, quando não é em andamento) ou, num subprocesso, "Faz parte de" com o pai, e abrir qualquer um deles na mesma janela.
128. Como integrante do EP, quero o menu "⋯" do cabeçalho com Histórico, Editar e Reclassificar; Suspender (ou Retomar) e Cancelar; e Excluir em vermelho, separado no fim, para que o destrutivo fique longe do resto.
129. Como integrante do EP, quero que o Histórico abra dentro da janela, com "← Voltar ao processo", agrupado por dia ("Hoje", "Ontem", "12/10"), do mais novo para o mais antigo.
130. Como integrante do EP, quero que o Editar e o Novo processo abram dentro da mesma janela, numa coluna estreita, com os botões num rodapé fixo, e que Salvar ou Cancelar volte ao verso.
131. Como integrante do EP, quero que, depois de cadastrar um processo, a janela mostre o verso dele com o aviso "Processo cadastrado", porque o passo seguinte é quase sempre iniciar a Modelagem piloto ou marcar a reunião.
132. Como integrante do EP, quero que a janela abra já no tamanho final, com blocos cinza no formato das colunas enquanto carrega, para nada pular de lugar quando os dados chegam.
133. Como integrante do EP, quero ver, quando o processo não carrega, a mensagem de erro com [Tentar de novo], e, quando ele foi excluído, a mensagem que já existe com [Voltar].
134. Como integrante do EP, quero que, numa tela com menos de 900 px de largura, a janela ocupe a tela toda e vire uma coluna só, com o trabalho em cima e o contexto embaixo.
135. Como integrante do EP que usa o teclado, quero que o foco vá ao nome do processo ao abrir, que o Tab circule só dentro da janela, que Esc feche (no Histórico, o primeiro Esc volta ao processo) e que, ao fechar, o foco volte ao cartão ou à linha de onde vim.
136. Como integrante do EP que usa leitor de tela, quero que a janela seja anunciada como "Processo {nome}".
137. Como Consulta, quero ver o verso inteiro só para ler: o Agora sem botões e com a borda cinza ("Com Ana M. há 6 dias"), baixar arquivos, e no "⋯" só o Histórico.
138. Como integrante do EP, quero buscar na Lista pelo nome do processo, sem me preocupar com maiúsculas, acentos e espaços nas pontas, com o resultado filtrando enquanto digito, o trecho encontrado marcado no nome e um "×" para limpar.
139. Como integrante do EP, quero que a busca fique no endereço da página junto com os filtros, para recarregar ou compartilhar a mesma busca.
140. Como integrante do EP, quero que a busca sem resultado mostre "Nenhum processo com estes filtros." com [Limpar filtros], que limpa também a busca.

### Cartão do Quadro (parte 4, 2026-10-19)

141. Como integrante do EP, quero ver em cada cartão uma barra com um pedaço por etapa do caminho do processo, com as resolvidas preenchidas, a atual destacada e as seguintes vazias, para saber de relance onde o processo está.
142. Como integrante do EP, quero que etapa dispensada e etapa realizada anteriormente contem como resolvidas na barra, como no resto da plataforma.
143. Como integrante do EP, quero que a barra seja discreta, em cinza e azul, sem cor de alerta, porque mostra o normal.
144. Como integrante do EP, quero que um processo parado (a etapa atual em andamento há mais de 15 dias) ganhe o selo âmbar "{n} dias nesta etapa", o mesmo texto do Agora, para notar o que está demorando sem abrir cada processo.
145. Como integrante do EP, quero que o processo com até 15 dias na etapa não tenha selo de dias, para o cartão normal ficar limpo.
146. Como integrante do EP, quero que o processo suspenso e a etapa atual ainda não iniciada não ganhem o selo de dias, porque neles o tempo não está correndo.
147. Como integrante do EP, quero ver no cartão o rótulo da última versão ("V3", ou "V5F" na versão histórica), em texto neutro, para saber em que versão o processo está.
148. Como integrante do EP, quero que o processo sem versão não mostre nada no lugar da versão.
149. Como integrante do EP, quero o selo "Relatório pendente" quando a última versão não tem relatório e a etapa atual é a Revisão interna ou uma posterior, para notar o que não pode seguir sem relatório.
150. Como integrante do EP, quero que, antes da Revisão interna, faltar o relatório não vire selo, porque é o trabalho normal da etapa Relatório e modelagem técnica.
151. Como integrante do EP, quero o selo neutro "Sem responsável" quando a etapa atual não tem responsável, para achar o trabalho que alguém precisa assumir.
152. Como integrante do EP, quero o selo "Reunião {dd/mm}" (ou "Reunião hoje") quando a data da reunião é hoje ou futura, e nada depois que ela passou, para lembrar a reunião que vem aí.
153. Como integrante do EP, quero ver no cartão do processo pai quantos subprocessos ele tem ("1 subprocesso", "3 subprocessos"), sem contar os cancelados.
154. Como integrante do EP, quero os selos sempre na mesma ordem (dias, Relatório pendente, Sem responsável, Reunião, versão, subprocessos), com os alertas primeiro, quebrando de linha quando não couberem.
155. Como integrante do EP, quero arrastar o cartão de um processo com a etapa atual em andamento e soltá-lo na coluna da etapa para onde ele vai avançar, para concluir a etapa sem abrir o processo.
156. Como integrante do EP, quero que, enquanto arrasto, só a coluna de destino fique destacada, para saber onde soltar.
157. Como integrante do EP, quero que a coluna de destino seja a da primeira etapa pendente depois da atual, mesmo que não seja a vizinha, porque é para lá que o processo vai.
158. Como integrante do EP, quero que soltar o cartão na coluna de destino abra a mesma janela "Quem fica com a próxima etapa?" do [Concluir], e que confirmar conclua e avance como no verso.
159. Como integrante do EP, quero que cancelar a janela (Esc ou [Cancelar]) deixe o cartão onde estava, sem gravar nada.
160. Como integrante do EP, quero que soltar o cartão em outra coluna o devolva ao lugar, com o aviso curto "Solte o cartão na coluna {etapa}.", para entender por que nada aconteceu.
161. Como integrante do EP, quero que não se arraste o cartão do processo suspenso, o da etapa atual ainda não iniciada (ela se inicia pelo verso, para não perder a data de início) nem o da última etapa (sem coluna depois, ela se conclui pelo verso).
162. Como integrante do EP que usa o teclado, quero concluir pela tecla Enter no cartão e pelo [Concluir] do Agora, sem precisar arrastar.
163. Como integrante do EP, quero que a falha na gravação ao soltar o cartão mostre a mensagem de erro de gravação e deixe o cartão e as etapas como estavam.
164. Como integrante do EP, quero escolher "Agrupar por: Etapa | Responsável" no Quadro, para ver o trabalho por pessoa.
165. Como integrante do EP, quero, agrupado por responsável, uma coluna por pessoa que tem algum cartão (depois dos filtros), em ordem alfabética, e a coluna "Sem responsável" no fim.
166. Como integrante do EP, quero que a coluna de um responsável que foi desativado apareça marcada com a pílula "Inativo".
167. Como integrante do EP, quero que, agrupado por responsável, o cartão mostre o nome da etapa atual no lugar da foto, e que não haja arrastar.
168. Como integrante do EP, quero que o agrupamento fique no endereço da página, como os filtros, para voltar, recarregar ou compartilhar a mesma visão.
169. Como integrante do EP, quero o botão "Só os meus", que mostra só os processos em que sou o responsável da etapa atual, com um clique, e desligá-lo com outro.
170. Como integrante do EP, quero que "Só os meus" seja o mesmo que me escolher no filtro Responsável, para as duas formas nunca se contradizerem.
171. Como integrante do EP, quero que "Só os meus" sem nenhum cartão mostre "Nenhum processo com você agora." com [Ver todos], que desliga o filtro.
172. Como Consulta, quero ver a barra, os selos e o "Agrupar por", sem "Só os meus" e sem arrastar.

### Anotações do processo (2026-10-23)

173. Como integrante do EP, quero um bloco "Anotações" no alto da coluna direita do verso, acima da Reunião, para registrar o que a equipe precisa lembrar sobre o processo sem procurar em outro lugar.
174. Como integrante do EP, quero que cada processo tenha um texto único de anotações, compartilhado pela equipe, para todos lerem e completarem o mesmo bloco.
175. Como integrante do EP, quero que o subprocesso tenha as suas próprias Anotações, separadas das do pai, porque cada um anda no seu ritmo.
176. Como integrante do EP, quero escrever direto no campo, sem botão de salvar, e que o texto se grave cerca de 1 segundo depois que eu paro de digitar, para não perder nada nem ter um passo a mais.
177. Como integrante do EP, quero que o texto se grave também quando saio do campo, para o que escrevi por último não ficar para trás.
178. Como integrante do EP, quero ver "Salvando…" ao lado do título enquanto grava e "Salvo" quando terminou, para saber que posso fechar a janela.
179. Como integrante do EP, quero que, se a gravação falhar (inclusive sem conexão), apareça "Não foi possível salvar. Seu texto continua aqui", o texto fique no campo e a plataforma tente de novo na minha próxima pausa, para não precisar redigitar.
180. Como integrante do EP, quero que a plataforma recuse gravar por cima de uma alteração que outra pessoa fez enquanto eu escrevia, com o aviso "Outra pessoa alterou as anotações enquanto você escrevia", para que ninguém apague sem querer o texto do colega, já que não há histórico para recuperar.
181. Como integrante do EP, quero que, nesse conflito, o meu texto continue no campo para eu copiar, e que o botão "Ver o texto atual" troque o campo pelo texto gravado, para eu juntar as duas versões.
182. Como integrante do EP, quero que, no conflito, a plataforma pare de tentar gravar até eu clicar em "Ver o texto atual", para não insistir numa gravação que vai ser recusada.
183. Como integrante do EP, quero ver abaixo do campo, discreto, "Alterado por {nome} em {dd/mm}, {hh:mm}", para saber quem mexeu por último e quando.
184. Como integrante do EP, quero que, sem nenhuma anotação gravada no processo, a linha "Alterado por" não apareça.
185. Como integrante do EP, quero ver no campo vazio a dica "Escreva aqui as anotações do processo", para entender para que serve o bloco.
186. Como integrante do EP, quero escrever até 2.000 caracteres, e ver a contagem só quando estiver perto do limite, para o bloco ficar limpo no uso comum.
187. Como integrante do EP, quero que o campo cresça com o texto até uma altura máxima e depois role por dentro, para ler textos curtos sem rolar e os longos sem empurrar a janela.
188. Como integrante do EP, quero que fechar o verso (pelo botão, por Esc ou abrindo o pai ou um subprocesso) com texto ainda não gravado grave na hora e, se a gravação falhar ou houver conflito, peça confirmação antes de fechar, para eu não perder o que escrevi.
189. Como integrante do EP, quero que fechar a aba ou recarregar a página com texto ainda não gravado mostre o aviso do navegador, pelo mesmo motivo.
190. Como integrante do EP, quero escrever nas Anotações de processos em andamento, suspensos, cancelados e concluídos, porque é justamente no processo parado que a equipe precisa anotar o porquê.
191. Como integrante do EP, quero que, no processo arquivado, as Anotações apareçam só para ler, com a linha "Alterado por", porque o arquivado não se edita.
192. Como integrante do EP, quero que alterar as Anotações não gere evento no Histórico do processo, para o histórico não ficar tomado de rascunhos (ADR 0021).
193. Como integrante do EP, quero que as Anotações fiquem só no verso: fora do cartão do Quadro, da busca da Lista e das planilhas dos dashboards, porque o texto livre pode trazer nome e e-mail de pessoas dos setores.
194. Como integrante do EP, quero que as Anotações continuem no processo depois de uma reclassificação, como tudo o que ele já tem.
195. Como integrante do EP que usa o teclado ou leitor de tela, quero que o campo tenha o nome "Anotações", que "Salvando…" e "Salvo" sejam anunciados sem roubar o foco, e que o aviso de falha e o de conflito sejam anunciados quando aparecem.
196. Como Consulta, quero ler as Anotações e a linha "Alterado por", sem campo editável, e ver "Sem anotações." quando não há texto.
197. Como responsável pela plataforma, quero que o banco recuse a gravação das Anotações vinda de Consulta, de usuário inativo e de visitante sem login, mesmo fora da tela, e que inativo e visitante não leiam as Anotações.
198. Como responsável pela plataforma, quero que o nome e a hora da última alteração sejam gravados pelo banco, para ninguém se passar por outra pessoa nem mudar a hora fora da tela.
199. Como integrante do EP, quero que um processo cadastrado agora mostre o bloco vazio, com a dica, pronto para escrever.

### Etapas do setor e responsáveis do setor (retirados em 2026-10-18)

45. Como integrante do EP, quero que a tela do setor e o painel do processo não mostrem mais etapas do setor nem responsáveis do setor, porque esse trabalho já foi feito para todos os setores, fora da plataforma (ADR 0013).
46. Como usuário, quero que os registros antigos de etapas do setor e de responsáveis do setor continuem no histórico, numa linha simples ("Registro de etapa do setor (recurso retirado da plataforma)", "Registro de responsável do setor (recurso retirado da plataforma)"), porque o histórico nunca se apaga.
47. Como usuário, quero que os filtros do Quadro e da Lista não ofereçam mais "Aguardando o setor".

### Situação do processo

53. Como integrante do EP, quero suspender um processo, com motivo obrigatório, para registrar que o trabalho parou.
54. Como integrante do EP, quero cancelar um processo, com motivo obrigatório, para registrar que ele não será mapeado.
55. Como integrante do EP, quero retomar um processo suspenso ou cancelado, com motivo obrigatório.
56. Como integrante do EP, quero que, com o processo suspenso ou cancelado, nenhuma etapa possa ser alterada, e que a tela explique por quê.
57. Como integrante do EP, quero que o processo apareça como "Concluído" sozinho quando todas as etapas obrigatórias estiverem resolvidas, sem ninguém precisar marcar.
58. Como integrante do EP, quero que voltar uma etapa de um processo concluído o tire de concluído.
59. Como integrante do EP, quero ver no painel o motivo da suspensão ou do cancelamento.

### Reclassificação

60. Como integrante do EP, quero transformar um processo em subprocesso, informando o pai e o motivo, para corrigir a estrutura sem perder nada.
61. Como integrante do EP, quero transformar um subprocesso em processo, com motivo.
62. Como integrante do EP, quero definir o tipo de um item "a classificar", com motivo.
63. Como integrante do EP, quero que o item reclassificado continue o mesmo, com as suas etapas e tudo o que já tem.
64. Como integrante do EP, quero que, ao virar subprocesso, o item passe para o macroprocesso do pai e que a tela me avise antes de confirmar quando o macroprocesso mudar.
65. Como integrante do EP, quero que, ao virar subprocesso, o setor do item seja incluído como setor envolvido no macroprocesso do pai se faltar.
66. Como integrante do EP, quero que a plataforma recuse transformar em subprocesso um processo que tem subprocessos, pedindo que eles sejam reclassificados antes.
67. Como integrante do EP, quero que o histórico registre cada reclassificação com quem, quando, de quê para quê e o motivo.

### Catálogo de etapas

68. Como administrador, quero ver o catálogo de etapas em ordem, com nome, obrigatória ou opcional, e situação, sem o campo "Nível".
69. Como administrador, quero que o catálogo tenha as 6 etapas do processo, numeradas de 1 a 6, com a primeira chamada Modelagem piloto, as 1 a 5 obrigatórias e a 6 (Publicação) opcional.
70. Como administrador, quero acrescentar uma etapa, escolhendo a posição, para mudar o caminho do trabalho sem mudar o código.
71. Como administrador, quero que uma etapa nova entre como "pendente" nos processos em andamento e suspensos, e não nos concluídos e cancelados (ADR 0004).
72. Como administrador, quero mudar o nome e a ordem de uma etapa, e marcá-la como obrigatória ou opcional.
73. (Retirada em 2026-10-18: não há mais etapas do setor para vir antes.)
74. Como administrador, quero desativar uma etapa: ela some de onde estava pendente e continua onde já foi usada; e reativá-la, voltando como pendente onde faltar.
75. Como administrador, quero excluir uma etapa que nunca foi usada, depois de confirmar, e que a plataforma recuse excluir uma etapa já usada, sugerindo desativá-la.
76. (Retirada em 2026-10-18: o catálogo não tem mais nível.)
77. Como integrante do EP ou Consulta, quero que o catálogo não apareça para mim na Administração.

### Histórico

78. Como integrante do EP, quero ver no Histórico do processo (aba do painel até 2026-10-19; desde então, pelo menu "⋯" do verso) todas as alterações do processo e das etapas dele, das mais recentes para as mais antigas, com data e hora, quem fez, o que fez, o antes e depois e o motivo quando houver.
79. (Retirada em 2026-10-18: os eventos antigos de etapas e responsáveis do setor aparecem na linha simples da história 46.)
80. Como integrante do EP, quero que um processo excluído continue aparecendo no histórico com o que tinha.
81. Como administrador, quero que as mudanças no catálogo de etapas fiquem no histórico.

### Perfis

82. Como administrador, quero ter as mesmas permissões do Integrante do EP em processos e etapas, e ser o único a mexer no catálogo.
83. Como usuário de perfil Consulta, quero ver o Quadro, a Lista, os painéis e o histórico, sem nenhum botão de alteração.
84. Como responsável pela plataforma, quero que o banco recuse qualquer alteração feita por um usuário de perfil Consulta, mesmo fora da tela.
85. Como responsável pela plataforma, quero que um visitante sem login e um usuário inativo não leiam nada de processos, etapas, catálogo e o histórico deles.

### Efeitos nos cadastros

86. Como integrante do EP, quero que o banco recuse excluir um setor ou macroprocesso com processo ligado e diga quantos processos são.
87. Como integrante do EP, quero que o banco recuse tirar de um macroprocesso um setor que tem processos nele e diga quantos são.
88. Como integrante do EP, quero ver na tela do setor a lista dos processos dele, e abrir o verso de cada um (na Lista filtrada pelo setor, desde 2026-10-19).

## Decisões de implementação

### Interface

- **Terceiro módulo injetado:** um módulo de processos, separado dos de acesso e de cadastros. Operações:
  - listar processos com etapa atual, responsável dela e situação calculada (desde a parte 4, também o status e o início da etapa atual, o caminho de etapas com o status de cada uma, a última versão com a marca de relatório, a contagem de subprocessos não cancelados e se o responsável está ativo);
  - ler um processo com a data da reunião, o caminho de etapas, os subprocessos ou o pai, e o histórico;
  - criar, editar e excluir processo, e marcar a data da reunião (spec de `reunioes`);
  - iniciar uma etapa;
  - concluir, dispensar e registrar como realizada anteriormente a etapa atual, levando o responsável da próxima (ou nenhum), numa chamada só (desde 2026-10-18);
  - corrigir as datas de uma etapa, mudar o responsável de uma etapa ([Assumir] é mudar para si mesmo) e voltar a uma etapa, levando o responsável da etapa reaberta (desde 2026-10-18);
  - suspender, cancelar, retomar e reclassificar um processo;
  - ler os processos de um setor;
  - listar e manter o catálogo de etapas;
  - ler as Anotações de um processo (o texto, o nome de quem alterou por último e quando), à parte da leitura do processo, porque elas ficam fora da view (desde 2026-10-23);
  - gravar as Anotações, levando o texto novo e o texto que a pessoa tinha quando começou a escrever; devolve o texto gravado com o novo "alterado por" e "em", ou a recusa de conflito, distinta das outras falhas, para a tela mostrar o aviso próprio (desde 2026-10-23).

  Saem em 2026-10-18: ler e alterar as etapas do setor, e ler, criar, editar e excluir responsáveis do setor.

  O aplicativo recebe o módulo por injeção; nos testes, uma implementação falsa nomeada. A falha chega como erro cuja mensagem é o motivo em português, como nos outros módulos.
- **Navegação no endereço:**
  - `#/processos` para o Quadro e `#/processos/lista` para a Lista, com os filtros no endereço;
  - `#/processos/<id>` abre o verso do cartão por cima da visão de onde veio, e `#/processos/novo` o Novo processo na mesma janela (desde 2026-10-19; antes, o painel lateral);
  - a busca da Lista fica no endereço como os filtros (parâmetro `busca`, desde 2026-10-19);
  - o agrupamento do Quadro fica no endereço (parâmetro `agrupar=responsavel`; sem ele, por etapa), desde a parte 4; "Só os meus" não tem parâmetro próprio: é o filtro `responsavel` com o id de quem está na tela;
  - Histórico e Editar são estados da janela aberta, sem endereço próprio: recarregar a página volta ao verso;
  - o catálogo fica numa aba da Administração.
- **Quadro:**
  - **Colunas:** uma por etapa ativa, na ordem do catálogo. A coluna de uma etapa desativada aparece enquanto houver processo nela. A coluna "Aguardando o setor" saiu em 2026-10-18.
  - **Cartões:** os processos de situação guardada "em andamento" ou "suspenso" que não estão concluídos. O cartão traz:
    - o quadradinho da sigla;
    - o nome;
    - o macroprocesso;
    - a pílula de tipo (só "Subprocesso" e "A classificar");
    - a pílula "Suspenso";
    - o avatar do responsável da etapa atual;
    - desde a parte 4 (2026-10-19), a barra de progresso e os selos, descritos abaixo.
  - **Ordem na coluna:** pelo nome do processo.
  - **Barra de progresso** (parte 4): uma linha fina de pedaços iguais, um por etapa do caminho do processo, na ordem do catálogo; resolvida (concluída, realizada anteriormente, dispensada) preenchida em cinza-escuro, a atual em `azul`, as seguintes em cinza-claro. Sempre visível, inclusive no suspenso. Nome acessível: "Etapa {n} de {total}: {etapa atual}".
  - **Selos** (parte 4), só quando há algo a dizer, nesta ordem, quebrando de linha:
    1. **Processo parado:** pílula âmbar "{n} dias nesta etapa" quando a etapa atual está em andamento há mais de 15 dias (a mesma conta e o mesmo limite do Agora); nunca no suspenso nem na etapa atual pendente;
    2. **Relatório pendente:** pílula âmbar quando a última versão não histórica não tem relatório e a etapa atual é a Revisão interna ou posterior na ordem do catálogo (posição comparada pelo código `revisao_interna`);
    3. **Sem responsável:** pílula neutra quando a etapa atual não tem responsável (não aparece agrupado por responsável, porque a coluna já diz);
    4. **Reunião:** pílula neutra com a barrinha amarela de reunião, "Reunião {dd/mm}" ou "Reunião hoje", quando a data da reunião é hoje ou futura;
    5. **Versão:** texto mono neutro, sem fundo, com o rótulo da última versão ("V3", "V5F"), quando há versão;
    6. **Subprocessos:** texto neutro "{n} subprocesso(s)", no processo pai com pelo menos um subprocesso não cancelado.
  - **Arrastar para concluir** (parte 4), com o arrastar nativo do navegador, sem biblioteca:
    - só Administrador e Integrante; só cartão com a etapa atual em andamento, de processo em andamento, com etapa pendente depois da atual; nos demais, o cartão não é arrastável;
    - **coluna de destino:** a da primeira etapa pendente depois da atual; durante o arrastar, só ela recebe o realce (fundo `azul-claro`, borda contínua em `azul`, sombra interna), e as demais colunas esmaecem;
    - soltar no destino abre a janela de avanço da parte 2, como o [Concluir] do Agora, com as mesmas opções, a mesma opção marcada e a mesma trava do autor; confirmar grava pela mesma função de avanço; Esc ou [Cancelar] não grava;
    - soltar em outra coluna devolve o cartão e mostra o aviso "Solte o cartão na coluna {etapa}.";
    - em tela de toque o arrastar não acontece (o arrastar nativo não funciona por toque, e isso é o desejado: rolar o Quadro não conclui nada); o caminho é o verso;
    - o cartão continua link: clicar ou Enter abre o verso. O caminho pelo teclado é esse, sem atalho novo;
    - ao confirmar, o Quadro recarrega e o cartão aparece na coluna nova; a falha mostra a mensagem de erro de gravação e nada muda.
  - **Agrupar por** (parte 4): controle "Agrupar por: Etapa | Responsável" na barra do Quadro, para todos os perfis.
    - **Responsável:** uma coluna por pessoa que é responsável da etapa atual de algum cartão visível (depois dos filtros), em ordem alfabética, com a pílula "Inativo" quando a pessoa foi desativada, e a coluna "Sem responsável" no fim (só se houver cartão nela); a contagem no título como nas colunas de etapa;
    - o cartão, nesse modo, mostra o nome da etapa atual no lugar do avatar; sem arrastar;
    - o filtro de etapa continua valendo nos dois modos.
  - **Só os meus** (parte 4): botão de liga e desliga na barra do Quadro, só para Administrador e Integrante, com o estado anunciado (aria-pressed). Ligado, põe o filtro Responsável em quem está na tela; desligado, limpa esse filtro. Escolher a si mesmo no filtro Responsável liga o botão; escolher outra pessoa o desliga.
  - **Largura** (decidido pelo usuário em 2026-10-14): o Quadro ocupa toda a largura à direita da faixa lateral, sem largura máxima (diferente dos 1280px de Cadastros e Administração); cada coluna tem largura fixa de 310px (token `--largura-coluna-quadro`, escala da interface de 2026-10-14; antes cerca de 272px), e o que não cabe na tela fica na rolagem lateral.
  - **Altura** (bug de 2026-10-27): o Quadro ocupa a altura toda da área de trabalho, e a coluna recebe o cartão em qualquer altura, não só sobre o título. A barra de rolagem lateral fica na base da tela; a rolagem vertical passa a ser **dentro de cada coluna** (os cartões rolam, o título fica), e a página só rola em janela muito baixa (coluna com mínimo de 320px).
- **Lista:**
  - **Colunas:** nome (com "↳ pai" no subprocesso), tipo, setor, macroprocesso, etapa atual, responsável e situação em pílula.
  - **Ordem:** pela sigla do setor e pelo nome.
  - **Filtros:** setor, macroprocesso, etapa atual (só as etapas do catálogo, sem "Aguardando o setor"), tipo, responsável e situação (todas as situações). O Quadro usa os mesmos filtros, menos situação. Um endereço antigo com o filtro "Aguardando o setor" é tratado como sem filtro de etapa.
  - **Busca** (desde 2026-10-19, só na Lista; o Quadro fica sem busca):
    - campo no começo da barra, antes dos filtros, com lupa, o texto de exemplo "Buscar pelo nome" e um "×" para limpar;
    - procura só no nome do processo, como trecho, sem diferenciar maiúsculas, minúsculas e acentos;
    - filtra enquanto se digita e soma-se aos filtros;
    - o trecho encontrado aparece marcado em amarelo claro no nome;
    - sem resultado, vale o estado "Nenhum processo com estes filtros." com [Limpar filtros], que limpa também a busca.
- **Formulário do processo** (cadastrar e editar, dentro da janela do verso desde 2026-10-19; ver "Novo processo e Editar"):
  - **Campos:** nome, setor (ativos), macroprocesso (ativos), tipo (só no cadastro: Processo, Subprocesso ou A classificar), processo pai (só para Subprocesso, entre os processos do tipo Processo), origem (Novo ou Retomado), contexto e observações.
  - **Subprocesso:** o macroprocesso aparece fixo, o do pai.
  - **Setor fora do macroprocesso:** quando o setor não é envolvido no macroprocesso, o aviso amarelo "O setor {SIGLA} ainda não está no macroprocesso {nome}; ele será incluído ao salvar." aparece abaixo dos campos.
  - **Tipo na edição:** a edição não muda o tipo; a mudança de tipo é só por Reclassificar.
- **Verso do cartão** (desde 2026-10-19, no lugar do painel lateral de 520 px com as abas Detalhes e Histórico). Princípios de desenho: uma só coisa acesa (o Agora, com a linha azul de 2 px e o único botão principal da janela); o normal fica quieto, e só o que foge do normal ganha cor; trabalho à esquerda, contexto à direita.
  - **Janela:**
    - central, até cerca de 880 px de largura, com 60% para a coluna esquerda (fundo `folha`) e 40% para a direita (fundo levemente cinza, separada por uma linha fina);
    - até 90% da altura da tela; uma só rolagem, da janela inteira, com o cabeçalho fixo no topo;
    - o Quadro ou a Lista atrás ficam escurecidos e inertes;
    - entra com um aparecimento suave de cerca de 150 ms, desligado quando o computador pede menos movimento;
    - abaixo de 900 px de largura, ocupa a tela toda e vira uma coluna só (esquerda em cima, direita embaixo);
    - pai e subprocessos abrem na mesma janela, trocando o conteúdo e o endereço; Esc fecha tudo.
  - **Cabeçalho:** quadradinho da sigla (mono); o nome do processo (19 px, 700); embaixo, em texto secundário, o quadradinho da cor do macroprocesso, o nome dele e o tipo ("Processo", "Subprocesso" ou "A classificar"); a pílula de situação só para Suspenso (âmbar), Cancelado (cinza) e Concluído (verde), sem pílula em andamento; o botão "⋯" do processo e o botão fechar.
  - **Menu "⋯" do processo,** em três grupos separados por linha fina:
    - Histórico · Editar · Reclassificar;
    - Suspender (ou Retomar, no suspenso e no cancelado) · Cancelar;
    - Excluir, em vermelho.

    A Consulta vê só Histórico. As janelas de motivo, de reclassificação e a confirmação de excluir são as que já existem.
  - **Coluna esquerda — Agora** (cartão branco com a borda de 2 px em `azul`):
    - rótulo "Agora · etapa {n} de {total}", o nome da etapa atual e a linha do responsável: avatar e nome, "há {n} dias" (o início da etapa até hoje) e o link "Trocar";
    - **dias na etapa:** número em cinza até 15 dias; acima de 15, a pílula âmbar "{n} dias nesta etapa", o mesmo texto e o mesmo limite do selo do cartão da parte 4;
    - **botão principal**, com o nome da ação e da etapa: [Iniciar {etapa}] quando a etapa atual está pendente (um clique, sem janela); [Concluir {etapa}] quando em andamento (abre a janela de avanço; sem etapa pendente depois, conclui direto);
    - **"⋯" do Agora:** Dispensar (só na etapa opcional) e Realizada anteriormente, com as janelas da parte 2;
    - **sem responsável:** no lugar do avatar, "Sem responsável", e o botão secundário [Assumir] ao lado do principal (mesma regra da parte 2: não aparece na Revisão interna para quem enviou a versão mais recente não histórica);
    - **"Trocar":** lista suspensa no próprio Agora, com quem está na tela primeiro ("{nome} (você)"), os demais integrantes ativos e "Ninguém por enquanto" no fim; a mesma trava do autor; grava ao escolher, sem confirmação; a falha mostra a mensagem de erro de gravação e deixa o responsável como estava;
    - **suspenso:** fundo âmbar claro, "Suspenso: {motivo}" e [Retomar] como botão principal;
    - **cancelado:** fundo cinza claro, "Cancelado: {motivo}" e [Retomar];
    - **concluído:** fundo verde claro e "Concluído em {data}" (a data da última etapa obrigatória resolvida); a parte 5 acrescenta a versão aprovada e o E-protocolo;
    - **Consulta:** o mesmo cartão sem botões nem "Trocar", com a borda cinza em vez de azul e a frase "Com {nome} há {n} dias" (ou "Sem responsável").
  - **Coluna esquerda — Etapas** (lista só de leitura, uma linha compacta por etapa):
    - concluída: ✓ verde; atual: ponto azul, com a linha em `azul-claro` e o nome em 600; pendente: círculo cinza; opcional ainda pendente: círculo tracejado e o selo "opcional"; dispensada: traço cinza, nome riscado de leve e o selo "dispensada"; realizada anteriormente: ✓ cinza e o selo "anterior";
    - à direita da linha, a data (mono; na atual, "desde {data}") e as iniciais de quem resolveu (na atual, do responsável);
    - **detalhe da etapa:** clicar na linha abre uma gaveta logo abaixo dela, uma por vez, com datas de início e de conclusão, nota, responsável, [Corrigir datas] (formulário que já existe) e, nas resolvidas anteriores à atual, [Voltar a esta etapa] (janela da parte 2). Nas pendentes depois da atual, o responsável tem o mesmo "Trocar" do Agora e, sem ninguém, [Assumir], para manter as histórias 42, 101 e 102. A etapa atual, aberta, mostra só datas e nota: as ações e o responsável dela ficam no Agora;
    - processo suspenso ou cancelado: a gaveta mostra só a leitura, sem botões.
  - **Coluna esquerda — Arquivos:** a mesma seção da funcionalidade `documentos-versoes`, com outra apresentação:
    - **linha de destaque** da versão mais recente: número (mono, 600), data (mono) e, quando falta algo, a pílula âmbar "falta relatório";
    - embaixo, um botão para cada arquivo dela ("Fluxograma .bpmn", "Imagem .png", "Relatório .docx", com a barrinha de cor do tipo e o ícone de baixar; desde 2026-10-20, na ordem .png, .bpm, relatório, .bpmn, ADR 0016 e seção "Mudança de 2026-10-20" da spec de `documentos-versoes`);
    - o relatório que falta aparece como espaço tracejado [+ Acrescentar relatório] no lugar onde ele estaria (só para quem pode enviar);
    - [Enviar versão] no título da seção; "Registrar versão histórica" num "⋯" da seção; Substituir no "⋯" de cada arquivo, como já é;
    - as versões anteriores recolhidas em "Versões anteriores ({n})", que abre a lista que já existe;
    - os formulários de envio abrem no lugar da seção, como hoje.
  - **Coluna direita — Anotações** (desde 2026-10-23; sabatina-anotacoes e ADR 0021), o primeiro bloco da coluna, acima da Reunião:
    - título "Anotações" e, à direita dele, o estado da gravação: nada, "Salvando…", "Salvo", ou o aviso de falha;
    - **campo:** uma área de texto com o nome acessível "Anotações", com a dica "Escreva aqui as anotações do processo" quando vazia; cresce com o texto até cerca de 12 linhas e depois rola por dentro; aceita até 2.000 caracteres (o próprio campo não deixa passar disso, inclusive ao colar);
    - **contagem:** "{n} de 2.000" abaixo do campo, só a partir de 1.800 caracteres;
    - **última alteração:** abaixo do campo, em texto secundário, "Alterado por {nome} em {dd/mm}, {hh:mm}", no horário de Brasília; não aparece enquanto o processo nunca teve anotação gravada;
    - **salvamento automático:** grava cerca de 1 segundo depois da última tecla e ao sair do campo, se o texto mudou desde a última gravação; uma gravação por vez (o que se digitar durante uma gravação vai na seguinte); o texto que segue para o banco como "o que a pessoa tinha" é o último lido ou gravado com sucesso nesta janela;
    - **falha (inclusive sem conexão):** o estado vira "Não foi possível salvar. Seu texto continua aqui" (vermelho, ADR 0003); o texto fica no campo; a próxima pausa ou a saída do campo tentam de novo;
    - **conflito** (o texto no banco não é mais o que a pessoa tinha): aviso amarelo "Outra pessoa alterou as anotações enquanto você escrevia" com o botão "Ver o texto atual"; o campo continua com o texto de quem escrevia, editável para copiar; o salvamento automático para até a pessoa clicar no botão, que lê de novo e troca o campo pelo texto gravado, com a linha "Alterado por" de quem gravou;
    - **ao fechar** o verso, ao abrir o pai ou um subprocesso na mesma janela, ou ao trocar o conteúdo pelo Histórico ou pelo Editar, com texto ainda não gravado: grava na hora; se gravar, segue; se falhar ou estiver em conflito, a confirmação simples (ADR 0003) "As anotações não foram salvas. Sair mesmo assim?" [Sair sem salvar] [Continuar escrevendo]. Fechar a aba ou recarregar com texto não gravado aciona o aviso nativo do navegador;
    - **somente leitura** para a Consulta e, para todos, no processo arquivado: o texto em parágrafo (quebras de linha mantidas), "Sem anotações." quando vazio, e a linha "Alterado por" quando há;
    - **leitor de tela:** "Salvando…" e "Salvo" numa região anunciada sem interromper; a falha e o conflito anunciados quando aparecem;
    - o texto é gravado como foi digitado; só espaços e quebras de linha contam como vazio e gravam nada (nulo).
  - **Coluna direita — Reunião:** rótulo "Reunião", a data (mono, com a barrinha amarela de reunião) e "· próxima" ou "· realizada"; sem data, "Ainda não marcada". Para quem pode alterar, "Marcar data" (ou "Alterar data") vira ali mesmo o campo de data com [Salvar], [Remover] e [Cancelar] (o comportamento da spec de `reunioes`).
  - **Coluna direita — Sobre:** setor, macroprocesso, tipo, origem, contexto e observações, cada um com o rótulo pequeno em cinza acima do valor; contexto e observações longos mostram até 4 linhas e "Ler mais" (que vira "Ler menos"); campo vazio não aparece.
  - **Coluna direita — Estrutura:** "Subprocessos ({n})", cada um com o nome em link e, embaixo em cinza, a etapa atual e a situação quando não é em andamento; no subprocesso, "Faz parte de" com o pai do mesmo jeito; sem subprocessos nem pai, a seção não aparece.
  - **Histórico** (pelo "⋯"): substitui o conteúdo da janela, que mantém a largura, com "← Voltar ao processo" e o título "Histórico" no topo; formato na seção "Histórico" abaixo. Esc volta ao verso; o segundo Esc fecha a janela. O Esc no Editar também volta ao verso, sem gravar (decisão de 2026-10-19: fechar a janela inteira perderia o que foi digitado).
  - **Novo processo e Editar:** o formulário do processo ocupa a janela, que encolhe para uma coluna de cerca de 560 px; cabeçalho "Novo processo" ou "Editar {nome}"; rodapé fixo com [Cadastrar] ou [Salvar] (principal) e [Cancelar]. Editar: Salvar ou Cancelar volta ao verso. Novo processo: Cancelar e Esc fecham a janela; ao cadastrar, a janela se alarga e mostra o verso do processo criado (o endereço passa a ser o dele), com o aviso "Processo cadastrado", e o Quadro ou a Lista atrás recarregam.
  - **Teclado e leitor de tela:** a janela é um diálogo anunciado como "Processo {nome}" (ou "Novo processo"); ao abrir, o foco vai ao nome do processo; o Tab circula só dentro da janela; Esc fecha (veja Histórico); ao fechar, o foco volta ao cartão (Quadro) ou à linha (Lista) de origem; menus e gavetas abrem e fecham pelo teclado, com o estado anunciado.
- **Janelas com campo obrigatório** (a mesma janela nativa do ADR 0003, com um campo de texto):
  - **Nota:** em Dispensar e Realizada anteriormente.
  - **Motivo:** em Suspender, Cancelar, Retomar, Voltar e Reclassificar.
  - **Botões:** o de confirmar tem o verbo da ação e fica desabilitado com o campo vazio; o foco abre no campo e Esc fecha sem gravar.
- **Janela de avanço** (desde 2026-10-18; a mesma janela nativa do ADR 0003):
  - **Quando abre:** em [Concluir], e dentro das janelas de Dispensar e Realizada anteriormente, abaixo da nota, sempre que há etapa pendente depois da que se resolve. Sem pendente depois, Concluir grava direto, e Dispensar e Realizada anteriormente mostram só a nota.
  - **Título:** "Concluir {etapa} e iniciar {próxima}" (com "Dispensar" ou "Registrar … como realizada anteriormente" nas outras ações).
  - **Pergunta e opções:** "Quem fica com a próxima etapa?", em botões de rádio: cada usuário ativo Administrador ou Integrante pelo nome, e "Ninguém por enquanto" por último. Quando a próxima é a Revisão interna, o autor da versão mais recente não histórica não aparece. Se a lista de usuários ainda não chegou (ou a leitura falhou), a janela oferece só "Ninguém por enquanto". Para a tela esconder esse autor, o processo lido traz a versão mais recente não histórica (número e autor); a proteção é a do banco, a tela só poupa a recusa.
  - **Marcado ao abrir:** o responsável que a próxima já tem, se ele pode ser escolhido; senão, quem está na tela, se pode; senão, "Ninguém por enquanto".
  - **Teclado e leitor de tela:** o grupo de rádios tem a pergunta como nome; o foco abre na opção marcada (na nota, quando há nota); as setas trocam de opção; Enter confirma; Esc e [Cancelar] fecham sem gravar.
  - **Botão de confirmar:** "Concluir e iniciar {próxima}" (ou "Dispensar e iniciar {próxima}", "Registrar e iniciar {próxima}"); com nota, desabilitado enquanto ela estiver vazia.
  - **Voltar:** a janela do motivo ganha "Quem fica com esta etapa?", com as mesmas opções e a mesma trava, e com o responsável atual da etapa reaberta marcado (se ele não pode, quem está na tela; senão, "Ninguém por enquanto").
  - **Reclassificar:** a janela traz o novo tipo e, para Subprocesso, o pai. Quando o macroprocesso muda, ela mostra o aviso "O item passa do macroprocesso {de} para {para}, o do processo pai."
- **Confirmação simples (ADR 0003)** em Excluir processo e Excluir etapa do catálogo:
  - "Excluir o processo {nome}? O histórico guarda o que ele tinha, inclusive as etapas, mas não é possível desfazer." [Excluir processo] [Cancelar];
  - "Excluir a etapa {nome} do catálogo?" [Excluir etapa] [Cancelar].
- **Tela do setor** ganha, abaixo do que já existe, "Processos do setor": lista com nome, tipo, etapa atual e situação, em que clicar leva à Lista filtrada pelo setor com o verso aberto; fechar deixa a pessoa nessa Lista. As seções "Responsáveis do setor" e "Etapas do setor" saíram em 2026-10-18.
- **Catálogo de etapas** (aba da Administração, só administrador):
  - **Lista:** em ordem, com nome, obrigatória ou opcional e pílula "Inativa".
  - **Ações:** [Nova etapa] (nome, código, obrigatória e posição), [Editar] (nome, obrigatória), [Subir], [Descer], [Desativar] ou [Reativar] e [Excluir]. O campo "Nível" saiu em 2026-10-18.
- **Mensagens de recusa, vindas do banco e traduzidas pela interface:**
  - "Já existe um processo com o nome {nome} no setor {SIGLA}."
  - "A etapa {anterior} ainda não foi resolvida."
  - "Já há uma etapa em andamento neste processo: {etapa}."
  - "A etapa {nome} é obrigatória e não pode ser dispensada."
  - "Este processo está {suspenso | cancelado}; retome-o para registrar o andamento."
  - "A data {valor} está no futuro." e "A conclusão ({valor}) não pode ser antes do início ({valor})."
  - "Este processo tem {n} subprocessos; reclassifique-os ou exclua-os antes." (exclusão e reclassificação em subprocesso)
  - "O processo pai precisa ser do tipo Processo."
  - "{Usuário} não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP."
  - "{Usuário} enviou a versão V{n} e não pode ser responsável pela Revisão interna." (desde 2026-10-18)
  - "A nota é obrigatória." (dispensar e registrar como realizada anteriormente, pelo avanço; o motivo de suspender, cancelar, retomar e voltar tem a frase "O motivo é obrigatório."; desde 2026-10-18)
  - "Não é possível excluir: {setor | macroprocesso} tem {n} processos ligados."
  - "O setor {SIGLA} tem {n} processos neste macroprocesso; mova-os ou exclua-os antes."
  - "A etapa {nome} já foi usada; desative-a em vez de excluir."
  - "Seu perfil não permite alterar os processos." (quando o banco recusa por perfil)
  - "Outra pessoa alterou as anotações enquanto você escrevia" (conflito nas Anotações, desde 2026-10-23; mostrado no próprio bloco, não como erro de gravação)
  - "As anotações têm {n} caracteres; o limite é 2.000." (desde 2026-10-23; a tela não deixa chegar a isso, mas o banco recusa)
- **Estados:**
  - **Carregando:**
    - Quadro: "Carregando processos…", com colunas-fantasma;
    - Lista: "Carregando processos…", com linhas-fantasma;
    - verso: a janela já no tamanho final, com blocos cinza no formato do cabeçalho e das duas colunas, e "Carregando processo…" para o leitor de tela (desde 2026-10-19; antes, só o texto);
    - "Carregando catálogo…" e "Carregando processos do setor…".
  - **Vazio:**
    - nenhum processo: o estado vazio que já existe ("Nenhum processo cadastrado ainda." com [Cadastrar processo] para quem pode);
    - filtros sem resultado: "Nenhum processo com estes filtros." com [Limpar filtros];
    - "Só os meus" sem resultado (sem outros filtros): "Nenhum processo com você agora." com [Ver todos], que desliga o "Só os meus" (parte 4); com outros filtros ligados, vale a mensagem dos filtros;
    - "Este setor ainda não tem processos." e "Nenhuma alteração registrada ainda." no histórico.
  - **Erro ao carregar, inclusive falha de conexão:** "Não foi possível carregar {os processos | o processo | o catálogo}. Verifique a conexão e tente de novo." com [Tentar de novo].
  - **Item que não existe mais:** "Este processo não existe mais. Ele pode ter sido excluído; veja o Histórico." com [Voltar].
  - **Erro de gravação:** "A alteração não foi salva: {motivo}. Seus dados continuam no formulário."
- **Cores das mensagens (ADR 0003):** vermelho para "a ação não aconteceu" e amarelo para aviso.
- **Histórico:**
  - **Formato:** o mesmo da lista do Histórico dos cadastros, acrescido do motivo ou da nota. No verso (desde 2026-10-19), o histórico do processo é uma linha do tempo do mais novo para o mais antigo, agrupada por dia ("Hoje", "Ontem", "12/10"); cada evento traz a hora em mono, as iniciais de quem fez, a frase da ação com o antes e depois e, em cinza abaixo, o motivo ou a nota.
  - **Textos das ações:**
    - "Criou", "Editou", "Excluiu";
    - "Iniciou a etapa", "Concluiu a etapa", "Dispensou a etapa", "Registrou a etapa como realizada anteriormente", "Voltou à etapa", "Corrigiu as datas da etapa", "Mudou o responsável da etapa";
    - o avanço (desde 2026-10-18) aparece como dois desses registros, com o mesmo autor e a mesma hora: o da etapa resolvida e "Iniciou a etapa" da próxima, com o responsável dela no "depois". Sem texto novo;
    - "Suspendeu", "Cancelou", "Retomou", "Reclassificou";
    - "Acrescentou a etapa ao catálogo", "Mudou a ordem do catálogo", "Desativou a etapa", "Reativou a etapa".
  - **Registros de recursos retirados (2026-10-18):** eventos de responsável do setor, de andamento de etapa do setor (o andamento sem processo) e de reunião aparecem no histórico geral e no da área Setores numa linha simples, com data, autor e ação: "Registro de responsável do setor (recurso retirado da plataforma)", "Registro de etapa do setor (recurso retirado da plataforma)" e "Registro de reunião (recurso retirado da plataforma)". Os eventos antigos do catálogo com o campo "nível" mostram o campo como veio, sem tradução nova.

### Modelo de dados

A primeira migração (2026-10-13 e 2026-10-14) foi não destrutiva. A de 2026-10-18 (Simplificação, seção "Migração de 2026-10-18" abaixo) é **destrutiva**: apaga as etapas do setor, os responsáveis do setor e o nível do catálogo. As tabelas abaixo já descrevem o estado depois dela.

**Tipos:**
- `tipo_de_processo`: `processo`, `subprocesso`, `a_classificar`;
- `origem_do_processo`: `novo`, `retomado`;
- `situacao_guardada`: `em_andamento`, `suspenso`, `cancelado`;
- `status_da_etapa`: `pendente`, `em_andamento`, `concluida`, `realizada_anteriormente`, `dispensada`.

O tipo `nivel_da_etapa` (`setor`, `processo`) foi apagado em 2026-10-18.

**`etapas`** (o catálogo de etapas)

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | uuid gerado | sim |
| codigo | texto, 2 a 40 caracteres, letras minúsculas sem acento, números e sublinhado, único, não muda depois de criado | sim |
| nome | texto, sem espaços nas pontas, 1 a 120 caracteres, único sem diferenciar maiúsculas | sim |
| ordem | inteiro positivo, único | sim |
| obrigatoria | booleano | sim |
| ativa | booleano, padrão verdadeiro | sim |
| criado_em | data e hora | sim |

O código é a identidade estável da etapa para as funcionalidades seguintes. Por exemplo, a funcionalidade de revisões vai concluir a etapa `revisao_interna` sozinha. Catálogo depois de 2026-10-18, na ordem:

| Ordem | Código | Nome | Obrigatória |
|---|---|---|---|
| 1 | `modelagem` | Modelagem piloto | sim |
| 2 | `relatorio_modelagem_tecnica` | Relatório e modelagem técnica | sim |
| 3 | `revisao_interna` | Revisão interna | sim |
| 4 | `revisao_setor` | Revisão pelo setor | sim |
| 5 | `aprovacao_setor` | Aprovação pelo setor | sim |
| 6 | `publicacao` | Publicação | não |

**`processos`**

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | uuid gerado | sim |
| setor_id | uuid, referência a `setores`, recusa apagar o setor | sim |
| macroprocesso_id | uuid, referência a `macroprocessos`, recusa apagar | sim |
| nome | texto, sem espaços nas pontas, 1 a 200 caracteres; único por setor sem diferenciar maiúsculas | sim |
| tipo | tipo_de_processo, padrão `a_classificar` | sim |
| processo_pai_id | uuid, referência a `processos`, recusa apagar o pai | só no subprocesso |
| origem | origem_do_processo, padrão `novo` | sim |
| situacao | situacao_guardada, padrão `em_andamento` | sim |
| motivo_da_situacao | texto, até 2000 caracteres | só quando suspenso ou cancelado |
| contexto | texto, até 4000 caracteres | não |
| observacoes | texto, até 2000 caracteres | não |
| data_da_reuniao | data (nova em 2026-10-18; regras na spec de `reunioes`) | não |
| criado_em | data e hora | sim |
| anotacoes | texto, até 2000 caracteres; nulo quando vazio ou só com espaços (nova em 2026-10-23) | não |
| anotacoes_alteradas_em | data e hora da última gravação das Anotações, preenchida pelo banco (nova em 2026-10-23) | só depois da primeira gravação |
| anotacoes_alteradas_por | uuid, referência a `usuarios`, quem gravou por último, preenchido pelo banco (nova em 2026-10-23) | só depois da primeira gravação |

O par (`macroprocesso_id`, `setor_id`) é uma referência a `setores_envolvidos` que recusa apagar. É ela que impede tirar de um macroprocesso um setor com processos ali, e garante que o setor do processo é sempre setor envolvido no macroprocesso dele.

**`andamentos`** (uma etapa do catálogo num processo)

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | uuid gerado | sim |
| etapa_id | uuid, referência a `etapas`, recusa apagar | sim |
| processo_id | uuid, referência a `processos`, apaga junto | sim (antes de 2026-10-18 era vazio na etapa do setor) |
| status | status_da_etapa, padrão `pendente` | sim |
| nota | texto, até 2000 caracteres | só em `realizada_anteriormente` e `dispensada` |
| responsavel_id | uuid, referência a `usuarios` | não |
| iniciada_em | data | quando em andamento ou concluída |
| resolvida_em | data | quando resolvida |

O par (`etapa_id`, `processo_id`) é único. A coluna `setor_id` foi apagada em 2026-10-18.

**`processos_com_andamento`** (view, `security_invoker = true`) devolve, para cada processo:
- a **etapa atual**: a em andamento ou, sem ela, a primeira pendente na ordem do catálogo (a funcionalidade de documentos usa o id dela para gravar a etapa da versão, e isso continua igual);
- o **responsável** da etapa atual;
- a **situação calculada**: `concluido` quando a guardada é `em_andamento` e todas as etapas obrigatórias do processo estão resolvidas; senão, a guardada.

A indicação "aguardando o setor" saiu da view em 2026-10-18. Desde a parte 4 (2026-10-19), a view devolve também, acrescentados no fim:

| Campo | Tipo | Vazio quando |
|---|---|---|
| etapa_atual_status | status_da_etapa (`pendente` ou `em_andamento`) | sem etapa atual |
| etapa_atual_iniciada_em | data | etapa atual pendente ou sem etapa atual |
| responsavel_ativo | booleano | sem responsável |
| caminho | lista JSON, na ordem do catálogo, de `{etapa_id, codigo, status}` de cada andamento do processo | nunca (lista vazia sem andamentos) |
| ultima_versao_numero | inteiro (a versão de maior número, histórica ou não) | sem versão |
| ultima_versao_historica | booleano | sem versão |
| ultima_versao_tem_relatorio | booleano (algum arquivo de papel relatório na última versão) | sem versão |
| subprocessos_quantidade | inteiro (subprocessos de situação guardada diferente de cancelado) | nunca (0) |

**Derivado, não guardado:** etapa atual, situação "concluído", quantidade de subprocessos e de processos por setor; desde a parte 4, os dias na etapa, o processo parado, a coluna de destino do arrastar e os selos (calculados na tela a partir dos campos da view).

**`eventos`** (já existe): recebe as entidades `processo`, `andamento` e `etapa`. Os eventos antigos de `responsavel_do_setor` e os de `andamento` de etapa do setor continuam guardados e legíveis por todo perfil ativo.
- O `detalhes` traz antes e depois com campos legíveis: nome do processo, sigla do setor, nome do macroprocesso, nome e código da etapa, nome do responsável, e a data da reunião. Assim o histórico continua legível depois de uma exclusão.
- O motivo ou a nota vão em `detalhes.motivo`.
- A exclusão de um processo traz no "antes" todos os campos e a lista dos andamentos.
- O evento de andamento guarda também o id do processo, para os filtros do histórico.
- As ações de "voltar" geram um evento por andamento alterado.
- As Anotações e as duas colunas da última alteração ficam fora do estado guardado nos eventos do processo (desde 2026-10-23, ADR 0021). Gravar só as Anotações não gera evento, porque o gatilho compara os dois estados; e o "antes" da exclusão do processo não traz o texto delas.

**Dado pessoal e quem vê:**
- `andamentos.responsavel_id` aponta para usuários, cujo nome todos os perfis ativos já veem.
- Os eventos desta funcionalidade são lidos por todo perfil ativo. Os de usuários e autorizações seguem só do Administrador.
- Com os responsáveis do setor apagados, a plataforma não guarda mais nome, e-mail e cargo de pessoas dos setores. Os eventos antigos deles (só dados inventados do desenvolvimento) ficam no histórico.
- As Anotações (desde 2026-10-23) são texto livre e podem trazer nome e e-mail de pessoas dos setores. Por isso não entram na view `processos_com_andamento` (de onde leem o Quadro, a Lista e o pacote das planilhas), nem no pacote das planilhas, nem nos eventos. Só o verso as lê, direto da tabela `processos`, com o nome de quem alterou por último vindo de `usuarios`, pela coluna `anotacoes_alteradas_por` dita no pedido (a tabela também liga a `usuarios` por `responsavel_id`, e sem a coluna o Supabase recusa a leitura por ambígua; bug de 2026-10-27).

**Privilégios padrão:** cada tabela nova nasce com `revoke all` de visitante e de logado e concede de volta só o necessário a logado, com a RLS decidindo o resto. A view nasce com `revoke all` de visitante. Assim o teste `10_privilegios_padrao` continua passando.

**Gravações com várias linhas** (voltar, reclassificar, suspender, cancelar e retomar com motivo, e mexer no catálogo, que acrescenta ou tira andamentos) passam por funções do banco chamadas pela interface, sem `security definer`, que rodam com a permissão de quem chama. A RLS decide o resto. Iniciar, corrigir datas e mudar responsável também podem ir por funções, se a execução preferir.

**Avanço (desde 2026-10-18, ADR 0014).** Concluir, dispensar e registrar como realizada anteriormente passam por uma função do banco, nas mesmas condições das outras (sem `security definer`, com a permissão de quem chama), que recebe o andamento, a ação, a nota (quando há) e o responsável da próxima (ou nenhum). Numa transação só, ela resolve a etapa e, se houver etapa pendente depois dela na ordem do catálogo, põe a primeira em andamento com início hoje e o responsável recebido. Qualquer recusa (sequência, nota, trava do autor, processo congelado) desfaz tudo. A função de voltar ganha o parâmetro do responsável da etapa reaberta (é apagada e recriada com a assinatura nova, com os mesmos privilégios). Nenhuma tabela ou coluna muda; a tabela "quem pode o quê" continua a mesma.

#### Quem pode o quê (cada célula vira um teste pgTAP)

"Visitante" é quem não entrou; "Inativo" é qualquer perfil com `ativo` falso em `usuarios`.

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `etapas` ler | sim | sim | sim | não | não |
| `etapas` criar, alterar nome, ordem, obrigatória, ativa | sim | não | não | não | não |
| `etapas` alterar id, código, criado_em | não | não | não | não | não |
| `etapas` apagar (só nunca usada) | sim | não | não | não | não |
| `processos` ler | sim | sim | sim | não | não |
| `processos` criar, alterar (inclusive a data da reunião), apagar | sim | sim | não | não | não |
| `processos` alterar id, criado_em | não | não | não | não | não |
| `processos` alterar tipo e pai fora da reclassificação | não | não | não | não | não |
| `processos` ler as Anotações e a última alteração delas (desde 2026-10-23) | sim | sim | sim | não | não |
| `processos` gravar as Anotações (pela função, em qualquer situação menos arquivado; desde 2026-10-23) | sim | sim | não | não | não |
| `processos` alterar `anotacoes_alteradas_em` e `anotacoes_alteradas_por` direto | não (só o gatilho as preenche) | não | não | não | não |
| `andamentos` ler | sim | sim | sim | não | não |
| `andamentos` alterar status, nota, responsável, datas | sim | sim | não | não | não |
| `andamentos` criar e apagar direto | não (só gatilhos e funções do catálogo e do cadastro) | não | não | não | não |
| `andamentos` alterar id, etapa_id, processo_id | não | não | não | não | não |
| `processos_com_andamento` ler | sim | sim | sim | não | não |
| `eventos` desta funcionalidade ler (inclusive os antigos de responsável e de etapa do setor) | sim | sim | sim | não | não |
| `eventos` criar, alterar, apagar | não (só os gatilhos incluem) | não | não | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Nome do processo único por setor | índice único sobre (setor, nome normalizado) | "Emitir ofício " recusado quando "emitir ofício" existe no mesmo setor; aceito em outro setor |
| Setor do processo é setor envolvido no macroprocesso | referência composta a `setores_envolvidos` + gatilho antes de incluir e alterar que inclui o setor envolvido se faltar | cadastrar com setor fora do macroprocesso inclui o setor envolvido e gera o evento dele |
| Não tirar setor envolvido com processos | referência composta recusa apagar | tirar CEE do macroprocesso com 2 processos é recusado |
| Não excluir setor ou macroprocesso com processo | referência recusa apagar | excluir setor com processo é recusado |
| Subprocesso tem pai do tipo processo; processo e "a classificar" não têm pai | gatilho e restrição | subprocesso sem pai, pai subprocesso e pai "a classificar" recusados |
| Subprocesso segue o macroprocesso do pai; mudar o macroprocesso do pai muda o dos filhos | gatilho | mudar o macroprocesso do pai muda o do filho e inclui o setor do filho como envolvido |
| Tipo e pai só mudam pela reclassificação, com motivo | gatilho que recusa a mudança fora da função de reclassificar; a função exige motivo | alterar `tipo` direto recusado; reclassificar sem motivo recusado |
| Processo com subprocessos não vira subprocesso | função de reclassificar | recusado com a contagem |
| Não excluir processo com subprocessos | referência do pai recusa apagar | recusado com a contagem |
| Criar processo cria os andamentos das etapas ativas | gatilho depois de incluir | processo novo tem 6 andamentos pendentes |
| Criar setor não cria andamentos (desde 2026-10-18) | gatilho de criação de setor apagado | setor novo não tem andamento |
| Etapa só sai de pendente com a anterior resolvida; a primeira (Modelagem piloto) sai livre | gatilho antes de alterar | iniciar a 2 com a 1 pendente recusado; iniciar a 1 de processo novo aceito |
| No máximo uma etapa em andamento por processo | índice único parcial | segunda em andamento recusada |
| Dispensar só etapa opcional; nota obrigatória em dispensada e realizada anteriormente | gatilho e restrição | dispensar a 3 recusado; dispensar sem nota recusado |
| Transições permitidas | gatilho antes de alterar | concluir uma pendente recusado; sair de resolvida só pela função de voltar |
| Datas: nunca no futuro; resolvida não antes de iniciada | restrição | data de amanhã recusada; resolvida antes de iniciada recusada |
| Processo suspenso ou cancelado congela os andamentos | gatilho antes de alterar | iniciar etapa de processo suspenso recusado |
| Motivo obrigatório em suspender, cancelar e retomar | restrição sobre `motivo_da_situacao` + funções | suspender sem motivo recusado |
| Voltar: a etapa escolhida volta a em andamento e as seguintes resolvidas voltam a pendente | função de voltar | voltar à 1 com a 2 e a 3 concluídas deixa 1 em andamento e 2 e 3 pendentes, com os eventos |
| Responsável é usuário ativo Administrador ou Integrante | gatilho antes de incluir e alterar | escolher um usuário Consulta ou inativo recusado |
| Resolver a etapa atual avança: a primeira pendente depois dela entra em andamento, com início hoje e o responsável recebido (ou nenhum); tudo ou nada (desde 2026-10-18) | função de avanço | concluir a 2 com a 3 pendente deixa a 2 concluída e a 3 em andamento com o responsável; "nenhum" deixa a 3 em andamento sem responsável; com a 3 já resolvida, inicia a 4; concluir a última não inicia nada; dispensar e realizada anteriormente avançam igual; dispensar sem nota recusado sem mudar nenhuma etapa |
| Responsável da Revisão interna não é quem enviou a versão mais recente não histórica, conferido só quando o responsável muda para alguém (desde 2026-10-18) | gatilho antes de alterar o responsável do andamento de código `revisao_interna` | escolher o autor da V3 recusado pelo seletor, pelo avanço e pela função de voltar; autor de versão histórica aceito; processo sem versão aceito; o responsável que envia a V4 depois de escolhido continua responsável |
| Etapa nova entra como pendente nos processos em andamento e suspensos não concluídos (ADR 0004) | função do catálogo, sem parâmetro de nível | etapa nova não entra em processo concluído nem cancelado |
| Desativar etapa apaga os andamentos pendentes dela; reativar os recria onde faltam | função do catálogo | desativar mantém os resolvidos e apaga os pendentes |
| Etapa usada não se exclui; código não muda | referência de `andamentos` recusa apagar quando há andamento não pendente; gatilho | excluir etapa com andamento concluído recusado |
| Toda mudança vira evento, com autor, antes, depois e motivo | gatilhos depois de incluir, alterar e apagar | cada ação gera o evento esperado; exclusão do processo traz os andamentos no "antes" |
| Gravação sem mudança não vira evento | os gatilhos comparam antes e depois | salvar sem mudar nada não gera evento |
| Anotações só se gravam se o texto no banco ainda é o que a pessoa tinha; senão, recusa de conflito sem mudar nada (desde 2026-10-23) | função de gravar as Anotações, que compara o texto atual com o recebido (nulo igual a nulo) | gravar com o texto esperado aceito; gravar depois que outra pessoa alterou recusado com o código de conflito e o texto dela intacto; primeira gravação com esperado nulo aceita |
| Quem e quando da última alteração são do banco (desde 2026-10-23) | gatilho antes de alterar: quando as Anotações mudam, preenche `anotacoes_alteradas_por` com quem chama e `anotacoes_alteradas_em` com agora; recusa mudar as duas colunas sem mudar as Anotações | gravar preenche autor e hora; mudar só o autor recusado; gravar o mesmo texto não muda autor nem hora |
| Anotações não viram evento (desde 2026-10-23, ADR 0021) | ficam fora do estado guardado nos eventos | gravar as Anotações não gera evento; editar o nome continua gerando, sem as Anotações no antes e depois |
| Anotações até 2000 caracteres; só espaços grava nulo (desde 2026-10-23) | restrição e a função | 2001 caracteres recusado; texto só com espaços grava nulo |
| Arquivado não tem as Anotações alteradas (desde 2026-10-23) | a trava do arquivado que já existe | gravar as Anotações de processo arquivado recusado; de suspenso, cancelado e concluído aceito |
| Anotações fora da view e do pacote das planilhas (desde 2026-10-23) | a view e o pacote listam as colunas uma a uma | a view não tem coluna de Anotações; o pacote não traz o texto |

As regras "etapas do setor antes das do processo", "nível não muda", "a primeira do processo exige as do setor resolvidas" e as de `responsaveis_do_setor` (e-mail no formato e em minúsculas) saíram em 2026-10-18, com as estruturas que protegiam.

#### Regras de estado

**Etapa (andamento):**

```
pendente ──iniciar──▶ em_andamento ──concluir──▶ concluida
pendente | em_andamento ──dispensar (só opcional, nota)──▶ dispensada
pendente | em_andamento ──realizada anteriormente (nota)──▶ realizada_anteriormente
resolvida ──voltar (motivo)──▶ em_andamento   (as seguintes resolvidas ──▶ pendente)
```

Sair de pendente exige a anterior resolvida (a Modelagem piloto, primeira, não tem anterior). Concluída, dispensada e realizada anteriormente contam como resolvida.

**Avanço (desde 2026-10-18):** concluir, dispensar ou registrar como realizada anteriormente a etapa atual leva, na mesma transação, a primeira etapa pendente depois dela de `pendente` a `em_andamento` (com o responsável escolhido ou nenhum). Sem pendente depois, nada mais muda. Voltar põe a etapa escolhida em andamento com o responsável escolhido.

**Processo (situação guardada):**

```
em_andamento ──suspender (motivo)──▶ suspenso ──retomar (motivo)──▶ em_andamento
em_andamento | suspenso ──cancelar (motivo)──▶ cancelado ──retomar (motivo)──▶ em_andamento
```

"Concluído" é calculado: situação guardada `em_andamento` com todas as etapas obrigatórias do processo resolvidas. Voltar uma etapa desfaz o concluído sozinho. Suspenso e cancelado congelam os andamentos. Ao retomar, `motivo_da_situacao` volta a nulo, e o motivo fica no evento.

**Reclassificação:** a classificar → processo | subprocesso; processo ⇄ subprocesso. Sempre com motivo e pela função. Ao virar subprocesso: pai do tipo processo, sem filhos próprios, e o macroprocesso passa a ser o do pai. Ao virar processo, o pai é apagado e o macroprocesso fica o mesmo. A data da reunião fica como está.

#### Migração de 2026-10-18 (Simplificação)

Destrutiva. A produção não existe; só se perdem dados inventados do desenvolvimento (ADR 0013). Três migrações novas, uma por ticket, cada uma numa transação: `20261018123613_data_da_reuniao` (itens 1 e 6), `20261018132857_responsaveis_do_setor_saem` (item 2) e `20261018141346_sem_etapas_do_setor` (itens 3 a 5). O que cada uma faz:

1. **Reuniões:** tudo o que a spec de `reunioes` lista como apagado (tabelas, tipo, funções, gatilhos e travas).
2. **Responsáveis do setor:** apaga a tabela `responsaveis_do_setor`, os gatilhos e funções dela.
3. **Etapas do setor:** apaga os andamentos de etapa do setor, as três etapas de nível setor, o gatilho que criava andamentos ao criar setor, a parte do gatilho de sequência que exigia as etapas do setor resolvidas, a regra de ordem entre níveis, a coluna `andamentos.setor_id` com a sua restrição e índices, a coluna `etapas.nivel` e o tipo `nivel_da_etapa`. A função de acrescentar etapa perde o parâmetro de nível (é apagada e recriada com a assinatura nova, com os mesmos privilégios).
4. **Catálogo:** renumera as etapas restantes de 1 a 6, mantendo a ordem relativa, e renomeia `modelagem` para "Modelagem piloto".
5. **View:** recria `processos_com_andamento` sem a indicação "aguardando o setor", com `security_invoker = true` e o mesmo `revoke` de visitante.
6. **Processos:** acrescenta `data_da_reuniao`, concede a alteração dela a logado e inclui a data no estado guardado nos eventos do processo.

As exclusões e a renumeração da migração não geram eventos: é mudança de estrutura, registrada no ADR 0013, e não ação de alguém. A migração precisa desligar os gatilhos de evento enquanto apaga e renumera (`session_replication_role = replica`, desfeito no fim, como nos testes de 2026-10-16). Os eventos antigos ficam como estão.

#### Migração da parte 2 (Etapas mais rápidas)

Não destrutiva: nenhuma tabela ou coluna muda. Uma migração nova cria a função de avanço, o gatilho da trava do autor na Revisão interna e recria a função de voltar com o parâmetro do responsável. Os eventos saem dos gatilhos que já existem (um por andamento alterado). Vai pelo workflow "Migrar banco de desenvolvimento" e entra no registro de `supabase/AMBIENTES.md`.


#### Parte 3 (Verso do cartão, 2026-10-19)

Sem migração: nenhuma tabela, coluna, política, view ou função muda. O verso usa o que o processo lido já traz (etapas com datas, responsáveis e notas, versão mais recente, data da reunião, estrutura e situação com motivo); os dias na etapa e o "Concluído em" se calculam na tela a partir das datas das etapas, e a busca filtra a lista já carregada.

#### Migração da parte 4 (Cartão do Quadro, 2026-10-19)

Não destrutiva: nenhuma tabela, coluna, política ou função muda; a tabela "quem pode o quê" continua a mesma. Uma migração nova recria a view `processos_com_andamento` com os campos acima acrescentados no fim (`create or replace view`, que mantém os campos atuais na mesma ordem), com `security_invoker = true` e o mesmo `revoke` de visitante. Como a view roda com a permissão de quem lê, ela só mostra versões, arquivos e subprocessos que o perfil já lê pelas próprias políticas (todo perfil ativo lê processos, andamentos, versões e arquivos da versão). O arrastar grava pela função de avanço da parte 2, sem nada novo no banco. Vai pelo workflow "Migrar banco de desenvolvimento" e entra no registro de `supabase/AMBIENTES.md`.

#### Migração das Anotações (2026-10-23)

Não destrutiva, numa migração nova:
1. acrescenta a `processos` as colunas `anotacoes`, `anotacoes_alteradas_em` e `anotacoes_alteradas_por`, com as restrições da tabela acima;
2. concede a logado a alteração só da coluna `anotacoes` (privilégio de coluna, como `data_da_reuniao` e `arquivado_em`); as duas colunas da última alteração não recebem privilégio de alteração, e o gatilho as preenche;
3. cria o gatilho da última alteração;
4. cria a função de gravar as Anotações (processo, texto esperado, texto novo), sem `security definer`, com a permissão de quem chama: grava só se o texto atual é o esperado e, senão, recusa com o código de conflito; devolve o texto gravado, o autor e a hora. A RLS de alteração de `processos` que já existe decide o perfil; a trava do arquivado que já existe recusa o arquivado;
5. não toca a view `processos_com_andamento`, o pacote das planilhas nem `private.estado_do_processo`: as três listam as colunas uma a uma e já deixam as Anotações de fora.

A tabela "quem pode o quê" ganha as linhas acima; o `10_privilegios_padrao` continua passando. Vai pelo workflow "Migrar banco de desenvolvimento" e entra no registro de `supabase/AMBIENTES.md`.

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).**
  - **Como:** Vitest com Testing Library, renderizando o aplicativo inteiro com a implementação falsa nomeada do módulo de processos, que guarda processos (com a data da reunião), catálogo, andamentos e histórico, aceita falhas programáveis e imita as recusas do banco. Ela fica ao lado das falsas do acesso e dos cadastros.
  - **O que cobre:**
    - Quadro e Lista para cada perfil (Consulta sem botões);
    - colunas por etapa, sem "Aguardando o setor" (processo novo direto na Modelagem piloto; endereço antigo com o filtro tratado como sem filtro);
    - cartões com pílulas;
    - filtros no endereço e "Limpar filtros";
    - cadastrar, editar e excluir processo, com sucesso e com falha;
    - o aviso de setor fora do macroprocesso;
    - subprocesso com macroprocesso fixo;
    - cada ação de etapa e cada janela de nota ou motivo (confirmar desabilitado com campo vazio, Esc sem gravar);
    - voltar;
    - datas;
    - responsável;
    - suspender, cancelar e retomar, com o congelamento;
    - concluído calculado;
    - reclassificar, com o aviso de macroprocesso;
    - tela do setor sem responsáveis nem etapas do setor, e painel sem as etapas do setor;
    - catálogo sem o campo "Nível" e com a Modelagem piloto em primeiro;
    - as linhas simples dos registros de recursos retirados no histórico;
    - catálogo só para o administrador;
    - cada mensagem de recusa;
    - estados de carregando, vazio e erro de cada tela;
    - item que não existe mais;
    - histórico do processo;
    - avanço (desde 2026-10-18): a janela de Concluir com o título, as opções e a opção marcada em cada caso (responsável que a próxima já tem, quem está na tela, "Ninguém por enquanto"); a próxima em andamento depois de confirmar, com e sem responsável; a primeira pendente pulando as resolvidas; a última etapa sem janela e o processo concluído; Dispensar e Realizada anteriormente com nota e escolha na mesma janela; Esc e [Cancelar] sem gravar; teclado (foco na opção marcada, setas, Enter) e nomes acessíveis; falha na gravação com a etapa como estava;
    - [Assumir] nas etapas pendentes e em andamento sem responsável, ausente nas resolvidas, para a Consulta e, na Revisão interna, para o autor da versão mais recente;
    - a trava do autor: ausente da janela de avanço e da de voltar, autor de versão histórica presente, e a recusa do banco pelo seletor com a mensagem;
    - voltar com a escolha do responsável da etapa reaberta;
    - os dois registros do avanço no histórico;
    - verso do cartão (desde 2026-10-19), pelo aplicativo inteiro, como a pessoa usa:
      - abrir pelo cartão, pela linha da Lista, pelo endereço e pela tela do setor; fechar pelo botão e por Esc, com o foco de volta ao cartão ou à linha; pai e subprocesso na mesma janela, com o endereço mudando;
      - a janela como diálogo com o nome acessível "Processo {nome}", o foco no nome ao abrir e o Tab preso dentro dela;
      - cabeçalho: tipo em texto, pílula de situação só em suspenso, cancelado e concluído;
      - Agora em cada caso: pendente com [Iniciar {etapa}]; em andamento com [Concluir {etapa}] abrindo a janela de avanço; "⋯" com Dispensar só na opcional e Realizada anteriormente; sem responsável com [Assumir]; "Trocar" com a pessoa da tela primeiro e "Ninguém por enquanto" no fim, gravando ao escolher, e a falha com a mensagem de erro; dias na etapa até 15 e a pílula "{n} dias nesta etapa" a partir de 16; suspenso e cancelado com motivo e [Retomar]; concluído com a data; Consulta sem botões;
      - etapas: o nome acessível de cada status; a gaveta abrindo uma por vez, com Corrigir datas e Voltar a esta etapa onde cabem, e o Trocar e o [Assumir] nas pendentes;
      - arquivos: destaque da versão mais recente, "falta relatório" com o espaço [+ Acrescentar relatório], versões anteriores recolhidas, "Registrar versão histórica" no "⋯" da seção, e a Consulta só baixando;
      - reunião marcada, alterada e removida no próprio lugar;
      - Sobre sem os campos vazios e com "Ler mais" no texto longo;
      - estrutura com a etapa atual de cada subprocesso, "Faz parte de" e a seção ausente sem estrutura;
      - menu "⋯" com os três grupos, e só Histórico para a Consulta;
      - Histórico dentro da janela, agrupado por dia, com "← Voltar ao processo" e o Esc que volta e depois fecha;
      - Editar na janela, voltando ao verso; Novo processo na janela, abrindo o verso do criado com "Processo cadastrado"; falhas de gravação com os dados no formulário;
      - estados do verso: carregando (com o texto para o leitor de tela), erro com [Tentar de novo] e processo excluído com [Voltar];
      - busca da Lista: por trecho do nome, sem diferenciar maiúsculas e acentos, somada aos filtros, no endereço, com o "×", com o trecho marcado e sem resultado com [Limpar filtros] limpando também a busca;
    - cartão do Quadro (parte 4), pelo aplicativo inteiro, como a pessoa usa:
      - a barra com o nome acessível "Etapa {n} de {total}: {etapa}", contando dispensada e realizada anteriormente como resolvidas;
      - cada selo aparecendo e não aparecendo: dias com 15 e com 16 dias, sem selo no suspenso e na etapa pendente; Relatório pendente na Relatório e modelagem técnica (ausente), na Revisão interna (presente) e com relatório (ausente); Sem responsável; Reunião hoje, futura e passada (ausente); versão normal, histórica ("V5F") e ausente; subprocessos com um cancelado fora da contagem; a ordem dos selos;
      - arrastar: o cartão arrastável só nos casos permitidos (não no suspenso, na etapa pendente, na última etapa, para a Consulta nem agrupado por responsável); soltar na coluna de destino abre a janela de avanço com o título dela; a coluna de destino quando a vizinha já está resolvida; confirmar move o cartão; Esc e [Cancelar] deixam tudo como estava; soltar em outra coluna mostra "Solte o cartão na coluna {etapa}."; a falha de gravação com a mensagem e nada mudado; o realce só na coluna de destino;
      - Agrupar por Responsável: colunas em ordem alfabética, "Sem responsável" no fim, pílula "Inativo", o nome da etapa no cartão, os filtros valendo, e o agrupamento no endereço (recarregar mantém);
      - Só os meus: liga e desliga, equivale ao filtro Responsável nos dois sentidos, ausente para a Consulta, e o vazio "Nenhum processo com você agora." com [Ver todos];
    - Anotações (desde 2026-10-23), pelo aplicativo inteiro, como a pessoa usa, com o relógio simulado do Vitest para a pausa de 1 segundo:
      - o bloco no alto da coluna direita, acima da Reunião, com o campo de nome "Anotações" e a dica no vazio;
      - digitar e parar: "Salvando…", depois "Salvo", e o texto gravado na falsa; sair do campo grava sem esperar a pausa; digitar sem parar não grava a cada tecla;
      - a linha "Alterado por {nome} em {dd/mm}, {hh:mm}" depois de gravar, e ausente no processo que nunca teve anotação;
      - falha programada (inclusive de conexão): o aviso, o texto no campo e a nova tentativa na próxima pausa, que grava;
      - conflito (a falsa altera o texto "como outra pessoa" no meio): o aviso, o texto de quem escrevia no campo, nenhuma nova tentativa ao digitar, e "Ver o texto atual" trazendo o texto e o autor da outra pessoa; depois disso, a gravação volta a funcionar;
      - contagem ausente com 1.799 caracteres e presente com 1.800; o campo sem passar de 2.000;
      - fechar o verso com texto pendente grava e fecha; com falha ou conflito, a confirmação, em que [Continuar escrevendo] mantém a janela e [Sair sem salvar] fecha; o mesmo ao abrir um subprocesso e ao abrir o Histórico;
      - escrita em suspenso, cancelado e concluído; só leitura no arquivado;
      - Consulta: texto só para ler, "Sem anotações." no vazio, sem campo;
      - subprocesso com as suas Anotações, diferentes das do pai;
      - o Histórico do processo sem nenhum evento depois de gravar as Anotações;
      - o texto das Anotações ausente do cartão do Quadro e a busca da Lista sem encontrar por ele;
    - os testes de tela atuais que falam do painel (por exemplo `App.painelDoProcesso` e `App.andamentoDoProcesso`) são ajustados ao verso, mantendo os comportamentos que continuam valendo.
  - **Funções puras novas:** a busca sem acento e sem maiúsculas, a contagem de dias na etapa e o limite de 15 dias, o agrupamento do histórico por dia e a leitura e montagem do endereço com `busca` ganham testes unitários pequenos. Na parte 4: os selos de um processo (quais e em que ordem), a barra a partir do caminho, a coluna de destino do arrastar (ou nenhuma), as colunas agrupadas por responsável e o endereço com `agrupar`.
  - **Anotações na falsa** (desde 2026-10-23): a implementação falsa do módulo de processos guarda as Anotações por processo, com autor e hora, imita a recusa de conflito comparando o texto esperado, recusa o arquivado e a Consulta como o banco, aceita falha programável e tem um gesto nomeado para "outra pessoa altera agora", usado nos testes de conflito.
  - **Arrastar nos testes:** os eventos nativos de arrastar e soltar disparados sobre o cartão e a coluna (o jsdom não faz o gesto, mas entrega os eventos), como a pessoa faria.
  - **Arte anterior:** os testes de tela de cadastros-basicos (`App.setores`, `App.macroprocessos`, `App.historicoDosCadastros`) e a janela de confirmação.
- **Tradução entre o banco e a tela.** Testes pequenos do módulo de processos real com o cliente Supabase simulado. Eles provam que os códigos de recusa do banco viram as mensagens acima e que as linhas do banco e da view viram os tipos da tela (na parte 4, os campos novos da view, inclusive vazios; desde 2026-10-23, a leitura das Anotações com o nome do autor, e a recusa de conflito virando um resultado próprio, separado das outras falhas). Arte anterior: os testes de `cadastrosSupabase` e `macroprocessosSupabase`.
- **Funções puras** (filtros a partir do endereço, ordem das colunas, textos do histórico): testes unitários pequenos.
- **Banco.**
  - **Testes:** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras. As transições de estado ganham um teste cada.
  - **Testes gerais:** `00_rls_ligada` e `10_privilegios_padrao` cobrem as tabelas novas sem mudança.
  - **Testes antigos:** conferir os que contam linhas de uma tabela inteira, porque o andamento nascia junto com cada setor (achado do `/ship` de cadastros-basicos).
  - **Simplificação (2026-10-18):** os testes `15_etapas_do_setor` e `16_responsaveis_do_setor` são apagados; `17`, `18`, `19`, `20`, `21` e `22` são ajustados ao catálogo de 6 etapas sem nível (posições mudam: a Revisão interna passa de 6 a 3); um teste novo prova a migração (tabelas e colunas apagadas, catálogo renumerado e renomeado, setor novo sem andamento, Modelagem piloto inicia sem depender do setor, eventos antigos legíveis). Os testes da funcionalidade de documentos (`26` a `31`) que criam processos ou citam etapas pela posição também são conferidos.
  - **Parte 2 (2026-10-18):** um teste por linha nova da tabela de regras (avanço e trava do autor), e os testes de "voltar" ajustados à assinatura nova. A função de avanço também ganha os casos de perfil (Consulta, inativo e visitante recusados) e de processo suspenso.
  - **Parte 4 (2026-10-19):** um teste novo da view prova cada campo novo (início e status da etapa atual, caminho na ordem do catálogo, última versão histórica e não histórica, relatório presente e ausente, subprocesso cancelado fora da contagem, responsável inativo) e que a Consulta lê os mesmos valores; visitante e inativo continuam sem ler (o teste da view que já existe). O `10_privilegios_padrao` continua passando.
  - **Anotações (2026-10-23):** um teste por linha nova da tabela "quem pode o quê" (cada perfil, inativo e visitante lendo e gravando; ninguém mudando direto o autor e a hora) e um por linha nova da tabela de regras (conflito, autor e hora pelo banco, sem evento, limite, só espaços, arquivado, fora da view e do pacote).
  - **Onde rodam:** os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco"). A migração vai pelo workflow "Migrar banco de desenvolvimento".
- Todos os processos, setores e usuários dos testes são inventados.

## Fora do escopo

- Reuniões: a data da reunião de modelagem piloto está na spec de `reunioes`; ela não muda nenhuma etapa.
- Etapas do setor e responsáveis do setor: retirados em 2026-10-18 (ADR 0013).
- Envio de fluxogramas e relatórios, versões e o nome dos arquivos: funcionalidade 5. A recusa de excluir processo com documento chega com ela.
- Registro da revisão interna, E-protocolo e a trava que exige o registro para concluir as etapas de revisão: `revisoes-aprovacao` (parte 5 da iniciativa). Vão junto a regra 14 (aviso "estrutura alterada após aprovação") e os campos vigência e próxima revisão. O [Assumir] (antes "capturar") e a trava do autor na escolha do responsável entraram aqui em 2026-10-18 (ADR 0014); a regra que impede o autor de *registrar* a revisão fica na parte 5 e fecha a brecha de quem assume a Revisão interna pendente e depois envia a versão.
- Conclusão automática de etapas por documento ou revisão. Resolver uma etapa continua manual; desde 2026-10-18, só o início da próxima é automático.
- Parte 4 (2026-10-19): barra e selos na Lista; arrastar para dispensar, para voltar ou para iniciar a etapa pendente; arrastar em tela de toque; atalho de teclado para concluir no cartão; ordem dos cartões por dias parados; prazos por etapa (o limite de processo parado é o número único 15, até a v1.5); outras pendências como selo.
- Parte 3 (2026-10-19): o novo desenho do cartão do Quadro (barra de progresso e selos) é da parte 4; busca no Quadro; reunião com mais de uma data (continua uma por processo, ADR 0013); endereço próprio para o Histórico e para o Editar; abrir o verso por cima da tela do setor; qualquer mudança no banco.
- Prazo padrão das etapas, prazo do andamento e indicador de atraso: funcionalidade 8.
- Campo "fase" (AS-IS ou TO-BE) no catálogo: quando existir a fase 2.
- Mais de um nível de subprocesso.
- Importação de processos: funcionalidade 10.
- Edição simultânea do mesmo item por duas pessoas: vale a última gravação, e as regras de sequência continuam garantidas pelo banco. A exceção são as Anotações (desde 2026-10-23), que recusam a gravação em conflito.
- Anotações (2026-10-23): histórico das versões do texto (ADR 0021); ícone de anotação no cartão do Quadro e busca pelo texto das Anotações (para o backlog, se fizerem falta); atualização ao vivo do texto quando outra pessoa grava com o verso aberto (o conflito só aparece ao gravar); formatação (negrito, listas, links); Anotações nas etapas ou nas versões; Anotações nas planilhas e nos dashboards.
- Registro de quem consultou (backlog).

## Observações

- **Mudança de 2026-10-22 (publicacao-e-arquivamento, ADR 0020):** o concluído passa a exigir também a escolha "não" ou a Publicação resolvida; a Publicação não se dispensa mais; o Quadro ganha a coluna Concluídos; o processo concluído pode ser arquivado e fica só na Lista, com selo e filtro; processo concluído fica sem etapa atual. O detalhe está em `.scratch/publicacao-e-arquivamento/spec.md`, que vale sobre esta spec no que divergir.
- Critérios conferidos olhando a tela, para o `/ship`:
  - `[visual]` O Quadro segue a identidade visual: fundo azul-acinzentado, cartões brancos, colunas por etapa, a linha azul "acesa" no cartão escolhido, e indicação de colunas fora da vista quando o quadro rola para o lado.
  - `[visual]` (Desde 2026-10-19, substitui o critério do painel lateral.) O verso abre como janela central de até cerca de 880 px, em duas colunas de 60% e 40%, a direita em fundo levemente cinza, com o Quadro ou a Lista escurecidos atrás; o cabeçalho fica fixo e a janela tem uma só rolagem; abaixo de 900 px de largura, ocupa a tela inteira em uma coluna.
  - `[visual]` O Agora é a única coisa acesa da janela: borda de 2 px em `azul` e o único botão principal; na Consulta, borda cinza e sem botões; suspenso em âmbar claro, cancelado em cinza claro e concluído em verde claro.
  - `[visual]` As etapas são linhas compactas e quietas: só o verde de concluída e o azul da atual têm cor; o resto é cinza, com selos neutros para opcional, dispensada e anterior; a gaveta do detalhe abre sem empurrar a janela para fora da tela.
  - `[visual]` Nos arquivos, a versão mais recente se lê numa linha ("V2 · 02/10 · falta relatório"), com os botões dos arquivos com a barrinha de cor do tipo e o espaço tracejado do arquivo que falta no lugar dele.
  - `[visual]` O cabeçalho do verso mostra pílula só em suspenso, cancelado e concluído; o menu "⋯" tem os três grupos com Excluir em vermelho no fim.
  - `[visual]` O Novo processo e o Editar encolhem a janela para uma coluna de cerca de 560 px, com os botões no rodapé fixo; o carregando mostra blocos cinza no formato final, sem a janela mudar de tamanho quando os dados chegam.
  - `[visual]` A busca da Lista fica antes dos filtros, com lupa e "×", e o trecho encontrado aparece marcado em amarelo claro no nome.
  - `[visual]` O caminho de etapas mostra as resolvidas com ✓, a atual em azul com o sublinhado aceso e as futuras apagadas; sem etapas do setor (desde 2026-10-18). Desde 2026-10-19, vale a lista compacta do verso, descrita acima.
  - `[visual]` As pílulas (Suspenso, Cancelado, Concluído, Subprocesso, A classificar, Inativo, Inativa) têm cor e texto, nunca só cor.
  - `[visual]` (Parte 4.) O cartão normal fica limpo: a barra fina em cinza e azul e, no máximo, versão e subprocessos em texto neutro; só "{n} dias nesta etapa" e "Relatório pendente" têm cor (âmbar); os selos quebram de linha sem estourar a largura da coluna.
  - `[visual]` (Parte 4.) Durante o arrastar, só a coluna de destino ganha fundo azul claro, borda contínua azul e sombra interna, e as demais colunas esmaecem; o cartão arrastado fica levemente apagado no lugar de origem.
  - `[visual]` (Parte 4.) Agrupado por responsável, as colunas têm o nome da pessoa (com "Inativo" quando cabe) e os cartões mostram o nome da etapa no lugar da foto; "Agrupar por" e "Só os meus" ficam na barra do Quadro, junto dos filtros.
  - `[visual]` (Anotações, 2026-10-23.) O bloco Anotações é o primeiro da coluna direita, quieto como o resto do contexto: campo sem moldura pesada, "Salvando…" e "Salvo" pequenos e cinza ao lado do título, a linha "Alterado por" discreta abaixo; só a falha (vermelho) e o conflito (amarelo) têm cor; o campo cresce sem empurrar a janela para fora da tela e rola por dentro depois da altura máxima.
  - `[visual]` A Lista é uma tabela compacta, no padrão das listas de cadastros.
  - `[visual]` Para a Consulta, Quadro, Lista, painel, tela do setor e histórico não mostram campos editáveis nem botões de alteração.
  - `[visual]` As janelas de nota e de motivo seguem o padrão da janela de confirmação, com o campo de texto e o botão de confirmar desabilitado enquanto vazio.
  - `[visual]` Mensagens de falha e de recusa em vermelho; avisos (setor que será incluído, macroprocesso que muda) em amarelo.
  - `[visual]` A janela de avanço segue o padrão da janela de confirmação: título, pergunta, lista de nomes em rádios com "Ninguém por enquanto" por último, e a nota acima dela em Dispensar e Realizada anteriormente; o [Assumir] é um botão discreto na linha da etapa, no padrão dos botões secundários (desde 2026-10-18).
- **Divergências com `.scratch/especificacao.md`**, decididas na sabatina de 2026-10-13:
  - o responsável do setor virou cadastro próprio, com vários por setor (a especificação tinha um responsável no setor);
  - os campos "fase" e "prazo padrão" do catálogo, e vigência e próxima revisão do processo, foram adiados;
  - a regra 14 foi para a funcionalidade 6;
  - o catálogo fica numa aba da Administração, como a especificação prevê.
- **Divergências da parte 4 (2026-10-19)** com o Dashboard v1 da especificação (que passou à v1.5): no cartão, "versão sem relatório" só vira pendência da Revisão interna em diante, e o limite de processo parado é um número único (15 dias), não um por etapa. O painel da v1.5 decide a sua própria conta.
- **Divergências de 2026-10-18** (ADR 0013): etapas do setor, responsáveis do setor e reuniões saem da plataforma; a especificação previa os três.
- **Decisões tomadas ao escrever a spec, a confirmar na leitura:**
  - **Código fixo da etapa:** cada etapa do catálogo tem um código fixo, para as funcionalidades 5 e 6 reconhecerem as etapas que vão andar sozinhas.
  - **Voltar:** devolve a "pendente" todas as etapas seguintes resolvidas (concluídas, dispensadas ou realizadas anteriormente). A sabatina falou em "concluídas"; deixar uma dispensada para trás tornaria o caminho incoerente.
  - **Etapa nova no catálogo:** entra também nos processos suspensos (eles não estão concluídos nem cancelados) (o "em todos os setores" valia para as etapas do setor, retiradas em 2026-10-18).
  - **Desativar uma etapa em andamento:** o processo continua nela até concluí-la. A coluna da etapa desativada aparece no Quadro enquanto houver processo nela.
  - **Parte 2 (2026-10-18):** o início da próxima é a data de hoje (corrigível depois, como as outras datas); a janela de voltar segue a mesma regra de opção marcada da janela de avanço; a trava do autor é conferida sempre que o responsável da Revisão interna passa a ser alguém (não quando fica vazio nem quando não muda); a falha na gravação do avanço mostra a mensagem de erro de gravação e deixa as etapas como estavam.
  - **Parte 3 (2026-10-19):**
    - "Concluído em" é a data da última etapa obrigatória resolvida;
    - Histórico e Editar não têm endereço próprio (recarregar volta ao verso);
    - a etapa atual pendente (como a primeira de um processo novo) tem o botão principal [Iniciar {etapa}] no Agora;
    - nas etapas pendentes depois da atual, o "Trocar" e o [Assumir] ficam na gaveta, para não perder a escolha antecipada do responsável (histórias 42 e 102);
    - o aviso "Este processo está {suspenso | cancelado}: {motivo}. Retome-o para registrar o andamento." dá lugar ao Agora suspenso ou cancelado, com o motivo e [Retomar];
    - a apresentação das versões e da reunião no verso muda o desenho das seções de `documentos-versoes` e `reunioes`, sem mudar o que elas fazem; as specs delas recebem uma nota apontando para cá;
    - [Limpar filtros] limpa também a busca.
  - **Parte 4 (2026-10-19):**
    - "Relatório pendente" não vale para a última versão histórica (ela é só leitura e não recebe relatório);
    - o selo "Sem responsável" some quando o Quadro está agrupado por responsável, porque a coluna já diz;
    - o cartão suspenso mantém a barra e os selos que não são de tempo (versão, reunião, subprocessos, Sem responsável);
    - "Só os meus" é o filtro Responsável com o próprio id, sem parâmetro novo no endereço;
    - o arrastar usa o recurso nativo do navegador, sem biblioteca nova; por isso não funciona por toque, o que a sabatina queria;
    - [Limpar filtros] também desliga o "Só os meus" (é um filtro), mas mantém o agrupamento.
  - **Anotações (2026-10-23):**
    - a linha "Alterado por" aparece sempre que já houve uma gravação, inclusive quando alguém apagou todo o texto, porque, sem histórico, é o único rastro de quem apagou; só some no processo que nunca teve anotação gravada;
    - a contagem aparece a partir de 1.800 caracteres ("perto do limite" da sabatina);
    - o campo cresce até cerca de 12 linhas;
    - fechar com texto pendente grava na hora e só pergunta se a gravação falhar ou houver conflito (perguntar sempre incomodaria a cada fechamento logo depois de digitar); vale também ao trocar o conteúdo da janela (pai, subprocesso, Histórico, Editar);
    - no conflito, o salvamento automático para até "Ver o texto atual", para não repetir uma gravação que será recusada;
    - o texto é lido ao abrir o verso e depois de "Ver o texto atual", sem atualização ao vivo;
    - o texto se grava como digitado (sem tirar espaços das pontas), e só espaços contam como vazio;
    - o "antes" do evento de exclusão do processo não traz as Anotações (seguem a mesma regra de ficar fora dos eventos);
    - entregue em 2026-10-23: o botão Voltar do navegador troca o endereço sem passar pelo verso e **não** guarda a saída (só o botão de fechar, o Esc, o pai ou o subprocesso, o Histórico, o Editar e o aviso do navegador ao fechar a aba ou recarregar); a falha de gravação mostra sempre a frase fixa, qualquer que seja o motivo, e some quando o texto volta ao que já está gravado; sem o nome de quem alterou (gravação feita direto no banco), a linha diz "Alterado em {dd/mm}, {hh:mm}"; ao abrir, o bloco mostra "Carregando as anotações…" e, se a leitura falhar, o erro com [Tentar de novo]; depois de "Ver o texto atual" o foco volta ao campo; o limite de 2.000 conta unidades do navegador no campo e caracteres no banco (texto com emoji é cortado um pouco antes do limite real).
  - **Entrega da parte 4 (2026-10-19):** o selo "Relatório pendente" compara a posição da Revisão interna no caminho do próprio processo (já na ordem do catálogo); processo sem a Revisão interna no caminho não ganha o selo.
- **Tamanho:** a funcionalidade tem várias entregas. A sabatina permitiu deixar a Lista para um ticket posterior.
- **Rede do escritório:** a migração vai pelo workflow "Migrar banco de desenvolvimento" e precisa ser registrada em `supabase/AMBIENTES.md` para o `migration repair` antes da primeira publicação em produção.
- **Privilégios padrão:** toda tabela ou view nova em `public` reprova o teste `10_privilegios_padrao` até receber o seu `revoke`.

Entregue em 2026-10-14 (commit f1cc3cf), com ressalva: critérios [visual] presumidos (a tela não foi conferida)
Entregue em 2026-10-18 (commit e54f51b)
Entregue em 2026-10-19 (commit 8d01ca8)
Entregue em 2026-10-19 (commit 8ef4091)
Entregue em 2026-10-19 (commit f3a12b3), com ressalva: critérios [visual] da parte 4 presumidos (a tela não foi conferida nesta entrega); Enter no cartão e voltar/recarregar do agrupamento sem teste de navegador

Entregue em 2026-10-20 (commit 8a7efb7)

Entregue em 2026-10-23 (commit ae1fb54), com ressalva: critérios [visual] da mudança de publicacao-e-arquivamento presumidos (a tela não foi vista); revisão de segurança foi a de reserva (menos completa); as ressalvas das entregas anteriores seguem valendo

Entregue em 2026-10-23 (commit fa00e9a)
Entregue em 2026-10-25 (commit cc17e13), com ressalva: critérios [visual] vistos só na vitrine local, com módulos falsos (as janelas de registrar revisão e aprovação e qualquer tela com o login real não foram vistas); revisão de segurança foi a de reserva (menos completa); as ressalvas das entregas anteriores seguem valendo
Entregue em 2026-10-25 (commit 4ce3e40), com ressalva: critérios [visual] dos tickets 26 e 27 presumidos (a tela não foi vista, nem na vitrine local); revisão de segurança foi a de reserva (menos completa); a Edge Function planilhas-dos-dashboards ainda precisa ser republicada no desenvolvimento; as ressalvas das entregas anteriores seguem valendo
Entregue em 2026-10-26 (commit 2c4ff1d), com ressalva: critérios [visual] da visualização por setores (título em duas linhas com nome longo, marca "inativo") vistos só na vitrine local, com módulos falsos, nunca com o login real; revisão de segurança foi a de reserva (menos completa); as ressalvas das entregas anteriores seguem valendo
Implementado em 2026-10-26 (commit 6052a4f)

Entregue em 2026-10-27 (commit 17ce602), correção do bug de criar processo (permissão da coluna da data da modelagem piloto); revisão de segurança foi a de reserva (menos completa); as ressalvas das entregas anteriores seguem valendo

Entregue em 2026-10-27 (commit c2b089f), com ressalva: critérios [visual] da mudança travas-em-avisos presumidos (a pergunta da confirmação de arquivos com a lista das duas etapas e a janela "Editar número" com prévia e avisos em 1366×768 não foram vistas; o "⋯" ao lado do rótulo foi visto na tela real); revisão de segurança foi a de reserva (menos completa: o /security-review não achou mudanças a revisar), com a leitura de chamador.ts, pastas.ts e dos módulos de tela por fazer; função arquivos-no-drive (ação renumerar) provada no Drive real em 2026-10-27, mas a publicação a partir da main não foi reconferida; as ressalvas das entregas anteriores seguem valendo

Implementado em 2026-10-27 (commit 29e2804): macroprocesso fora da frente do cartão do Quadro; [visual] item 5 presumido (não visto na tela).

Entregue em 2026-10-27 (commit 69f8b43), com ressalva: critério [visual] 5 da mudança "macroprocesso fora do cartão" presumido (espaçamento regular e alinhamento dos cartões não vistos na tela, que exige login); revisão de segurança dispensada (mudança só de exibição, sem login, dado de fora nem banco); as ressalvas das entregas anteriores seguem valendo

Entregue em 2026-10-27 (commit 764e74d), com ressalva: critérios [visual] da mudança visual-do-cartao presumidos (a tela nunca foi vista com o login real; vista só a faixa por etapa na cor 1, na vitrine local com módulos falsos: faltam o nome na faixa por setor, a faixa do parado, as 30 cores e nome longo, os selos do verso, da Lista e do título da coluna, o quadradinho das caixas, a grade de cores, a barra lisa e as etiquetas vivas); revisão de segurança foi a de reserva (menos completa: o /security-review só viu documentação); painel do Supabase de desenvolvimento não reconferido; função arquivos-no-drive ainda sem nova publicação no desenvolvimento; as ressalvas das entregas anteriores seguem valendo

Entregue em 2026-10-28 (commit 1af2485), com ressalva: critérios [visual] 6 a 8 da seção "Coluna tingida e etiquetas fortes" presumidos (não vistos na tela, que exige login)

Implementado em 2026-10-28 (commit f1d045f) — seção "Coluna tingida e etiquetas fortes"; polida em 2026-10-28; os critérios [visual] 6 a 8 seguem por conferir com o login real.


Implementado em 2026-10-28 (commit 8d8cb7a) — seção "Ajustes do Quadro e da Lista"; os critérios [visual] 4 a 7 seguem por conferir com o login real.

Entregue em 2026-10-28 (commit 7ea4c43), com ressalva: critérios [visual] 4 a 7 da seção "Ajustes do Quadro e da Lista" presumidos (não vistos na tela, que exige login), em especial a altura da coluna por setor (`max-height: 100%`) com muitos cartões; revisão de segurança dispensada (mudança só de aparência, sem login, dado de fora, migração ou dependência); as ressalvas das entregas anteriores seguem valendo

Entregue em 2026-10-28 (commit 31544ac), com ressalva: critérios [visual] 5 a 7 de cor-solida-do-setor presumidos no app real (vistos só numa página de teste com as folhas de estilo reais e marcação montada à mão; a tela com o login real não foi vista); revisão de segurança dispensada (só CSS e um módulo puro de cor, sem login, dado de fora ou banco)
