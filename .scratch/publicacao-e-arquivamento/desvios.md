# Desvios de publicacao-e-arquivamento

## 2026-10-23 — /polir da funcionalidade (tickets 01 a 03)

- **Auditoria (`impeccable audit`, escopo: os 43 arquivos de `src/` alterados desde o marco `marco/2026-10-22-inicio-publicacao-e-arquivamento`, sem testes):** o detector não apontou nada. Conferência à mão do que a funcionalidade acrescentou: `JanelaDaPublicacao` (rótulos ligados aos campos por `useId`, `type="date"` com `min`/`max`, aviso de dado pessoal), `PerguntaDaPublicacao` (grupo de rádios nativos com `role="radiogroup"` e nome acessível), `AgoraDoConcluido`, selo "Arquivado" (a `Pilula` neutra que já existia), filtro "Arquivados" (o `SeletorDoFiltro` que já existia), coluna Concluídos vazia. As classes de CSS novas usam só tokens (`--texto-2`, `--tam-secundario`, `--esp-*`), sem cor fixa; todas as classes usadas existem no CSS.
- **Polimento (`impeccable polish`):** nada corrigido, porque a auditoria não trouxe defeito. O ticket 03 não mexeu na interface (banco e funções puras das planilhas). O polimento visual do ticket 02 já tinha sido feito em 2026-10-22.
- **Deixado de fora, com o motivo:** (1) o filtro "Arquivados" que desce para uma segunda linha da barra a 1366×768 (já no backlog; a barra quebra por desenho e não atrapalha o uso); (2) a conferência renderizada desta passagem: não foi feita, porque exigiria login e banco, ou uma vitrine temporária com módulos falsos. **Presumido**, então, o aspecto na tela dos critérios `[visual]` dos tickets 01 e 02 além do que o `/polir` do ticket 02 já viu.
- **Não é de design, mas ficou pendente (backlog, 2026-10-22):** a gaveta da Publicação pendente de um processo concluído com "não" ainda oferece Iniciar, Dispensar e Realizada anteriormente; regra a decidir.

## 2026-10-23 — /ship (tickets 01 a 03)

- **/code-review (padrões e spec, desde `marco/2026-10-22-inicio-publicacao-e-arquivamento`):** nada bloqueante. Registrado como divergência: (1) a migração `20261023004441` abre uma exceção na trava do arquivado para a propagação de `macroprocesso_id` do pai ao subprocesso (só dentro do gatilho do pai, nada mais pode mudar); a spec dizia que o arquivado recusa tudo, menos Registrar publicação e Desarquivar. (2) A view `processos_com_andamento` foi reescrita inteira nas migrações 1 e 2 (duplicação consciente, uma coluna nova por vez). (3) `publicacao_antes_da_aprovacao` lê as duas datas de dentro da mensagem de erro do banco, sem validar o formato. (4) A conversão dos quatro estados antigos foi ensaiada à parte antes de aplicar a migração 1 e o ensaio não está no repositório. Alarmes falsos descartados: o filtro "Arquivados" tem "Mostrar" como opção padrão e a Publicação desativada tem teste (48).
- **Revisão de segurança:** o `/security-review` não encontrou mudanças (branch já integrada); foi feita a revisão de reserva, menos completa, por leitura do que mudou desde o marco. Nenhum achado. Foi conferido que as marcas de sessão `ep.*` não se forjam pela API, os privilégios por perfil, a trava do arquivado e as funções `security definer` em `private`. Observação de integridade, já no backlog: `update` direto em `andamentos` pode pôr a Publicação em andamento num processo com escolha "não".
- **Banco:** nenhuma migração destrutiva; tipos do banco em dia (a diferença era só de quebra de linha); "Testes de banco" da `main` verde (#178). A linha da migração `20261023020432` faltava no `AMBIENTES.md` e foi acrescentada.

## 2026-10-24 — /executar-complexo do ticket 04 (Andamento livre, parte 1)

- **O que já estava pronto e não foi refeito:** a chegada em `mover_processo`, as colunas da publicação, a trava do arquivado em mover, etiqueta e responsável e a conversão dos dados vieram do ticket 24; `DadosDaChegada` e o selo "Sem publicação", do 25. Os testes `49` e `52` já tinham sido ajustados.
- **Decisão: `arquivar_so_concluido` mantém o motivo.** Só a frase mudou para "Só se arquiva processo concluído, suspenso ou cancelado.".
- **Decisão: a view ganhou `explicacao_sem_publicacao`** (última coluna), para o verso mostrar "Concluído sem publicação: {explicação}". A coluna já era legível por todo perfil ativo; o pacote das planilhas continua sem ela.
- **Decisão: marca `ep.movendo_processo = 'publicar'`** na `registrar_publicacao`, para liberar só as colunas da publicação sem abrir as passagens do movimento.
- **Decisão: "Arquivado · {situação}" na Lista** são a pílula da situação e o selo "Arquivado" lado a lado (como já estavam); o ticket só ganhou o teste do suspenso e do cancelado arquivados. No Agora do suspenso e do cancelado arquivados o texto é "Arquivado · {situação}: {motivo}".
- **Divergência: o módulo falso não simula "data antes da aprovação"** (não tem aprovações); a recusa vem do banco e a tradução dela tem teste em `publicacaoSupabase.test.ts`.
- **Divergência: tipos escritos à mão** (`registrar_publicacao` e `explicacao_sem_publicacao` na view). O `gen types --local` sai em formato diferente do arquivo, gerado pelo remoto; a regeneração de verdade fica na integração (tarefa 7).
- **Não feito nesta sessão (depende do GitHub e do usuário):** workflows "Testes de banco" e "Migrar banco de desenvolvimento" (o navegador do app não está logado no GitHub), conferência na tela com login real, republicação da função das planilhas e a junção à `main`.

## 2026-10-25 · /polir (Andamento livre, parte 1: janelas de chegada e de publicação, Agora de Concluídos, selos)

- **Auditoria (impeccable audit), código das telas novas:** o detector não achou nada em `processos/`, `administracao/` e `versoes/`; cores todas por token, foco visível e movimento reduzido globais em `index.css`, janela nativa com título ligado, fieldset/legend nos rádios, rótulos ligados aos campos, falha em `role="alert"`, link da publicação só http/https com `rel="noopener noreferrer"`. A tela não foi aberta (sem vitrine com login real), então os critérios `[visual]` seguem presumidos.
- **Corrigido:** a data da publicação (`CamposDaPublicacao`) e a explicação de "Concluir sem publicação" (`JanelaDaChegada`) ganharam `required`, para o leitor de tela anunciar o campo como obrigatório (o botão já só habilitava com eles preenchidos).
- **Deixado de fora, com o motivo:**
  - Borda dos campos (`--linha` sobre branco, cerca de 1,3:1, abaixo dos 3:1 do WCAG 1.4.11): vale para os 16 usos de `border: 1px solid var(--linha)` em todo o sistema, não só para as janelas novas; pede decisão de token (um tom de borda de campo mais escuro), não um ajuste local. Vai para o backlog.
  - Botão de confirmar desabilitado sem dizer por quê (nas duas janelas): padrão já existente em todas as `JanelaDeEdicao`; o campo obrigatório agora é anunciado, o que cobre o essencial.
  - `.selo-reuniao` com borda esquerda de 3px: já existia antes desta funcionalidade e é o marcador de tipo do DESIGN.md.
- **Conferência:** `npm run typecheck` sem erros; `npm test`: 184 arquivos, 2405 testes verdes.
