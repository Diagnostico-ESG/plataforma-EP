# Sabatina da parte 3 — Verso do cartão (processos-etapas)

Iniciada em 2026-10-19 pelo `grill-with-docs`. Marco: `marco/2026-10-19-inicio-verso-do-cartao`. O usuário pediu atenção especial ao desenho (apresentação das informações), com olhar de designer de interface.

## Fatos do código (levantados antes das perguntas)

- O painel atual (`PainelDoProcesso.tsx`) é lateral, 520 px, com abas Detalhes e Histórico; as ações da etapa atual ficam dentro da lista de etapas (`CaminhoDeEtapas.tsx`).
- A Lista já abre o painel e tem filtros (setor, macroprocesso, etapa, tipo, responsável, situação); não tem busca por nome. O Quadro mostra só os vivos; a situação só filtra na Lista.
- A tela do setor (`ProcessosDoSetor.tsx`) abre a Lista filtrada pelo setor com o processo aberto.
- Reunião é uma data só por processo (`processos.data_da_reuniao`, ADR 0013).
- Catálogo: Modelagem piloto, Relatório e modelagem técnica, Revisão interna, Revisão pelo setor, Aprovação pelo setor, Publicação.

## Rodada 1 (todas as recomendações aceitas)

1. **Reunião:** uma data por processo, como está; o "lista de datas" do mapa é anterior à parte 1. Sem mudança no banco.
2. **Colunas:** cabeçalho com sigla, nome, macroprocesso, pílulas, "⋯" e fechar. Esquerda (o trabalho): Agora, Etapas compactas, Arquivos. Direita (o contexto): Reunião, Sobre (setor, macroprocesso, tipo, origem, contexto, observações), Estrutura (pai ou subprocessos).
3. **Agora:** etapa atual, responsável (ou [Assumir]), dias na etapa, um botão principal [Concluir <etapa>]; Dispensar e Realizada anteriormente num "⋯" do Agora. Etapas só de leitura; clicar abre o detalhe da etapa (datas, nota, Corrigir datas, Voltar a esta etapa). Suspenso/cancelado: motivo e Retomar. Concluído: "Concluído em dd/mm". A janela "Quem fica com a próxima etapa?" (parte 2) continua igual.
4. **Histórico:** no "⋯", substitui o conteúdo da janela com "← Voltar ao processo". As abas saem.
5. **Consulta:** vê o verso inteiro só para ler; somem botões do Agora, [Assumir], marcação da reunião, envio e substituição de arquivos e as ações do "⋯" exceto Histórico; baixar continua.
6. **Tela estreita:** abaixo de cerca de 900 px, a janela ocupa a tela e vira uma coluna (esquerda em cima, direita embaixo).
7. **Busca da Lista:** só pelo nome, sem diferenciar maiúsculas e acentos, guardada no endereço como os filtros. O Quadro fica sem busca.
8. **Novo processo:** na mesma janela; depois de criar, a janela mostra o verso do processo criado.
9. **Editar:** pelo "⋯"; o formulário do Novo processo ocupa a janela; Salvar ou Cancelar volta ao verso.
10. **Pai e subprocessos:** clicar troca o conteúdo da mesma janela (o endereço muda); Esc fecha tudo.
11. **Arquivos:** versão mais recente numa linha de destaque ("V2 · 02/10 · falta relatório"); anteriores recolhidas em "Versões anteriores (n)"; [Enviar versão] visível; [Acrescentar relatório] na linha de destaque só quando falta; "Registrar versão histórica" num "⋯" da seção.
12. **Tela do setor:** mantém o comportamento (Lista filtrada pelo setor com o verso por cima).

## Rodada 2 — desenho (todas as recomendações aceitas)

Esboço mostrado na conversa: janela branca, cabeçalho com sigla em mono, nome em 19 px/700, linha "quadradinho do macroprocesso · nome · tipo", "⋯" e fechar; esquerda branca (Agora com linha acesa de 2 px em `azul` e o único botão principal; Etapas; Arquivos); direita em fundo levemente cinza (Reunião com a barrinha amarela de reunião, Sobre, Estrutura). Princípios: uma só coisa acesa (o Agora); o normal fica quieto, só o que foge ganha cor; trabalho à esquerda, contexto à direita.

