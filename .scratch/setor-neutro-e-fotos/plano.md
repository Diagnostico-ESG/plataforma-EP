# Setor neutro, Status colorido e foto do responsável — plano de implementação

> **Para quem executa:** use `superpowers:executing-plans`. Marque as caixas (`- [x]`) conforme cada passo termina. O plano só diz como executar; os requisitos estão na spec e são citados por referência.

**Objetivo:** executar `.scratch/setor-neutro-e-fotos/spec.md` (ADR 0039): selo único e maior, selo no cartão por setor, Status em vez de Etiqueta com ícones maiores e A fazer laranja, Situação em pílulas de cor, avatar do responsável no cartão e na Lista.

**Spec:** `.scratch/setor-neutro-e-fotos/spec.md`. **Sem migração, sem banco.** Branch: `setor-neutro-e-fotos`.

## Restrições gerais (da spec e do `CLAUDE.md`)

- Sem dependência nova; `Avatar` e `AvatarVazio` (`src/components/Avatar.tsx`) já existem e são reaproveitados.
- TypeScript sem `any`; funções de 4–20 linhas; arquivos até 300 linhas; early return. `tsc -b` guia a remoção dos campos `cor`.
- Cada comportamento de tela tem teste de tela (`App.*.test.tsx`) com as implementações falsas; cores não se testam no jsdom (ficam nos critérios `[visual]`), salvo contraste, que o `src/styles/etiquetasVivas.test.ts` já confere.
- Nome do valor guardado e nomes de código (`etiqueta`, `ETIQUETAS`, `EtiquetaDoProcesso`) **não mudam**; só o que o usuário lê.
- Comando de verificação padrão: `npm run typecheck && npm test && npm run lint`. O pre-commit roda isso e leva cerca de 2 minutos: rode os comandos em segundo plano quando passar de 2 min.

## Pontos para o executor saber antes

1. **O Quadro por setor já não tem cabeçalho nem coluna coloridos** (a identidade de 2026-10-30 já tirou): `CabecalhoDaColuna` mostra só texto e a coluna é neutra. Só o **selo** carrega a cor (`--cor-do-setor`). Então o "cabeçalho sem cor" da spec (item 1 e critério 8) já vale; confirme isso olhando `Quadro.css` e não crie trabalho.
2. **`ROTULO_DA_ETIQUETA.em_andamento` é "Iniciado"** no código (`src/processos/rotulos.ts`), enquanto a spec fala "Em andamento". Não renomeie: registre a divergência em `.scratch/setor-neutro-e-fotos/desvios.md` (entrada datada) e siga com "Iniciado".
3. **`CONTEXT.md` tem o termo "Etiqueta"** (linha 111, com _Avoid_ "status"). Não edite sem confirmar: no fim, proponha a redação ao usuário (Task 6).

---

### Task 1: Selo único e maior; sai a cor do setor da tela

Cobre: spec solução 1 e 2, histórias 1–3, critérios 1, 2 e 8.

