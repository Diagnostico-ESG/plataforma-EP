# Trava de arquivos (ticket 11) — plano de execução

> **Para quem executa:** use `superpowers:executing-plans` (a pedido do `/executar-complexo`). Marque as caixas (`- [x]`) à medida que cada passo termina.

**Objetivo:** mover o processo para a frente da Modelagem piloto ou da Relatório e modelagem técnica, faltando o que a etapa exige, passa a ser recusado pelo banco e pela tela; a tela abre uma janela que diz o que falta e oferece o envio ali mesmo, e só depois move.

**Ticket:** `.scratch/documentos-versoes/issues/11-trava-de-arquivos.md`. **Spec:** `.scratch/documentos-versoes/spec.md`, seção "Arquivos por etapa (mudança de 2026-10-26)" (histórias 97 a 106; decisões 1 a 4 e 10). **ADRs:** 0025 (vale), 0022 e 0024 (a trava de Concluídos vem depois da trava de arquivos). **Branch:** `quadro-livre-parte-3` (já criada; marco `marco/2026-10-26-inicio-ticket-11-documentos-versoes`, enviado ao GitHub). A branch não é juntada à `main` neste ticket (decisão da parte, ver `desvios.md` do ticket 09).

**Regras do banco que valem aqui** (`.claude/regras/banco.md`, lido em 2026-10-26): teste de banco antes da migração; função em `private` com `search_path` vazio e `revoke`/`grant` só a `authenticated`; view com `security_invoker = true`; dado que se calcula vira view (nada de coluna guardada); migração, teste de banco e tipos no mesmo commit; migração já aplicada não se edita; alvo conferido antes de comando de banco (vínculo atual = `yclkzyoebpsxmgpbcbus`, desenvolvimento, confere com `supabase/.temp/project-ref`); dados de teste inventados. **O Docker não está ligado nesta máquina hoje** (daemon fora do ar): os testes de banco rodam no workflow "Testes de banco" do GitHub Actions e a migração vai pelo workflow "Migrar banco de desenvolvimento" (ambos autorizados no CLAUDE.md).

## Fora deste ticket (não fazer)

- Selo "Relatório pendente" do cartão, coluna `ultima_versao_tem_relatorio` e o "P" da versão piloto no cartão: já estão no backlog de 2026-10-26; **a decisão sobre eles é registrada no fim** (Tarefa 6), sem mexer na view além dos três campos novos.
- Data da validação e .pdf da aprovação (ticket 06 de revisoes-aprovacao).
- Publicar a função `arquivos-no-drive` (já publicada pelo usuário; este ticket não toca a função do servidor).

## Decisões de execução (as que o ticket deixa abertas)

