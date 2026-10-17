# Análise de experiência do usuário — 2026-10-17

Pedido do usuário: olhar a plataforma do ponto de vista de quem é avesso a burocracia e precisa ser convencido de que ela é mais fácil que planilha e e-mail. Ponto de partida citado por ele: o painel do processo (abre à direita no Quadro) tem informação demais, é longo, sem separação clara, com muito texto.

Método: vitrine local com dados inventados (`vitrine.local/`, fora do git), tela 1280×800, perfil Administrador, um processo na Revisão interna com 2 versões, 2 reuniões e 1 subprocesso. Leitura do código do painel e da spec de `revisoes-aprovacao`.

## O que se mede no painel hoje

- **Altura:** cerca de 2.280 px, ou seja, quase 3 telas de rolagem num monitor comum.
- **Controles:** 30 botões e 6 caixas de seleção visíveis de uma vez.
- **Ordem:** Etapas do setor (3) → Etapas do processo (6) → Dados → Subprocessos → Reuniões → Versões → Ações do processo. O que a pessoa mais procura ("em que pé está, o que falta, cadê o arquivo") está no meio ou no fim.

## Problemas do painel, do mais grave ao menos

1. **Não responde à pergunta principal.** Quem abre um processo quer saber: em que etapa está, com quem, desde quando e o que falta. Hoje a resposta está diluída em 9 linhas de etapa iguais; a etapa atual só se distingue por uma barra azul fina.
2. **Tudo aberto ao mesmo tempo.** Cada etapa, inclusive as futuras, mostra "Início: — · Conclusão: —" e "Responsável: [Sem responsável]". As etapas do setor (que não pertencem ao processo e não se mexem aqui) ocupam o topo.
3. **Ações raras com o mesmo peso das frequentes.** "Corrigir datas" e "Voltar a esta etapa" se repetem em cada etapa concluída, com o mesmo botão do "Concluir". Suspender, Cancelar, Reclassificar, Editar e Excluir ficam lado a lado no rodapé, com o mesmo estilo; o Excluir (destrutivo) parece igual ao Editar.
4. **Sem hierarquia visual entre seções.** Os títulos de seção têm o mesmo tamanho do texto, as divisórias são linhas finas e só as versões viram cartões. O olho não encontra onde uma seção acaba.
5. **Repetição.** Sigla, macroprocesso e tipo aparecem no cabeçalho e de novo em "Dados do processo".
6. **Versões ruidosas.** Nomes de arquivo longos e sublinhados ("TSA_V2_Emitir Ofício.bpmn"), um "Substituir" ao lado de cada arquivo, as versões antigas tão abertas quanto a atual.
7. **Caixas de seleção nativas** sem estilo da identidade visual, que destoam do resto.

## Proposta para o painel (boas práticas aplicadas)

Princípios: **revelação progressiva** (mostrar primeiro o essencial e abrir o detalhe sob demanda), **uma ação principal por tela**, **agrupar por tarefa** e **ações raras dentro de um menu**.

1. **Cabeçalho fixo:** nome, "Setor · Macroprocesso", pílula da situação, avatar do responsável e um menu "⋯" com Editar, Reclassificar, Suspender, Cancelar e Excluir (este em vermelho, no fim). Some a seção "Dados do processo" do topo.
2. **Cartão "Agora"** logo abaixo: a etapa atual em destaque, quem cuida dela (ou [Assumir]), há quantos dias está nela e **um único botão principal** (ex.: [Concluir revisão interna]). Se algo impede a conclusão, o cartão diz o que falta ("Falta o relatório da V2").
3. **Linha do tempo compacta das etapas:** uma linha por etapa (marca de feito, nome, data, iniciais do responsável). Clicar numa etapa abre o detalhe dela (datas, nota, Corrigir datas, Voltar a esta etapa). As etapas do setor viram uma linha só: "Etapas do setor: 3 de 3 resolvidas · ver no setor".
4. **Abas em vez de rolagem:** Andamento (cartão Agora + linha do tempo + contexto e observações) · Arquivos · Reuniões · Histórico. Cada aba cabe numa tela.
5. **Aba Arquivos:** só a versão mais recente aberta, com rótulos curtos ("Fluxograma .bpmn", "Imagem .png", "Relatório") e um botão de baixar; Substituir vai para um "⋯" do arquivo; versões antigas recolhidas em "Versões anteriores (n)".
6. **Painel mais largo** (de 520 para cerca de 640 px) e espaçamento maior entre seções; títulos de seção mais fortes.

## O que pesa no uso diário, além do painel

1. **Dois cliques por etapa.** Hoje cada etapa precisa de [Iniciar] e depois de [Concluir], e concluir uma não inicia a seguinte. Nas 6 etapas do processo são 12 cliques, mais a escolha do responsável. Sugestão: concluir uma etapa já inicia a próxima e põe como responsável quem clicou (ou mantém o atual); o [Iniciar] some.
2. **Revisões e aprovação (ainda não executada) vai aumentar o painel e o trabalho.** A spec prevê [Capturar], uma seção nova com formulário de revisão e de aprovação, e travas que recusam o [Concluir] até a pessoa ir a outra seção registrar. Para quem é direto, isso é burocracia em dobro. Sugestão: **o próprio [Concluir] pede o que falta**. Concluir a revisão interna abre a janela "Sem alteração / Corrigida + comentário"; concluir a aprovação abre a janela "Número do E-protocolo + link". Um clique, um registro. As travas do banco continuam iguais. **É o momento mais barato para mudar: nenhum ticket foi executado.**
3. **"Capturar"** vale para qualquer etapa sem responsável, com o nome [Assumir] (mais claro).
4. **Falta uma tela "Comigo"**: o que está sob minha responsabilidade agora, do mais parado para o mais recente. É o argumento mais forte contra a planilha (ninguém precisa procurar o que fazer). Não depende de Prazos.
5. **Cartão do Quadro sem sinal de parado:** mostrar "há 12 dias" no cartão quando passa de um limite simples dá visibilidade sem depender da funcionalidade de Prazos (v1.5).
6. **Importação é condição de adoção:** sem a carga inicial, a equipe teria de redigitar tudo que está na planilha e não vai querer começar. Vale considerar planejá-la logo depois de Revisões e aprovação, antes do visualizador de fluxograma.
7. **Notas obrigatórias** (dispensar, realizada anteriormente, voltar, suspender) fazem sentido para o histórico, mas podem oferecer frases prontas para um clique.

