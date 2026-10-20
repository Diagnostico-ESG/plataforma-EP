# Planilhas dos dashboards

A plataforma escreve duas planilhas do Google todo dia, e os dashboards (no Data Studio) leem essas planilhas. Ninguém preenche nada à mão. Decisões de origem: ADR 0017 (as planilhas e o Data Studio) e ADR 0018 (como o banco agenda e entrega os dados). O roteiro para refazer os dashboards está em `07-dashboards-no-data-studio.md`.

**Hoje só existe o desenvolvimento, com planilhas de prova e dados inventados.** O que depende da produção, que ainda não existe, está marcado **"conferir no `/ship` de produção"**.

Termos usados aqui:

- **Planilha interna:** planilha do Google com o andamento de cada processo e de cada fase do Regimento. Só a equipe do EP tem acesso. Tem nome de processo, mas nenhum nome de pessoa.
- **Planilha pública:** planilha só com contagens (processos, setores e conclusões por fase). Nenhum nome de processo nem de pessoa. Alimenta o dashboard público.
- **Fase do Regimento:** cada uma das nove fases (I a IX) do art. 8º do Regimento Interno do EP. As fases I a III não têm etapa e contam sempre como concluídas; as fases IV a IX ligam-se às etapas do catálogo.
- **Cofre do banco (Vault):** o lugar do banco onde os segredos ficam cifrados. Só o banco os lê.
- **Conta de serviço:** o "usuário robô" do Google que a plataforma usa para escrever nas planilhas e no Drive.
- **pg_cron e pg_net:** extensões do banco que agendam uma tarefa (`pg_cron`) e fazem uma chamada pela internet (`pg_net`).

## Como funciona

1. Todo dia às **6h de Brasília** (9h UTC, sem horário de verão), o banco monta um pacote com os dados dos processos e o envia à função do servidor `planilhas-dos-dashboards`. O agendamento se chama `atualizar-planilhas-dos-dashboards` (extensão `pg_cron`).
2. O mesmo caminho serve ao botão **Atualizar planilhas agora**, em **Administração → Planilhas**, só para o Administrador.
3. A função confere a **senha interna** que o banco manda, escreve a planilha interna e depois a pública, e devolve o resultado ao banco.
4. As planilhas são **reescritas inteiras**. Se a escrita de uma falha, ela fica como estava e a próxima atualização acerta. Se a interna deu certo e a pública falhou, a tentativa fica "Falhou" com o motivo da pública, e a interna já está nova.
5. A função não lê o banco e não usa a chave secreta do Supabase. Os logs e as respostas dela nunca levam nome de processo, observação, identificador de planilha nem token.

### O que há em cada planilha

| Planilha | Aba | Colunas |
| --- | --- | --- |
| Interna | `Processos` | Identificador, Área, Macroprocesso, Processo, Tipo, Situação, Data da modelagem piloto, Data da publicação, Última versão, Observações |
| Interna | `Fases` | Identificador, Área, Processo, Fase, Situação, Data de conclusão (uma linha por processo e fase; as fases I a III vêm sempre "Concluída") |
| Pública | `Resumo` | Total de processos, Total de setores, Atualizado em (uma linha) |
| Pública | `Fases` | Fase, Concluídos, Total (sete linhas, fases I a VII) |

Regras que a plataforma aplica ao escrever (as mesmas do `supabase/functions/_shared/planilhas*.ts`):

- **Situação de cada fase (IV a VII):** "Concluída" se todas as etapas da fase estão resolvidas; "Em andamento" se alguma começou; "Pronto para iniciar" se nenhuma começou e a fase anterior está concluída; "Aguardando etapa anterior" nos demais casos; "Sem etapa" se a fase não tem etapa ativa; "Dispensada" só na fase VII, quando todas as etapas dela estão dispensadas.
- **Rótulo do processo:** "Suspenso · fase", "Publicado" (fase VII concluída), "Concluído", "Em andamento · fase" ou "Próxima · fase".
- **Datas** em texto `AAAA-MM-DD`; vazio vira o texto `null`. O Data Studio converte o texto em data (ver `07-dashboards-no-data-studio.md`).
- **Última versão** é a última versão **não** histórica. Quem só tem versão histórica sai com a coluna vazia.
- A coluna **Observações** pode chegar vazia; o Data Studio a descarta quando toda a coluna está vazia.

## Configurar um ambiente novo (cofre, conta de serviço e Sheets)

O roteiro já está pronto e testado em três arquivos. Siga na ordem; em cada um, troque o ref de desenvolvimento pelo do ambiente em que você está trabalhando (`<ref>`).

