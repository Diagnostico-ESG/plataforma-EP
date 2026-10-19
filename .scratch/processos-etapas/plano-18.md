# Plano do ticket 18: Arquivos, Reunião, Sobre e Estrutura no verso

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa, marcando as caixas (`- [x]`). Branch comum `processos-etapas-18`, sem worktree (o isolamento já está feito).

**Objetivo:** redesenhar no verso a seção de versões (agora "Arquivos", com a versão mais recente em destaque) e a coluna direita (Reunião editada no lugar, Sobre sem campos vazios, Estrutura com a etapa atual de cada subprocesso), sem mudar o que cada ação faz.

**Arquitetura:** as regras continuam onde estão (`src/versoes/rotulos.ts`, `src/processos/textoDaReuniao.ts`); entram poucas funções puras novas. A seção de versões ganha um bloco de destaque para a mais recente e guarda as anteriores num `<details>` nativo, que abre a lista que já existe. A estrutura passa a ler a view `processos_com_andamento` (que já traz a etapa atual e a situação), sem migração.

**Tecnologia:** React 19, TypeScript, Vitest com Testing Library, CSS com os tokens de `src/styles/tokens.css`.

**Requisitos:** `.scratch/processos-etapas/issues/18-arquivos-reuniao-sobre-estrutura.md` (critérios citados como "critério N do ticket 18", de cima para baixo, 1 a 10) e a spec `.scratch/processos-etapas/spec.md` (histórias 123 a 127; "Interface", "Verso do cartão", itens Arquivos, Reunião, Sobre e Estrutura; "Decisões de teste", verso do cartão). Notas da parte 3 em `.scratch/documentos-versoes/spec.md` e `.scratch/reunioes/spec.md`.

## Restrições gerais

- Sem mudança no banco (spec, "Parte 3"): nenhuma migração. A leitura da estrutura troca a tabela `processos` pela view `processos_com_andamento`, que a interface já lê com a chave publicável.
- Sem dependência nova.
- Limites do ESLint: função de lógica até 20 linhas, arquivo até 300, complexidade até 10; componente dividido por responsabilidade.
- Toda tarefa termina com `npm test`, `npm run lint` e `npm run typecheck` verdes; o pré-commit roda a bateria inteira.
- Textos da tela exatamente como na spec, em português com acentos. Dados de teste inventados.
- Design e facilidade de uso são prioridade (pedido do usuário em 2026-10-19): a Tarefa 5 confere a tela no navegador do app.
- Shell: sem Python; scripts de apoio em `node`. Arquivos com CRLF: trocas pela ferramenta de edição. Leituras de arquivo pela ferramenta de leitura (a trava do git barrou um `cat` comum nesta sessão).

## Decisões deste plano (vão para o `desvios.md` na Tarefa 6)

1. **As anteriores ficam num `<details>` nativo** ("Versões anteriores ({n})"), com a lista que já existe dentro; nada de estado em React.
2. **Cada versão é um `<article>` com o nome do rótulo** ("V4"), a de destaque e as anteriores; os testes passam a achá-las pelo papel `article`.
3. **O destaque mantém autor, etapa e observação** numa segunda linha em cinza, abaixo de "V2 · 02/10 · falta relatório"; a spec não os cita, e tirá-los perderia informação que a lista mostra hoje.
4. **O botão do arquivo** mostra o rótulo curto ("Fluxograma .bpmn") e tem como nome acessível "Baixar Fluxograma .bpmn (TSA_V2_Emitir Ofício.bpmn)", que contém o texto visível; o nome completo também vai no `title`. As anteriores continuam com o nome completo como link.
5. **"Acrescentar relatório" no "⋯" da seção** quando só uma versão anterior está sem relatório (a mais recente tem): o espaço tracejado só existe na mais recente, e sem isso a anterior ficaria sem caminho. "Sem alteração de conteúdo" fica no destaque, ao lado do espaço tracejado, como hoje.
6. **Substituir no "⋯" de cada arquivo também nas anteriores**, para o mesmo arquivo não ter dois jeitos de substituir.
7. **"Relatório pendente" continua nas anteriores**; no destaque, a pílula é "falta relatório".
8. **Texto longo do Sobre:** mais de 240 caracteres ou mais de 3 quebras de linha. Medir a altura não funciona nos testes (jsdom não mede); o corte visual é do CSS (`line-clamp: 4`).
9. **Reunião hoje é "· próxima"** (a regra atual: só a data antes de hoje foi realizada). A data no verso é DD/MM/AAAA, como hoje.
10. **Situação do subprocesso:** "Suspenso", "Cancelado" ou "Concluído" depois da etapa atual ("Revisão interna · Suspenso"); concluído sem etapa atual mostra só "Concluído".