## Ordem sugerida

1. Ajustar a spec de `revisoes-aprovacao` (item 2 acima) antes de executar os tickets.
2. Redesenho do painel do processo (propostas 1 a 6), que muda telas já entregues.
3. Concluir e seguir (item 1) e [Assumir] em qualquer etapa.
4. Tela "Comigo" e "há N dias" no cartão.
5. Reavaliar a posição da Importação na ordem.

Cada item entra no funil pelo `/demanda`.

## Cartão do Quadro (conversa de 2026-10-17, estilo Trello/Planner)

Hoje o cartão traz sigla, macroprocesso, nome e o avatar do responsável: diz "o que é", mas nada sobre "como vai". Proposta (maquete mostrada na conversa):

- **Sigla do setor + nome.** O macroprocesso sai do cartão (fica no filtro e no painel); "Subprocesso" continua como pílula só quando for o caso.
- **Barra de progresso** das etapas do processo: feitas em verde, atual em azul, com "2 de 6 etapas".
- **Selos que só aparecem quando há algo a dizer** (no máximo três por cartão): dias na etapa atual (âmbar acima de um limite, com borda âmbar no cartão), versão atual (V2), pendência que impede de concluir (vermelho, ex.: "falta relatório"), próxima reunião, número de subprocessos.
- **Responsável da etapa atual** no rodapé; sem responsável, um botão tracejado [Assumir].
- **Suspenso** fica apagado, com o motivo curto no rodapé.

Interações no estilo Trello:
- Arrastar o cartão uma coluna à frente = concluir a etapa atual (e iniciar a próxima). As travas continuam: se faltar algo, a janela pede (revisão, E-protocolo) ou o cartão volta com a frase do motivo. Voltar etapa continua só pelo painel, porque pede motivo.
- "Agrupar por: Etapa | Responsável" e o filtro "Só os meus" (o "Comigo" sai daqui, sem tela nova).

Custo técnico: a leitura do Quadro precisa trazer dias na etapa, versão atual, pendência, próxima reunião e número de subprocessos (uma view nova ou ampliada).

Decisões em aberto com o usuário: arrastar para concluir (sim ou só botão), limite de dias para "parado" e agrupar por responsável.

## Onde abre o detalhe (conversa de 2026-10-17)

Ideia do usuário: em vez do painel lateral, o processo abrir no próprio cartão. Avaliação:
- **Expandir dentro da coluna** (o cartão cresce no lugar): não recomendado. A coluna tem cerca de 250 px, empurra os outros cartões para baixo, quebra a leitura do quadro e não cabe etapas nem arquivos.
- **"Verso do cartão" em janela central larga** (como o Trello e o Planner fazem): recomendado. Cerca de 800 px, duas colunas (à esquerda: Agora, etapas compactas e arquivos; à direita: reuniões, sobre, subprocessos, histórico), ações raras no "⋯". Cabe em uma tela, é o padrão que quem conhece Trello espera, mantém o endereço próprio de cada processo e o Esc para fechar.
- **Painel lateral redesenhado:** alternativa, se o usuário quiser continuar vendo o quadro enquanto lê o processo.
Decisão em aberto com o usuário.

## Decisões do usuário (2026-10-17)

- **Detalhe do processo:** opção A, "verso do cartão" em janela central larga, em duas colunas, no lugar do painel lateral.
- **Histórico** vai para o menu "⋯" (pouco usado no dia a dia).
- **Versão em vigor clara** no verso e no cartão: é sempre a mais recente (sem termo novo no CONTEXT.md, decisão do usuário). Uma linha "V2 · 02/10" com o que falta (ex.: "falta relatório"); depois da aprovação, "V8 · aprovada · E-protocolo nº …". Versões anteriores recolhidas.
- **Reuniões reduzidas a marcação e data** (decisão do usuário): no verso, lista de datas e uma marcação rápida que pede só a data (tipo, setor e processo já vêm do processo). Saem de vez local, hora, participantes (usuários, responsáveis do setor e outros) e anotações, também na área de Reuniões. Motivo dado por ele: a existência do relatório já pressupõe que a reunião aconteceu. Como a produção ainda não existe, a perda é só de dados inventados do desenvolvimento; a remoção vai por migração nova. Reavaliar no `/demanda` se a área de Reuniões ainda se justifica com tão pouco dado.
- **Cartão:** acatadas as recomendações: arrastar uma coluna à frente conclui a etapa (com as travas); limite único de 15 dias para "parado"; "Agrupar por: Etapa | Responsável" e filtro "Só os meus".
- **Revisões e aprovação:** acatado o [Concluir] que pede o que falta (revisão ou E-protocolo) e [Assumir] em qualquer etapa sem responsável; concluir uma etapa inicia a próxima.