13. **Situação no cabeçalho:** sem pílula em andamento; pílula só para Suspenso (âmbar), Cancelado (cinza) e Concluído (verde). O tipo vai em texto na linha do macroprocesso.
14. **Dias na etapa:** número em cinza até 15 dias; acima, pílula âmbar (texto a definir na rodada 3), o mesmo limite do selo da parte 4.
15. **Status na lista de etapas:** concluída ✓ verde; atual ponto azul com a linha em `azul-claro`; pendente círculo cinza; opcional pendente círculo tracejado com selo "opcional"; dispensada traço cinza, nome riscado de leve e selo "dispensada"; realizada anteriormente ✓ cinza com selo "anterior". Linha resolvida mostra data (mono) e iniciais de quem resolveu.
16. **Detalhe da etapa:** gaveta embaixo da própria linha (datas, nota, Corrigir datas, Voltar a esta etapa); uma gaveta aberta por vez.
17. **Arquivo que falta:** espaço tracejado "+ Acrescentar relatório" no lugar do arquivo, com a pílula âmbar "falta relatório" ao lado da versão.
18. **Janela:** até cerca de 880 px de largura, 60/40; até 90% da altura; uma só rolagem, da janela inteira, com o cabeçalho fixo; fundo escurecido; entrada suave de cerca de 150 ms, desligada com "reduzir movimento".
19. **Menu "⋯" do processo:** Histórico · Editar · Reclassificar | Suspender (ou Retomar) · Cancelar | Excluir em vermelho. A Consulta vê só Histórico.
20. **Sobre:** textos longos mostram até 4 linhas com "Ler mais"; campos vazios somem.
21. **Agora nos casos especiais:** Consulta vê o cartão sem botões, borda cinza, "Com Ana M. há 6 dias"; sem responsável, [Assumir] secundário ao lado do principal; suspenso em fundo âmbar claro com motivo e [Retomar] principal; cancelado cinza com motivo e [Retomar]; concluído verde claro com "Concluído em dd/mm" (a parte 5 acrescenta a versão aprovada e o E-protocolo).
22. **Busca da Lista:** campo no começo da barra, antes dos filtros, com lupa, exemplo "Buscar pelo nome", filtra ao digitar, "×" limpa, trecho encontrado marcado em amarelo claro no nome.

## Rodada 3 (todas as recomendações aceitas)

23. **Sem a palavra "parado" para dias na etapa:** no código, "parado" já quer dizer suspenso ou cancelado. A pílula acima de 15 dias diz "18 dias nesta etapa", em âmbar; a parte 4 usa o mesmo texto no selo. Sem termo novo no `CONTEXT.md`.
24. **Novo processo e Editar:** a janela encolhe para uma coluna de cerca de 560 px; cabeçalho "Novo processo" ou "Editar <nome>"; rodapé fixo com [Cadastrar]/[Salvar] principal e Cancelar. Ao criar, a janela se alarga e mostra o verso, com o aviso "Processo cadastrado".
25. **Histórico:** largura toda, "← Voltar ao processo" e título no topo; linha do tempo do mais novo para o mais antigo, agrupada por dia ("Hoje", "Ontem", "12/10"); cada evento com data e hora em mono, iniciais de quem fez, a frase do que mudou e o motivo ou a nota em cinza. Esc no histórico volta ao processo; o segundo Esc fecha.
26. **Estados:** carregando abre a janela no tamanho final com blocos cinza no formato das duas colunas; erro de conexão com mensagem e [Tentar de novo] no centro; processo excluído com a mensagem atual e [Voltar].
27. **Estrutura:** cada subprocesso numa linha, nome em link azul e a etapa atual em cinza embaixo; situação só se não for em andamento. No subprocesso, a seção vira "Faz parte de" com o pai. Sem subprocessos, a seção some.
28. **Trocar responsável:** "Trocar" abre uma lista suspensa no próprio Agora (você primeiro, com "(você)"; "Ninguém por enquanto" no fim); grava ao escolher, sem confirmação.
29. **Teclado e leitor de tela:** foco vai ao nome do processo ao abrir; Tab circula só dentro da janela; Esc fecha; ao fechar, o foco volta ao cartão ou à linha de origem; a janela é anunciada como "Processo <nome>".

## Fecho

Árvore de decisões percorrida em 2026-10-19. Sem mudança no banco, sem termo novo no `CONTEXT.md` e sem ADR: as decisões são de desenho, fáceis de rever, e a escolha da janela central já está registrada em `.scratch/analise-experiencia-2026-10-17.md` e no mapa. A reunião continua uma data só (rodada 1, item 1), com a marcação no próprio lugar ("Alterar data" vira o campo de data). Próximo passo: `to-spec`, atualizando `.scratch/processos-etapas/spec.md`.