**Arquivos**
- Modificar: `src/styles/tokens.css` (novo `--selo-do-setor: #475569`; `--tam-selo: 13px`; remover `--canto-amostra`)
- Modificar: `src/components/SeloDoSetor.tsx`, `SeloDoSetor.css`, `SeloDoSetor.test.tsx`
- Modificar: `src/components/OpcaoDaCaixa.tsx`, `OpcaoDaCaixa.test.tsx`, `src/styles/caixas.css` (remover `.opcao-cor-do-setor` e a marca de cor)
- Modificar: `src/components/processos/Etapas.css:290` (usa `--tam-selo`: confirmar que 13px não quebra o item da trilha; se quebrar, fixar o valor antigo ali)
- Modificar os chamadores do selo: `src/components/cadastros/{ListaDeSetores,SetorEditavel,SetorSomenteLeitura,SetoresEnvolvidos,LinhaDeSetorEnvolvido}.tsx`, `src/components/processos/{CabecalhoDoVerso,LinhaDoProcesso,LinhasDeGrupo,MatrizDoQuadro,CartaoDoProcesso}.tsx`
- Modificar chamadores da opção: `src/components/cadastros/PorSetor.tsx`, `src/components/processos/CamposDoProcesso.tsx`, `src/processos/filtrosDosProcessos.ts` (+ `.test.ts`; sai `corDoSetor` da opção)
- Modificar: `src/components/cadastros/FormularioDeSetor.tsx` (sai o estado `cor`, a prop `coresEmUso` e a `GradeDeCores`; `[Salvar]` envia só nome, sigla e observações) e quem passa `coresEmUso`
- Apagar: `src/cadastros/corDoSetor.ts`, `corDoSetor.test.ts`, `src/components/cadastros/GradeDeCores.tsx`, `GradeDeCores.css`, `src/App.corDoSetor.test.tsx`, `src/App.corDoSetorNoQuadro.test.tsx`
- Ajustar testes que citam cor: `src/App.arvoreDaLista.test.tsx`, `src/App.arvoreDaListaPorSetor.test.tsx`, `src/components/processos/LinhasDeGrupo.test.tsx`, `src/cadastros/CadastrosFalso.test.ts`, `src/testes/processosNosCadastros.tsx`
- Testar: `src/App.cadastroDeSetores*.test.tsx` (o arquivo de tela do cadastro de setor que já existe; localize com `grep -l "Salvar" src/App.setor*.test.tsx`), `src/styles/etiquetasVivas.test.ts`

**Interfaces**
- Produz: `SeloDoSetor({ sigla, nome?, className? })` (sem `cor`); `OpcaoDaCaixa({ valor, rotulo, desabilitada?, pessoa? })` (sem `corDoSetor`).

- [x] **Passo 1 (teste que falha):** em `SeloDoSetor.test.tsx`, trocar os testes de cor por um que renderiza `<SeloDoSetor sigla="DET" nome="Departamento" />` e confere o texto, o nome acessível e que o `style` não define `--cor-do-setor`. No teste de tela do cadastro do setor: abrir um setor como Administrador e conferir que **não** existe o grupo "Cor do setor" (`queryByRole('group', { name: 'Cor do setor' })` nulo) e que salvar só envia nome/sigla/observações (o `CadastrosFalso` recebe `DadosDoSetor` sem `cor`).
- [x] **Passo 2:** rodar `npx vitest run src/components/SeloDoSetor.test.tsx` e o teste do cadastro; conferir que falham (compilação ou asserção).
- [x] **Passo 3 (implementação mínima):**
  - `tokens.css`: acrescentar `--selo-do-setor: #475569;` (sigla branca = 7,6:1) e mudar `--tam-selo` de `11px` para `13px`.
  - `SeloDoSetor.css`: `padding: 3px 10px; background: var(--selo-do-setor);` (o resto igual, mantendo `forced-color-adjust: none`).
  - `SeloDoSetor.tsx`: remover `cor`, `estiloDaCor` e o import; o selo é `<span className={classes}>{sigla}</span>` (com `role="img"`, `aria-label` e `title` quando há `nome`).
  - `OpcaoDaCaixa.tsx` e `caixas.css`: remover `corDoSetor`, o `<span className="opcao-marca opcao-cor ...">` e a regra `.opcao-cor-do-setor`; as opções de setor ficam só com o texto `SIGLA — Nome`.
  - Todos os chamadores: apagar o argumento `cor`/`corDoSetor`. Em `filtrosDosProcessos.ts` a opção de setor passa a `{ valor, rotulo }`.
  - `FormularioDeSetor.tsx`: remover tudo de cor (estado, `coresEmUso`, grade) e os props correspondentes nos pais.
  - Apagar os arquivos listados em "Apagar" e `--canto-amostra`.
- [x] **Passo 4:** `npm run typecheck`; corrigir o que sobrar (os campos `cor` dos tipos ficam por enquanto, a Task 2 os remove).
- [x] **Passo 5:** em `etiquetasVivas.test.ts`, acrescentar um teste de contraste: `contraste(valorDe('selo-do-setor'), '#ffffff')` ≥ 4,5 (a sigla é branca).
- [x] **Passo 6:** `npm run typecheck && npm test && npm run lint` passam.
- [x] **Passo 7 (commit):** `git add -A && git commit -m "setor-neutro-e-fotos: selo do setor em cor única e maior, sai a escolha de cor"` (com a atribuição pedida pelo ambiente).

