# Plano do ticket 22: Agrupar por responsável e "Só os meus"

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa, marcando as caixas (`- [x]`). Branch comum `processos-etapas-22`, sem worktree (o isolamento já está feito).

**Objetivo:** a barra do Quadro ganha "Agrupar por: Etapa | Responsável" (todos os perfis) e o botão "Só os meus" (Administrador e Integrante). Agrupado por responsável, o Quadro tem uma coluna por pessoa; "Só os meus" é o filtro Responsável com o id de quem está na tela.

**Arquitetura:** só interface, sem banco, sem migração, sem dependência. O cartão do Quadro já traz `responsavel` e `cartao.responsavelAtivo` (ticket 20), então a pílula "Inativo" não precisa de dado novo. O agrupamento é um campo novo do endereço (`agrupar`), fora de `filtros`, para o [Limpar filtros] não o desligar. Uma função pura monta as colunas por pessoa; o Quadro escolhe entre ela e a de etapa; o cartão muda o rodapé e perde o selo "Sem responsável" nesse modo. "Só os meus" não tem estado próprio: o botão lê e escreve `filtros.responsavel`.

**Requisitos:** `.scratch/processos-etapas/issues/22-agrupar-por-responsavel-e-so-os-meus.md` (critérios citados como "critério N do ticket 22", de cima para baixo, 1 a 8) e a spec (histórias 164 a 172; "Interface", Quadro, itens Agrupar por e Só os meus; "Estados", vazio do "Só os meus"; "Decisões de teste"; "Observações", parte 4).

## Restrições gerais

- Sem dependência nova, sem migração, sem mexer no banco (por isso não vale a leitura do `banco.md`). Limites do ESLint: função até 20 linhas (hook até 40), arquivo até 300, complexidade até 10.
- Toda tarefa de código termina com `npm test`, `npm run lint` e `npm run typecheck` verdes. Testes de tela instáveis sob carga (backlog): repita o arquivo isolado antes de concluir que falhou de verdade.
- Textos da tela exatamente como na spec, com acentos. Dados de teste inventados.
- Arquivos com CRLF: trocas pela ferramenta de edição. Arquivos novos pela ferramenta de arquivo, nunca por heredoc.
- Cada commit leva cerca de 1 minuto (o pré-commit roda a bateria inteira). Comece cada chamada do Bash com `cd` para a raiz do projeto.

## Decisões deste plano (vão para o `desvios.md` na Tarefa 5)

1. **`agrupar` fica no endereço, ao lado de `filtros`, não dentro deles.** `temFiltro` e o [Limpar filtros] olham só `filtros`; assim "limpar" mantém o agrupamento (spec, "Observações", parte 4). Só vale no Quadro: na Lista o parâmetro é ignorado e não é escrito (como `situacao` e `busca` no sentido inverso). O alternador Quadro/Lista já zera o endereço, então o agrupamento não acompanha a troca de visão.
2. **"Agrupar por" são dois botões com `aria-pressed`** (Etapa, Responsável), como o "Quadro | Lista" da barra de cima, e não um seletor: a spec escreve "Etapa | Responsável".
3. **"Só os meus" só aparece no Quadro** (a spec o põe "na barra do Quadro"); na Lista o filtro Responsável faz o mesmo.
4. **Cartão sem etapa atual** não entra no Quadro agrupado por responsável, como já não entra em nenhuma coluna de etapa.
5. **Responsável sem processo visível:** "Só os meus" ligado para quem não tem nenhum processo deixa o seletor Responsável mostrando "Todos" (o id dela não está nas opções, que saem da lista). Só o vazio "Nenhum processo com você agora." conta a situação. Conhecido e aceito (Ponytail: acrescentar a opção só se alguém estranhar).

## Mapa de arquivos

