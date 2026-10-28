# Cor sólida do setor

Status: ready-for-agent

Funcionalidade 13 do `.scratch/projeto.md`. Decisões na sabatina `.scratch/cor-solida-do-setor/sabatina.md` (2026-10-28) e no ADR 0033, que revê o degradê dos ADRs 0030 e 0031. Prévia aprovada: `.scratch/cartoes-da-aplicacao-solidos.png`. Acréscimo datado em `.scratch/identidade-visual.md`. Muda as specs entregues de `processos-etapas` e `cadastros-basicos`, que ganharam uma nota apontando para esta spec e a linha `Em revisão desde 2026-10-28`. Sem mudança no banco. Esta spec é o único ticket.

## O problema

A **cor do setor** aparece hoje em degradê, do tom da paleta à esquerda para um tom um pouco mais escuro à direita, em todo lugar onde acompanha a sigla. Na prévia com os 30 setores lado a lado, o usuário preferiu a cor lisa: o degradê não acrescenta informação e faz a mesma cor parecer diferente de uma ponta à outra.

## A solução

A cor do setor passa a ser **lisa, no tom da paleta** (o tom claro que já está registrado), em todo lugar onde aparece:

- selo da sigla (Lista, verso, cadastros, setor envolvido do macroprocesso);
- faixa do cartão no Quadro por etapa e por responsável;
- cabeçalho da coluna no Quadro por setor;
- quadradinho das caixas de seleção de setor (inclusive o [Pôr setor] dos cadastros);
- grade de amostras do setor aberto, onde se escolhe a cor.

A cor fica igual em todas as telas, e a amostra mostra a cor do jeito que ela vai aparecer.

Não mudam:

- a paleta de 30 cores, os nomes delas e o número gravado no banco;
- o fundo tingido da coluna por setor, já feito do tom claro misturado com branco (perto de 30%) e que vai só até o último cartão (ADR 0032);
- a coluna de setor inativo, em cinza;
- a **barra de etapas**, que continua em degradê do azul claro ao azul escuro, porque não é cor de setor: a ponta escura marca a etapa atual;
- as etiquetas e as pílulas de Situação.

## Histórias de usuário

1. Como Integrante do EP, quero que a cor do setor seja lisa no selo da sigla, para reconhecer o setor por uma cor só, sem variação de uma ponta à outra.
2. Como Integrante do EP, quero que a faixa do cartão no Quadro por etapa e por responsável tenha a cor lisa do setor, para o Quadro ficar mais calmo.
3. Como Integrante do EP, quero que o cabeçalho da coluna no Quadro por setor tenha a cor lisa do setor, para ele combinar com o fundo tingido da mesma coluna.
4. Como Integrante do EP, quero que o fundo tingido da coluna por setor continue como está, para não perder a leitura de relance de onde fica cada setor.
5. Como Integrante do EP, quero que o cabeçalho continue mais forte que o fundo tingido da coluna, para o título se destacar da área dos cartões.
6. Como Integrante do EP, quero que o quadradinho das caixas de seleção de setor tenha a mesma cor lisa do selo, para achar o setor pela mesma cor que vejo no Quadro.
7. Como Integrante do EP, quero que as amostras da grade do setor aberto sejam lisas, para escolher a cor vendo exatamente como ela vai aparecer.
8. Como Integrante do EP, quero que a amostra em uso por outro setor continue com o ponto discreto no canto, para saber que a cor já está em uso.
9. Como Integrante do EP, quero que a amostra escolhida continue com a linha acesa, para ver qual é a cor atual.
10. Como Integrante do EP, quero que a sigla em texto escuro tenha contraste AA (4,5:1) sobre a cor lisa em qualquer das 30 cores, para ler sem esforço.
11. Como Integrante do EP, quero que a barra de etapas continue em degradê azul com a ponta escura na etapa atual, para ver de relance onde o processo está.
12. Como Integrante do EP, quero que a coluna de setor inativo continue cinza, para distinguir o caso à parte.
13. Como Consulta, quero ver a cor lisa do setor nas listas e no setor aberto, como os outros perfis.
14. Como pessoa que usa leitor de tela, quero que o selo, o quadradinho e a amostra continuem sem acrescentar nada ao nome do setor, para a leitura não mudar.
15. Como pessoa que usa o modo de contraste forçado do sistema, quero que a cor lisa continue aparecendo no selo, no quadradinho, na amostra e no cabeçalho, como aparecia o degradê.
16. Como responsável pela plataforma, quero que a paleta continue num único ponto do código, agora só com o tom claro de cada cor, para não haver tom calculado sem uso.

