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
Apagar o cadastro de vez, o que só é possível enquanto nenhum processo depende dele. O histórico guarda o que foi apagado. Diferente do usuário, que depois do primeiro acesso só se desativa.
_Avoid_: remover, deletar

**Responsável do setor**:
Pessoa de um setor atendido que responde pelo processo mapeado. Não é usuário e não entra na plataforma.
_Avoid_: dono do processo, usuário do setor