## Mapa de arquivos

| Arquivo | O que faz |
|-|-|
| `src/versoes/rotulos.ts` + `.test.ts` | `rotuloCurtoDoArquivo`, `formatarDiaEMes` |
| `src/processos/textoDaReuniao.ts` + `.test.ts` | `momentoDaReuniao` no lugar de `textoDaReuniao` |
| `src/processos/textoLongo.ts` + `.test.ts` (criar) | `ehTextoLongo` |
| `src/processos/tipos.ts` | `ItemDaEstrutura` ganha `etapaAtual` e `situacao` |
| `src/processos/lerProcessoSupabase.ts` + `.test.ts` | estrutura pela view |
| `src/processos/reclassificacaoFalso.ts`, `ProcessosFalso.ts`, `src/testes/processoNoVerso.tsx` | o falso e o ajudante com os campos novos |
| `src/components/processos/ReuniaoDoProcesso.tsx` | leitura e edição no lugar |
| `src/components/processos/SobreDoProcesso.tsx` (criar; apaga `DadosDoProcesso.tsx`) | Sobre |
| `src/components/processos/TextoQueSeAbre.tsx` (criar) | "Ler mais" / "Ler menos" |
| `src/components/processos/EstruturaDoProcesso.tsx` | Subprocessos ({n}) / Faz parte de |
| `src/components/processos/Contexto.css` (criar) | coluna direita |
| `src/components/versoes/SecaoDeVersoes.tsx` | título "Arquivos", [Enviar versão] no título, "⋯" da seção, destaque e anteriores |
| `src/components/versoes/VersaoEmDestaque.tsx` (criar) | a linha de destaque, os botões dos arquivos e o espaço tracejado |
| `src/components/versoes/ListaDeVersoes.tsx` | `<article>` por versão |
| `src/components/versoes/LinkDoArquivo.tsx` | `rotulo` opcional |
| `src/components/versoes/AcaoSubstituir.tsx` | o "⋯" do arquivo |
| `src/components/versoes/Versoes.css` | o destaque, os botões, o tracejado |
| `src/components/processos/VersoDoCartao.tsx` | usa `SobreDoProcesso` |
| `src/App.contextoDoVerso.test.tsx` (criar) | critérios 4 a 6 pelo aplicativo inteiro |
| `src/App.arquivosDoVerso.test.tsx` (criar) | critérios 1 a 3 pelo aplicativo inteiro |
| Testes de tela atuais (`App.versoesNoProcesso`, `.enviarVersao`, `.registrarVersaoHistorica`, `.relatorioDepois`, `.substituirArquivo`, `.baixarArquivo`, `.conferenciaNoDrive`, `.versoesNoHistorico`, `.reuniaoDoProcesso`, `.subprocessos`, `.versoDoCartao`, `.reclassificar`, `.recursosRetirados`) | só a forma de achar as coisas (critério 7) |

---

### Tarefa 1: Funções puras

**Arquivos:** os três módulos puros do mapa e os testes deles.

- [x] **Passo 1: testes que falham.**
  - `rotuloCurtoDoArquivo(arquivo)`: bpmn → "Fluxograma .bpmn"; png → "Imagem .png"; bpm → "Bizagi .bpm"; relatório `…_Relatório.docx` → "Relatório .docx", `.pdf` → "Relatório .pdf" (extensão tirada do nome, em minúsculas).
  - `formatarDiaEMes('2026-10-02T13:00:00Z')` → "02/10" (no fuso de quem usa, como `formatarMomento`).
  - `momentoDaReuniao(null, hoje)` → null; data depois de hoje e igual a hoje → 'proxima'; antes de hoje → 'realizada'.
  - `ehTextoLongo`: 240 caracteres → false, 241 → true; 4 linhas curtas → true, 3 → false.
- [x] **Passo 2:** `npx vitest run src/versoes/rotulos.test.ts src/processos/textoDaReuniao.test.ts src/processos/textoLongo.test.ts` falha (funções inexistentes).
- [x] **Passo 3:** implementar. `textoDaReuniao` sai (só o `ReuniaoDoProcesso` o usa; a Tarefa 3 troca o uso), com os testes dele; até a Tarefa 3, manter as duas funções para o commit não quebrar.
- [x] **Passo 4:** os testes passam; `npm run lint`, `npm run typecheck`.
- [x] **Passo 5: commit** `Ticket 18 de processos-etapas: funções puras do verso (arquivo, dia, reunião, texto longo)`.

### Tarefa 2: Estrutura com a etapa atual e a situação

