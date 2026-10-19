# Plano do ticket 19: Histórico, Novo processo e Editar dentro da janela

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa, marcando as caixas (`- [x]`). Branch comum `processos-etapas-19`, sem worktree (o isolamento já está feito).

**Objetivo:** fechar o desenho da janela do verso: o Histórico vira linha do tempo agrupada por dia (com Esc que volta antes de fechar), o Editar e o Novo processo ocupam uma janela estreita com cabeçalho próprio e rodapé fixo, e cadastrar abre o verso do processo criado.

**Estado de partida (ticket 16):** Histórico e Editar já trocam o conteúdo da janela (`modo` em `VersoDoCartao.tsx`); o Novo processo já abre em `JanelaDoNovoProcesso` (`#/processos/novo`) e, ao cadastrar, fecha a janela. Falta o que está nos critérios abaixo.

**Requisitos:** `.scratch/processos-etapas/issues/19-historico-novo-e-editar-na-janela.md` (critérios citados como "critério N do ticket 19", de cima para baixo, 1 a 8) e a spec (histórias 78, 129 a 131; "Interface", "Verso do cartão", itens Histórico e Novo processo e Editar; "Histórico", item Formato; "Navegação no endereço"; "Decisões de teste").

## Restrições gerais

- Sem migração e sem dependência nova. O módulo de processos real muda uma linha: `criarProcesso` passa a devolver o id (`.insert(...).select('id')`, como as outras gravações já fazem).
- Limites do ESLint: função de lógica até 20 linhas, arquivo até 300, complexidade até 10; componente dividido por responsabilidade.
- Toda tarefa termina com `npm test`, `npm run lint` e `npm run typecheck` verdes; o pré-commit roda a bateria inteira. Testes de tela instáveis sob carga (backlog): repita o arquivo isolado antes de concluir que falhou de verdade.
- Textos da tela exatamente como na spec, com acentos. Dados de teste inventados.
- Arquivos com CRLF: trocas pela ferramenta de edição. Arquivos novos pela ferramenta de arquivo, nunca por heredoc.

## Decisões deste plano (vão para o `desvios.md` na Tarefa 6)

1. **O Esc dentro do Editar também volta ao verso** (a spec só diz isso do Histórico). Esc é cancelar, e fechar a janela inteira perderia o que foi digitado sem aviso. O Novo processo continua fechando.
2. **O aviso "Processo cadastrado" fica no estado da `AreaDeProcessos`** (id do processo recém-criado) e vai ao verso como `aviso`; some ao abrir outro processo. A janela do Novo processo fecha e a do verso abre (o `<dialog>` é outro), então "a janela se alarga" é o resultado, não uma animação.
3. **O botão de enviar do formulário se chama [Cadastrar] ou [Salvar] (spec); o botão que abre o cadastro na visão continua [Cadastrar processo].**
4. **O título do formulário sai do `h3` interno e vai para o cabeçalho da janela** (`h2`, que recebe o foco). O `aria-label` do formulário ("Cadastrar processo", "Editar processo") fica, para os testes e o leitor de tela.
5. **O iniciais de quem fez** vêm de `src/lib/iniciais.ts`, num círculo pequeno com o nome completo em `title` e `aria-label`; sem autor (alteração direta no banco), "BD".

## Mapa de arquivos

| Arquivo | O que faz |
|-|-|
| `src/processos/agrupamentoDoHistorico.ts` + `.test.ts` (criar) | `agruparPorDia(eventos, agora)` |
| `src/components/processos/LinhaDoTempo.tsx` + `.css` (criar) | a linha do tempo do processo |
| `src/components/processos/HistoricoDoProcesso.tsx` | usa a linha do tempo |
| `src/components/cadastros/ListaDoHistorico.tsx` | exporta `MudancaDoEvento` |
| `src/components/processos/JanelaDoVerso.tsx` | `aoCancelar` próprio (Esc) |
| `src/components/processos/VersoDoCartao.tsx` | `modo` sobe para o componente da janela; Esc; aviso; Editar estreito |
| `src/components/processos/CabecalhoDoFormulario.tsx` (criar) | "Novo processo" / "Editar {nome}" e fechar |
| `src/components/processos/FormularioPronto.tsx`, `FormularioDoProcesso.tsx` | rótulo do botão, sem `h3`, rodapé fixo |
| `src/components/processos/JanelaDoNovoProcesso.tsx` | cabeçalho novo; devolve o id criado |
| `src/components/processos/AreaDeProcessos.tsx` | abre o verso do criado |
| `src/processos/tipos.ts`, `gravarProcessoSupabase.ts`, `ProcessosFalso.ts` | `criarProcesso` devolve o id |
| `src/components/processos/Verso.css`, `Painel.css` | janela estreita, rodapé fixo |
| `src/App.historicoNaJanela.test.tsx` (criar) | critérios 2 a 5 pelo aplicativo inteiro |
| `src/App.cadastrarProcesso.test.tsx`, `src/App.versoDoCartao.test.tsx` | ajustes (critério 6) |