| Arquivo | O que faz |
|-|-|
| `src/processos/enderecoDosProcessos.ts` + `.test.ts` | campo `agrupar` (`'etapa' \| 'responsavel'`) lido e montado |
| `src/processos/colunasDoQuadro.ts` + `.test.ts` | `colunasPorResponsavel(processos)`; `ColunaDoQuadro` ganha `inativo?` |
| `src/components/processos/ControlesDoQuadro.tsx` (criar) | `AgruparPor` e `SoOsMeus` |
| `src/components/processos/VisaoDosProcessos.tsx`, `AreaDeProcessos.tsx` | passam `agrupar`, `aoMudarAgrupar`; vazio do "Só os meus" |
| `src/components/processos/QuadroDeProcessos.tsx`, `ColunaDoQuadro.tsx`, `CartaoDoProcesso.tsx`, `SelosDoCartao.tsx` | modo responsável: colunas, pílula Inativo, etapa no lugar do avatar, sem selo, sem arrastar |
| `src/components/processos/FiltrosDosProcessos.tsx` | `NenhumProcessoDoUsuario` (o vazio do "Só os meus") |
| `src/components/processos/Quadro.css` | estilo do nome da etapa no cartão e dos controles |
| `src/App.agruparPorResponsavel.test.tsx` (criar) | critérios 2 a 7 pelo aplicativo inteiro |
| `src/App.soOsMeus.test.tsx` (criar) | critérios 4 a 7 pelo aplicativo inteiro |

---

### Tarefa 1: O agrupamento no endereço (critério 1, parte do 3)

**Arquivos:** `src/processos/enderecoDosProcessos.ts`, `src/processos/enderecoDosProcessos.test.ts`, `src/components/processos/ProcessosDoSetor.tsx` (o literal de `EnderecoDosProcessos`) e os testes que o typecheck apontar.

**Produz:** `type AgruparQuadroPor = 'etapa' | 'responsavel'`; `EnderecoDosProcessos` ganha `agrupar: AgruparQuadroPor`; `lerEnderecoDosProcessos` devolve `agrupar` (`'responsavel'` só no Quadro e só com `agrupar=responsavel`; qualquer outra coisa vira `'etapa'`); `montarEnderecoDosProcessos` escreve `agrupar=responsavel` depois dos filtros, só no Quadro.

- [x] **Passo 1: os testes que falham** em `enderecoDosProcessos.test.ts` (use o `describe`/estilo que o arquivo já usa):
  - `lerEnderecoDosProcessos('#/processos?agrupar=responsavel').agrupar` é `'responsavel'`;
  - sem o parâmetro, ou com `agrupar=outra-coisa`, é `'etapa'`;
  - `'#/processos/lista?agrupar=responsavel'` dá `'etapa'` (a Lista ignora);
  - `montarEnderecoDosProcessos({ visao: 'quadro', aberto: null, filtros: { ...SEM_FILTROS, setor: 's1' }, agrupar: 'responsavel' })` é `'#/processos?setor=s1&agrupar=responsavel'`;
  - o mesmo na Lista é `'#/processos/lista?setor=s1'`;
  - ida e volta: `montar(ler(x)) === x` para `'#/processos/p1?responsavel=u1&agrupar=responsavel'`.
- [x] **Passo 2:** `npx vitest run src/processos/enderecoDosProcessos.test.ts` — esperado: falha.
- [x] **Passo 3: implementar.** Em `enderecoDosProcessos.ts`:

```ts
export type AgruparQuadroPor = 'etapa' | 'responsavel'

/** aberto: ...(comentário que já existe). agrupar: só no Quadro. */
export type EnderecoDosProcessos = { visao: VisaoDosProcessos; aberto: string | null; filtros: FiltrosDosProcessos; agrupar: AgruparQuadroPor }
```

  `lerEnderecoDosProcessos` cria `const parametros = new URLSearchParams(consulta)` uma vez, passa a `filtrosDaConsulta(parametros, visao)` e devolve `agrupar: visao === 'quadro' && parametros.get('agrupar') === 'responsavel' ? 'responsavel' : 'etapa'`. `montarEnderecoDosProcessos` recebe também `agrupar` e, depois do laço dos filtros, faz `if (visao === 'quadro' && agrupar === 'responsavel') consulta.set('agrupar', 'responsavel')`.
- [x] **Passo 4:** corrigir o que o `npm run typecheck` apontar (o literal em `ProcessosDoSetor.tsx` ganha `agrupar: 'etapa'`; testes antigos que montam `EnderecoDosProcessos` à mão também). Rodar os testes do arquivo — esperado: passam.
- [x] **Passo 5:** `npm test`, `npm run lint`, `npm run typecheck` verdes. Commit: `Ticket 22 de processos-etapas: o agrupar do Quadro no endereço`.

---

### Tarefa 2: As colunas por responsável (critério 2)

**Arquivos:** `src/processos/colunasDoQuadro.ts`, `src/processos/colunasDoQuadro.test.ts`.