1. **Qual etapa trava e quando:** as duas etapas com trava são `modelagem` (Modelagem piloto) e `relatorio_modelagem_tecnica`. Uma etapa trava a ida de `de` para `para` quando está **ativa**, `de.ordem <= etapa.ordem` e `para.ordem > etapa.ordem` (cobre "vindo dela ou de antes, indo para depois dela", inclusive pular por cima). Voltar, a mesma etapa, processo que já estava depois dela e etapa desativada não travam.
2. **O que a Modelagem piloto exige:** uma versão piloto. **Escolha minha, a registrar em `desvios.md`:** uma versão em sequência já enviada também basta, porque depois da primeira versão em sequência o banco recusa versão piloto (história 77) e o processo ficaria sem saída (caso real: processo antigo que voltou à Modelagem piloto sem nunca ter tido piloto). O ticket não trata esse caso; é a escolha mais conservadora (não prende o processo).
3. **O que a técnica exige:** uma versão em sequência **e** um relatório numerado (`numero_do_relatorio` não nulo), sem importar a ligação entre os dois.
4. **Quando a trava confere:** em `mover_processo`, depois da própria etapa (nada a fazer) e antes da regra da chegada a Concluídos; quando duas etapas travam, a primeira em ordem diz o que falta (a segunda só é conferida na volta da janela, uma de cada vez, como na tela).
5. **Recusas do banco** (P0001, `motivo:valor`): `trava_piloto` (sem valor) e `trava_tecnica:versao`, `trava_tecnica:relatorio`, `trava_tecnica:versao_e_relatorio`. Frases em `src/processos/frasesDeTravaDeArquivos.ts`: "Para sair da Modelagem piloto, envie a versão piloto (.bpm)." e "Para sair da Relatório e modelagem técnica, envie {a versão | o relatório | a versão e o relatório}.".
6. **View:** `create or replace view processos_com_andamento` com as três colunas novas **no fim** (`tem_versao_piloto`, `tem_versao_em_sequencia`, `tem_relatorio_numerado`), mesmo corpo da migração `20261025194034`. Piloto = `versoes.piloto`; em sequência = não histórica e não piloto; relatório numerado = arquivo de papel `relatorio` com `numero_do_relatorio` não nulo, em qualquer versão do processo.
7. **Tela, o que o processo "tem":** `ProcessoDaLista.arquivos?: ArquivosDoProcesso` (`versaoPiloto`, `versaoEmSequencia`, `relatorioNumerado`), preenchido pela view. **Sem o campo (processo montado à mão em teste), a tela não trava** (mesmo padrão de `cartao` e `etiqueta`); a falsa de processos só recusa quando o campo existe.
8. **Função pura** `src/processos/travaDeArquivos.ts`: `primeiraTravaQueFalta({ de, para, catalogo, arquivos })` devolve `{ etapa: 'modelagem' | 'relatorio_modelagem_tecnica', nome, falta: ('versao_piloto'|'versao'|'relatorio')[] }` ou `null`. O mesmo código das etapas (`codigosDasEtapas.ts`) serve a tela e a falsa.
9. **Fluxo da tela** (hook `useMovimentoDoProcesso`): `mover` consulta a trava; se há, abre `travaDeArquivos` (processo, destino, trava). Ao enviar, o hook atualiza o `arquivos` local do pedido (piloto → `versaoPiloto`, versão → `versaoEmSequencia`, relatório → `relatorioNumerado`) e consulta de novo: outra trava → próxima janela; senão a chegada a Concluídos, se pede; senão grava o movimento. Falha no movimento depois do envio: "Os arquivos foram enviados, mas o processo não foi movido." (a janela fecha e a falha aparece onde as outras do movimento aparecem; o clique seguinte no mesmo destino não abre a trava, porque a tela relê os arquivos pela view). Fechar a janela deixa tudo como estava; o `arquivos` local nunca vai ao banco.
10. **A janela** `JanelaDaTrava` é um `<dialog>` modal no padrão da `JanelaDaChegada` (mesma moldura de `JanelaDeEdicao`, sem o botão de salvar dela) com os formulários que já existem dentro: `FormularioDeVersao` (piloto, ou em sequência) e `FormularioDeRelatorio`. Eles ganham `rotuloDoEnvio` ("Enviar e mover"), e a versão em sequência ganha `relatorioObrigatorio` para o caso "versão e relatório". Os dois formulários passam a pedir só `Pick<ProcessoDaLista, 'id' | 'nome' | 'setorSigla'>` (o Quadro só tem o processo da lista). A janela lê as versões do processo (`listarVersoes`) para a prévia do número, como o verso.
11. **O módulo de versões** chega ao Quadro e ao verso: `QuadroDeProcessos` e `CaminhoDoProcesso` recebem `versoes: ModuloDeVersoes` pelo mesmo caminho que `processos` (props vindas de `App`). `modoDoEnvio` sai de `SecaoDeVersoes.tsx` para `src/versoes/formularioDeVersao.ts` (a janela e o verso usam o mesmo).

## Arquivos

- Banco: `supabase/migrations/<AAAAMMDDHHMMSS>_trava_de_arquivos.sql` (nova, depois de `20261026140000`); testes `supabase/tests/52_mover_processo.test.sql` (ajustado), `supabase/tests/59_trava_de_arquivos.test.sql` (novo) e os testes que movem processo por cima das etapas com trava sem ter os arquivos (ver Tarefa 1); `46_funcoes_e_views_seguras` continua passando.
- Tipos: `src/types/database.ts` (`npm run db:types`).
- Tela, função pura e módulos: `src/processos/travaDeArquivos.ts` (+ teste), `frasesDeTravaDeArquivos.ts`, `recusasDoBanco.ts` (+ teste), `tipos.ts`, `processosSupabase.ts` (e onde a linha da view vira `ProcessoDaLista`), `movimentoFalso.ts`, `ProcessosFalso.ts`, `codigosDasEtapas.ts`.
- Hook e componentes: `src/hooks/useMovimentoDoProcesso.ts`, `src/components/processos/JanelaDaTrava.tsx` (novo, + `.css` se faltar), `QuadroDeProcessos.tsx`, `CaminhoDoProcesso.tsx`, `VisaoDosProcessos.tsx`/`App.tsx` (o módulo de versões), `src/components/versoes/FormularioDeVersao.tsx`, `FormularioDeRelatorio.tsx`, `SecaoDeVersoes.tsx`, `src/versoes/formularioDeVersao.ts`.
- Testes de tela: `src/App.travaDeArquivos.test.tsx` (novo), `App.arrastarParaMover`, `App.agoraDoVerso`, `App.chegadaAConcluidos` (ajustados onde a trava muda o caminho).
- Documentação: `docs/manutencao/04-modelo-de-dados.md` (a view e a trava), `CONTEXT.md` (já tem "Trava de arquivos"; conferir só).