---

### Tarefa 1: Agrupamento do histórico por dia

**Arquivos:** `agrupamentoDoHistorico.ts` e o teste.

**Produz:** `agruparPorDia(eventos: EventoDoCadastro[], agora: Date): { rotulo: string; eventos: EventoDoCadastro[] }[]`, na ordem recebida (do mais novo para o mais antigo).

- [ ] **Passo 1: testes que falham** (critério 1): eventos de hoje → "Hoje"; de ontem → "Ontem"; de 12/10 → "12/10"; dois eventos no mesmo dia ficam no mesmo grupo, na ordem; dia por data local (evento às 23:30 locais de ontem não vira "Hoje"); lista vazia → `[]`; ano diferente → "dd/mm/aaaa".
- [ ] **Passo 2:** `npx vitest run src/processos/agrupamentoDoHistorico.test.ts` falha.
- [ ] **Passo 3: implementar** (chave do dia = `toLocaleDateString('pt-BR')` do evento; sem dependência).
- [ ] **Passo 4:** o teste passa; `npm run lint`, `npm run typecheck`.
- [ ] **Passo 5: commit** `Ticket 19 de processos-etapas: agrupamento do histórico por dia`.

### Tarefa 2: Linha do tempo e Esc que volta

**Arquivos:** `LinhaDoTempo.tsx` + `.css`, `HistoricoDoProcesso.tsx`, `ListaDoHistorico.tsx`, `JanelaDoVerso.tsx`, `VersoDoCartao.tsx`, `src/App.historicoNaJanela.test.tsx`.

- [ ] **Passo 1: testes que falham** em `App.historicoNaJanela.test.tsx` (critérios 2 e 5; ajudantes de `src/testes/versoDoCartao.ts`):
  1. o Histórico mostra grupos "Hoje", "Ontem" e "12/10" nessa ordem, cada evento com a hora, as iniciais de quem fez (nome completo no nome acessível), a frase e o antes/depois, e o motivo ou a nota em linha própria;
  2. sem eventos: "Nenhuma alteração registrada ainda."; carregando e erro com [Tentar de novo] como hoje;
  3. o primeiro Esc volta ao verso (a região "Etapas" volta, a janela continua aberta); o segundo Esc fecha (endereço sem o id);
  4. Esc no Editar volta ao verso sem gravar (decisão 1);
  5. recarregar com o Histórico aberto: o aplicativo montado de novo no mesmo endereço mostra o verso (critério 5).
  O Esc dispara `cancel` no `<dialog>` (`fireEvent(dialog, new Event('cancel', { cancelable: true }))`), como os testes de Esc que já existem.
- [ ] **Passo 2:** rodar e ver falhar.
- [ ] **Passo 3: implementar.**
  - `LinhaDoTempo`: `<ol>` de grupos; cada grupo com `<h4>` do rótulo e `<ol>` de eventos; evento = hora (`<time>` em mono, só HH:mm), iniciais, `<strong>` da ação + nome do item, `MudancaDoEvento` (exportada de `ListaDoHistorico`) e, abaixo, o motivo em cinza (os textos de ação e as linhas dos recursos retirados vêm das mesmas funções de hoje).
  - `HistoricoDoProcesso`: estados carregando/erro/vazio com os mesmos textos; pronto → `LinhaDoTempo` com `agruparPorDia(eventos, new Date())`.
  - `JanelaDoVerso`: prop `aoCancelar` (Esc), em vez de reaproveitar `aoFechar`; o botão Fechar continua fechando.
  - `VersoDoCartao`: `modo` e `setModo` sobem de `ProcessoAberto` para `VersoDoCartao`, que passa à janela `aoCancelar = modo === 'verso' ? aoFechar : voltar`; `modo` volta a `'verso'` ao trocar de `id`.
- [ ] **Passo 4: ajustar os testes atuais** (critério 6) que leem o histórico do processo por `listitem` (`App.versoDoCartao`, `App.avancoDaEtapa`, `App.reclassificar`, `App.reuniaoDoProcesso`, `App.situacaoDoProcesso`, `App.voltarDatasResponsavel`): o texto do evento continua dentro do item, então a maioria não muda; rode e ajuste só o que falhar.
- [ ] **Passo 5:** `npm test`, `npm run lint`, `npm run typecheck`.
- [ ] **Passo 6: commit** `Ticket 19 de processos-etapas: Histórico em linha do tempo e Esc que volta ao verso`.

### Tarefa 3: `criarProcesso` devolve o id

**Arquivos:** `tipos.ts`, `gravarProcessoSupabase.ts` + teste, `ProcessosFalso.ts`.

