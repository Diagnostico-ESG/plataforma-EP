# Desvios — login-perfis

Só entradas novas, datadas; as antigas não se editam.

## 2026-10-07 — ticket 02, teste de banco não visto falhando

- **Previsto:** rodar `supabase/tests/04_autorizacoes.test.sql` no SQL Editor antes da migração `20261007214206_autorizar_emails` e vê-lo falhar (TDD).
- **Aconteceu:** a migração foi colada primeiro; o teste rodou só depois e passou (29 de 29). O passo "ver falhar" ficou sem registro.
- **Decisão:** seguir sem reconstruir o passo (o usuário seguiu sem objeção; opção mais simples). As asserções conferem efeitos que só existem com a migração (recusas `email_*` com motivo, eventos com autor, e-mail normalizado, privilégios do visitante), então um teste que passasse sem a migração é improvável.
- **Ordem das tarefas:** o plano punha o banco primeiro; a interface (tarefas 2 a 5) foi feita antes para juntar os passos manuais do SQL Editor numa só ida. Sem efeito no resultado.

## 2026-10-08 — ticket 03, ordem das tarefas e teste instável corrigido no caminho

- **Ordem das tarefas:** o plano punha o banco primeiro; o teste de banco `05_gerir_usuarios.test.sql` foi gravado primeiro, a interface (tarefas 2 a 4) veio em seguida e os passos manuais do SQL Editor ficaram juntos no fim. Desta vez o teste foi visto falhando antes da migração (26 de 40 `not ok`) e passando depois (40 de 40); 02, 03 e 04 continuaram passando.
- **Teste instável (fora do escopo do ticket, corrigido nele):** a falha intermitente de "Excluir" registrada no handoff de 2026-10-07 voltou na tarefa 3 e foi reproduzida (1 de 4 rodadas frias). Causa: os testes de tela esperavam `findByRole('table')`, mas a tabela já existe no estado carregando (`aria-busy`); numa rodada lenta, procuravam o botão antes de as linhas chegarem. Correção: esperar `findByRole('table', { busy: false })` em `App.administracao.test.tsx` e `App.autorizacoes.test.tsx` (commit próprio, 914f393); 6 de 6 rodadas frias passaram depois. Feito no ticket porque bloqueava os commits (o pre-commit roda os testes) e o arquivo de teste novo usa o mesmo padrão.
- **Teste na tela:** feito pelo usuário com a própria conta (único usuário real no dev): corrigir o próprio nome, o nome mantido depois de sair e entrar, as duas travas "a si mesmo" e a aparência. Desativar e reativar outra pessoa e a trava do último administrador ficam provados só pelos testes de banco e de tela (não há segunda conta real; ADR 0001).

## 2026-10-08 — ticket 04, coluna "Alvo", ordem das tarefas e teste instável da entrada

- **Coluna "Alvo" (sobre quem foi a mudança):** não está escrita no ticket nem na spec (história 38 pede data e hora, quem fez, a ação e o antes e depois). Acrescentada porque, sem ela, "Desativou" não responde a uma auditoria: e-mail para eventos de autorização, nome atual para eventos de usuário (o id, se o usuário não for achado). Decisão de execução registrada no `plano-04.md`; o usuário conferiu a tela sem objeção.
- **Histórico em lista, não em tabela:** a spec fala em "tabela compacta" para Administração > Usuários; o histórico ficou numa lista ordenada (`<ol>`) com a mesma aparência compacta. Uma segunda tabela na área confundiria os testes que buscam a tabela de usuários, e a lista ordenada já diz que a ordem importa.
- **Ordem das tarefas:** como nos tickets 02 e 03, os arquivos do banco foram gravados primeiro, a interface (tarefas 2 a 4) veio em seguida e os passos no SQL Editor ficaram juntos no fim. O teste `06_historico.test.sql` foi visto falhando antes da migração (17 de 25 `not ok`) e passando depois (25 de 25); 02, 03, 04 e 05 continuaram passando.
- **Teste instável da entrada (fora do escopo, corrigido no ticket):** o primeiro commit da branch foi barrado pelo pre-commit com `App.entrada.test.tsx` falhando ("o botão chama o Google": 0 chamadas). Causa, a mesma do teste corrigido no ticket 03: o botão "Entrar" já existe, desligado, enquanto o acesso é conferido, e numa rodada lenta o clique caía nele. Correção: esperar o botão ligado antes de clicar; 4 de 4 rodadas frias passaram. O plano foi junto no mesmo commit (06ab39c), porque tinha ficado preparado da tentativa barrada.
- **Arquivo de teste esvaziado por engano:** o usuário esvaziou `supabase/tests/02_login_barreira.test.sql` ao copiá-lo; o conteúdo foi recuperado da versão comitada (`git show HEAD:…`), sem perda.
- **Achado fora do escopo:** `usuarios`, `usuarios_emails` e `autorizacoes` aceitam `truncate` de `authenticated` (e as duas primeiras, de `anon`). Sem caminho pela API (o PostgREST não oferece `truncate`); registrado no `backlog.md` para o `/demanda` antes do `/ship`.

