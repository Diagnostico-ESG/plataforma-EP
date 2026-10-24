# Plataforma do Escritório de Processos (EP)

Plataforma interna do Centro Estadual de Desburocratização (CED) que acompanha, etapa por etapa, o mapeamento dos processos dos setores feito pela equipe do EP.

## Acesso

**Usuário**:
Pessoa da equipe que entra na plataforma com a sua conta institucional.
_Avoid_: conta, login, membro

**Conta institucional**:
A conta Google da pessoa no domínio `ccivil.pr.gov.br`; é a única forma de entrar na plataforma.
_Avoid_: conta pessoal, e-mail particular

**Autorização**:
O registro, feito pelo administrador, de um e-mail institucional e do perfil que ele terá; sem autorização, a conta institucional não entra.
_Avoid_: convite, pré-cadastro, whitelist

**Aguardando primeiro acesso**:
Situação de uma autorização cuja pessoa ainda não entrou na plataforma. Só nessa situação a autorização pode ser excluída; depois do primeiro acesso, o usuário só pode ser desativado.
_Avoid_: pendente, convidado

**Perfil**:
O conjunto de permissões de um usuário; cada usuário tem exatamente um: Administrador, Integrante do EP ou Consulta.
_Avoid_: papel, função, nível de acesso

**Administrador**:
Perfil que pode tudo, incluindo gerir usuários, o catálogo de etapas e as planilhas dos dashboards.
_Avoid_: admin, gestor

**Integrante do EP**:
Perfil de quem faz o trabalho do Escritório de Processos: cria e edita processos, registra etapas, envia documentos e revisa.
_Avoid_: analista, colaborador

**Consulta**:
Perfil que só vê processos, documentos e o painel, sem editar. É o perfil de todo usuário novo.
_Avoid_: leitor, visitante

**Inativo**:
Situação do usuário que não pode mais entrar na plataforma, mas cujo nome e histórico continuam registrados. O oposto é **Ativo**.
_Avoid_: desativado (como situação), bloqueado, excluído

**Desativar / Reativar**:
A ação do administrador que torna um usuário inativo ou ativo de novo.
_Avoid_: excluir, bloquear, banir

## Setores

**Setor**:
Unidade da Casa Civil atendida pelo EP, identificada por uma sigla. Existe por conta própria e pode participar de vários macroprocessos.
_Avoid_: área, departamento, unidade

**Sigla**:
O identificador curto e único do setor, que entra no nome dos arquivos. Pode mudar; os arquivos já enviados mantêm a sigla antiga no nome.
_Avoid_: código do setor, abreviação

**Macroprocesso**:
Grande agrupamento de processos da Cadeia de Valor, identificado por um código. Pode ter uma categoria: finalístico, apoio ou gerencial.
_Avoid_: área de atuação, eixo

**Setor envolvido**:
Um setor que participa de um macroprocesso, com uma observação opcional sobre o papel dele ali. Um macroprocesso pode não ter nenhum enquanto o planejamento não termina.
_Avoid_: setor vinculado, setor do macroprocesso

**Setor inativo / Macroprocesso inativo**:
Cadastro que não aparece mais nas listas de escolha, mas continua aparecendo, marcado, onde já foi usado. Um setor inativo continua como setor envolvido nos macroprocessos em que estava.
_Avoid_: arquivado, extinto

**Excluir (setor ou macroprocesso)**:
Apagar o cadastro de vez, o que só é possível enquanto nenhum processo depende dele. O histórico guarda o que foi apagado. Diferente do usuário, que depois do primeiro acesso só se desativa.
_Avoid_: remover, deletar

## Processos

**Processo**:
Trabalho de um setor que o EP mapeia, ligado a um único setor (o dono) e a um macroprocesso em que esse setor é setor envolvido. Por isso, um setor não sai de um macroprocesso enquanto tiver processos nele. O nome é único dentro do setor, porque entra no nome dos arquivos.
_Avoid_: fluxo, atividade, procedimento