**Arquivos:** `tipos.ts`, `lerProcessoSupabase.ts` + teste, `reclassificacaoFalso.ts`, `ProcessosFalso.ts`.

**Produz:** `ItemDaEstrutura = { id: string; nome: string; etapaAtual: string | null; situacao: SituacaoDoProcesso }`.

- [x] **Passo 1: testes que falham** em `lerProcessoSupabase.test.ts`: os dois de estrutura passam a responder em `processos_com_andamento.select` com as linhas do processo, dos filhos e do pai (com `situacao` e `etapa_atual_nome`), e esperam `subprocessos: [{ id: 'p2', nome: 'Filho A', etapaAtual: 'Revisão interna', situacao: 'em_andamento' }, …]` e `processoPai: { id: 'p0', nome: 'Pai Fictício', etapaAtual: …, situacao: … }`; o filtro `ou` do pedido da estrutura continua `processo_pai_id.eq.p1` e `processo_pai_id.eq.p1,id.eq.p0`; a falha continua com "Falha ao ler o pai e os subprocessos do processo".
- [x] **Passo 2:** rodar e ver falhar.
- [x] **Passo 3:** `lerEstrutura` lê `processos_com_andamento` com `select('id, nome, processo_pai_id, situacao, etapa_atual_nome')`; `lerProcesso` acha a linha do processo por `id` (não pela primeira linha), porque o cliente falso devolve a mesma resposta às duas leituras da view. `estruturaDoProcesso` do falso leva `etapaAtual: outro.etapaAtual?.nome ?? null` e `situacao`.
- [x] **Passo 4:** `npm test`, `npm run lint`, `npm run typecheck` (o TypeScript aponta os outros lugares que montam a estrutura).
- [x] **Passo 5: commit** `Ticket 18 de processos-etapas: a estrutura traz a etapa atual e a situação`.

### Tarefa 3: Coluna direita — Reunião, Sobre e Estrutura

**Arquivos:** `ReuniaoDoProcesso.tsx`, `SobreDoProcesso.tsx`, `TextoQueSeAbre.tsx`, `EstruturaDoProcesso.tsx`, `Contexto.css`, `VersoDoCartao.tsx`; apagar `DadosDoProcesso.tsx`; `App.contextoDoVerso.test.tsx`; ajustes nos testes de tela atuais.

- [x] **Passo 1: testes que falham** em `App.contextoDoVerso.test.tsx` (com `montarVerso` e `processoLido`):
  1. sem data: região "Reunião" com "Ainda não marcada" e [Marcar data];
  2. data futura: "DD/MM/AAAA" e "· próxima", [Alterar data]; data passada: "· realizada";
  3. [Marcar data] mostra o campo "Data da reunião de modelagem piloto" com [Salvar] e [Cancelar] (sem [Remover]); salvar grava (`falso` com a data nova) e volta à leitura com a data;
  4. [Alterar data] → [Remover] apaga a data e volta a "Ainda não marcada"; [Cancelar] volta sem gravar;
  5. Consulta: a data, sem [Marcar data] nem [Alterar data];
  6. Sobre: com contexto e sem observações, mostra Setor, Macroprocesso, Tipo, Origem e Contexto, e não mostra "Observações";
  7. contexto de 300 caracteres mostra [Ler mais], que vira [Ler menos] (`aria-expanded`); contexto curto, sem botão;
  8. processo com subprocessos: região "Subprocessos (2)", cada um com link e "Revisão interna" embaixo, e "Revisão interna · Suspenso" no suspenso; clicar no link abre o subprocesso na mesma janela (endereço `#/processos/<id>`);
  9. subprocesso: região "Faz parte de" com o pai; processo sem estrutura: nenhuma das duas regiões.
- [x] **Passo 2:** rodar e ver falhar.
- [x] **Passo 3: implementar.**
  - `ReuniaoDoProcesso`: `section` com `h3` "Reunião" (nome da região); leitura com a barrinha (`--tipo-reuniao`), a data em mono e o momento; estado `editando` (só para `podeAlterar`); a edição atual (falha, `CadastroInexistente`, chave que recomeça) ganha [Cancelar] e volta à leitura depois de gravar.
  - `SobreDoProcesso`: `section` "Sobre", `dl` com o rótulo em cima; só os campos com valor; contexto e observações por `TextoQueSeAbre` (`ehTextoLongo` decide o botão; o CSS corta em 4 linhas enquanto fechado).
  - `EstruturaDoProcesso`: títulos "Subprocessos ({n})" e "Faz parte de"; a linha cinza com `etapaAtual` e, fora de em andamento, `ROTULO_DA_SITUACAO`.
  - `Contexto.css`: rótulos pequenos em cinza (`--tam-rotulo`), valores em `--tam-secundario`/base, barrinha de 3 px, sem caixas pesadas (a coluna já tem fundo cinza).