- [ ] **Passo 1: testes que falham** em `gravarProcessoSupabase.test.ts`: com `respostas['processos.insert'] = { data: [{ id: 'p9' }], error: null }`, `criarProcesso` devolve `'p9'`; o pedido pede `select('id')`; resposta sem linha lança erro com o valor recebido e o formato esperado. Ajustar os testes de criar que não respondem o insert.
- [ ] **Passo 2:** rodar e ver falhar.
- [ ] **Passo 3: implementar:** tipo `Promise<string>`; `tabela().insert(...).select('id')`; `ProcessosFalso.criarProcesso` devolve o `id` do processo novo.
- [ ] **Passo 4:** `npm test`, `npm run lint`, `npm run typecheck`.
- [ ] **Passo 5: commit** `Ticket 19 de processos-etapas: criarProcesso devolve o id do processo criado`.

### Tarefa 4: Janela do formulário e verso do criado

**Arquivos:** `CabecalhoDoFormulario.tsx`, `FormularioPronto.tsx`, `FormularioDoProcesso.tsx`, `JanelaDoNovoProcesso.tsx`, `AreaDeProcessos.tsx`, `VersoDoCartao.tsx`, `Verso.css`, `Painel.css`; testes em `App.historicoNaJanela.test.tsx` (ou `App.cadastrarProcesso.test.tsx`).

- [ ] **Passo 1: testes que falham** (critérios 3 e 4):
  1. Novo processo: o diálogo "Novo processo" tem o cabeçalho "Novo processo" e os botões [Cadastrar] e [Cancelar] (não há [Salvar]);
  2. Editar: cabeçalho "Editar Emitir Ofício", botões [Salvar] e [Cancelar]; Salvar e Cancelar voltam ao verso (já cobertos, ajustar os nomes);
  3. cadastrar: o endereço passa a ser `#/processos/<id do criado>`, o diálogo "Processo {nome}" mostra "Processo cadastrado" (`role="status"`), e o Quadro atrás (recarregado) tem o cartão do criado; abrir outro processo tira o aviso;
  4. falha de gravação ao cadastrar e ao editar: a mensagem com os dados no formulário e o endereço intacto (já cobertos);
  5. Cancelar e Esc no Novo processo fecham sem gravar (já cobertos).
- [ ] **Passo 2:** rodar e ver falhar.
- [ ] **Passo 3: implementar.**
  - `CabecalhoDoFormulario`: `<header>` com o `h2` (título; recebe o foco) e `BotaoFecharJanela`.
  - `FormularioPronto`: sem o `h3`; prop `rotuloDoEnvio` ("Cadastrar" ou "Salvar", escolhida por `inicial`); os botões dentro de `.formulario-do-processo-rodape` (sticky no fim da janela, fundo da folha, borda superior).
  - `JanelaDoNovoProcesso`: usa o cabeçalho novo; `aoCriado(id)`.
  - `VersoDoCartao`: no modo `editar`, a janela é `estreita` e o cabeçalho é o do formulário ("Editar {nome}"); prop `aviso` mostrada logo abaixo do cabeçalho.
  - `AreaDeProcessos`: `aoCriar(id)` abre o verso do criado (`irParaVisao({ aberto: id })`), guarda o id recém-criado para o aviso e recarrega a visão.
  - CSS: a coluna do formulário com 560 px (a janela estreita já tem), rodapé fixo; tela estreita sem mudança.
- [ ] **Passo 4: ajustar os testes atuais** (critério 6): `App.cadastrarProcesso` (botão [Cadastrar] no cadastro; "cadastrar fecha o painel" passa a abrir o verso do criado), `App.versoDoCartao` e os demais que clicam [Salvar] no cadastro.
- [ ] **Passo 5:** `npm test`, `npm run lint`, `npm run typecheck`.
- [ ] **Passo 6: commit** `Ticket 19 de processos-etapas: Novo processo e Editar na janela estreita; cadastrar abre o verso do criado`.

### Tarefa 5: Conferir a tela no navegador (critério 8 `[visual]`)

- [ ] Subir a vitrine (`vitrine.local/`, fora do git) com `npx vite` numa porta própria, conferir Histórico (agrupado por dia, iniciais, hora em mono), Editar e Novo processo (coluna de ~560 px, rodapé fixo com a página rolando, cabeçalho) e o aviso "Processo cadastrado"; corrigir o que destoar; encerrar o servidor ao fim.
- [ ] Commit só se houver ajuste: `Ticket 19 de processos-etapas: acabamento visual da janela do formulário e do histórico`.

### Tarefa 6: Fecho

- [ ] Registrar no `.scratch/processos-etapas/desvios.md` as decisões deste plano (datadas) e, no `.scratch/melhorias-protocolo.md`, os itens não testados do `/executar-complexo` que aconteceram.
- [ ] Atualizar a spec: o Esc no Editar (decisão 1) e o aviso do cadastro, se a redação pedir.
- [ ] `npm test`, `npm run lint`, `npm run typecheck` verdes; commit `Ticket 19 de processos-etapas: desvios, melhorias do protocolo e plano marcado`.
