# Plataforma do Escritório de Processos (EP) — Especificação

Plataforma interna do Centro Estadual de Desburocratização (CED) para controlar o trabalho do Escritório de Processos: acompanhar cada processo por etapa, guardar fluxogramas e relatórios com versão e histórico, e monitorar tudo em um painel próprio (substitui o dashboard atual em Power BI).

Este documento serve de base para a construção no Claude Code. Itens marcados como **[decisão aberta]** precisam de resposta antes ou durante a construção.

---

## 1. Escopo por versão

**v1 (primeira entrega utilizável)**
- Cadastro de usuários e perfis de acesso
- Cadastro de setores (com responsável), macroprocessos e processos (com subprocessos)
- Etapas configuráveis por processo, com possibilidade de dispensar as etapas iniciais com anotação
- Reuniões (sensibilização e modelagem) com data, local, participantes e anotações
- Documentos com versão e histórico: fluxograma (.bpmn + .png) e relatório
- Revisão interna e rodadas de revisão pelo setor (com e-mail anexado)
- Aprovação com número do E-protocolo
- Histórico de tudo que acontece em cada processo (auditoria)
- Visualizador de .bpmn no navegador
- Prazos por etapa, com indicador visual de atraso
- Dashboard interno básico
- Importação dos dados que já existem (planilhas ou base do Power BI)
- Exportação dos dados em CSV

**v1.5**
- Alertas por e-mail (prazo vencendo, revisão pendente, setor sem resposta)
- Checagem automática do .bpmn no upload
- Publicação (interna e/ou externa), conforme a decisão sobre o destino
- Sincronização com o Google Drive institucional **[decisão aberta]**

**v2**
- Comparação visual entre versões do fluxograma
- Problemas e oportunidades identificados na reunião, ligados ao processo
- Registro do uso da IA (versão do prompt, entrada e saída)
- Formulário estruturado na reunião que gera o rascunho do relatório
- Chamada ao Gemini de dentro da plataforma (envia conteúdo dos processos a serviço externo; depende de liberação, e hoje o uso da gem continua fora da plataforma)
- Previsão de conclusão por ritmo de trabalho

**Depois**
- Fase 2 (TO-BE): o catálogo de etapas é configurável, então as etapas novas entram sem mudar o código.
- **Revisão futura: mais de um nível de subprocesso** (subprocesso de subprocesso). Hoje não há nenhum caso, e a v1 trabalha com um nível só. Se aparecer, o modelo de dados já comporta (o processo pai é uma referência ao próprio cadastro de processos). Mudariam a regra 15, a árvore de navegação, a contagem no dashboard e a matriz macroprocesso × setor.

---

## 2. Perfis de acesso

| Perfil | Pode |
|---|---|
| Administrador | Tudo, incluindo usuários, catálogo de etapas e importação |
| Integrante do EP | Criar e editar processos, registrar etapas, enviar documentos, revisar |
| Consulta | Ver processos, documentos e dashboard, sem editar |

Regra: o revisor interno precisa ser diferente de quem enviou o documento revisado.

---

## 3. Fluxo da fase 1 (AS-IS)

Etapas do catálogo inicial, na ordem:

1. Identificação dos responsáveis (por setor)
2. Reunião de sensibilização (por setor)
3. Identificação dos processos (por setor): lista de processos e subprocessos, cada um ligado a um macroprocesso
4. Reunião de modelagem (por processo) — gera a modelagem piloto (.bpmn + .png)
5. Relatório e modelagem técnica — ajustes com apoio de IA, relatório escrito
6. Revisão interna
7. Revisão pelo setor (uma ou mais rodadas)
8. Aprovação pelo setor (E-protocolo)
9. Publicação

As etapas 1 a 3 ficam no nível do setor e valem para todos os processos dele. O setor passa por elas uma única vez, mesmo participando de vários macroprocessos. Nos setores em que já foram feitas, o status é **"realizada anteriormente"**, com anotação obrigatória.