---

### Task 2: Os dados deixam de carregar a cor do setor

Cobre: spec "Decisões de implementação — Dados". Sem migração; a coluna e `src/types/database.ts` ficam como estão.

**Arquivos**
- Modificar: `src/cadastros/tipos.ts` (sai `Setor.cor`, `DadosDoSetor.cor`, `cor` de `SetorEnvolvido`), `cadastrosSupabase.ts` e `.test.ts`, `macroprocessosSupabase.ts` e `.test.ts`, `CadastrosFalso.ts` e `.test.ts` (sai `primeiraCorLivre`, `comCor`, `SetorDoTeste` volta a ser `Setor`)
- Modificar: `src/processos/tipos.ts` (`setorCor`, `SetorDoQuadro.cor`), `processoDaLinha.ts` e `.test.ts`, `colunasDoQuadro.ts` e `.test.ts` (`Coluna.cor`), `linhasDoQuadro.ts` e `.test.ts` (`cor`), `arvoreDaLista.ts` e `.test.ts` (`cor` das duas formas de setor), `ProcessosFalso.ts`, `listaDeProcessosSupabase.test.ts`

**Interfaces**
- Consome: Task 1 (nenhum componente lê mais `cor`).
- Produz: tipos sem campo de cor.

- [x] **Passo 1:** `grep -rn "setorCor\|setor_cor\|\.cor\b\|cor:" src --include=*.ts --include=*.tsx` e listar o que resta (fora `src/types/database.ts`, que não se mexe).
- [x] **Passo 2:** remover cada campo `cor` dos tipos e dos pontos de leitura. Nas consultas Supabase, tirar `cor` da lista de colunas (`cadastrosSupabase.ts:41,55`, `macroprocessosSupabase.ts:44`) e o comentário do gatilho em `cadastrosSupabase.ts:71` (a criação continua sem enviar cor; o gatilho do banco segue dando valor, e `database.ts` ainda a exige no tipo de insert — se o compilador reclamar, manter a asserção que já existe nessa função em vez de mexer nos tipos gerados). A view `processos_com_andamento` continua devolvendo `setor_cor`; a tela apenas não a lê.
- [x] **Passo 3:** ajustar os testes que construíam fixtures com `cor` (remover o campo), sem mudar o que provam.
- [x] **Passo 4:** `npm run typecheck && npm test && npm run lint` passam.
- [x] **Passo 5 (commit):** `"setor-neutro-e-fotos: dados deixam de carregar a cor do setor"`.

---

### Task 3: Selo do setor no cartão do Quadro por setor

Cobre: spec solução 3, história 4, critério 3.

**Arquivos**
- Modificar: `src/components/processos/CartaoDoProcesso.tsx` (`oQueOCartaoRepete`, comentário da prop `agrupar`)
- Testar: `src/App.agruparPorSetor.test.tsx` e `src/App.linhasDoQuadro.test.tsx`

**Interfaces**
- Produz: o cartão mostra `SeloDoSetor` sempre, exceto quando `naLinha === 'setor'`.

- [x] **Passo 1 (teste que falha):** em `App.agruparPorSetor.test.tsx`, trocar a expectativa "o cartão não repete a sigla" por: o cartão do processo de um setor mostra o selo com a sigla (`cartao.querySelector('.selo-do-setor')?.textContent` é a sigla). Em `App.linhasDoQuadro.test.tsx`, manter (ou acrescentar) o teste de que, com Linhas por Setor, o cartão **não** tem `.selo-do-setor`.
- [x] **Passo 2:** `npx vitest run src/App.agruparPorSetor.test.tsx src/App.linhasDoQuadro.test.tsx` — o primeiro falha.
- [x] **Passo 3:** em `oQueOCartaoRepete`, `selo: naLinha !== 'setor'` (some o `agrupar !== 'setor' &&`); atualizar o comentário da função e o da prop `agrupar` (por setor o cartão agora repete o selo; só o responsável e a barra mudam).
- [x] **Passo 4:** os dois arquivos passam; depois `npm test` inteiro.
- [x] **Passo 5 (commit):** `"setor-neutro-e-fotos: cartão do Quadro por setor mostra a sigla do setor"`.