1. **Conta de serviço e Drive compartilhado:** `docs/drive-conta-de-servico.md`. A mesma conta de serviço escreve os arquivos das versões e as planilhas.
2. **Cofre do banco:** `docs/planilhas-cofre-do-banco.md`. O cofre guarda **quatro** segredos, com estes nomes: `planilhas_id_interna`, `planilhas_id_publica`, `planilhas_senha_interna` e `planilhas_endereco_da_funcao`. O ponto único por ambiente é o cofre: se uma planilha mudar, troque o valor lá.
3. **API do Google Planilhas e função:** `docs/planilhas-publicar-a-funcao.md`. A API do Sheets precisa estar ligada no projeto do Google Cloud onde está a conta de serviço. A função usa dois segredos novos, `EP_PLANILHAS_SENHA` (a mesma senha do cofre) e `EP_CHAVE_PUBLICAVEL`.
4. Em **Administração → Planilhas**, os links das duas planilhas devem aparecer e o botão **Atualizar planilhas agora** deve estar ligado. Se aparecer "As planilhas ainda não foram configuradas neste ambiente.", falta um dos quatro nomes do cofre.
5. Clique em **Atualizar planilhas agora**. A tentativa aparece "Em andamento" e passa a "Concluída". Abra as duas planilhas no Google e confira as abas.
6. Em **produção**, repita os passos 1 a 5 com planilhas, Drive e segredos **de produção** (nunca reaproveite os do desenvolvimento). **Conferir no `/ship` de produção.**

A senha interna é inventada pela equipe (mais de 30 caracteres, só letras e números), guardada no gerenciador de senhas e **nunca** colocada em chat, arquivo do projeto ou e-mail.

## A aba Planilhas da Administração

- Mostra as **últimas 10 tentativas**: quando, origem ("Automática" ou "Pelo botão · <quem>"), resultado ("Em andamento", "Concluída", "Falhou" com o motivo, ou "Sem resposta") e os dois links.
- Enquanto uma tentativa está "Em andamento", o botão fica desligado. Depois de 10 minutos sem resposta, ela passa a "Sem resposta" e o botão volta.
- Só o Administrador ativo vê a aba e a tabela de tentativas (`atualizacoes_das_planilhas`).

## Quando uma atualização falha

| O que aparece | O que quase sempre é |
| --- | --- |
| **Sem resposta** depois de 10 minutos | A função não foi publicada, ou a senha dela (`EP_PLANILHAS_SENHA`) é diferente da do cofre. |
| **Falhou**: "O Google recusou a escrita na planilha interna" (ou pública) | A API do Sheets não está ligada, a planilha não está no Drive onde a conta de serviço é membro, ou o identificador no cofre está errado. |
| **Falhou**: "O Google não respondeu." | O Google ficou fora do ar ou limitou as chamadas. Clique de novo em alguns minutos. |
| **Falhou**: "O pedido enviado à atualização estava incompleto." | Banco e função estão em versões diferentes. Publique a função de novo. |
| **Falhou**: motivo não identificado | Erro inesperado da função. Veja os registros dela no painel (**Edge Functions → planilhas-dos-dashboards → Logs**). |

O que o banco recebeu da função: no SQL Editor do projeto, `select status_code, error_msg, created from net._http_response order by created desc limit 5;`. `401` é senha diferente, `404` é função não publicada, `202` é pedido aceito. Mais detalhes: `docs/planilhas-publicar-a-funcao.md`, seção "Se algo não der certo".

## Dar fase a uma etapa nova

Os dashboards contam o andamento pelas **fases do Regimento**, não pelas etapas do catálogo. Por isso toda etapa do catálogo tem uma fase (IV a IX), e a plataforma não deixa salvar sem ela.

1. Entre como Administrador.
2. Abra **Administração → Catálogo de etapas**.
3. Clique em **Nova etapa** (ou, numa etapa existente, **Editar**).
4. Preencha o nome e escolha a **Fase do Regimento**. Sem fase, o botão recusa com "Escolha a fase do Regimento.".
5. Salve. A mudança de fase aparece no histórico do catálogo, com o antes e o depois.
6. A etapa nova entra como **pendente** em todos os processos em andamento (ADR 0004).
7. Na próxima atualização (às 6h, ou pelo botão), as planilhas já contam a etapa na fase escolhida. Nenhuma mudança no código nem nos dashboards.
8. As etapas de **Revisão interna**, **Revisão pelo setor** e **Aprovação pelo setor** são protegidas: não se desativam nem se excluem, mas a fase delas pode mudar.

## Transição: o Power BI e a planilha manual

O Power BI atual (licença do Tecpar) e a planilha preenchida à mão **continuam funcionando** até o cadastro dos processos atuais na plataforma terminar. Só então:

1. Confira, com a equipe, que os números do dashboard novo batem com o atual para os mesmos processos.
2. Troque o link na página do EP no site da Casa Civil, o encerramento do Power BI e a exclusão da planilha manual: `07-dashboards-no-data-studio.md`, seções "Trocar o link no site", "Encerrar o Power BI" e "Excluir a planilha manual".

A exportação dos dados em CSV, prevista antes, foi para o backlog: as planilhas atendem ao uso (ADR 0017).