Status possíveis de uma etapa: pendente, em andamento, concluída, realizada anteriormente, dispensada.

Status possíveis de um processo: em andamento, suspenso (exige motivo), concluído, cancelado (exige motivo).

---

## 4. Modelo de dados

### Cadastros

**Usuario**: nome, e-mail, perfil, ativo

**Setor**: nome, sigla (única, sem espaço e sem sublinhado, porque entra no nome dos arquivos), responsável (nome, e-mail, cargo), observações

**Macroprocesso**
- código, nome, descrição
- categoria: finalístico | apoio | gerencial (opcional) **[decisão aberta]**
- ativo

Hierarquia: **Macroprocesso → Setor → Processo → Subprocesso**. O setor é um cadastro independente: não pertence a nenhum macroprocesso e pode participar de vários. Na metodologia do EP, cada processo pertence a um único setor.

**MacroprocessoSetor** (setores envolvidos em cada macroprocesso)
- macroprocesso, setor
- observação (papel do setor no macroprocesso, opcional)

Regras: um macroprocesso tem vários setores, e um setor pode estar em vários macroprocessos. O setor de um processo precisa estar entre os setores do macroprocesso dele. Se faltar, o integrante do EP adiciona o setor ali mesmo, e a inclusão fica no histórico. Um macroprocesso pode existir sem setores, enquanto o planejamento não termina.

**Processo**
- setor (um só, dono do processo; deve estar entre os setores do macroprocesso). O subprocesso tem setor próprio, que pode ser diferente do setor do processo pai.
- macroprocesso (obrigatório; o subprocesso usa o do processo pai)
- nome
- tipo: processo | subprocesso | a classificar (padrão na identificação e na importação)
- processo_pai (opcional, só para subprocessos; um processo nunca pode ser pai de si mesmo, direta ou indiretamente)
- origem: novo | retomado (já tinha trabalho anterior)
- situação
- etapa_atual
- contexto: legislação, sistemas usados, áreas envolvidas, volume estimado (texto livre na v1)
- vigência e data da próxima revisão
- observações

**TipoEtapa** (catálogo configurável)
- código, nome, ordem
- fase: AS-IS | TO-BE
- nível: setor | processo
- obrigatória (sim/não)
- prazo padrão em dias

### Andamento

**Etapa**
- processo (ou setor, para as etapas de nível setor)
- tipo_etapa
- status
- nota (obrigatória quando "realizada anteriormente" ou "dispensada")
- responsável (usuário)
- data de início, prazo, data de conclusão

**Reuniao**
- setor, processo (opcional)
- tipo: sensibilização | modelagem
- data, local, participantes, anotações

**RevisaoInterna**
- processo, revisor, escopo (fluxograma | relatório | ambos)
- data, resultado (aprovado | ajustes), comentários

**RodadaRevisaoSetor**
- processo, número da rodada
- enviada em, respondida em
- resultado: aprovada | ajustes solicitados | sem resposta
- e-mail de envio e e-mail de resposta (anexos)
- observações

**Aprovacao**
- processo, número do E-protocolo, link, data, registrado por

**Publicacao** (v1.5)
- processo, canal (interna | externa | ambas), url, data

**RegraBpmn** (v1.5, catálogo das regras da checagem automática)
- código, descrição, gravidade (erro | alerta), ativa (sim/não)

**ChecagemBpmn** (v1.5, resultado de cada checagem)
- versão do documento, regra, resultado (ok | aviso), detalhe (elemento afetado), data

### Documentos

**Documento**
- processo
- tipo: fluxograma_piloto | fluxograma_tecnico | relatorio | email_setor | outro
- título