---

## Tarefa 1: Testes de banco antes da migração (critério 1 do ticket)

- [ ] Ler `supabase/tests/52_mover_processo.test.sql` inteiro e `56_versao_piloto.test.sql` (como se cria versão piloto/em sequência/relatório numerado nos testes) para copiar o padrão (`plan(N)`, `_tap`, usuários fictícios, `pg_temp.*`).
- [ ] `59_trava_de_arquivos.test.sql` (novo): Modelagem piloto → técnica sem piloto recusado (`trava_piloto`); Não iniciados → Revisão interna sem piloto recusado (pula por cima); com versão piloto aceito; com versão em sequência e sem piloto aceito (decisão 2); técnica → Validação sem nada recusado (`trava_tecnica:versao_e_relatorio`), só com versão `…:relatorio`, só com relatório `…:versao`; versão e relatório ligados a versões diferentes aceito; Revisão interna → Aprovação também confere a técnica? **(não: Revisão interna tem ordem maior que a técnica, não trava)**; voltar sem nada aceito; processo que já estava adiante (Validação → Publicação) sem nada aceito; mudar a etiqueta sem nada aceito; etapa desativada no catálogo não trava (`update etapas set ativa = false`, desfeito no fim); relatório sem número (pdf antigo) não conta; Consulta e visitante continuam recusados antes da trava (perfil primeiro); os três campos da view (`tem_versao_piloto`, `tem_versao_em_sequencia`, `tem_relatorio_numerado`) nos casos sem nada, só piloto, só sequência e relatório, e dois processos independentes (subprocesso sem herdar do pai).
- [ ] Rodar `grep -rln "mover_processo" supabase/tests` e, para cada teste que **move para além da Modelagem piloto ou da técnica** sem ter os arquivos (52, 17, 20, 21, 37, 39, 40, 41, 44, 49, 50, 51, 53, 54, 55, 57…), listar o que precisa de ajuste. O ajuste mecânico é montar o piloto, a versão e o relatório do processo antes do movimento (função de apoio por teste, dados inventados). Não ajustar ainda: o vermelho primeiro mostra os que quebram de verdade (Tarefa 2 os conserta).
- [ ] `52_mover_processo`: ajustado onde o movimento atravessa as etapas com trava; os casos novos da trava ficam no 59.
- [ ] Commit só dos testes novos e do 52 (`git add supabase/tests`), `git push` da branch e disparar o workflow "Testes de banco" na branch. **Esperado: vermelho pelo motivo certo** (a recusa não existe; coluna da view inexistente). Anotar o número da execução em `desvios.md`.

## Tarefa 2: Migração (critério 1 do ticket)

- [ ] Conferir o alvo (`supabase/AMBIENTES.md`: vínculo atual = desenvolvimento, igual ao `project-ref`).
- [ ] `npx supabase migration new trava_de_arquivos`; conferir que o horário é depois de `20261026140000` (senão escolher à mão).
- [ ] Escrever, nesta ordem: `create or replace view public.processos_com_andamento` com as três colunas no fim (decisão 6; `revoke all … from anon, authenticated; grant select … to authenticated` repetidos); `private.arquivos_que_faltam(p_processo uuid, p_etapa text)` (o que falta para sair da etapa: `null` ou o texto do valor); `private.conferir_trava_de_arquivos(p_processo uuid, de public.etapas, para public.etapas)` (percorre as duas etapas com trava em ordem, decisão 1); `mover_processo` recriada com a chamada nova logo depois do `if de.id = para.id` (decisão 4), igual à da migração `20261024040945` em todo o resto; `revoke`/`grant` das funções novas e da recriada.
- [ ] Migração não destrutiva: só funções e view; registrar no cabeçalho.
- [ ] Commit da migração e dos testes ajustados; `git push` e "Testes de banco" na branch. **Todos os arquivos verdes**, inclusive `00_rls_ligada`, `10_privilegios_padrao` e `46_funcoes_e_views_seguras`. Teste de outro ticket que quebre pela trava: ajustar (mecânico, Tarefa 1) ou parar e perguntar se o motivo for outro.

## Tarefa 3: Aplicar no desenvolvimento e regenerar os tipos

- [ ] Disparar o workflow "Migrar banco de desenvolvimento" na branch com o nome da migração e ler o resultado.
- [ ] `npm run db:types` (alvo conferido). Se o arquivo vier "modificado" só por quebra de linha, `git add`.
- [ ] Atualizar a lista de migrações em `supabase/AMBIENTES.md`. Commit.