**Subprocesso**:
Processo que pertence a um processo pai e segue o macroprocesso dele; pode ter setor diferente do pai. Tem o próprio ciclo de etapas. Não tem subprocessos.
_Avoid_: processo filho, subfluxo

**A classificar**:
Tipo provisório do item identificado (ou importado) que ainda não se sabe se é processo ou subprocesso. Tem ciclo de etapas normal.
_Avoid_: indefinido, rascunho

**Catálogo de etapas**:
A lista ordenada de etapas, mantida pelo administrador, em que o processo pode estar: começa sempre em **Não iniciados** e termina sempre em **Concluídos**, fixas no lugar e no nome; entre elas, as etapas de trabalho, da modelagem piloto em diante. A ordem não obriga ninguém a seguir a sequência. Uma etapa nova só acrescenta uma coluna, sem mexer em nenhum processo. Etapa com processo dentro não se desativa nem se exclui; etapa por onde algum processo já passou só se desativa; as etapas que têm campos próprios (Modelagem piloto, Relatório e modelagem técnica, Revisão interna, Validação com o setor, Aprovação pelo setor e Publicação) se renomeiam e se reordenam, mas não se desativam nem se excluem. Não há etapas do setor: identificação dos responsáveis, sensibilização e identificação dos processos já foram feitas para todos os setores e ficam fora da plataforma.
_Avoid_: workflow, fluxo de etapas, etapa do setor

**Não iniciados**:
A primeira etapa do catálogo, onde entra todo processo cadastrado e fica o que ainda não começou. Não pertence a nenhuma fase do Regimento.
_Avoid_: backlog, a fazer (para a etapa), pendentes

**Fase do Regimento**:
Cada uma das nove fases do mapeamento definidas no art. 8º do Regimento Interno do EP (I a IX), pelas quais os dashboards contam o andamento. Cada etapa do catálogo pertence a uma fase; uma fase pode juntar várias etapas (a VI junta Revisão interna, Validação com o setor e Aprovação pelo setor). As fases I a III não têm etapa, porque foram feitas fora da plataforma para todos os setores, e contam sempre como concluídas. As outras contam pela posição do processo no catálogo: concluída quando ele está numa etapa depois dela, na última etapa dela com a etiqueta Concluído, ou em Concluídos (a VII, só com a publicação registrada); em andamento quando ele está numa etapa dela; não iniciada no resto.
_Avoid_: etapa (para a fase), etapa do Regimento, macroetapa

**Etapa atual**:
A etapa do catálogo em que o processo está. Todo processo está em exatamente uma.
_Avoid_: etapa corrente, passo atual, status da etapa

**Mover**:
Levar o processo para qualquer etapa do catálogo, para a frente ou para trás, pela lista de etapas ou arrastando o cartão, sem motivo e sem trava de sequência. A combinação da equipe decide quando mover, não a plataforma. Ao mover, a etiqueta volta a A fazer. Cada mudança fica no histórico.
_Avoid_: avançar, voltar a uma etapa, concluir a etapa, iniciar a etapa, dispensar

**Etiqueta**:
Marca da etapa atual do processo: **A fazer**, **Em andamento** ou **Concluído**. Concluído quer dizer que a parte de quem estava na etapa terminou e o processo espera o próximo pegá-lo; não conclui o processo.
_Avoid_: tag, status, situação (para a etiqueta)

**Processo parado**:
Processo em andamento que está na mesma etapa há mais de 7 dias, contados de quando entrou nela; mudar só a etiqueta não zera a contagem. Não vale em Não iniciados nem em Concluídos. A tela o destaca. O limite é um número único até os prazos por etapa.
_Avoid_: atrasado, vencido, esquecido

**Responsável do processo**:
Usuário (Administrador ou Integrante do EP) que cuida do processo agora; um só por processo, não por etapa. Quem move o processo, para qualquer etapa, passa a ser o responsável; depois, qualquer integrante pode trocá-lo por outro ou por ninguém. O histórico guarda quem esteve com o processo em cada etapa. A plataforma não guarda os contatos dos setores.
_Avoid_: responsável da etapa, dono, executor