**VersaoDocumento**
- documento, número da versão. No fluxograma, o número é automático e sequencial por processo, e continua a numeração das versões históricas. O relatório não tem numeração própria: usa o número da versão do fluxograma que ele acompanha (por padrão, a mais recente).
- histórica (sim/não): versão da primeira etapa do trabalho, importada, somente leitura. O rótulo leva o sufixo F (ex.: V5F)
- etapa em que foi enviada
- enviado por, data
- observação da mudança
- referência ao Drive (id do arquivo, quando houver)

**ArquivoVersao**
- versão, nome, formato (.bpm, .bpmn, .png, .docx, .pdf, .eml...), tamanho, hash

### Registro

**Evento** (histórico e auditoria; só inclui, nunca altera)
- data e hora, usuário, ação, entidade afetada, detalhes (antes e depois)

### v2

**Apontamento**: processo, tipo (problema | oportunidade), descrição, origem (reunião)

**RegistroIA**: processo, versão do prompt, entrada, saída, data, usuário

---

## 5. Regras de negócio

1. Cada mudança de status, upload, revisão ou aprovação gera um Evento.
2. Versões de documento nunca são apagadas. Substituir cria uma versão nova.
3. Versão de fluxograma exige os arquivos .bpmn e .png. O .bpm (arquivo-fonte do Bizagi) é opcional **[decisão aberta]**. Versões históricas ficam isentas e podem ter só o .bpm.
4. Uma etapa só inicia quando a anterior está concluída, realizada anteriormente ou dispensada. Um processo pode voltar a uma etapa anterior, com motivo registrado.
5. A revisão pelo setor aceita quantas rodadas forem necessárias. Cada rodada registra as datas e os e-mails.
6. A aprovação exige o número do E-protocolo.
7. Processo suspenso ou cancelado exige motivo.
8. A etapa de publicação é opcional até a decisão sobre o destino.
9. Usuário inativo mantém o histórico, sem acessar o sistema.
10. **Reclassificação.** O integrante do EP pode transformar um processo em subprocesso (informando o processo pai), transformar um subprocesso em processo ou definir o tipo de um item "a classificar". Cada mudança exige motivo e entra no histórico (quem, quando, de quê para quê).
11. **Identidade preservada.** O item reclassificado mantém o mesmo identificador, com suas etapas, documentos, versões, rodadas de revisão e número de E-protocolo. Nada é recriado ou perdido.
12. **Efeitos da reclassificação em subprocesso.** O macroprocesso passa a ser o do processo pai. O setor do item não muda, e se ele ainda não estiver entre os setores do macroprocesso, é incluído. Se o macroprocesso anterior for diferente, o sistema avisa antes de confirmar.
13. **Cada item tem o próprio ciclo.** Processo e subprocesso têm etapas, documentos e aprovação separados, mesmo quando o fluxograma do pai faz referência ao subprocesso.
14. **Pai já aprovado.** Se um subprocesso é vinculado a um processo pai já aprovado ou publicado, o sistema marca o pai com o aviso "estrutura alterada após aprovação", sem bloquear, para que o EP decida se o pai precisa de revisão.
15. **Níveis.** Um subprocesso não pode ter subprocessos (um nível só na v1; revisão prevista na seção 1, em "Depois").
16. **Nome dos arquivos.** O padrão é `SIGLA_V{número}_Nome do processo`, por exemplo `CEE_V6_Elaboração de Expediente do Tipo Ofício`. A plataforma gera o nome no envio e no download, a partir da sigla do setor, da versão e do nome do processo. O nome-base é o mesmo para o .bpm, o .bpmn e o .png. Acentos são mantidos, e caracteres que não valem em nome de arquivo são substituídos. No relatório vale o mesmo padrão, com `_Relatório` acrescentado ao final, e o número da versão é o do fluxograma que ele acompanha. Por exemplo, `CEE_V6_Elaboração de Expediente do Tipo Ofício_Relatório` acompanha `CEE_V6_Elaboração de Expediente do Tipo Ofício`.
17. **Versões históricas.** Os arquivos da primeira etapa do trabalho levam o sufixo F (ex.: `CEE_V5F_ELABORAÇÃO DE EXPEDIENTE DO TIPO OFÍCIO`). Entram como versão histórica, somente leitura, e ficam fora das métricas de tempo. A primeira versão nova continua a numeração (V5F → V6).
18. **Nome guardado no envio.** O nome de cada arquivo fica registrado quando ele é enviado. Renomear o processo ou o setor depois não altera o nome das versões anteriores.
19. **Relatório e fluxograma andam juntos.** O relatório só pode ser enviado para uma versão de fluxograma que já existe. Quando uma nova versão do fluxograma é criada, o sistema avisa que o relatório dessa versão está pendente. Se o relatório não mudou, o integrante pode marcar "sem alteração de conteúdo", e o sistema gera a cópia com o novo número de versão e registra isso no histórico. Se um processo que já tem subprocessos for reclassificado como subprocesso, o sistema bloqueia e pede que os filhos sejam reclassificados antes.