## Decisões de implementação

- **Módulo puro da cor do setor:** deixa de calcular o tom escuro. A cor passa a ter número, nome e tom (o claro); somem a regra fixa de escurecer e o fator dela. A função que entrega as variáveis CSS da cor passa a entregar só a do tom claro. O resto do módulo (cor fora de 1 a 30 cai na 1, nome da amostra, cores em uso) não muda.
- **Folhas de estilo:** os cinco fundos em degradê da cor do setor (selo, cabeçalho da coluna por setor, quadradinho das caixas e as duas regras da amostra da grade) passam a usar só o tom claro. Na amostra em uso, o ponto do canto continua sobre o fundo liso. A faixa do cartão usa o selo e acompanha a mudança. A proteção contra o modo de contraste forçado fica onde está.
- **Barra de etapas:** sem mudança, nem nos tokens nem no componente.
- **Comentários:** os que falam no degradê do setor (no módulo, no selo, na opção da caixa e no Quadro) passam a falar na cor lisa; o da barra continua falando em degradê.
- **Banco, tipos, telas e textos:** sem mudança. Nenhuma tela nova, mensagem nova ou estado novo de carregamento, vazio ou erro.

## Decisões de teste

- Um bom teste olha o comportamento de fora: o que o módulo entrega e o que o componente mostra, não o CSS. Fundo liso em vez de degradê não se vê no jsdom e fica nos critérios `[visual]`.
- **Ponto de teste principal:** o módulo puro da cor do setor, com os testes que ele já tem. O teste do tom escuro sai. O contraste da sigla escura, de pelo menos 4,5:1, passa a ser conferido só sobre o tom claro, para as 30 cores. O teste das variáveis CSS passa a esperar só a do tom claro.
- **Componentes:** os testes do selo e da opção da caixa que conferem a variável do tom escuro, ou que falam em "degradê" no nome, se ajustam para o tom claro. A grade de amostras não ganha teste novo.
- Arte anterior: os testes do próprio módulo, do selo do setor e da opção da caixa.

## Critérios de pronto

1. O módulo da cor do setor não tem mais tom escuro: a cor tem número, nome e tom claro, e as variáveis CSS trazem só o tom claro.
2. Teste de contraste: a sigla em texto escuro passa de 4,5:1 sobre o tom claro de cada uma das 30 cores.
3. Nenhuma folha de estilo usa a variável do tom escuro; a barra de etapas continua em degradê azul.
4. `npm test`, typecheck e lint passam.
5. `[visual]` Selo, faixa do cartão (por etapa e por responsável), cabeçalho da coluna por setor, quadradinho das caixas e amostras da grade aparecem com a cor lisa, iguais entre si e iguais à prévia aprovada.
6. `[visual]` No Quadro por setor, o fundo tingido da coluna continua como antes, e o cabeçalho liso se destaca dele; a coluna inativa continua cinza.
7. `[visual]` Na grade de amostras, a amostra em uso mostra o ponto no canto sobre o fundo liso, e a escolhida tem a linha acesa.

## Fora do escopo

- Mudar a paleta, os tons ou o número de cores.
- Mudar a barra de etapas, as etiquetas ou as pílulas de Situação.
- Mudar a altura ou a intensidade do fundo tingido da coluna por setor.
- Qualquer mudança no banco.

## Notas

- O motivo da preferência pelo liso não foi detalhado na sabatina. O ADR 0033 registra só que o usuário preferiu a prévia lisa (escolha padrão).
- Os critérios `[visual]` das entregas anteriores com a cor do setor seguem por conferir com o login real; esta entrega pode aproveitar a mesma conferência.

Implementado em 2026-10-28 (commit 39cd830)