## 2026-10-08 — /polir (telas de login-perfis: entrada, Administração, menu da conta)

Auditoria do Impeccable: 16/20 (bom). O detector automático não apontou nada. A Administração foi avaliada pelo código, porque só abre com o login Google do usuário; a entrada foi vista no navegador em computador e celular.

Corrigidos:
- **Esc no menu da conta perdia o foco:** com o foco no "Sair", o Esc fechava o painel e o foco ia para o topo da página. Agora volta ao avatar. Teste de regressão em `App.conta.test.tsx`.
- **Campos mais baixos que os botões:** e-mail, seletor de perfil e campo de nome passaram a ter 32px, a altura dos botões ao lado (o estilo do campo de nome foi unido ao dos outros).
- **Datas do histórico em fonte mono,** como o DESIGN.md manda para datas.
- **Histórico em tela estreita:** abaixo de 640px cada evento vira uma pilha, em vez de três colunas fixas espremidas.
- **Título da entrada em peso 700,** como a escala "página".
- **Classe `visualmente-oculto`** passou do CSS da Administração para o `index.css`, porque serve à aplicação inteira.

Deixados de fora:
- **Seletor de perfil grava a cada seta do teclado (P1):** muda o comportamento da tela (exigiria um botão de confirmar ou gravar só ao sair do campo). Foi para o `backlog.md`.
- **Excluir e Desativar sem confirmação (P2):** decisão de comportamento, não de acabamento. Foi para o `backlog.md`.
- **Duas cores de erro (P2):** a falha da Administração usa a caixa amarela de pendência, e a da entrada usa o vermelho de atraso. As duas foram aprovadas na tela, e o DESIGN.md não define a cor de erro de gravação; fica para decidir junto com o item anterior.
- **Botão "Filtrar" visível na Administração sem função (P2):** vem da identidade visual e está planejado para Processos; esconder fora de Processos cabe à funcionalidade "Processos e etapas".
- **Cabeçalho da tabela no tamanho de rótulo sem maiúsculas:** o DESIGN.md só pede maiúsculas em pílula e rótulo de seção; não é desvio.

## 2026-10-08 — ticket 05, gatilho da foto e imagem padrão do Google

- **Gatilho sem a condição de mudança:** o plano disparava o gatilho só quando os dados do Google mudavam. O teste de ponta a ponta mostrou a foto antiga: os dados novos já estavam no Auth de uma entrada anterior à migração, e a entrada seguinte trouxe os mesmos dados. Migração nova (`20261008155748_foto_a_cada_entrada.sql`) recria o gatilho para rodar a cada alteração da conta no Auth; a função continua só gravando quando o link muda. Caso de regressão no `07_foto_google.test.sql`. Em produção, isso corrige na primeira entrada quem trocou a foto antes da publicação.
- **História 45 na prática:** o Auth do Supabase *mescla* os dados do Google (chave ausente fica com o valor antigo), e o Google manda uma imagem padrão (letra no círculo colorido) para quem não tem foto, como o próprio teste na tela mostrou. Então quem tira a foto do Google passa a ver a imagem padrão do Google, não as iniciais da plataforma. Opções mostradas: aceitar, ou reconhecer o endereço da imagem padrão e tratá-lo como sem foto (frágil, formato não documentado do Google). **Decisão do usuário: aceitar.** O gatilho continua tratando "sem foto" como nulo (iniciais), caso o Google um dia deixe de mandar a imagem. Spec atualizada na regra da foto.

## 2026-10-08 — bug do "Sair" sem aviso de falha (/demanda, caminho de bug)

- **Defeito:** se a saída falhava (por exemplo, sem conexão), nada acontecia na tela: o `sair` de `src/hooks/useEntrada.ts` esperava `acesso.sair()` e, com erro, parava ali sem avisar a tela (o erro ficava sem tratamento). A pessoa continuava dentro sem saber por quê.
- **Lacuna da spec:** as histórias 9 e 10 e a regra da barra superior não diziam o que acontece quando o Sair falha. Acrescentadas a história 55 e a frase na regra da barra superior.
- **Decisão do usuário (opção A):** manter a pessoa dentro, com a mensagem em vermelho no menu da conta. A outra opção (tirar da tela mesmo assim) foi descartada porque a sessão poderia continuar aberta no servidor, o pior caso num computador compartilhado.
- **Correção:** o menu da conta trata a falha e mostra a mensagem com as cores de atraso, como as demais falhas (ADR 0003). Testes de regressão em `src/App.conta.test.tsx`. O `vite.config.ts` passou a carregar também o `Moldura.css` nos testes, para o teste da cor.