---

## 6. Telas da v1

1. **Login**
2. **Lista de processos**: filtros por setor, macroprocesso, etapa, situação, responsável e atraso
3. **Detalhe do processo**: linha do tempo das etapas, documentos com versões, visualizador do fluxograma, rodadas de revisão, histórico
4. **Setor**: responsável, macroprocessos em que participa, etapas de nível setor, reuniões, processos
5. **Reuniões**: cadastro e consulta
6. **Dashboard**
7. **Administração**: usuários, perfis, catálogo de etapas, macroprocessos e seus setores
8. **Importação**: carga inicial com validação antes de gravar. O nome dos arquivos (SIGLA_VERSÃO_NOME) identifica setor, versão e processo, o que liga cada arquivo ao cadastro. Nomes fora do padrão ficam como pendência.

### Dashboard v1
- Processos por etapa
- Processos por setor, por macroprocesso e por situação
- Matriz macroprocesso × setor: processos identificados, modelados e aprovados em cada cruzamento, o que mostra o que falta mapear
- Itens "a classificar" (tipo ainda indefinido), como pendência a resolver
- Versões de fluxograma sem o relatório correspondente, como pendência a resolver
- Contagem de processos e subprocessos: o total soma os dois, porque cada um tem o próprio ciclo, e há filtro por tipo
- Parados há mais de X dias, por etapa
- Aguardando resposta do setor (com dias de espera)
- Tempo médio em cada etapa
- Revisões pendentes por integrante
- Concluídos por mês

---

## 7. Integrações

- **Google Drive institucional** **[decisão aberta]**: a especificação original pede que a modelagem piloto vá para uma pasta do Drive do CED. A v1 guarda os arquivos no Supabase Storage, atrás de um adaptador de armazenamento. Na v1.5, uma Edge Function copia cada versão aprovada para o Drive (conta de serviço ou OAuth autorizada pelo CED). Somente os arquivos vão ao Drive; cadastros, e-mails e histórico ficam só na plataforma.
- **E-mails do setor**: registro manual na v1 (anexar o .eml ou colar o texto). Integração com caixa compartilhada fica para depois.
- **E-protocolo**: só registro do número e do link, sem integração.

---

## 8. Requisitos não funcionais

- **LGPD**: a base guarda nomes e e-mails de servidores em nuvem externa. Região dos dados: São Paulo. Formalizar o contrato ou termo de tratamento de dados com o provedor e validar com o jurídico e a TI. Registrar quem acessa o quê e limitar cada perfil ao necessário.
- **Segurança de acesso**: RLS ativada em todas as tabelas e no Storage, com testes automatizados por perfil. Nenhuma chave de serviço no front-end.
- **Backup**: plano do Supabase com backup diário (a confirmar) e exportação periódica de dados e arquivos para um local do CED, com teste de restauração.
- **Exportação** completa dos dados em CSV, o que permite usar Power BI ou outra ferramenta no futuro.
- **Manutenção**: README de instalação, documentação do modelo de dados e registro das decisões, para que outra pessoa consiga assumir o sistema.
- **Uso**: interno, em desktop. Layout responsivo é opcional.