- [x] **Passo 4: ajustar os testes atuais** (critério 7): `App.reuniaoDoProcesso` (região "Reunião", clicar [Marcar data]/[Alterar data] antes do campo, textos novos), `App.subprocessos` e `App.versoDoCartao` (regiões "Subprocessos (n)", "Faz parte de", "Sobre"), `App.reclassificar` e `App.recursosRetirados` ("Sobre" no lugar de "Dados do processo"). Mantêm o que conferem.
- [x] **Passo 5:** `npm test`, `npm run lint`, `npm run typecheck`.
- [x] **Passo 6: commit** `Ticket 18 de processos-etapas: Reunião, Sobre e Estrutura na coluna direita`.

### Tarefa 4: Arquivos

**Arquivos:** `SecaoDeVersoes.tsx`, `VersaoEmDestaque.tsx`, `ListaDeVersoes.tsx`, `LinkDoArquivo.tsx`, `AcaoSubstituir.tsx`, `Versoes.css`; `App.arquivosDoVerso.test.tsx`; ajustes nos testes de versões.

**Consome:** `rotuloCurtoDoArquivo`, `formatarDiaEMes` (Tarefa 1); `MenuDeAcoes` (`src/components/MenuDeAcoes.tsx`).

- [x] **Passo 1: testes que falham** em `App.arquivosDoVerso.test.tsx` (com `montarNosCadastros`, `versaoDeTeste`, `arquivoDeTeste`):
  1. região "Arquivos" com o `article` "V2" em destaque: "V2", "02/10" e, sem relatório, a pílula "falta relatório"; os botões "Baixar Fluxograma .bpmn (…)" e "Baixar Imagem .png (…)"; o espaço [+ Acrescentar relatório] abre o formulário do relatório da V2;
  2. com relatório, sem a pílula nem o espaço, e com o botão "Baixar Relatório .pdf (…)";
  3. "Versões anteriores (2)" fechado (`details` sem `open`), com os `article` V1 e V2F dentro depois de abrir;
  4. o "⋯" da seção ("Mais ações dos arquivos") tem "Registrar versão histórica" só sem versão nova, e "Acrescentar relatório" quando só uma anterior não tem relatório; sem item, sem "⋯";
  5. o "⋯" de cada arquivo ("Ações de TSA_V2_Emitir Ofício.bpmn") tem Substituir, que abre o formulário da troca;
  6. Consulta: baixa (os botões existem), sem [Enviar versão], "⋯" da seção, "⋯" dos arquivos e espaço tracejado; o mesmo para processo suspenso;
  7. as marcas "alterado fora da plataforma" e "não encontrado no Drive" aparecem ao lado do botão do arquivo do destaque (critério 3).
- [x] **Passo 2:** rodar e ver falhar.
- [x] **Passo 3: implementar.**
  - `SecaoDeVersoes`: `section` com `h3` "Arquivos" e [Enviar versão] na mesma linha do título; o "⋯" da seção ao lado; formulário aberto, conferência e carregando como hoje; corpo = `VersaoEmDestaque` da primeira de `ordenarVersoes` + `<details>` com `ListaDeVersoes` das demais.
  - `VersaoEmDestaque`: `article` com `aria-label` do rótulo; linha `rotulo · dia · pílulas` (mono no rótulo e no dia; "Histórica · somente leitura" e "falta relatório" como `Pilula`); segunda linha cinza com autor, etapa e observação; lista de botões (`LinkDoArquivo` com `rotulo`, barrinha por papel: `--tipo-fluxograma` em bpmn, png e bpm, `--tipo-relatorio` no relatório; ícone `documento` à esquerda, seta de baixar à direita); `MarcaNoDrive` e `AcaoSubstituir` por arquivo; espaço tracejado (botão) quando `relatorioPendente` e pode enviar; `AcaoSemAlteracao` quando `podeCopiarRelatorio`.
  - `LinkDoArquivo`: `rotulo?: string`; com ele, mostra o rótulo e usa `aria-label` "Baixar {rotulo} ({nome})" e `title` com o nome.
  - `AcaoSubstituir`: o gatilho vira `MenuDeAcoes` com rótulo "Ações de {nome}" e o item "Substituir"; o formulário abre no lugar, como hoje.
  - `ListaDeVersoes`: `li > article aria-label` no lugar do `aria-label` do `li`.
  - Ícone de baixar: acrescentar `baixar` ao `Icone` (seta para baixo) se não existir.
