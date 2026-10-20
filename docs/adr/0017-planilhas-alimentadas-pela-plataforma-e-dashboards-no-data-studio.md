# As planilhas dos dashboards são alimentadas pela plataforma, e os dashboards passam ao Data Studio

Data: 2026-10-20.

A planilha do Google Sheets que hoje alimenta o dashboard em Power BI é preenchida à mão. A plataforma passa a escrever duas planilhas novas, criadas em branco no Drive compartilhado do CED: a planilha interna (uma aba por processo e uma por processo e fase) e a planilha pública (só contagens, sem nenhum nome de processo ou de pessoa). Uma Edge Function reescreve as duas inteiras, com a mesma conta de serviço do Drive (ADR 0008), todo dia às 6h de Brasília e pelo botão "Atualizar planilhas agora" da Administração, só para o Administrador. Reescrever inteiro se corrige sozinho: uma atualização que falha deixa as planilhas como estavam, e a próxima acerta.

Os dois dashboards (interno, só para a equipe, e público, por link "Não listado" na página do EP no site da Casa Civil) passam ao Data Studio da conta institucional do CED. A licença do Power BI em uso é do Tecpar, e o dashboard público da Casa Civil não deve depender da licença de outra instituição. Em 2026-10-20 se verificou que o Data Studio está liberado na conta institucional e que o link público é permitido. O Data Studio calcula menos que o Power BI e não tem o visual de HTML, por isso a plataforma já entrega as situações por fase prontas na planilha.

Os dashboards contam o andamento pelas fases do art. 8º do Regimento Interno (I a IX), não pelas etapas do catálogo. Cada etapa do catálogo ganha a sua fase, escolhida pelo Administrador (IV a IX), porque o catálogo é configurável (ADR 0004) e uma ligação fixa no código deixaria uma etapa nova fora do dashboard sem aviso. As fases I a III não têm etapa e contam sempre como concluídas.

A planilha manual e o Power BI continuam até o cadastro dos processos atuais terminar; a troca e a exclusão da planilha antiga são passos do usuário, fora do código. A exportação em CSV, prevista na especificação "para usar Power BI", perde o motivo e vai para o backlog.

## Opções consideradas

- Exportação em CSV por botão, colada à mão na planilha: continua manual, que é o que se quer eliminar.
- Escrever cada mudança na hora, linha por linha: quase tempo real que o dashboard não aproveita, e uma escrita que falha deixa a linha errada até a próxima mudança do processo.
- Dados públicos numa aba da planilha interna: bastaria trocar a aba de origem do relatório público para expor dados internos.
- Power BI com licença da Casa Civil: custo de licença e liberação da publicação aberta pelo administrador do Power BI do órgão.
- Painel público da própria plataforma: abre a plataforma a quem não entrou e é o trabalho da v1.5.