---

## 9. Stack e hospedagem

**Decisão:** Supabase (PostgreSQL, autenticação, armazenamento de arquivos e funções) com front-end em React. A hospedagem é em nuvem externa. O CED já conhece essa stack pelo projeto do diagnóstico de maturidade ESG.

- **Banco**: PostgreSQL no Supabase. O modelo da seção 4 vira migrações SQL versionadas no repositório.
- **Login**: Supabase Auth, com e-mail e senha. O administrador convida os usuários, sem cadastro aberto. O perfil de cada um fica em tabela própria, ligada ao usuário do Auth. O navegador guarda só o token de sessão.
- **Segurança**: RLS ativada em todas as tabelas, sem exceção, com políticas por perfil (seção 2). A chave `service_role` existe apenas em Edge Functions, nunca no front-end.
- **Regras do fluxo** (seção 5): implementadas no banco, com triggers e funções. Isso cobre a sequência das etapas, versões que não se apagam, evento automático no histórico e revisor diferente do autor. Cada regra e cada perfil tem teste automatizado.
- **Arquivos**: bucket privado no Storage, com políticas por perfil, URLs assinadas de curta duração e nomes de arquivo por identificador (sem o nome do setor ou do processo no caminho).
- **Front-end**: React com TypeScript, bpmn-js para o visualizador e uma biblioteca de gráficos para o dashboard. Hospedagem estática (Netlify, Vercel ou similar).
- **Edge Functions**: alertas por e-mail (v1.5), checagem do .bpmn (v1.5) e cópia ao Drive (v1.5).
- **Ambientes**: um projeto Supabase de desenvolvimento e outro de produção, ambos na região de São Paulo (sa-east-1).

---

## 10. Ordem de construção

1. **Base**: projeto Supabase (desenvolvimento), migrações, Auth, perfis, RLS e testes de acesso por perfil, setores
2. **Processos e etapas**: catálogo configurável, andamento, dispensa com nota, histórico (regras em triggers e funções, com testes)
3. **Documentos**: upload, versões, pares .bpmn + .png, Storage com políticas, adaptador de armazenamento
4. **Revisões e aprovação**: revisão interna, rodadas do setor, E-protocolo
5. **Visualizador** de .bpmn no detalhe do processo (testar com arquivos reais do Bizagi)
6. **Prazos** e indicador de atraso
7. **Dashboard**
8. **Importação** dos dados atuais
9. **Revisão de segurança antes da produção**: todas as tabelas e buckets com RLS, teste com cada perfil, conferência de chaves e de variáveis de ambiente
10. **Exportação** CSV e documentação
11. Itens da v1.5

---

## 11. Decisões abertas (resumo)

1. Plano do Supabase (backup diário) e onde o front-end será hospedado
2. Contrato e LGPD: validação do uso de nuvem externa pelo jurídico e pela TI
3. Login: e-mail e senha no Supabase Auth, ou integração com algum acesso do governo, se existir e for possível
4. Drive institucional: a cópia dos arquivos entra na v1.5?
5. Publicação: só interna ou também no site da Casa Civil
6. Formato e origem dos dados atuais para importação (planilha, base do Power BI). Na importação, o macroprocesso pode ficar em branco e aparece como pendência a preencher.
7. Macroprocessos: a lista parte da Cadeia de Valor da Casa Civil ou será criada pelo EP? E a categoria (finalístico, apoio, gerencial) será usada?
8. Arquivo-fonte do Bizagi (.bpm): obrigatório, opcional ou não guardado? O visualizador lê só o .bpmn, e o .bpm não abre no navegador.
9. O fluxograma piloto entra na numeração de versões (V1) ou fica fora dela? A especificação parte de que entra, e a primeira versão técnica é a seguinte.
10. Quem mantém o sistema depois de pronto