**Situação do processo**:
Em andamento, suspenso, cancelado ou concluído. Suspender, cancelar e **retomar** exigem motivo; suspenso e cancelado congelam a etapa, a etiqueta e o responsável, e retomar devolve o processo à mesma etapa. Concluído não se marca: é o processo que está em Concluídos. Suspensos e cancelados ficam fora das planilhas dos dashboards.
_Avoid_: status do processo, estado

**Concluídos**:
A última etapa do catálogo, fixa: o processo que chega a ela está concluído. Para chegar, o processo precisa ter a data da publicação ou ser concluído sem publicação.
_Avoid_: finalizados, encerrados

**Concluir sem publicação**:
Levar o processo a Concluídos sem publicá-lo, com uma explicação obrigatória, porque há processos que não se quer divulgar. Nos dashboards, a fase VII dele aparece "Sem publicação" e não conta como concluída. Ainda pode ser publicado depois.
_Avoid_: não publicado, dispensar a publicação, vai para publicação

**Registrar publicação**:
Informar a data em que o processo foi publicado (com o link, se houver), na etapa Publicação ou depois, num processo concluído sem publicação ou arquivado. O processo fica onde está.
_Avoid_: publicar depois, republicar

**Arquivado**:
Marca de um processo concluído, suspenso ou cancelado que sai do Quadro e fica só na Lista, guardando a situação e a etapa que tinha. Quem arquiva é um Administrador ou Integrante do EP, e quem **desarquiva** o devolve como estava. Arquivado não tem etapa mexida; só se registra publicação ou se desarquiva.
_Avoid_: encerrado, inativo, cancelado

**Anotações**:
Texto livre e único de um processo (cada subprocesso tem o seu), escrito pela equipe e guardado sozinho enquanto se escreve, sem histórico das versões anteriores. Administrador e Integrante do EP escrevem; Consulta só lê; no arquivado, só se lê. Não sai da plataforma: fica fora dos dashboards.
_Avoid_: observações, notas, comentários

**Reclassificação**:
Mudança do tipo de um item (processo, subprocesso ou a classificar), com motivo, que preserva o mesmo item com tudo o que ele já tem.
_Avoid_: conversão, migração, recriação

## Reuniões

**Modelagem piloto**:
A primeira etapa de trabalho de todo processo, logo depois de Não iniciados: o EP se reúne com o setor e faz o primeiro desenho do fluxo.
_Avoid_: reunião de modelagem, oficina, workshop

**Reunião**:
Encontro do EP com o setor para a modelagem piloto de um processo, marcado no próprio processo só pela data. Pode ser marcado antes de acontecer: a data diz se é próxima ou realizada. Uma reunião que trata vários processos é marcada em cada um. Não muda o status de nenhuma etapa. Participantes, local e anotações da reunião ficam fora: a existência do relatório já pressupõe a reunião, e o que for preciso registrar vai nas Anotações do processo.
_Avoid_: encontro, evento, agenda, oficina, reunião de sensibilização

## Documentos

**Versão**:
Conjunto de arquivos do fluxograma de um processo, com número sequencial por processo (V1, V2…). Nasce com o .bpm (arquivo-fonte do Bizagi) e o .png (o .bpmn é opcional) e pode receber o relatório depois. Nunca se apaga, mas um arquivo dela pode ser substituído. Registra a etapa atual do processo no momento do envio, mas não muda nenhuma etapa.
_Avoid_: documento, revisão (para versão), arquivo

**Relatório**:
Arquivo (.docx ou .pdf) que acompanha uma versão e usa o número dela; não tem numeração própria.
_Avoid_: laudo, documento técnico

**Substituir arquivo**:
Trocar um arquivo de uma versão por outro do mesmo tipo. O arquivo anterior não fica guardado; o histórico registra a troca.
_Avoid_: corrigir versão, reenviar, atualizar arquivo

