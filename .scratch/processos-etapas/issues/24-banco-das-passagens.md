# 24: Banco das passagens (Andamento livre)

**Como resolve a sua parte.** O banco hoje impõe a sequência das etapas, guarda um responsável por etapa e calcula o concluído pelas etapas obrigatórias. Este ticket troca esse motor pelo do Andamento livre:

- o processo fica sempre numa etapa do catálogo, que começa em Não iniciados e termina em Concluídos;
- vai para qualquer etapa ativa por uma função só, que põe quem move como responsável;
- a etapa atual tem a etiqueta;
- cada estadia numa etapa vira uma passagem, que o histórico, o processo parado e as planilhas usam.

Os dados inventados do desenvolvimento são convertidos, e o modelo anterior sai do banco (ADR 0022).

**What to build:** a migração destrutiva do Andamento livre e os testes de banco, de ponta a ponta no banco. A tela muda nos tickets seguintes.

- **Modelo novo:**
  - o tipo da etiqueta;
  - a tabela `passagens`, com RLS, as políticas e o `revoke` padrão;
  - `processos.responsavel_id`;
  - as colunas da publicação (`publicado_em`, `link_da_publicacao`, `explicacao_sem_publicacao`);
  - as etapas fixas `nao_iniciados` e `concluidos`, com o catálogo renumerado;
  - a fase vazia só nas duas fixas.
- **Função `mover_processo`:**
  - qualquer etapa ativa, sem motivo, e nada muda quando o destino é a própria etapa;
  - fecha e abre a passagem e põe a etiqueta em A fazer (Concluído em Concluídos);
  - quem move vira o responsável;
  - na chegada a Concluídos, exige a data da publicação ou a explicação; na saída, apaga a explicação;
  - recusa suspenso, cancelado, arquivado e etapa inativa;
  - gera um só evento.
- **Etiqueta e responsável:**
  - a etiqueta muda só na passagem aberta e fica fixa em Concluídos, com `concluido_em` preenchido e esvaziado pelo banco;
  - o responsável é usuário ativo Administrador ou Integrante, com evento próprio quando muda fora do movimento;
  - suspenso, cancelado e arquivado congelam os dois.
- **Catálogo:**
  - as fixas não mudam de nome nem de ordem, não se desativam e não se apagam;
  - etapa com processo dentro não se desativa nem se apaga, com a contagem na recusa;
  - etapa com passagem não se apaga;
  - as seis com campos próprios não se desativam nem se apagam;
  - etapa nova não cria nada nos processos;
  - sai obrigatória.
- **Cadastro:** abre a passagem em Não iniciados, com A fazer e sem responsável.
- **View `processos_com_andamento`:** recriada com os nomes de hoje que outras partes leem, mais `etiqueta`, `entrou_na_etapa_em`, `etapa_atual_posicao`, `publicado_em`, `link_da_publicacao` e `sem_publicacao`. `situacao = concluido` quando o processo está em Concluídos. Saem `caminho`, `etapa_atual_status`, `etapa_atual_iniciada_em` e `vai_para_publicacao`.
- **Conversão dos dados do desenvolvimento:**
  - etapa, etiqueta, responsável e entrada pela regra da spec;
  - a escolha de publicação vira data ou explicação;
  - os arquivados continuam arquivados.
- **O que sai:**
  - os eventos do modelo anterior (andamento e escolha de publicação);
  - `andamentos`, `status_da_etapa`, `etapas.obrigatoria`, `vai_para_publicacao`;
  - as funções e os gatilhos do modelo anterior, inclusive `concluir_revisao_interna`, `concluir_aprovacao`, `nao_vai_mais_para_publicacao`, a `registrar_publicacao` antiga (a nova chega no ticket 04 de publicacao-e-arquivamento), a trava do autor e o apagar da aprovação na volta. As funções de registrar revisão e aprovação chegam no ticket 05 de revisoes-aprovacao.
- **Testes de banco:** os do modelo anterior são reescritos para as passagens, e os que provam regra que saiu são apagados.

Spec: `.scratch/processos-etapas/spec.md`, seção "Andamento livre (mudança de 2026-10-23)" (Modelo de dados, Quem pode o quê, Regras, Migração). Seções "Modelo de dados" e "Migração dos dados" da spec de `publicacao-e-arquivamento`. Sabatina em `.scratch/quadro-livre/sabatina-parte-1.md`. ADRs 0022, 0023 e 0024.

**Branch:** todo o Andamento livre é feito na branch de integração `quadro-livre-parte-1`, criada neste ticket a partir da `main`, com o marco de início. Este ticket não aplica a migração no banco de desenvolvimento: ela vai junto com as outras no ticket 04 de publicacao-e-arquivamento, para a plataforma não ficar quebrada no meio.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP escritos antes da migração e vistos falhar: uma célula por linha da tabela "quem pode o quê" da seção Andamento livre (cada perfil, inativo e visitante) e uma regra por linha da tabela de regras, inclusive a chegada a Concluídos com data, com explicação e sem nenhuma, e a saída de Concluídos.
- [ ] Teste da conversão, ensaiado num teste temporário antes de aplicar: processos com a Modelagem piloto pendente, com a etapa em andamento e responsável, concluído com escolha "sim" e com escolha "não", arquivado e suspenso. Depois da conversão, a passagem, a etiqueta, o responsável, a data ou a explicação da publicação estão certos, e os eventos antigos de andamento sumiram enquanto os de cadastro e versão ficaram.
- [ ] A view devolve os campos novos para a Consulta. Inativo e visitante não leem. `00_rls_ligada` e `10_privilegios_padrao` passam.
- [ ] Os testes antigos que dependiam de `andamentos` foram reescritos ou apagados (o que saiu está anotado no plano), e o workflow "Testes de banco" passa na branch.
- [ ] Os tipos do banco usados pela tela (`db:types`) foram regenerados a partir das migrações, e `npm test` e `tsc` passam. A tela pode ficar sem as funções novas até o ticket 25.
