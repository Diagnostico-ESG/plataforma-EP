# Sabatina — exportacao-e-manutencao (2026-10-20)

Decisões do usuário; o porquê está no ADR 0017 e os termos no `CONTEXT.md` (Fase do Regimento, seção Dashboards).

## Fontes conferidas

- Planilha manual atual, aba "PRODUTO 33" (só lida, não muda): colunas Área (sigla), Macros, Processos, Question., I a III, IV Modelagem Piloto, Data da Modelagem Piloto, Modelagem Técnica, Revisão Interna, V Relatório Piloto, VI Revisão e validação, VII Publicação, Data da Publicação, VIII Avaliação, IX Remodelagem, Observações, V1 a V8.
- Dashboard em Power BI (licença do Tecpar), 4 páginas: 1 Visão geral (avanço I a VII, fase de execução IV a VII, total, publicados; conclusão por fase; setor × fase; modelagens piloto por mês com meta 12); 2 por fase (concluídos, prontos para iniciar, aguardando, setores com a fase concluída; processos por setor); 3 tabela processo × fase com situação e observações; 4 pública (total de processos, setores, % das etapas concluídas, barras por fase I a III, IV, V, VI, VII). Páginas 1 a 3 internas, 4 pública.
- Data Studio na conta institucional do CED: liberado; link "Público" e "Não listado" permitidos (verificado em 2026-10-20; termos aceitos pelo usuário).

## Decisões

1. **Duas planilhas novas**, criadas em branco pelo usuário no Drive compartilhado do CED (o robô já tem acesso); os endereços ficam num único ponto de configuração. A planilha manual atual não muda; é apagada pelo usuário no fim da transição.
2. **Planilha interna**: aba "Processos" (uma linha por processo) e aba "Fases" (uma linha por processo e fase I a VII). **Nenhum nome de pessoa** (nem responsável). Observações do processo entram só aqui. Acesso só da equipe.
3. **Planilha pública**: só contagens, sem nome de processo nem de pessoa: total de processos, total de setores, para cada fase I a VII os concluídos e o total, data e hora da atualização.
4. **Fase do Regimento no catálogo**: campo obrigatório em cada etapa, opções IV a IX, escolhido pelo Administrador; as seis etapas atuais recebem: Modelagem piloto → IV; Relatório e modelagem técnica → V; Revisão interna, Revisão pelo setor e Aprovação pelo setor → VI; Publicação → VII. Mudar a fase entra no histórico como as outras mudanças do catálogo. Fases I a III não têm etapa e saem sempre concluídas. VIII e IX ficam fora das planilhas enquanto não houver etapa nelas.
5. **Situação de cada fase**: concluída = todas as etapas da fase resolvidas (concluída, realizada anteriormente ou dispensada); em andamento = alguma etapa da fase em andamento ou resolvida, sem todas; pronto para iniciar = fase anterior concluída e nenhuma etapa desta começou; aguardando etapa anterior = o resto. Exceção: **Publicação dispensada não conta como publicada** — a fase VII fica "Dispensada".
6. **Rótulo da situação do processo**: Publicado (VII concluída); Concluído (processo concluído sem publicação); Em andamento · fase; Próxima · fase; Suspenso · fase.
7. **Processos que entram**: processos, subprocessos e "a classificar", cada um conta um; cancelados ficam fora; suspensos entram. Coluna de tipo na aba interna.
8. **Data da modelagem piloto**: a data da reunião; sem ela, a data de conclusão da etapa Modelagem piloto.
9. **Colunas sem equivalente**: "Question." fica fora; VIII e IX fora; V1 a V8 viram "Última versão"; Data da Publicação = conclusão da etapa Publicação; Observações = observações do processo (só interna).
10. **"% das etapas concluídas"**: no público, a conta de hoje (fases I a VII); no interno, as duas (I a VII e IV a VII). A planilha traz contagens; a porcentagem é calculada no dashboard.
11. **Atualizar as planilhas**: Edge Function com a conta de serviço do Drive (ADR 0008), reescreve as duas inteiras; todo dia às 6h de Brasília e pelo botão "Atualizar planilhas agora". Falha deixa as planilhas como estavam.
12. **Aba "Planilhas" na Administração**, só Administrador: última tentativa (quando, automática ou pelo botão e de quem, resultado, motivo do erro) e o link das duas planilhas. Guarda as **últimas 10 tentativas**. Botão desligado durante uma atualização; segundo pedido recusado com "já há uma atualização em andamento". Sem e-mail de aviso.
13. **Meta mensal de modelagens** (12): fixa no dashboard interno, mudada no Data Studio.
14. **Dashboards** no Data Studio da conta do CED, montados por Claude no navegador num ticket desta funcionalidade, com revisão visual do usuário. Interno compartilhado só com as pessoas da equipe; público por link "Não listado" com a planilha pública como fonte. Parecidos com os de hoje, dentro dos limites da ferramenta (sem visual de HTML).
15. **Transição**: o Power BI continua até o cadastro dos processos atuais terminar; troca do link no site, fim do Power BI e exclusão da planilha antiga são passos do usuário, descritos na documentação.
16. **Documentação de manutenção** em `docs/manutencao/`, ticket próprio, para quem assumir o sistema, em português: instalação, publicação (banco, funções, site), backup e restauração, modelo de dados, índice dos ADRs, planilhas e dashboards (roteiro do Data Studio, troca do link, transição). O que depende da produção, que ainda não existe, fica com o que se sabe hoje e é conferido no `/ship` de produção.
17. **Exportação em CSV**: sai, vai para o backlog.

## Nomes (glossário)

Fase do Regimento; Planilha interna; Planilha pública; Dashboard interno; Dashboard público; Atualizar as planilhas; aba "Planilhas" da Administração. "Painel" continua reservado ao dashboard da própria plataforma (v1.5). Na definição do Administrador, "a importação" virou "as planilhas dos dashboards".

## Nota

As datas de início e conclusão das etapas ainda seguem o dia UTC do banco (item do backlog de 2026-10-20, /ship de revisoes-aprovacao): uma etapa resolvida depois das 21h de Brasília entra no dia seguinte. Afeta pouco as contagens por mês; não entra nesta funcionalidade.