**Consome:** `ProcessoDaLista` (`responsavel`, `etapaAtual`, `situacao`, `cartao?.responsavelAtivo`).
**Produz:** `colunasPorResponsavel(processos: ProcessoDaLista[]): ColunaDoQuadro[]`; `ColunaDoQuadro` ganha `inativo?: boolean`; a chave da coluna de uma pessoa é o id dela, e a de "Sem responsável" é `'sem-responsavel'`.

- [x] **Passo 1: os testes que falham** em `colunasDoQuadro.test.ts` (reaproveite o `processo()` do arquivo; passe `responsavel: { id, nome, fotoUrl: null }`):
  - uma coluna por pessoa, em ordem alfabética sem diferenciar maiúsculas e acentos (`Zélia`, `ana`, `Bruno` → `ana`, `Bruno`, `Zélia`), com o título igual ao nome;
  - duas pessoas de ids diferentes e o mesmo nome viram duas colunas;
  - "Sem responsável" é a última e só existe se algum cartão estiver nela;
  - a coluna da pessoa desativada (`cartao: { ..., responsavelAtivo: false }` no cartão dela) tem `inativo: true`; a de pessoa ativa, `false`;
  - dentro da coluna, os cartões saem em ordem de nome;
  - suspenso entra; concluído e cancelado saem (mesma regra do Quadro por etapa);
  - cartão sem `etapaAtual` fica de fora;
  - lista vazia → `[]`.
- [x] **Passo 2:** `npx vitest run src/processos/colunasDoQuadro.test.ts` — esperado: falha (função inexistente).
- [x] **Passo 3: implementar.** Extraia de `colunasDoQuadro` o filtro dos vivos em ordem de nome para uma função `processosDoQuadro(processos)` (segunda repetição real) e escreva:

```ts
const CHAVE_SEM_RESPONSAVEL = 'sem-responsavel'

function porTitulo(a: ColunaDoQuadro, b: ColunaDoQuadro): number {
  return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
}

/** Uma coluna por pessoa que responde pela etapa atual de algum cartão, em ordem de nome; "Sem responsável" no fim. */
export function colunasPorResponsavel(processos: ProcessoDaLista[]): ColunaDoQuadro[] {
  const noQuadro = processosDoQuadro(processos).filter((processo) => processo.etapaAtual !== null)
  const pessoas = new Map<string, ColunaDoQuadro>()
  for (const processo of noQuadro) {
    const { responsavel } = processo
    if (!responsavel) continue
    const coluna = pessoas.get(responsavel.id)
      ?? { chave: responsavel.id, titulo: responsavel.nome, processos: [], inativo: processo.cartao?.responsavelAtivo === false }
    coluna.processos.push(processo)
    pessoas.set(responsavel.id, coluna)
  }
  const semResponsavel = noQuadro.filter((processo) => processo.responsavel === null)
  const colunas = [...pessoas.values()].sort(porTitulo)
  if (semResponsavel.length === 0) return colunas
  return [...colunas, { chave: CHAVE_SEM_RESPONSAVEL, titulo: 'Sem responsável', processos: semResponsavel }]
}
```

  Se a função passar de 20 linhas ou 10 caminhos, extraia o agrupamento por pessoa para `agruparPorPessoa(noQuadro)`.
- [x] **Passo 4:** os testes do arquivo passam; `npm test`, `npm run lint`, `npm run typecheck` verdes. Commit: `Ticket 22 de processos-etapas: colunas do Quadro por responsável`.

---

### Tarefa 3: "Agrupar por" e o Quadro por responsável na tela (critérios 2, 3 e 8)

**Arquivos:** criar `src/components/processos/ControlesDoQuadro.tsx` e `src/App.agruparPorResponsavel.test.tsx`; modificar `VisaoDosProcessos.tsx`, `AreaDeProcessos.tsx`, `QuadroDeProcessos.tsx`, `ColunaDoQuadro.tsx`, `CartaoDoProcesso.tsx`, `SelosDoCartao.tsx`, `Quadro.css`.

**Consome:** `colunasPorResponsavel` e `AgruparQuadroPor` (Tarefas 1 e 2); `montar`, `processo`, `cartaoDe`, `ETAPAS` de `src/testes/quadroDeTeste.tsx`.
**Produz:** `AgruparPor({ agrupar, aoMudar })` em `ControlesDoQuadro.tsx`; as props `agrupar: AgruparQuadroPor` em `QuadroDeProcessos`, `ColunaDoQuadro` (`agrupar`) e `VisaoDosProcessos` (`agrupar`, `aoMudarAgrupar: (agrupar: AgruparQuadroPor) => void`); `CartaoDoProcesso` e `SelosDoCartao` ganham `agrupadoPorResponsavel: boolean`.

