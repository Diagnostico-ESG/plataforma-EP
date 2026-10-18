# Sabatina — parte 2 (Etapas mais rápidas), 2026-10-18

Muda `processos-etapas`. Decisões do usuário (todas as recomendações aceitas). Porquê geral: ADR 0014. Termos: `CONTEXT.md` ("Avançar", "Responsável da etapa", "Voltar a uma etapa", "Assumir", "Revisor").

1. **Janela "Quem fica com a próxima etapa?"** ao concluir: lista os usuários ativos Administrador e Integrante, mais "Ninguém por enquanto". Vem marcado o responsável que a próxima etapa já tem; sem ele, quem está concluindo.
2. **"Ninguém por enquanto" também inicia:** a próxima entra em andamento sem responsável, à espera de [Assumir].
3. **A próxima etapa** é a primeira pendente depois da resolvida (pula as já resolvidas, caso de etapa acrescentada ao catálogo). Sem pendente depois: não há janela; o processo fica concluído se todas as obrigatórias estiverem resolvidas.
4. **Próxima opcional (Publicação):** inicia como qualquer outra; se não for feita, dispensa-se depois. A janela não oferece "dispensar".
5. **Dispensar e realizada anteriormente** avançam do mesmo jeito; a escolha do responsável entra na mesma janela da nota, abaixo dela.
6. **[Iniciar] continua**, um clique sem janela, para a etapa atual pendente (Modelagem piloto de processo novo; casos raros de catálogo). O processo novo não nasce com etapa em andamento.
7. **Tudo ou nada:** resolver a etapa e iniciar a próxima numa função só do banco.
8. **Histórico:** dois eventos, mesmo autor e hora: "Concluiu a etapa X" (ou dispensou, ou realizada anteriormente) e "Iniciou a etapa Y", com o responsável. Sem texto novo.
9. **[Assumir]** para Administrador e Integrante, em etapa pendente ou em andamento sem responsável. Em etapa resolvida, só o seletor.
10. **Trava do autor na Revisão interna:** quem enviou a versão mais recente não histórica não pode ser responsável dela. O banco recusa na janela, no seletor e no [Assumir]; a janela nem mostra o autor e, se o autor é quem conclui, vem marcado "Ninguém por enquanto". Conferida só no momento da escolha. Sem versão não histórica, sem restrição.
11. **Janela acessível:** a nativa do ADR 0003; opções em botões de rádio com o nome de cada pessoa; foco na opção marcada; setas trocam; Enter confirma em "Concluir e iniciar {próxima}"; Esc fecha sem gravar nada; o título diz qual etapa se conclui e qual vem. Na última etapa, sem janela.
12. **Voltar a uma etapa** ganha, na janela do motivo, "Quem fica com esta etapa?", com o responsável atual dela marcado (a trava do autor vale; se barrado, "Ninguém por enquanto").
13. **Brecha aceita:** assumir a Revisão interna ainda pendente e depois enviar a versão da etapa 2. Fecha-a a regra da parte 5 (quem registra a revisão nunca é o autor da versão revisada). Anotada no mapa.
14. A parte 2 assume o [Capturar] (agora [Assumir]) e a trava do autor que estavam na spec de `revisoes-aprovacao`; a revisão daquela spec continua na parte 5.