---

### Task 4: Status no lugar de Etiqueta, ícones maiores e A fazer laranja

Cobre: spec solução 4, histórias 5, 6 e 9, critérios 4 e 9. Ponto 2 de "Pontos para o executor saber" (rótulo "Iniciado").

**Arquivos**
- Modificar: `src/styles/tokens.css` (`--etiqueta-a-fazer: #ea580c`), `src/styles/etiquetasVivas.test.ts`
- Modificar: `src/components/processos/EtiquetaDoProcesso.tsx` (tamanhos 22 e 18; `title` e `aria`: "Status: …"), `LegendaDasEtiquetas.tsx` (+ `.css`), `CorpoDoAgora.tsx:87,92`, `src/cadastros/historicoDosCadastros.ts:81` (`etiqueta: 'Status'`) e `.test.ts`
- Testar: `src/App.cartaoDoQuadro.test.tsx`, `src/App.agoraDoVerso.test.tsx`, `src/App.versoEnxuto.test.tsx`, `src/App.historicoDosCadastros.test.tsx`, e os demais `App.*.test.tsx` que citam "Etiqueta" (`grep -rln "Etiqueta" src --include=*.test.tsx`)
- Criar/registrar: `.scratch/setor-neutro-e-fotos/desvios.md` (divergência "Iniciado" × "Em andamento")

- [x] **Passo 1 (testes que falham):**
  - `etiquetasVivas.test.ts`: o teste do contorno de A fazer passa a conferir `valorDe('etiqueta-a-fazer')` igual a `#ea580c` e `contraste(..., '#ffffff')` ≥ 3 (mínimo gráfico); manter o do traço azul de Em andamento.
  - `App.cartaoDoQuadro.test.tsx`: o ícone da etiqueta tem `title="Status: A fazer"` e texto oculto "A fazer".
  - `App.agoraDoVerso.test.tsx` / `App.versoEnxuto.test.tsx`: o campo se chama **Status** (`getByLabelText('Status')` ou `getByText('Status')`, conforme já façam com "Etiqueta") e o grupo da legenda do Quadro tem nome "Legenda do status".
  - `App.historicoDosCadastros.test.tsx` e `historicoDosCadastros.test.ts`: a linha de mudança mostra "Status" no lugar de "Etiqueta".
- [x] **Passo 2:** rodar esses arquivos e conferir as falhas.
- [x] **Passo 3 (implementação):**
  - `tokens.css`: `--etiqueta-a-fazer: #ea580c;` (deixa de apontar para `--icone-inativo`).
  - `EtiquetaDoProcesso.tsx`: ícone do cartão 18 → 22; com nome, 14 → 18; `title={`Status: ${rotulo}`}`.
  - `LegendaDasEtiquetas.tsx`: `aria-label="Legenda do status"` e, antes da lista, o rótulo visível `Status` e um `title` explicando "Status é da etapa; a Situação é do processo todo"; ajustar `.legenda-das-etiquetas` se precisar de espaço para o rótulo.
  - `CorpoDoAgora.tsx`: os dois textos "Etiqueta" viram "Status".
  - `historicoDosCadastros.ts`: `etiqueta: 'Status'`.
  - Ajustar os demais testes que procuravam o texto "Etiqueta" visível (o valor guardado e os nomes de código não mudam).
- [x] **Passo 4:** `desvios.md`: entrada de 2026-11-03 — "A spec fala em três valores (A fazer, Em andamento, Finalizado); o rótulo atual do segundo valor é 'Iniciado' (`rotulos.ts`). Mantido 'Iniciado'; a decisão de trocar o rótulo fica com o usuário."
- [x] **Passo 5:** `npm run typecheck && npm test && npm run lint` passam.
- [x] **Passo 6 (commit):** `"setor-neutro-e-fotos: Status no lugar de Etiqueta, ícones maiores e A fazer em laranja"`.