## Tarefa 4: Função pura, frases e recusas (critério 3 do ticket)

Teste primeiro, visto falhar, em Vitest.

- [ ] `src/processos/travaDeArquivos.test.ts` + `travaDeArquivos.ts` (decisões 1 a 3 e 8): sem trava quando `arquivos` é indefinido; Modelagem piloto → técnica sem piloto → `falta: ['versao_piloto']`; com versão em sequência e sem piloto → sem trava; Não iniciados → Validação sem nada → primeiro a Modelagem piloto, depois (com `versaoPiloto` verdadeiro) a técnica com `['versao','relatorio']`; só o relatório, só a versão; voltar e mesma etapa, `null`; etapa travada desativada no catálogo, `null`; catálogo com **etapa nova** entre as duas travas (a ida atravessa e confere as duas); destino Concluídos passa pelas duas.
- [ ] `src/processos/frasesDeTravaDeArquivos.ts` (teste junto): as frases da decisão 5 e `fraseDaTravaDoBanco`.
- [ ] `recusasDoBanco.ts`: `trava_piloto` e `trava_tecnica` entram no padrão e na tabela; `recusasDoBanco.test.ts` prova a frase (o teste do módulo real, critério 3).
- [ ] `tipos.ts`: `ArquivosDoProcesso` e `ProcessoDaLista.arquivos?`; leitura da view em `processosSupabase.ts` (e o teste dele: os três campos).
- [ ] `movimentoFalso.ts` + `ProcessosFalso.ts`: `moverProcesso` recusa pela mesma função pura, com as mesmas frases, quando o processo tem `arquivos`; teste em `ProcessosFalso.mover.test.ts`.
- [ ] `npx vitest run src/processos` verde; commit.

## Tarefa 5: A tela (critério 2 do ticket)

Teste de tela primeiro, com o aplicativo inteiro (`src/App.travaDeArquivos.test.tsx`), visto falhar.

- [ ] Casos: a trava pela lista do Agora (a janela abre, o processo não se move); a trava ao arrastar; a janela com só o que falta (versão piloto; versão e relatório; só um dos dois); enviar e mover (o formulário envia pelo módulo de versões falso e o processo se move); fechar sem enviar (continua onde estava); falha no envio (nada move, o preenchido fica); falha no movimento depois do envio ("Os arquivos foram enviados, mas o processo não foi movido."); as duas travas em sequência e depois a chegada a Concluídos; voltar sem trava; processo adiante sem trava.
- [ ] `src/versoes/formularioDeVersao.ts`: `modoDoEnvio` sai de `SecaoDeVersoes.tsx` para cá (teste existente do arquivo cobre).
- [ ] `FormularioDeVersao`/`FormularioDeRelatorio`: `rotuloDoEnvio` opcional, `relatorioObrigatorio` opcional no modo em sequência (o botão só habilita com o .docx; teste em `formularioDeVersao.test.ts`), `processo` como `Pick` (decisão 10).
- [ ] `JanelaDaTrava.tsx` (decisão 10) e o hook (decisão 9); `QuadroDeProcessos`, `CaminhoDoProcesso` e quem os monta passam o módulo de versões.
- [ ] `App.arrastarParaMover`, `App.agoraDoVerso`, `App.chegadaAConcluidos` ajustados só onde a trava muda o caminho (processo montado à mão sem `arquivos` não trava, então a maioria não muda).
- [ ] `npm test`, `npm run lint`, `npm run typecheck` e a checagem de circulares limpos; commit.

## Tarefa 6: Fechamento

- [ ] `[visual]` do critério 4: a janela da trava vista na vitrine local (1366×768), se der para subir a vitrine; senão presumido e dito. Registrar o que foi visto e o que foi presumido.
- [ ] `docs/manutencao/04-modelo-de-dados.md` (view e trava); `CONTEXT.md` conferido.
- [ ] `desvios.md` do documentos-versoes: decisões de execução (2 em especial), números das execuções do "Testes de banco", ajustes mecânicos nos testes antigos. `melhorias-protocolo.md`: itens não testados que aconteceram e ocorrências. `backlog.md`: o que surgir (inclusive a decisão pendente do selo "Relatório pendente" e da coluna `ultima_versao_tem_relatorio`: a trava não depende deles, ficam como estão).
- [ ] Marcar as caixas do plano, `Concluído em AAAA-MM-DD (commit <hash>)` no fim do ticket 11, `.scratch/proximo-passo.md` sobrescrito, commit e `git push` da branch.
