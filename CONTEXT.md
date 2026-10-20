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
A lista ordenada de etapas, mantida pelo administrador, que todo processo percorre, da modelagem piloto em diante. Não há etapas do setor: identificação dos responsáveis, sensibilização e identificação dos processos já foram feitas para todos os setores e ficam fora da plataforma.
_Avoid_: workflow, fluxo de etapas, etapa do setor

**Fase do Regimento**:
Cada uma das nove fases do mapeamento definidas no art. 8º do Regimento Interno do EP (I a IX), pelas quais os dashboards contam o andamento. Cada etapa do catálogo pertence a uma fase; uma fase pode juntar várias etapas (a VI junta Revisão interna, Revisão pelo setor e Aprovação pelo setor). As fases I a III não têm etapa, porque foram feitas fora da plataforma para todos os setores, e contam sempre como concluídas.
_Avoid_: etapa (para a fase), etapa do Regimento, macroetapa

**Etapa obrigatória / Etapa opcional**:
Marcação do catálogo. Só a etapa opcional pode ser dispensada; o processo só se conclui com todas as obrigatórias resolvidas.
_Avoid_: etapa facultativa, etapa pulável

**Status da etapa**:
Pendente, em andamento, concluída, realizada anteriormente (feita fora da plataforma, com nota) ou dispensada (opcional que não será feita, com nota). As três últimas contam como **resolvida**.
_Avoid_: estado, fase (para status)

**Etapa atual**:
A etapa em andamento do processo ou, se nenhuma estiver, a primeira pendente. Cada processo tem no máximo uma etapa em andamento.
_Avoid_: etapa corrente, passo atual

**Processo parado**:
Processo em andamento cuja etapa atual começou há mais de 15 dias. O limite é um número único até os prazos por etapa.
_Avoid_: atrasado, vencido, esquecido

**Avançar**:
O que acontece quando a etapa atual é concluída, dispensada ou registrada como realizada anteriormente: a primeira etapa pendente depois dela entra em andamento, com o responsável escolhido por quem resolveu (ou sem responsável). Sem etapa pendente depois, não há avanço. A etapa atual pendente (como a primeira de um processo novo) continua se iniciando à mão.
_Avoid_: pular, passar de fase

**Voltar a uma etapa**:
Reabrir uma etapa anterior, com motivo; as etapas seguintes já concluídas voltam a pendente. Quem volta escolhe o responsável da etapa reaberta. Nada se apaga do histórico.
_Avoid_: retroceder, desfazer, reabrir processo

**Responsável da etapa**:
Usuário (Administrador ou Integrante do EP) que cuida de uma etapa de um processo. Quem conclui, dispensa ou registra como realizada anteriormente uma etapa escolhe o responsável da seguinte (pode não escolher ninguém); depois, qualquer integrante pode trocá-lo por qualquer outro. A plataforma não guarda os contatos dos setores.
_Avoid_: dono da etapa, executor

**Situação do processo**:
Em andamento, suspenso, cancelado ou concluído. Suspender, cancelar e **retomar** exigem motivo e congelam ou liberam o andamento; concluído não se marca, acontece quando todas as etapas obrigatórias estão resolvidas.
_Avoid_: status do processo, estado

**Reclassificação**:
Mudança do tipo de um item (processo, subprocesso ou a classificar), com motivo, que preserva o mesmo item com tudo o que ele já tem.
_Avoid_: conversão, migração, recriação

## Reuniões

**Modelagem piloto**:
A primeira etapa de todo processo: o EP se reúne com o setor e faz o primeiro desenho do fluxo.
_Avoid_: reunião de modelagem, oficina, workshop

**Reunião**:
Encontro do EP com o setor para a modelagem piloto de um processo, marcado no próprio processo só pela data. Pode ser marcado antes de acontecer: a data diz se é próxima ou realizada. Uma reunião que trata vários processos é marcada em cada um. Não muda o status de nenhuma etapa. Participantes, local e anotações ficam fora: a existência do relatório já pressupõe a reunião.
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
O integrante pôr a si mesmo como responsável de uma etapa, de qualquer tipo, pendente ou em andamento, que está sem responsável.
_Avoid_: capturar, pegar, puxar

**Revisão interna**:
Conferência, por um integrante diferente do autor, da última versão do processo antes de ela ir ao setor. O revisor corrige ele mesmo: o resultado é "sem alteração" (segue a versão revisada) ou "corrigida" (o revisor enviou uma versão nova).
_Avoid_: validação, conferência, aprovação interna

**Revisor**:
Integrante que registra a revisão interna; nunca é o autor da versão revisada. Por isso, quem enviou a versão mais recente (fora as versões históricas) não pode ser escolhido como responsável da revisão interna. A conferência vale no momento da escolha: o revisor que corrige e envia uma versão nova continua responsável.
_Avoid_: aprovador, conferente

**Revisão pelo setor**:
A etapa em que a versão completa (.bpm, .png e relatório) está com o setor. Em andamento quer dizer "com o setor"; se o setor pede ajustes, o EP volta à revisão interna, e a ida seguinte é a etapa recomeçando. A plataforma não registra cada envio nem a resposta (ADR 0012): o histórico das etapas diz quando foi e voltou, e os e-mails ficam fora (a resposta pode vir pessoalmente).
_Avoid_: rodada, ciclo, envio ao setor

**Aprovação**:
O registro de que o setor aprovou a versão mais recente do processo, feito ao concluir a etapa de aprovação, com o número, o link e a data do E-protocolo quando houver (o número pode entrar depois). Pode vir depois de ajustes pequenos feitos sem nova ida ao setor, que o setor só vê de novo no E-protocolo. Uma por processo; a versão aprovada não tem arquivo substituído, e voltar para a etapa de aprovação ou antes dela a desfaz.
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