---

### Task 5: Situação em pílulas de cor

Cobre: spec solução 5, história 7, critério 6.

**Arquivos**
- Modificar: `src/components/processos/PilulaDaSituacao.tsx`
- Criar: `src/components/processos/PilulaDaSituacao.test.tsx`
- Verificar: `src/styles/tokens.css` (tokens `informativa-*`, `vencendo-*`, `atraso-*`, `aprovado-*`), `etiquetasVivas.test.ts` (já confere contraste de `atraso`, `vencendo`, `aprovado`, `neutra`; acrescentar `informativa-texto` sobre `informativa-fundo`)

**Interfaces**
- Produz: `PilulaDaSituacao({ situacao })` com cores: `em_andamento` → `informativa` (azul claro), `suspenso` → `vencendo` (âmbar), `cancelado` → `atraso` (vermelho claro), `concluido` → `aprovado` (verde). O texto vem de `ROTULO_DA_SITUACAO`.

- [x] **Passo 1 (teste que falha):** `PilulaDaSituacao.test.tsx` com `test.each` dos quatro valores: renderiza e confere o texto (`Em andamento`, `Suspenso`, `Cancelado`, `Concluído`) e a classe `pilula-informativa|pilula-vencendo|pilula-atraso|pilula-aprovado` (o mapa de classes é o comportamento visível acessível aos testes). Em `etiquetasVivas.test.ts`, incluir `['informativa-texto', 'informativa-fundo']` no `test.each` de contraste, se ainda não estiver.
- [x] **Passo 2:** `npx vitest run src/components/processos/PilulaDaSituacao.test.tsx` — falha (Em andamento ainda é `discreta`, Suspenso e Cancelado ainda `neutra`).
- [x] **Passo 3:** trocar o mapa `PILULA_DA_SITUACAO` como acima; conferir em `Pilula.css`/`tokens.css` que as classes e os tokens existem (se `informativa` não for azul, escolher o token azul claro já existente da identidade, sem criar paleta nova).
- [x] **Passo 4:** conferir os testes de tela que olham "discreta" ou a ausência de pílula para Em andamento (`App.situacao.test.tsx`, `App.lista.test.tsx`) e ajustar para a nova pílula, mantendo o que provam (texto presente). O cartão do Quadro continua só com "Suspenso" (`Pilula situacao="neutra"` no `CartaoDoProcesso`, não mudar).
- [x] **Passo 5:** `npm run typecheck && npm test && npm run lint` passam.
- [x] **Passo 6 (commit):** `"setor-neutro-e-fotos: Situação em pílulas de cor"`.

---

### Task 6: Foto do responsável no cartão e na Lista; registros de apoio

Cobre: spec solução 6, histórias 8, 9 e 10, critérios 5 e 10, e "Registros de apoio".

**Arquivos**
- Modificar: `src/components/processos/CartaoDoProcesso.tsx` (`QuemCuida`), `src/components/processos/LinhaDoProcesso.tsx` (célula do responsável), `src/components/processos/Quadro.css` (`.cartao-responsavel`, `.cartao-responsavel svg`), `ArvoreDaLista.css` ou o CSS da Lista (alinhar avatar + nome)
- Reaproveitar: `src/components/Avatar.tsx` (`Avatar`, `AvatarVazio`)
- Testar: `src/App.cartaoDoQuadro.test.tsx:162` (hoje exige "sem avatar"), `src/App.lista.test.tsx`, `src/App.agruparPorResponsavel*.test.tsx` e `App.linhasDoQuadro.test.tsx` (o cartão não repete o responsável)
- Modificar (apoio): `.scratch/identidade-visual.md` (acréscimo datado), `.scratch/proposta-visual/decisoes.md` (linhas do avatar e do cartão: "Feito (2026-11-03, ADR 0039)")

**Interfaces**
- Consome: `ProcessoDaLista.responsavel: { id, nome, fotoUrl } | null` (já traz `fotoUrl`), `usuarioId` (já passado ao cartão).
- Produz: `QuemCuida` mostra `Avatar` 24px decorativo (foto ou iniciais) + "Você"/nome; sem responsável, `AvatarVazio` + "Sem responsável".