- [x] **Passo 1: os testes que falham** em `App.agruparPorResponsavel.test.tsx` (mesma moldura de `App.arrastarParaConcluir.test.tsx`: `beforeEach` põe `#/processos`, `afterEach` limpa; `const coluna = (nome) => screen.getByRole('region', { name: nome })`; `const trocar = async () => fireEvent.click(await screen.findByRole('button', { name: 'Responsável' }))`). Três pessoas inventadas (`Ana Teste` `u1` ativa, `Bia Teste` `u2` desativada, `Caio Teste` `u3`), passadas por `processo(nome, { processo: { responsavel: {...} }, cartao: { responsavelAtivo } })`:
  - barra: em `role="group"` com nome "Agrupar por" há os botões Etapa (`aria-pressed="true"`) e Responsável (`"false"`); clicar em Responsável inverte os dois;
  - por etapa continua como antes (a região "Modelagem piloto" existe e a de `Ana Teste` não);
  - por responsável: as regiões saem na ordem `Ana Teste`, `Bia Teste`, `Caio Teste`, `Sem responsável` (leia os `h3` das `.coluna` em ordem), a contagem no título é a de cartões, e só "Sem responsável" depende de haver cartão (sem cartão sem responsável, a região não existe);
  - a coluna de `Bia Teste` mostra a pílula "Inativo"; a de `Ana Teste`, não;
  - o cartão nesse modo mostra o nome da etapa atual (`.cartao-etapa`, ex.: "Revisão interna") e não tem avatar (`.avatar` ausente); o cartão sem responsável não mostra o selo "Sem responsável" (`.cartao-selos`), mas no modo por etapa ainda mostra;
  - nenhum cartão é arrastável (`draggable="false"`) no modo por responsável, mesmo com a etapa em andamento e pendente depois; voltando a Etapa, o arrastável volta (`"true"`);
  - o filtro de etapa continua valendo: com `#/processos?etapa=revisao_interna&agrupar=responsavel`, só aparecem as colunas das pessoas com cartão nessa etapa;
  - o endereço: clicar em Responsável deixa `window.location.hash` em `#/processos?agrupar=responsavel`; clicar em Etapa volta a `#/processos`; abrir o app já em `#/processos?agrupar=responsavel` mostra `Responsável` pressionado e as colunas por pessoa (é o "recarregar mantém");
  - a Consulta (`montar(..., 'consulta')`) vê o "Agrupar por" e as colunas por pessoa.
- [x] **Passo 2:** `npx vitest run src/App.agruparPorResponsavel.test.tsx` — esperado: falham pelo motivo certo (sem o grupo "Agrupar por").
- [x] **Passo 3: implementar.**
  - `ControlesDoQuadro.tsx`:

```tsx
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'

const OPCOES: { valor: AgruparQuadroPor; rotulo: string }[] = [{ valor: 'etapa', rotulo: 'Etapa' }, { valor: 'responsavel', rotulo: 'Responsável' }]

/** "Agrupar por: Etapa | Responsável": dois botões, o escolhido anunciado por aria-pressed. */
export function AgruparPor({ agrupar, aoMudar }: { agrupar: AgruparQuadroPor; aoMudar: (agrupar: AgruparQuadroPor) => void }) {
  return (
    <div className="controle-do-quadro" role="group" aria-label="Agrupar por">
      <span className="filtro-rotulo" aria-hidden="true">Agrupar por</span>
      <span className="controle-opcoes">
        {OPCOES.map(({ valor, rotulo }) => (
          <button key={valor} type="button" className={agrupar === valor ? 'botao botao-principal' : 'botao botao-secundario'}
            aria-pressed={agrupar === valor} onClick={() => aoMudar(valor)}>{rotulo}</button>
        ))}
      </span>
    </div>
  )
}
```

  - `AreaDeProcessos.tsx`: passar `agrupar={atual.agrupar}` e `aoMudarAgrupar={(agrupar) => irParaVisao({ agrupar, aberto: null })}` a `VisaoDosProcessos`.
  - `VisaoDosProcessos.tsx`: aceitar as duas props; na `quadro-barra`, depois de `FiltrosDosProcessos`, `{visao === 'quadro' && <AgruparPor agrupar={agrupar} aoMudar={aoMudarAgrupar} />}`; repassar `agrupar` ao `QuadroDeProcessos` em `ConteudoDaVisao`.
  - `QuadroDeProcessos.tsx`: prop `agrupar`; `const colunas = agrupar === 'responsavel' ? colunasPorResponsavel(lista.processos) : colunasDoQuadro(lista)`; repassa `agrupar` a cada `ColunaDoQuadro`.
  - `ColunaDoQuadro.tsx`: prop `agrupar`; no `h3`, depois do título, `{coluna.inativo && <Pilula situacao="neutra">Inativo</Pilula>}` antes da contagem; `arrastavel={podeAlterar && agrupar === 'etapa' && colunaDeDestino(processo) !== null}`; `agrupadoPorResponsavel={agrupar === 'responsavel'}` no cartão.
  - `CartaoDoProcesso.tsx`: no rodapé, `agrupadoPorResponsavel ? <span className="cartao-etapa">{processo.etapaAtual?.nome}</span> : responsavel && <Avatar ... />`; passa a prop a `SelosDoCartao`.
  - `SelosDoCartao.tsx`: com `agrupadoPorResponsavel`, filtra `selo.tipo !== 'sem_responsavel'` (a coluna já diz).
  - `Quadro.css`: `.cartao-etapa` com `font-size: var(--tam-rotulo)`, `color: var(--texto-2)`, truncando com `text-overflow: ellipsis`; `.controle-do-quadro` e `.controle-opcoes` em `display: flex`, `gap: var(--esp-1)`, alinhados embaixo como `.filtro`. Use só tokens que já existem no arquivo.
- [x] **Passo 4:** o arquivo de teste novo passa; `npm test`, `npm run lint`, `npm run typecheck` verdes. Commit: `Ticket 22 de processos-etapas: Quadro agrupado por responsável`.

---

### Tarefa 4: "Só os meus", o vazio e o [Limpar filtros] (critérios 4 a 7)

**Arquivos:** criar `src/App.soOsMeus.test.tsx`; modificar `ControlesDoQuadro.tsx`, `VisaoDosProcessos.tsx`, `AreaDeProcessos.tsx` (já passa `usuarioId`), `FiltrosDosProcessos.tsx`.

**Consome:** `AgruparPor` (Tarefa 3); `FiltrosDosProcessos`, `SEM_FILTROS`, `temFiltro`.
**Produz:** `SoOsMeus({ ligado, aoAlternar })` em `ControlesDoQuadro.tsx`; `NenhumProcessoDoUsuario({ aoVerTodos })` em `FiltrosDosProcessos.tsx`; função local `soOsMeusSemMais(filtros, usuarioId)` em `VisaoDosProcessos.tsx` (verdadeira quando o único filtro ligado é o Responsável com o id de quem está na tela).

- [x] **Passo 1: os testes que falham** em `App.soOsMeus.test.tsx` (mesma moldura; o usuário da tela é `USUARIO_DE_TESTE`, e os processos "meus" levam `responsavel: { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome, fotoUrl: null }`):
  - Administrador e Integrante veem o botão "Só os meus" (`aria-pressed="false"`); a Consulta não vê;
  - clicar liga: `aria-pressed="true"`, só os cartões do usuário ficam e o filtro Responsável (`getByLabelText('Responsável')`) passa a ter o id dele; o endereço fica `#/processos?responsavel=<id>`;
  - clicar de novo desliga: todos os cartões voltam, filtro Responsável em "Todos", endereço `#/processos`;
  - escolher a si mesmo no filtro Responsável liga o botão; escolher outra pessoa desliga; escolher "Todos" desliga;
  - sem nenhum cartão do usuário e sem outros filtros: "Nenhum processo com você agora." e o botão [Ver todos], que desliga o "Só os meus" e traz os cartões de volta; a mensagem "Nenhum processo com estes filtros." não aparece;
  - sem cartão do usuário, mas com outro filtro ligado (`#/processos?setor=s1&responsavel=<id>`): vale "Nenhum processo com estes filtros." com [Limpar filtros];
  - [Limpar filtros] com "Só os meus" e outro filtro ligados desliga os dois e **mantém** o agrupamento (`#/processos?agrupar=responsavel`);
  - "Só os meus" com o Quadro agrupado por responsável: sobra só a coluna do usuário.