## 2026-10-08 — bug do "Sair": opção A trocada pela C, depois da revisão de código

- **Achado da revisão (conferido no código do `@supabase/auth-js` 2.117.2, `GoTrueClient.js`, `_signOut`):** quando o aviso ao servidor falha (por exemplo, sem rede), a biblioteca apaga o login do navegador e só depois devolve o erro. Com a opção A, a tela mostrava a pessoa "dentro" com "Não foi possível sair", mas o navegador já tinha esquecido o login, e recarregar levava à tela de entrada. O simulador dos testes (`AcessoFalso`) não imitava isso, por isso os testes passaram.
- **Premissa errada na decisão anterior:** a opção B tinha sido descartada porque "a sessão continua aberta no servidor". Isso é verdade, mas o navegador já não guarda o login, então ninguém naquele computador continua como aquela pessoa.
- **Decisão do usuário: opção C.** Depois de uma falha no Sair, a plataforma confere se o navegador ainda guarda o login. Se não guarda, vai para a tela de entrada; se guarda (por exemplo, a falha foi ao renovar um login vencido) ou se nem a conferência responde, fica dentro com a mensagem vermelha. A spec (história 55 e regra da barra superior) foi reescrita.
- **Junto, pontos menores da revisão:** botão Sair desativado durante a saída (clique duplo); teste de que a mensagem some e volta numa nova falha; a lógica do menu foi para `src/hooks/useSaida.ts`; a leitura do CSS dos testes de cor virou a função `src/testes/regrasDaClasse.ts`, usada pelos dois testes. O `AcessoFalso` passou a imitar as duas formas de falha da biblioteca.

## 2026-10-08 — /polir (login-perfis, segunda rodada: tickets 05 a 07 e bug do "Sair")

Auditoria do Impeccable: 17/20 (Bom). O detector automático não achou nada; os achados vieram da leitura do código. Não houve teste na tela: a entrada pelo Google é do usuário, e o navegador embutido não tem sessão. Os achados são de comportamento do foco e foram provados por testes.

Corrigidos (com testes em `src/App.conta.test.tsx` e no novo `src/App.focoNaAdministracao.test.tsx`):
- **Menu da conta, mensagem antiga (P2, do backlog):** ao fechar o menu, a falha do Sair é esquecida; reabrir não mostra a mensagem velha (`esquecerFalha` em `src/hooks/useSaida.ts`).
- **Menu da conta, foco depois da falha (P2, do backlog):** o Sair fica desativado durante a tentativa e perdia o foco; na falha, o foco volta a ele.
- **Menu da conta não fechava com clique fora (P2):** agora fecha (clique dentro do painel continua sem fechar).
- **Perfil na tabela, foco perdido (P2):** ao salvar ou cancelar, os botões somem; o foco volta ao seletor de perfil.
- **Corrigir nome, foco perdido (P2):** ao salvar ou cancelar, o formulário some; o foco volta ao botão "Corrigir nome".
- **Cor fora do arquivo de cores (P3):** o véu atrás da janela de confirmação virou o token `--veu-janela` em `src/styles/tokens.css` (Regra do Arquivo Único).
- **Aviso do e-mail sem ligação ao campo (P3):** o campo ganhou `aria-describedby` apontando para a mensagem.

Deixados de fora:
- **Tabela de usuários rola para o lado em tela estreita (P3):** celular é opcional no projeto, e a área de trabalho já rola; não vale um layout próprio agora.
- **Foco depois de Excluir ou Desativar confirmados:** a linha muda ou some e o navegador devolve o foco ao botão de origem quando ele ainda existe; quando a linha some (Excluir), o foco cai no topo. Resolver pede decidir um destino (por exemplo, o título "Usuários") e entra melhor numa revisão de acessibilidade da tabela inteira; fica registrado aqui para o `/ship`.

## 2026-10-08 — /ship de login-perfis (achados da revisão, da segurança e da conferência na tela)

Ponto de partida da revisão: `marco/2026-10-07-inicio-login-perfis`, o mais antigo, porque nenhum ticket tinha passado pelo `/ship`. Correções a partir de `marco/2026-10-08-antes-correcao-ship-login-perfis`.