- [x] **Passo 1 (testes que falham):**
  - Cartão: com responsável sem foto, o cartão tem `.avatar` (as iniciais saem por `data-iniciais`) e o texto "Ana Teste"; com `fotoUrl`, tem `img.avatar` com `alt=""`; o do usuário logado diz "Você" (o avatar `.avatar-proprio`); sem responsável, tem o círculo tracejado (o seletor que `AvatarVazio` usa; ver `Avatar.tsx`) e o texto "Sem responsável". Reescrever o teste de `App.cartaoDoQuadro.test.tsx:162` com isso.
  - Lista: a linha do processo traz o avatar (`.avatar`) antes do nome do responsável; sem responsável, "—" sem avatar.
  - Acessibilidade (história 9): o avatar no cartão é decorativo, então o nome não é lido duas vezes: `img` com `alt=""` ou `span` com `aria-hidden`.
  - Mantidos: Quadro por responsável e Linhas por responsável continuam sem a linha do responsável no cartão.
- [x] **Passo 2:** rodar esses arquivos e conferir as falhas.
- [x] **Passo 3 (implementação):**
  - `QuemCuida`: trocar `<Icone nome="conta" ... />` por `responsavel ? <Avatar nome={responsavel.nome} fotoUrl={responsavel.fotoUrl ?? undefined} tamanho={24} decorativo proprio={responsavel.id === usuarioId} /> : <AvatarVazio tamanho={24} />` (conferir a assinatura de `AvatarVazio` em `Avatar.tsx`); o texto continua "Você"/nome/"Sem responsável".
  - `Quadro.css`: `.cartao-responsavel` com `display: flex; align-items: center; gap: var(--esp-2)`; remover a regra `.cartao-responsavel svg` se ficar sem uso.
  - `LinhaDoProcesso.tsx`: a célula vira `<span className="lista-responsavel">` com o `Avatar` (24px, decorativo) e o nome, ou "—"; estilo `display: inline-flex; align-items: center; gap: var(--esp-2)`. Função auxiliar `ResponsavelDaLinha` se a função crescer.
- [x] **Passo 4:** `npm run typecheck && npm test && npm run lint` passam.
- [x] **Passo 5 (registros):** acrescentar entrada datada (2026-11-03) em `.scratch/identidade-visual.md` ("Setor neutro e maior; Status com ícones maiores e A fazer laranja; Situação em pílulas de cor; avatar de 24px no cartão e na Lista, ADR 0039") e atualizar as linhas da tabela de `.scratch/proposta-visual/decisoes.md` (avatar e "cartão sem avatar").
- [x] **Passo 6 (verificação visual):** abrir o app (`preview_start`, se houver servidor configurado) e olhar o Quadro (por etapa e por setor), a Lista e o cadastro de setores; conferir selo, ícones, pílulas e avatar. Sem login real, o que não der para ver (foto do Google, `[visual]` 8 a 10) fica registrado como presumido para o `/ship`.
- [x] **Passo 7 (commit):** `"setor-neutro-e-fotos: avatar do responsável no cartão e na Lista, registros de apoio"`.
- [ ] **Passo 8 (CONTEXT.md):** **não editar.** Propor ao usuário, na conclusão, a redação do termo "Etiqueta" (linha 111, _Avoid_ "status") como "Status (antes Etiqueta)", e aplicar só depois da confirmação.

---

## Conferência final (depois da Task 6)

- [ ] `npm run typecheck && npm test && npm run lint && npm run check:circular` passam.
- [ ] Cada critério da spec tem tarefa: 1 e 2 → Task 1–2; 3 → Task 3; 4 → Task 4; 5 → Task 6; 6 → Task 5; 7 → todas; 8 a 10 `[visual]` → passo visual da Task 6 (presumidos onde faltar o login real).
- [ ] Sem referência nova a `corDoSetor`, `--cor-do-setor`, `GradeDeCores` ou `setorCor` em `src/` (fora `src/types/database.ts`).
