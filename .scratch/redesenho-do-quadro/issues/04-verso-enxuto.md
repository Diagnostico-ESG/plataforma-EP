# 04: Verso enxuto

**Como resolve a sua parte:** o verso de hoje divide tudo em duas colunas, e as ações da etapa ficam espalhadas por elas. Este ticket refaz o verso no desenho da verso-3: o que mais se usa no cabeçalho (a ação principal da etapa atual), uma linha para os dados e outra para os campos da etapa, e no corpo a versão mais recente com os arquivos em lista, ao lado das Anotações com o dobro do espaço. Tudo dentro da janela fixa de cerca de 880 × 740, que não cresce.

**What to build:** o verso enxuto, reaproveitando os blocos que já existem (Anotações, versões, anexos, registros de revisão, aprovação e publicação, datas, estrutura) no lugar novo, sem mudar o que fazem. No lugar da miniatura fica, por enquanto, um quadro com o ícone do fluxograma, que o ticket 05 troca pela imagem. Spec: seção "Redesenho do Quadro" de `.scratch/processos-etapas/spec.md`, histórias 61 a 74.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Janela de tamanho fixo, sem abas; o que passa rola por dentro.
- [ ] Cabeçalho com selo do setor, nome do processo, ação principal da etapa atual em azul ([Registrar revisão] na Revisão interna, [Registrar aprovação] na Aprovação pelo setor, [Registrar publicação] na Publicação e em Concluídos sem publicação; nenhuma nas outras), menu "···" e fechar.
- [ ] Linha de dados com setor, macroprocesso, tipo (com o pai do subprocesso e os subprocessos, que abrem ao clicar) e situação.
- [ ] Trilha, linha do Agora (etiqueta, responsável com Trocar, Mover para) e avisos lado a lado, como hoje.
- [ ] Campos da etapa atual (data da modelagem piloto, data da validação, E-protocolo, registros) numa linha logo abaixo dos avisos, só quando a etapa os tiver.
- [ ] Corpo com a versão mais recente (lugar da miniatura, rótulo, quem enviou e quando, relatório que vale, [Enviar versão], arquivos em lista vertical com o selo do tipo em mono, nome e tamanho, abrindo ou baixando ao clicar); sem versão, "Nenhuma versão enviada ainda" com [Enviar versão] quando permitido.
- [ ] "Versões anteriores" e "Outros anexos" recolhidos, com a contagem, abrindo ao clicar, com tudo o que fazem hoje.
- [ ] Anotações ao lado da versão, com o dobro da altura de hoje, escrevendo direto e gravando sozinhas, sem "Editar".
- [ ] Histórico no "···", abrindo no lugar do processo com [Voltar ao processo].
- [ ] Consulta vê o verso inteiro sem ação principal, sem [Enviar versão] e com as Anotações só para ler.
- [ ] Os testes atuais do verso continuam passando (o que o verso faz não muda); testes de tela novos para a ação principal de cada etapa, a linha de dados e a linha dos campos da etapa.
- [ ] `[visual]` O verso segue a verso-3 em 880 × 740, com os arquivos em lista vertical e as Anotações com o dobro da altura, sem nada vazando da janela em 1366×768.