- [x] **Passo 2:** `npx vitest run src/App.soOsMeus.test.tsx` — esperado: falha (botão inexistente).
- [x] **Passo 3: implementar.**
  - `SoOsMeus` em `ControlesDoQuadro.tsx`: `<button type="button" className={ligado ? 'botao botao-principal' : 'botao botao-secundario'} aria-pressed={ligado} onClick={aoAlternar}>Só os meus</button>`.
  - `VisaoDosProcessos.tsx`: na barra, ao lado do `AgruparPor`, `{visao === 'quadro' && podeAlterar && <SoOsMeus ligado={filtros.responsavel === usuarioId} aoAlternar={() => aoMudarFiltros({ ...filtros, responsavel: filtros.responsavel === usuarioId ? null : usuarioId })} />}`. Como é o mesmo filtro Responsável, "escolher a si mesmo liga o botão" e "escolher outra pessoa desliga" saem de graça, sem estado novo.
  - Vazio: onde hoje está `lista.processos.length === 0 && temFiltro(filtros)`, escolher `NenhumProcessoDoUsuario` quando `soOsMeusSemMais(filtros, usuarioId)` e `NenhumProcessoComFiltros` nos outros casos. `soOsMeusSemMais`: `filtros.responsavel === usuarioId && !temFiltro({ ...filtros, responsavel: null })`.
  - `NenhumProcessoDoUsuario` em `FiltrosDosProcessos.tsx`, no molde de `NenhumProcessoComFiltros`: `<p className="cadastros-vazio">Nenhum processo com você agora.</p>` e um botão secundário "Ver todos".
  - O [Limpar filtros] já faz `aoMudar(SEM_FILTROS)` e o `irParaVisao` guarda o `agrupar` do endereço atual; o teste prova.
- [x] **Passo 4:** o arquivo de teste novo passa; `npm test`, `npm run lint`, `npm run typecheck` verdes. Commit: `Ticket 22 de processos-etapas: Só os meus, vazio e Limpar filtros`.

---

### Tarefa 5: Conferência na tela e registros (critério 8, `[visual]`)

**Arquivos:** `.scratch/processos-etapas/desvios.md` (entrada nova, datada), `.scratch/processos-etapas/plano-22.md` (as caixas).

- [x] **Passo 1: conferir a tela** pela vitrine local com módulos falsos (como no ticket 21; veja o `desvios.md` do ticket 21 e `package.json` para o comando), no navegador do app: barra com os filtros, "Agrupar por" e "Só os meus" sem quebrar de forma feia; por responsável, o título das colunas com a pílula "Inativo", o nome da etapa no lugar da foto, "Sem responsável" no fim; Só os meus ligado (botão azul) e o vazio. Registrar o que foi visto e o que ficou presumido.
- [x] **Passo 2:** `desvios.md`: entrada datada "ticket 22" com as cinco decisões deste plano e o que apareceu no caminho, mais a conferência da tela.
- [x] **Passo 3:** `npm test` inteiro, `npm run lint`, `npm run typecheck` e a cobertura (`npm run test:cobertura`, se existir no `package.json`) verdes. Commit: `Ticket 22 de processos-etapas: desvios e conferência`.
- [ ] **Passo 4:** (fora do plano de código, na branch principal, depois do merge, como manda o `/executar-complexo`) linha `Concluído em` no ticket 22, marca das melhorias do protocolo (`nao-testados.md`), spec com a nota de entrega da parte 4 se o `/executar-complexo` pedir, e commit.

---

## Cobertura dos critérios do ticket 22

| Critério | Onde |
|-|-|
| 1. Funções puras (colunas e endereço) | Tarefas 1 e 2 |
| 2. Agrupado por responsável (colunas, ordem, Sem responsável, Inativo, etapa no cartão, sem selo, sem arrastar, filtros) | Tarefas 2 e 3 |
| 3. O agrupamento no endereço | Tarefas 1 e 3 |
| 4. "Só os meus" liga/desliga, equivale ao filtro, ausente para a Consulta | Tarefa 4 |
| 5. Vazio "Nenhum processo com você agora." | Tarefa 4 |
| 6. [Limpar filtros] | Tarefa 4 |
| 7. Testes de interface com o aplicativo inteiro | Tarefas 3 e 4 |
| 8. `[visual]` | Tarefa 5 |