- **`/code-review` invalidou um critério marcado como feito (ticket 07):** "Se a gravação confirmada falhar, a mensagem aparece na linha". A falha de Excluir, Desativar e Reativar aparecia acima da tabela; o teste só conferia que ela aparecia. Corrigido por decisão do usuário (commit edb4a70, com testes que conferem a mensagem dentro da linha).
- **Célula da tabela "quem pode o quê" sem teste:** `usuarios_emails` criar, alterar e apagar. Teste novo `supabase/tests/09_emails_sem_escrita.test.sql` (16 casos, com a pré-condição de que as linhas existem); ainda não rodado no banco (vai na bateria `npm run test:db`).
- **História 12 divergia do código:** quem é desativado com a página aberta só vê "acesso inativo" ao recarregar (o banco já não entrega dados). Por decisão do usuário, a spec passou a descrever o comportamento atual, e levar à mensagem sem recarregar foi para o backlog.
- **Revisão de segurança do código (reserva):** o `/security-review` não rodou, porque o projeto não tem repositório remoto (`origin/HEAD`); feita a revisão de reserva das migrações e do módulo de acesso, menos completa. **Achado real:** a foto do avatar era copiada de `raw_user_meta_data`, que a própria pessoa altera pela API (`auth.updateUser`); qualquer logado, até inativo, trocava a própria foto por um link qualquer, carregado pelos colegas. Corrigido com a migração `20261008205500_foto_pela_identidade.sql` (a foto vem de `auth.identities`, que só o Auth grava), conferida no código do Supabase Auth; teste 07 falhou antes (7 de 8) e passou depois (8 de 8) pelo SQL Editor; spec atualizada. Considerados de baixo risco: texto da recusa montado no endereço (o React escreve como texto, e a frase é a da plataforma) e troca do e-mail da conta pela API (pede confirmação no endereço novo; nada decide acesso pelo e-mail da conta depois do primeiro acesso).
- **`security-auditor`:** a skill falhou no Windows (problema conhecido); `npm audit --json` direto: nenhuma vulnerabilidade em 413 pacotes (`.scratch/security.md`).
- **Conferência na tela (critério `[visual]` do ticket 06):** o Cancelar descia sozinho para a linha de baixo quando a coluna Perfil ficava estreita. Corrigido com uma grade de três colunas (commit 8bf681c); a revisão dessa correção apontou que uma falha longa alargaria as colunas, conferido numa réplica com o CSS real e corrigido (commit 5eda001).
- **Achados de padrão e de teste deixados para depois** (domínio do e-mail escrito em vários lugares, passo a passo de envio repetido, conferência de administrador copiada em 8 políticas, concessão a `supabase_auth_admin` sem ADR, tipos soltos, lacunas do simulador): no backlog, com origem nesta revisão.
- **Sem dependência circular, sem migração destrutiva** (a migração nova só troca um gatilho e uma função), **tipos do banco em dia.**

## 2026-10-09 — /ship de login-perfis (retomada: bateria de banco e marca de entrega)

- **Passo 7 concluído.** A bateria `npm run test:db` (10 arquivos, de `00` a `09`, incluindo o `09_emails_sem_escrita`, que nunca tinha rodado) passou inteira no GitHub Actions ("Testes de banco", na `main`), confirmado pelo usuário em 2026-10-09. Antes, a porta 5432 da rede do escritório impedia a execução.
- **Critério `[visual]` conferido na tela real pelo usuário** (Salvar e Cancelar ao lado do seletor de perfil): ok. A marca de entrega sai sem ressalva.
- Nenhuma mudança em `src/` ou `supabase/` de login-perfis desde o `/ship` de 2026-10-08, então a revisão de código, a de segurança e a cobertura anteriores continuam valendo.

## 2026-10-09 — /ship de login-perfis (entrada por bug: permissões padrão do Supabase)

Ponto de partida da revisão: `2d49a6b` (`marco/2026-10-09-antes-correcao-permissoes-padrao`), o commit anterior à correção.

- **Saída diferente da sugerida no backlog:** o item sugeria `revoke all` e conceder de volta só o necessário, como `eventos` fez; a migração `20261010012539_sem_privilegios_padrao.sql` tira só `references`, `trigger` e `maintain`. Efeito: visitante e logado continuam com os privilégios de tabela de leitura e gravação em `usuarios`, `usuarios_emails` e `autorizacoes`, barrados só pela RLS (já era assim; não é regressão). O `revoke all` foi para o backlog, por decisão do usuário de fechar a entrega só com o que bloqueia (2026-10-09).
- **Pontos cegos do teste geral `10_privilegios_padrao`, achados no `code-review`:** funções em `public` (execução liberada por padrão), schemas expostos além de `public` e views sem `security_invoker` (nenhum teste confere). Os aceitos antes continuam: permissão por coluna e herdada de outro papel. Todos no backlog.
- **`/security-review`:** comparou com `origin/main` e viu só o commit do backlog (markdown), sem nenhuma mudança de código; feita a revisão de reserva das mudanças desde `2d49a6b` (uma migração que só retira privilégios e um teste). Nenhum achado.