**Relatório pendente**:
Situação da versão que ainda não tem relatório.
_Avoid_: relatório faltando, versão incompleta

**Sem alteração de conteúdo**:
Registro, numa versão nova, do mesmo relatório da versão anterior, com o nome da versão nova.
_Avoid_: cópia do relatório, relatório repetido

**Versão histórica**:
Versão da primeira etapa do trabalho, feita antes da plataforma, somente leitura, com o sufixo F no rótulo (V5F). Só se registra enquanto o processo não tem versão nova, e a primeira versão nova continua a numeração (V5F → V6). Pode ter só o .bpm.
_Avoid_: versão antiga, versão importada, versão final

## Revisões e aprovação

**Assumir**:
O integrante pôr a si mesmo como responsável do processo, sem movê-lo.
_Avoid_: capturar, pegar, puxar

**Revisão interna**:
Conferência, por um integrante diferente do autor, da última versão do processo antes de ela ir ao setor, registrada com o processo na etapa Revisão interna. O revisor corrige ele mesmo: o resultado é "sem alteração" (segue a versão revisada) ou "corrigida" (a versão enviada nessa etapa é a correção). Registrar não move o processo, e mover não exige registro; cada passagem pela etapa pode ter o seu registro.
_Avoid_: conferência, aprovação interna

**Revisor**:
Integrante que registra a revisão interna; não deveria ser o autor da versão revisada. A plataforma avisa, sem impedir, quando o autor da versão mais recente (fora as versões históricas) registra a revisão ou fica responsável do processo na Revisão interna.
_Avoid_: aprovador, conferente

**Validação com o setor**:
A etapa em que a versão está com o setor. Se o setor pede ajustes, o EP move o processo de volta à revisão interna, e a ida seguinte é o processo voltando a esta etapa. A plataforma não registra cada envio nem a resposta: o histórico das mudanças de etapa diz quando foi e voltou, e os e-mails ficam fora (a resposta pode vir pessoalmente).
_Avoid_: revisão pelo setor, rodada, ciclo, envio ao setor

**Aprovação**:
O registro de que o setor aprovou a versão mais recente do processo, feito com o processo na etapa Aprovação pelo setor, com o número, o link e a data do E-protocolo quando houver (o número pode entrar depois). Registrar não move o processo. Pode vir depois de ajustes pequenos feitos sem nova ida ao setor, que o setor só vê de novo no E-protocolo. Vale uma por processo: mover o processo para trás não a desfaz, e uma aprovação registrada depois, da mesma versão ou de outra, toma o lugar da anterior, que fica no histórico. A versão aprovada não tem arquivo substituído.
_Avoid_: homologação, validação final

**E-protocolo**:
O sistema de protocolo do governo onde o setor formaliza a aprovação; a plataforma guarda só o número e, se houver, o link.
_Avoid_: protocolo, processo eletrônico

## Dashboards

**Planilha interna**:
Planilha do Google que a plataforma escreve com o andamento de cada processo e de cada fase do Regimento, sem nome de pessoa, para o dashboard interno. Só a equipe do EP tem acesso.
_Avoid_: planilha do dashboard, planilha de controle, base

**Planilha pública**:
Planilha do Google que a plataforma escreve só com contagens (processos, setores e conclusões por fase do Regimento), sem nome de processo nem de pessoa, para o dashboard público.
_Avoid_: planilha aberta, dados abertos

**Dashboard interno / Dashboard público**:
Os relatórios montados fora da plataforma, no Data Studio da conta do CED, a partir da planilha interna e da planilha pública. O público é divulgado por link na página do EP no site da Casa Civil. Diferente do **Painel**, que é a área da própria plataforma.
_Avoid_: painel (para o dashboard), relatório (para o dashboard), BI

**Atualizar as planilhas**:
Reescrever as duas planilhas inteiras com os dados atuais da plataforma, todo dia de manhã ou quando o Administrador pede. Se falha, as planilhas ficam como estavam.
_Avoid_: sincronizar, exportar, publicar