- [x] **Passo 4: ajustar os testes atuais** (critério 7): região "Arquivos"; `findByRole('article', { name })` no lugar de `listitem`; "falta relatório" no lugar de "Relatório pendente" quando a versão é a mais recente; links da mais recente por `button`/`link` com nome em expressão regular do nome do arquivo; Substituir pelo "⋯" do arquivo; "Registrar versão histórica" e "Acrescentar relatório" pelo "⋯" da seção ou pelo espaço tracejado. Mantêm o que conferem.
- [x] **Passo 5:** `npm test`, `npm run lint`, `npm run typecheck`.
- [x] **Passo 6: commit** `Ticket 18 de processos-etapas: Arquivos com a versão mais recente em destaque`.

### Tarefa 5: Conferir a tela no navegador (critérios `[visual]`)

- [x] **Passo 1:** subir a vitrine local (`vitrine.local/`, fora do git, módulos falsos) com `npx vite --port 5179` em segundo plano (ou reaproveitar o servidor se a porta já responder) e montar nela: processo com V2 sem relatório e duas anteriores, reunião futura, contexto longo e dois subprocessos (um suspenso); um subprocesso; a Consulta. Se a vitrine quebrar pelas mudanças, ajustá-la (ela não entra no commit).
- [x] **Passo 2:** no navegador do app, conferir: a linha "V2 · 02/10 · falta relatório"; botões com a barrinha de cor; o tracejado no lugar do relatório; pílulas com texto; a coluna direita (reunião com a barrinha amarela, Sobre, Estrutura); o "⋯" e o `<details>`; a janela com menos de 900 px. Conferir também pelo DOM (as fotos saem atrasadas).
- [x] **Passo 3:** ajustar o CSS até ficar bom; encerrar o Vite da vitrine.
- [x] **Passo 4:** `npm test`, `npm run lint`, `npm run typecheck`.
- [x] **Passo 5: commit** `Ticket 18 de processos-etapas: acabamento visual de Arquivos e da coluna direita`.

### Tarefa 6: Fecho

- [x] **Passo 1:** `desvios.md` (entrada nova, datada): as dez decisões deste plano e o que a conferência mostrou, separando **visto** de **presumido**.
- [x] **Passo 2:** `.scratch/melhorias-protocolo.md`: ocorrências desta execução e os itens de `.claude/regras/nao-testados.md` que aconteceram (bloco do `/executar-complexo` e "Qualquer momento"), sem concluir se funcionaram.
- [x] **Passo 3:** `npm run test:coverage` (acima de 70%), `npm run check:circular`, `npm run build`.
- [x] **Passo 4:** marcar as caixas do plano e os critérios do ticket provados (os `[visual]` só com o que foi visto).
- [x] **Passo 5: commit** `Ticket 18 de processos-etapas: desvios, melhorias do protocolo e plano marcado`.
- [x] **Passo 6:** juntar à `main` (`git switch main`, merge), `git branch -d processos-etapas-18`, `Concluído em AAAA-MM-DD (commit <hash>)` no fim do ticket, commit, envio da `main` e do marco ao GitHub.

## Cobertura dos critérios do ticket

| Critério | Onde |
|-|-|
| 1. Destaque, falta relatório, anteriores, "⋯" da seção, Substituir | Tarefa 4, casos 1 a 5 |
| 2. Consulta só baixa | Tarefa 4, caso 6 |
| 3. Marcas do Drive | Tarefa 4, caso 7 |
| 4. Reunião no lugar | Tarefa 3, casos 1 a 5 |
| 5. Sobre | Tarefa 3, casos 6 e 7 |
| 6. Estrutura | Tarefa 3, casos 8 e 9 |
| 7. Testes atuais ajustados | Tarefas 3 e 4, passo 4 |
| 8. Aplicativo inteiro | Tarefas 3 e 4 |
| 9 e 10. `[visual]` | Tarefa 5 |

## Pontos de atenção na revisão

- Versão mais recente **histórica** (processo só com V5F): destaque sem "falta relatório", com "Histórica · somente leitura" e sem Substituir. Teste no caso 2 da Tarefa 4.
- Processo **sem versão**: "Nenhuma versão enviada." e nenhum `<details>` (o teste atual cobre).
- Subprocesso **concluído** (sem etapa atual): só "Concluído" na linha cinza. Teste no caso 8 da Tarefa 3.
- Reunião **hoje**: "· próxima" (Tarefa 1).
- Falha ao gravar a reunião: a mensagem aparece e o campo continua aberto com a data digitada (o teste atual de `App.reuniaoDoProcesso` cobre; conferir que continua).
