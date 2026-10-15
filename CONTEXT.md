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
Perfil que pode tudo, incluindo gerir usuários, o catálogo de etapas e a importação.
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
Apagar o cadastro de vez, o que só é possível enquanto nenhum processo (e, no setor, nenhuma reunião) depende dele. O histórico guarda o que foi apagado. Diferente do usuário, que depois do primeiro acesso só se desativa.
_Avoid_: remover, deletar

**Responsável do setor**:
Pessoa de um setor atendido que responde pelo setor junto ao EP. Um setor pode ter nenhum ou vários. Não é usuário e não entra na plataforma.
_Avoid_: dono do processo, usuário do setor

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
A lista ordenada de etapas, mantida pelo administrador, que todo processo percorre. Cada etapa é do setor (feita uma vez pelo setor e valendo para todos os processos dele) ou do processo.
_Avoid_: workflow, fluxo de etapas

**Etapa do setor / Etapa do processo**:
Etapa do catálogo feita uma vez pelo setor (identificação dos responsáveis, sensibilização, identificação dos processos) ou feita em cada processo (da reunião de modelagem em diante). A primeira etapa do processo só começa com as etapas do setor resolvidas.
_Avoid_: etapa geral, etapa inicial

**Etapa obrigatória / Etapa opcional**:
Marcação do catálogo. Só a etapa opcional pode ser dispensada; o processo só se conclui com todas as obrigatórias resolvidas.
_Avoid_: etapa facultativa, etapa pulável

**Status da etapa**:
Pendente, em andamento, concluída, realizada anteriormente (feita fora da plataforma, com nota) ou dispensada (opcional que não será feita, com nota). As três últimas contam como **resolvida**.
_Avoid_: estado, fase (para status)

**Etapa atual**:
A etapa em andamento do processo ou, se nenhuma estiver, a primeira pendente. Cada processo tem no máximo uma etapa em andamento.
_Avoid_: etapa corrente, passo atual

**Voltar a uma etapa**:
Reabrir uma etapa anterior, com motivo; as etapas seguintes já concluídas voltam a pendente. Nada se apaga do histórico.
_Avoid_: retroceder, desfazer, reabrir processo

**Responsável da etapa**:
Usuário (Administrador ou Integrante do EP) que cuida de uma etapa de um processo. Não confundir com o responsável do setor, que não é usuário.
_Avoid_: dono da etapa, executor

**Situação do processo**:
Em andamento, suspenso, cancelado ou concluído. Suspender, cancelar e **retomar** exigem motivo e congelam ou liberam o andamento; concluído não se marca, acontece quando todas as etapas obrigatórias estão resolvidas.
_Avoid_: status do processo, estado

**Reclassificação**:
Mudança do tipo de um item (processo, subprocesso ou a classificar), com motivo, que preserva o mesmo item com tudo o que ele já tem.
_Avoid_: conversão, migração, recriação

## Reuniões

**Reunião**:
Encontro do EP com um único setor, de sensibilização ou de modelagem, com data (e hora, se houver), local, participantes e anotações. Pode ser registrada antes de acontecer: a data diz se é próxima ou realizada. É um registro e não muda o status de nenhuma etapa.
_Avoid_: encontro, evento, agenda

**Reunião de sensibilização**:
Reunião com o setor, sem processos ligados, que apresenta o trabalho do EP.
_Avoid_: reunião inicial, apresentação

**Reunião de modelagem**:
Reunião que trata um ou mais processos do próprio setor da reunião, em qualquer situação. Um processo tratado numa reunião não pode ser excluído.
_Avoid_: oficina, workshop

**Participante**:
Pessoa presente numa reunião: um usuário, um responsável do setor ou outra pessoa, anotada só pelo nome. O responsável do setor excluído continua na reunião como outra pessoa, com o nome que tinha.
_Avoid_: convidado, presente

## Documentos

**Versão**:
Conjunto de arquivos do fluxograma de um processo, com número sequencial por processo (V1, V2…). Nasce com o .bpmn e o .png (o .bpm do Bizagi é opcional) e pode receber o relatório depois. Nunca se apaga, mas um arquivo dela pode ser substituído. Registra a etapa atual do processo no momento do envio, mas não muda nenhuma etapa.
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
