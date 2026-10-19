# Plano do ticket 17: o cartão "Agora" e o caminho de etapas

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa, marcando as caixas (`- [x]`). Branch comum `processos-etapas-17`, sem worktree (o isolamento já está feito).

**Objetivo:** pôr no alto da coluna esquerda do verso o cartão "Agora" (etapa atual, responsável, dias na etapa e um único botão principal) e transformar o caminho de etapas numa lista compacta de leitura, com o detalhe de cada etapa numa gaveta (ticket 17).

**Arquitetura:** o hook `useAcoesDaEtapa` (que já guarda as janelas de nota e de avanço e a falha de gravação) sobe para o `CaminhoDoProcesso`, que o entrega ao Agora e à gaveta das etapas; assim há uma só instância das janelas. O Agora e a gaveta são componentes novos que chamam as mesmas ações de hoje; as regras (etapa atual, próxima pendente, trava do autor, [Assumir]) continuam em `src/processos/caminhoDeEtapas.ts`, com três funções puras novas e um módulo novo para os dias. Sem mudança no banco.

**Tecnologia:** React 19, TypeScript, Vitest com Testing Library, CSS com os tokens de `src/styles/tokens.css`.

**Requisitos:** `.scratch/processos-etapas/issues/17-agora-e-caminho-de-etapas.md` (critérios citados como "critério N do ticket 17", contados de cima para baixo, 1 a 13) e a spec `.scratch/processos-etapas/spec.md` (histórias 112 a 122 e 137; "Interface", "Verso do cartão", itens Agora e Etapas; "Observações", decisões da parte 3; "Decisões de teste").

## Restrições gerais

- Sem mudança no banco (spec, "Parte 3"): nenhuma migração e nenhum tipo novo do banco.
- Sem dependência nova.
- Limites do ESLint: função de lógica até 20 linhas, arquivo até 300, complexidade até 10; componente React dividido por responsabilidade. Se um limite barrar, extraia uma função com nome próprio.
- Cada commit roda a bateria inteira no pré-commit (cerca de 1 minuto): toda tarefa termina com `npm test`, `npm run lint` e `npm run typecheck` verdes. Um commit nunca deixa teste quebrado.
- Textos da tela exatamente como na spec. Português do Brasil, com acentos.
- Dados dos testes inventados.
- **Design e facilidade de uso são prioridade máxima** (pedido do usuário em 2026-10-19): a Tarefa 7 confere a tela no navegador do app, pela vitrine local (`vitrine.local/`, fora do git).
- Shell: sem Python nesta máquina; scripts de apoio em `node`. Os arquivos têm final de linha CRLF: troque texto pela ferramenta de edição, não por regex em lote.

## Decisões deste plano (vão para o `desvios.md` na Tarefa 8)

1. **Concluído com etapa opcional aberta.** O processo fica "Concluído" com todas as obrigatórias resolvidas, mas a Publicação (opcional) pode seguir pendente ou em andamento. O Agora verde diz "Concluído em {data}" e, se ainda há etapa atual aberta, mantém logo abaixo o corpo normal (nome, responsável, botão principal, "⋯") dela. Sem isso, Concluir ou Dispensar a Publicação deixaria de existir na tela.
2. **[Corrigir datas] também na etapa atual em andamento.** A spec diz que a atual aberta "mostra só datas e nota"; o botão fica, porque é a única forma de corrigir o início, de que os dias na etapa dependem.
3. **"há 0 dias" é "hoje" e "há 1 dias" é "há 1 dia".** Só concordância.
4. **As iniciais da linha da etapa são as do responsável dela** (o dado traz o responsável da etapa, não quem a resolveu).
5. **A região das etapas se chama "Etapas"** (o título visível), no lugar de "Caminho de etapas".
6. **Retomar do Agora usa a janela de motivo que já existe** (`JanelaDeSituacao`), com o mesmo `executar` do "⋯" do processo.

## Mapa de arquivos

| Arquivo | O que faz |
|-|-|
| `src/processos/diasNaEtapa.ts` + `.test.ts` (criar) | `LIMITE_DE_DIAS_NA_ETAPA`, `diasNaEtapa`, `passouDoLimite`, `textoDosDias` |
| `src/processos/caminhoDeEtapas.ts` + `.test.ts` (alterar) | `concluidoEm`, `opcoesDeResponsavel`, `sinalDaEtapa`, `ROTULO_DO_SINAL`; sai `ROTULO_DO_STATUS` se ninguém mais o usar |
| `src/hooks/useAcoesDaEtapa.ts` (alterar) | exporta o tipo `AcoesDaEtapaEmUso` |
| `src/components/processos/JanelasDaEtapa.tsx` (criar) | as janelas de nota e de avanço, tiradas do `CaminhoDeEtapas` |
| `src/components/processos/CaminhoDoProcesso.tsx` (alterar) | dono do hook; monta Agora, falha, Etapas e janelas |
| `src/components/processos/AgoraDoProcesso.tsx` (criar) | escolhe a variante: andamento, parado (suspenso/cancelado), concluído, Consulta |
| `src/components/processos/EtapaDoAgora.tsx` (criar) | corpo do Agora: rótulo, nome da etapa, responsável, botão principal, "⋯" |
| `src/components/processos/TrocaDoResponsavel.tsx` (criar) | o link "Trocar" que abre a lista suspensa; serve ao Agora e à gaveta |
| `src/components/processos/DiasNaEtapa.tsx` (criar) | "há n dias" em cinza ou a pílula âmbar |
| `src/components/processos/EtapasDoProcesso.tsx` (criar) | a lista de linhas compactas e a gaveta de uma por vez |
| `src/components/processos/DetalheDaEtapa.tsx` (criar) | o conteúdo da gaveta |
| `src/components/processos/Agora.css` (criar) | o cartão e suas variantes |
| `src/components/processos/Etapas.css` (alterar) | as linhas compactas e a gaveta |
| `src/components/processos/Painel.css` (alterar) | sai `.painel-aviso` (se ninguém mais usar) e as regras antigas da etapa |
| `src/components/processos/VersoDoCartao.tsx` (alterar) | passa `executar` ao `CaminhoDoProcesso` |
| `src/testes/processoNoVerso.tsx` (criar) | monta o aplicativo com um processo à vista: `etapaDoProcesso`, `processoLido`, `montarVerso`, `diasAtras` |
| `src/testes/versoDoCartao.ts` (alterar) | `agoraDoVerso()` e `gavetaDaEtapa(nome)` |
| `src/App.agoraDoVerso.test.tsx` (criar) | os critérios 2 a 9 do ticket pelo aplicativo inteiro |
| `src/App.etapasDoVerso.test.tsx` (criar) | o critério 10 do ticket pelo aplicativo inteiro |
| `src/App.andamentoDoProcesso`, `.assumirEAutor`, `.avancoDaEtapa`, `.voltarDatasResponsavel`, `.situacaoDoProcesso`, `.versoDoCartao`, `.catalogoNosProcessos` (alterar) | só a forma de achar os botões (Agora e gaveta) e o aviso antigo que saiu |
| `src/components/processos/CaminhoDeEtapas.tsx`, `LinhaDaEtapa.tsx`, `EdicaoDaEtapa.tsx`, `SeletorDeResponsavel.tsx` (apagar) | substituídos pelos novos, na Tarefa 6 |

---

### Tarefa 1: Funções puras (dias, "Concluído em", opções do "Trocar", sinal da etapa)

**Arquivos:** criar `src/processos/diasNaEtapa.ts` e `diasNaEtapa.test.ts`; alterar `src/processos/caminhoDeEtapas.ts` e `caminhoDeEtapas.test.ts`.

**Produz:**
`LIMITE_DE_DIAS_NA_ETAPA = 15`; `diasNaEtapa(iniciadaEm: string | null, hoje: string): number | null`; `passouDoLimite(dias: number): boolean`; `textoDosDias(dias: number): string`;
`concluidoEm(etapas: EtapaDoCaminho[]): string | null`;
`type OpcaoDeResponsavel = { valor: string; rotulo: string; desabilitada?: boolean }` e `opcoesDeResponsavel(etapa: EtapaDoProcesso, usuarios: UsuarioResponsavel[], usuarioId: string): OpcaoDeResponsavel[]`;
`type SinalDaEtapa = 'concluida' | 'atual' | 'pendente' | 'opcional' | 'dispensada' | 'anterior'`, `ROTULO_DO_SINAL: Record<SinalDaEtapa, string>` e `sinalDaEtapa(etapas: EtapaDoCaminho[], indice: number): SinalDaEtapa`.

- [x] **Passo 1: testes que falham.** `diasNaEtapa.test.ts`:

```ts
import { expect, test } from 'vitest'
import { LIMITE_DE_DIAS_NA_ETAPA, diasNaEtapa, passouDoLimite, textoDosDias } from './diasNaEtapa'

test('conta os dias do início até hoje, atravessando mês e ano', () => {
  expect(diasNaEtapa('2026-10-01', '2026-10-07')).toBe(6)
  expect(diasNaEtapa('2026-12-30', '2027-01-02')).toBe(3)
})

test('o mesmo dia é 0, início no futuro também (nunca negativo) e sem início é null', () => {
  expect(diasNaEtapa('2026-10-07', '2026-10-07')).toBe(0)
  expect(diasNaEtapa('2026-10-09', '2026-10-07')).toBe(0)
  expect(diasNaEtapa(null, '2026-10-07')).toBeNull()
})

test('o horário de verão não muda a conta', () => {
  expect(diasNaEtapa('2026-10-17', '2026-10-19')).toBe(2)
  expect(diasNaEtapa('2026-02-20', '2026-02-22')).toBe(2)
})

test('até 15 dias é número; a partir de 16, pílula', () => {
  expect(LIMITE_DE_DIAS_NA_ETAPA).toBe(15)
  expect(passouDoLimite(15)).toBe(false)
  expect(passouDoLimite(16)).toBe(true)
})

test('o texto dos dias concorda: hoje, há 1 dia, há 6 dias', () => {
  expect([0, 1, 6].map(textoDosDias)).toEqual(['hoje', 'há 1 dia', 'há 6 dias'])
})
```

E em `caminhoDeEtapas.test.ts` (acrescentar; usar o construtor de etapas que o arquivo já tem, ou este mínimo):

```ts
const etapaDe = (nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso => ({
  id: nome, codigo: nome, nome, ordem: 1, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
  resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
})

test('concluidoEm é a data da última etapa obrigatória resolvida, e a opcional não conta', () => {
  const etapas = [
    etapaDe('a', { status: 'concluida', resolvidaEm: '2026-10-10' }),
    etapaDe('b', { status: 'realizada_anteriormente', resolvidaEm: '2026-10-12' }),
    etapaDe('c', { status: 'dispensada', obrigatoria: false, resolvidaEm: '2026-10-15' }),
  ]
  expect(concluidoEm(etapas)).toBe('2026-10-12')
  expect(concluidoEm([etapaDe('a')])).toBeNull()
})

test('o Trocar põe quem está na tela primeiro, com (você), e Ninguém por enquanto no fim', () => {
  const eu = { id: 'u1', nome: 'Ana Teste' }
  const bia = { id: 'u2', nome: 'Bia Teste' }
  const opcoes = opcoesDeResponsavel(etapaDe('x'), [bia, eu], 'u1')
  expect(opcoes.map((opcao) => opcao.rotulo)).toEqual(['Ana Teste (você)', 'Bia Teste', 'Ninguém por enquanto'])
  expect(opcoes.at(-1)?.valor).toBe('')
})

test('o responsável atual que saiu da lista continua à vista; o inativo fica desabilitado', () => {
  const inativo = etapaDe('x', { responsavelId: 'u9', responsavelNome: 'Caio Teste', responsavelInativo: true })
  const opcoes = opcoesDeResponsavel(inativo, [{ id: 'u1', nome: 'Ana Teste' }], 'u1')
  expect(opcoes.map((opcao) => opcao.rotulo)).toEqual(['Ana Teste (você)', 'Caio Teste (Inativo)', 'Ninguém por enquanto'])
  expect(opcoes[1].desabilitada).toBe(true)
})

test('o sinal de cada etapa: atual, concluída, anterior, dispensada, pendente e opcional', () => {
  const etapas = [
    etapaDe('a', { status: 'concluida' }), etapaDe('b', { status: 'realizada_anteriormente' }),
    etapaDe('c', { status: 'em_andamento' }), etapaDe('d'), etapaDe('e', { obrigatoria: false }),
    etapaDe('f', { status: 'dispensada', obrigatoria: false }),
  ]
  expect(etapas.map((_, indice) => sinalDaEtapa(etapas, indice))).toEqual(
    ['concluida', 'anterior', 'atual', 'pendente', 'opcional', 'dispensada'])
})
```

- [x] **Passo 2: rodar e ver falhar.** `npx vitest run src/processos/diasNaEtapa.test.ts src/processos/caminhoDeEtapas.test.ts`. Esperado: falha por import inexistente.

- [x] **Passo 3: implementar.** `src/processos/diasNaEtapa.ts`:

```ts
/** Daqui em diante o número de dias vira a pílula âmbar (spec, "Verso do cartão"); o selo do cartão da parte 4 usa o mesmo limite. */
export const LIMITE_DE_DIAS_NA_ETAPA = 15

const MS_POR_DIA = 24 * 60 * 60 * 1000

// Em UTC, para o horário de verão não fazer um dia valer 23 ou 25 horas.
function emDias(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number)
  return Date.UTC(ano, mes - 1, dia) / MS_POR_DIA
}

/** Dias da etapa em andamento, do início até hoje (AAAA-MM-DD); null sem início; nunca negativo. */
export function diasNaEtapa(iniciadaEm: string | null, hoje: string): number | null {
  if (iniciadaEm === null) return null
  return Math.max(0, emDias(hoje) - emDias(iniciadaEm))
}

export function passouDoLimite(dias: number): boolean {
  return dias > LIMITE_DE_DIAS_NA_ETAPA
}

export function textoDosDias(dias: number): string {
  if (dias === 0) return 'hoje'
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`
}
```

E em `caminhoDeEtapas.ts`, acrescentar (no fim, e `OpcaoDeResponsavel`/`SinalDaEtapa` exportados):

```ts
/** "Concluído em": a data da última etapa obrigatória resolvida; null se nenhuma tem data. */
export function concluidoEm(etapas: EtapaDoCaminho[]): string | null {
  const datas = etapas.flatMap((etapa) => (etapa.obrigatoria && etapa.resolvidaEm ? [etapa.resolvidaEm] : []))
  return datas.sort().at(-1) ?? null
}

export type OpcaoDeResponsavel = { valor: string; rotulo: string; desabilitada?: boolean }

/**
 * O "Trocar": quem está na tela primeiro, com "(você)"; os demais; o responsável atual que já não está na lista
 * (desativado) e, por último, "Ninguém por enquanto" (valor ""). A lista chega sem o autor barrado da Revisão interna.
 */
export function opcoesDeResponsavel(etapa: EtapaDoProcesso, usuarios: UsuarioResponsavel[], usuarioId: string): OpcaoDeResponsavel[] {
  const eu = usuarios.filter((usuario) => usuario.id === usuarioId).map((usuario) => ({ valor: usuario.id, rotulo: `${usuario.nome} (você)` }))
  const outros = usuarios.filter((usuario) => usuario.id !== usuarioId).map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome }))
  return [...eu, ...outros, ...responsavelForaDaLista(etapa, usuarios), { valor: '', rotulo: 'Ninguém por enquanto' }]
}

function responsavelForaDaLista(etapa: EtapaDoProcesso, usuarios: UsuarioResponsavel[]): OpcaoDeResponsavel[] {
  const atual = etapa.responsavelId
  if (atual === null || usuarios.some((usuario) => usuario.id === atual)) return []
  const inativo = etapa.responsavelInativo
  return [{ valor: atual, rotulo: `${etapa.responsavelNome}${inativo ? ' (Inativo)' : ''}`, desabilitada: inativo }]
}

export type SinalDaEtapa = 'concluida' | 'atual' | 'pendente' | 'opcional' | 'dispensada' | 'anterior'

/** O nome acessível de cada sinal, ao lado do nome da etapa. */
export const ROTULO_DO_SINAL: Record<SinalDaEtapa, string> = {
  concluida: 'concluída', atual: 'atual', pendente: 'pendente', opcional: 'opcional, pendente', dispensada: 'dispensada',
  anterior: 'realizada anteriormente',
}

/** O sinal da linha da etapa (spec, "Etapas"): a atual vale mais que o status dela. */
export function sinalDaEtapa(etapas: EtapaDoCaminho[], indice: number): SinalDaEtapa {
  const etapa = etapas[indice]
  if (indice === indiceDaEtapaAtual(etapas)) return 'atual'
  if (etapa.status === 'concluida') return 'concluida'
  if (etapa.status === 'realizada_anteriormente') return 'anterior'
  if (etapa.status === 'dispensada') return 'dispensada'
  return etapa.obrigatoria ? 'pendente' : 'opcional'
}
```

- [x] **Passo 4: rodar e ver passar** o mesmo comando do passo 2. Depois `npm run lint` e `npm run typecheck`.

- [x] **Passo 5: commit** `Ticket 17 de processos-etapas: dias na etapa, Concluído em, opções do Trocar e sinal da etapa` (todo commit termina com a linha `Co-Authored-By` do ambiente).

---

### Tarefa 2: Subir o hook das ações e extrair as janelas (refatoração, testes verdes)

**Arquivos:** alterar `src/hooks/useAcoesDaEtapa.ts`, `src/components/processos/CaminhoDeEtapas.tsx`, `src/components/processos/CaminhoDoProcesso.tsx`; criar `src/components/processos/JanelasDaEtapa.tsx`.

**Produz:** `type AcoesDaEtapaEmUso = ReturnType<typeof useAcoesDaEtapa>` (exportado); `<JanelasDaEtapa acoes usuarios usuarioId ultimaVersao />`; o `CaminhoDeEtapas` passa a receber `acoes: AcoesDaEtapaEmUso` e deixa de montar o hook, as janelas e a falha. O comportamento na tela não muda (nenhum teste muda).

- [x] **Passo 1:** em `useAcoesDaEtapa.ts`, acrescentar no fim: `export type AcoesDaEtapaEmUso = ReturnType<typeof useAcoesDaEtapa>`.
- [x] **Passo 2:** criar `JanelasDaEtapa.tsx` movendo, sem mudar o texto, de `CaminhoDeEtapas.tsx`: as constantes `JANELA_DO_TEXTO`, `PERGUNTA_DA_PROXIMA`, `JANELA_DO_AVANCO`, o componente `JanelaDoAvancoDaEtapa` e o trecho `<JanelaComCampo …/>` + `{avanco && <JanelaDoAvancoDaEtapa …/>}`. O componente novo:

```tsx
type JanelasDaEtapaProps = {
  acoes: AcoesDaEtapaEmUso
  usuarios?: UsuarioResponsavel[]
  usuarioId: string
  ultimaVersao: UltimaVersao | null
}

/** As janelas das ações da etapa: a da nota (Dispensar e Realizada anteriormente sem pendente depois) e a de avanço. */
export function JanelasDaEtapa({ acoes, usuarios, usuarioId, ultimaVersao }: JanelasDaEtapaProps) {
  const { pedido, avanco, gravarComTexto, gravarComAvanco, fecharPedido, fecharAvanco } = acoes
  const janela = pedido ? JANELA_DO_TEXTO[pedido.acao] : null
  return (
    <>
      <JanelaComCampo aberta={pedido !== null} titulo={janela && pedido ? janela.titulo(pedido.etapa.nome) : ''}
        rotuloDoCampo={janela?.rotuloDoCampo ?? ''} rotuloDaAcao={janela?.rotuloDaAcao ?? ''}
        aoConfirmar={gravarComTexto} aoFechar={fecharPedido} />
      {avanco && (
        <JanelaDoAvancoDaEtapa avanco={avanco} usuarios={usuarios} usuarioId={usuarioId} ultimaVersao={ultimaVersao}
          aoConfirmar={gravarComAvanco} aoFechar={fecharAvanco} />
      )}
    </>
  )
}
```

- [x] **Passo 3:** em `CaminhoDeEtapas.tsx`, trocar as props `processos`, `aoMudar`, `aoSumir` usadas pelo hook por `acoes: AcoesDaEtapaEmUso` (mantém `processos` e `aoMudar` só para `corrigirDatas`); usar `acoes.agir` e `acoes.mudarResponsavel`; apagar a chamada ao hook, as janelas e o parágrafo `{falha && …}`.
- [x] **Passo 4:** em `CaminhoDoProcesso.tsx`, chamar `const acoes = useAcoesDaEtapa(processos, aoMudar, aoSumir)`, passar `acoes` ao `CaminhoDeEtapas`, e renderizar depois dele `{acoes.falha && <p className="cadastros-falha" role="alert">{acoes.falha}</p>}` e `<JanelasDaEtapa acoes={acoes} usuarios={usuarios} usuarioId={usuarioId} ultimaVersao={processo.ultimaVersao} />`.
- [x] **Passo 5:** `npm test`, `npm run lint`, `npm run typecheck` verdes, sem alterar nenhum teste.
- [x] **Passo 6: commit** `Ticket 17 de processos-etapas: o hook das ações da etapa sobe para o CaminhoDoProcesso`.

---

### Tarefa 3: O Agora no andamento (Iniciar, Concluir, "⋯", Assumir, Trocar, dias) e na Consulta

**Arquivos:** criar `src/testes/processoNoVerso.tsx`, `src/App.agoraDoVerso.test.tsx`, `AgoraDoProcesso.tsx`, `EtapaDoAgora.tsx`, `TrocaDoResponsavel.tsx`, `DiasNaEtapa.tsx`, `Agora.css`; alterar `src/testes/versoDoCartao.ts`, `CaminhoDoProcesso.tsx`, `VersoDoCartao.tsx`.

**Consome:** `AcoesDaEtapaEmUso`, `acoesDaEtapa`, `indiceDaEtapaAtual`, `proximaPendente`, `podeAssumir`, `usuariosParaAEtapa`, `opcoesDeResponsavel`, `diasNaEtapa`, `passouDoLimite`, `textoDosDias`, `hojeLocal` (de `src/processos/textoDaReuniao.ts`).
**Produz:** `<AgoraDoProcesso processo usuarios usuarioId podeAlterar acoes executar aoMudar />`, a região "Agora · etapa {n} de {total}"; `<TrocaDoResponsavel etapa opcoes aoEscolher />`.

Nesta tarefa o Agora entra **por cima** do caminho antigo, que continua inteiro (os botões do Agora têm nome completo — "Iniciar Modelagem piloto" — e os testes antigos buscam o nome curto, então nenhum teste antigo quebra).

- [x] **Passo 1: ajudantes de teste.** `src/testes/processoNoVerso.tsx`:

```tsx
import { render } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { hojeLocal } from '../processos/textoDaReuniao'
import type { EtapaDoProcesso, ProcessoLido, UsuarioResponsavel } from '../processos/tipos'
import { VersoesFalso } from '../versoes/VersoesFalso'

export const EU: UsuarioResponsavel = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }
export const BIA: UsuarioResponsavel = { id: 'u2', nome: 'Bia Teste' }

export function etapaDoProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

/** A data de AAAA-MM-DD de `dias` dias atrás, no relógio de quem usa. */
export function diasAtras(dias: number): string {
  const dia = new Date()
  dia.setDate(dia.getDate() - dias)
  return hojeLocal(dia)
}

export function processoLido(etapas: EtapaDoProcesso[], mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  const atual = etapas.find((etapa) => etapa.status === 'em_andamento' || etapa.status === 'pendente') ?? etapas[0]
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: atual.codigo, nome: atual.nome, ordem: atual.ordem },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo', contexto: null,
    observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao: null, etapasDoProcesso: etapas, ...mudancas,
  }
}

/** O aplicativo inteiro com o processo aberto no verso (endereço #/processos/p1). */
export function montarVerso(processo: ProcessoLido, perfil: Perfil = 'integrante_ep'): ProcessosFalso {
  window.location.hash = `#/processos/${processo.id}`
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = [processo]
  falso.usuariosPossiveis = [EU, BIA]
  falso.etapasDoCatalogo = processo.etapasDoProcesso.map((etapa) => ({
    id: `e${etapa.ordem}`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, ativa: true,
  }))
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} />)
  return falso
}
```

E em `src/testes/versoDoCartao.ts` acrescentar:

```ts
/** O cartão "Agora" do verso aberto. */
export const agoraDoVerso = async () => within(await (await versoAberto()).findByRole('region', { name: /^Agora/ }))
```

- [x] **Passo 2: testes que falham** em `src/App.agoraDoVerso.test.tsx` (cada `test` limpa o hash no `afterEach`, como os outros arquivos). Casos, com as asserções exatas:

```tsx
const MODELAGEM = 'Reunião de modelagem'
const RELATORIO = 'Relatório e modelagem técnica'
const PUBLICACAO = 'Publicação'

// Modelagem em andamento há 6 dias, Relatório e Publicação (opcional) pendentes.
const caminho = (mudancas = {}) => [
  etapaDoProcesso(4, 'modelagem', MODELAGEM, { status: 'em_andamento', iniciadaEm: diasAtras(6), ...mudancas }),
  etapaDoProcesso(5, 'relatorio', RELATORIO),
  etapaDoProcesso(9, 'publicacao', PUBLICACAO, { obrigatoria: false }),
]
```

1. **Pendente tem Iniciar** (critério 2): `caminho({ status: 'pendente', iniciadaEm: null })`; no Agora: `getByText('Agora · etapa 1 de 3')`, `getByRole('heading', { name: MODELAGEM })`; clicar `Iniciar Reunião de modelagem` → `await agora.findByRole('button', { name: 'Concluir Reunião de modelagem' })` e `falso.chamadas` igual a `[{ acao: 'iniciar', id: 'a4' }]`.
2. **Em andamento tem Concluir, que abre a janela de avanço** (critério 2): clicar `Concluir Reunião de modelagem`; `within(janelaPorCima()).getByRole('dialog'...)` — usar `screen.getByRole('dialog', { name: 'Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica' })`.
3. **A última etapa conclui direto, sem janela** (critério 2): etapas só com `Relatório` em andamento e a `Modelagem` concluída; clicar `Concluir Relatório e modelagem técnica`; `falso.chamadas` igual a `[{ acao: 'concluir', id: 'a5', usuarioId: null }]` (formato igual ao de `App.avancoDaEtapa.test.tsx:153`) e nenhuma janela por cima (`janelasPorCima()` vazio).
4. **"⋯" do Agora** (critério 3): botão `Mais ações da etapa` → itens `['Realizada anteriormente']` na obrigatória; na Publicação opcional pendente (Modelagem e Relatório concluídas) → `['Dispensar', 'Realizada anteriormente']`; escolher `Realizada anteriormente` abre a janela `Registrar Reunião de modelagem como realizada anteriormente e iniciar Relatório e modelagem técnica`; escolher `Dispensar` na Publicação abre `Dispensar a etapa Publicação?`.
5. **Sem responsável** (critério 4): `getByText('Sem responsável')` e botão `Assumir Reunião de modelagem`; clicar → `falso.chamadas` registra o responsável (ver como `App.assumirEAutor.test.tsx` confere) e o Agora passa a mostrar `Pessoa de Teste` (o nome de `EU`). Na Revisão interna com `ultimaVersao` do usuário da tela (`{ numero: 3, autorId: EU.id, autorNome: EU.nome }`): sem o botão Assumir.
6. **Trocar** (critério 5): clicar `Trocar` → `combobox` de nome `Responsável de Reunião de modelagem` com as opções, em ordem, `['Pessoa de Teste (você)', 'Bia Teste', 'Ninguém por enquanto']` (`within(select).getAllByRole('option')`); `fireEvent.change(select, { target: { value: 'u2' } })` grava e o Agora mostra `Bia Teste`; `Ninguém por enquanto` (valor `''`) devolve `Sem responsável`. Com `falso.falhaDeGravacao = 'sem conexão'`: aparece o alerta `A alteração não foi salva: sem conexão.` e o Agora continua com o responsável de antes.
7. **Dias** (critério 6): início `diasAtras(15)` → `getByText('há 15 dias')` e sem `/dias nesta etapa/`; `diasAtras(16)` → `getByText('16 dias nesta etapa')` e sem `há 16 dias`; início hoje → `hoje`.
8. **Consulta** (critério 9): `montarVerso(processo, 'consulta')`, com responsável `Ana Teste` na etapa atual: `agora.queryAllByRole('button')` vazio, sem `Trocar`, `getByText('Com Ana Teste há 6 dias')`; sem responsável: `Sem responsável`; a região tem a classe `agora-leitura`.

- [x] **Passo 3: rodar e ver falhar:** `npx vitest run src/App.agoraDoVerso.test.tsx` (falham porque a região "Agora" não existe).

- [x] **Passo 4: implementar.**
  - `DiasNaEtapa.tsx`: recebe `dias: number`; `passouDoLimite(dias)` → `<Pilula situacao="vencendo">{dias} dias nesta etapa</Pilula>`; senão `<span className="agora-dias">{textoDosDias(dias)}</span>`.
  - `TrocaDoResponsavel.tsx`: props `etapa: EtapaDoProcesso`, `opcoes: OpcaoDeResponsavel[]`, `aoEscolher: (usuarioId: string | null) => void`. Estado `trocando`. Fechado: `<button type="button" className="agora-trocar" aria-label={`Trocar o responsável de ${etapa.nome}`}>Trocar</button>` — o texto visível é "Trocar" (o nome acessível o contém, critério 2.5.3). Aberto: `<select aria-label={`Responsável de ${etapa.nome}`} value={etapa.responsavelId ?? ''} onChange={…} onKeyDown={Esc: preventDefault, stopPropagation e fecha}>` com `<option key value disabled>` das opções; foco no select ao abrir (`useEffect` + ref) e no botão ao fechar. `onChange` chama `aoEscolher(valor === '' ? null : valor)` e fecha; o `value` vem da etapa, então, se a gravação falhar, o select volta ao responsável de antes.
  - `EtapaDoAgora.tsx` (props: `etapas: EtapaDoProcesso[]`, `indice: number`, `podeAlterar: boolean`, `usuarios: UsuarioResponsavel[]`, `usuarioId`, `ultimaVersao`, `acoes: AcoesDaEtapaEmUso`): lê `etapa = etapas[indice]`, `dias = diasNaEtapa(etapa.iniciadaEm, hojeLocal())`. Mostra o rótulo `Agora · etapa {indice + 1} de {etapas.length}` (id para o `aria-labelledby` da seção), `<h3 className="agora-etapa">{etapa.nome}</h3>` e a linha do responsável: com nome, `<Avatar nome tamanho={24}/>` + nome (+ ` (Inativo)`), depois `<DiasNaEtapa/>` (só com `dias !== null`) e `<TrocaDoResponsavel/>` (só `podeAlterar`); sem nome, `Sem responsável` e, se `podeAlterar && podeAssumir(etapa, usuarioId, ultimaVersao)`, o botão secundário `Assumir` com `aria-label={`Assumir ${etapa.nome}`}`. Na Consulta (`!podeAlterar`) a linha vira só texto: `Com {nome} {textoDosDias(dias)}` numa string única quando até 15 dias (e, passando de 15, `Com {nome}` seguido da pílula), `Sem responsável` sem dono. Os botões vêm de `acoesDaEtapa(etapas, indice)`: o primeiro (`iniciar` ou `concluir`) é o principal, `botao botao-principal`, com `{Iniciar|Concluir} {etapa.nome}`, e chama `acoes.agir(acao, etapa, proximaPendente(etapas, indice))`; `dispensar` e `realizada` vão para `<MenuDeAcoes rotulo="Mais ações da etapa" grupos={[itens]} />` com os rótulos `Dispensar` e `Realizada anteriormente`. O responsável escolhido no Trocar passa por `usuariosParaAEtapa(etapa, usuarios, ultimaVersao)` antes de `opcoesDeResponsavel(etapa, …, usuarioId)`. Dividir em subcomponentes (`ResponsavelDoAgora`, `BotoesDoAgora`) no mesmo arquivo se a função passar de 20 linhas.
  - `AgoraDoProcesso.tsx`: `const indice = indiceDaEtapaAtual(processo.etapasDoProcesso)`; nesta tarefa só a variante `andamento` (a Tarefa 4 acrescenta as outras): `<section className={podeAlterar ? 'agora' : 'agora agora-leitura'} aria-labelledby={idDoRotulo}>` com `<EtapaDoAgora …/>`; sem etapa atual (`indice === -1`), nada.
  - `Agora.css`: `.agora { padding: var(--esp-4); border: var(--linha-acesa); border-radius: var(--canto); background: var(--folha); }`, `.agora-leitura { border: 2px solid var(--linha); }`; rótulo pequeno em `--texto-2`; nome em 600; linha do responsável em flex com `gap`; `.agora-trocar` como link (`background: none; border: 0; color: var(--azul); text-decoration: underline; min-height: 24px`); dias em `--texto-2`. Importar o CSS no `AgoraDoProcesso.tsx`.
  - `CaminhoDoProcesso.tsx`: renderizar `<AgoraDoProcesso …/>` antes do `<section className="painel-caminho">`, recebendo `executar` (nova prop) para a Tarefa 4; `VersoDoCartao.tsx` passa `executar` ao `CaminhoDoProcesso` (acrescentar `executar` a `CorpoProps` e ao `ColunasDoVerso`).
- [x] **Passo 5:** `npx vitest run src/App.agoraDoVerso.test.tsx` passa; `npm test`, `npm run lint`, `npm run typecheck` verdes.
- [x] **Passo 6: commit** `Ticket 17 de processos-etapas: o cartão Agora no andamento e na Consulta`.

---

### Tarefa 4: O Agora parado, concluído e a janela de Retomar

**Arquivos:** alterar `AgoraDoProcesso.tsx`, `Agora.css`, `src/App.agoraDoVerso.test.tsx`; criar `AgoraParado.tsx` se a função passar de 20 linhas.

**Consome:** `JanelaDeSituacao` (`pedido: 'retomar'`), `concluidoEm`, `executar` e `aoMudar` do `CaminhoDoProcesso`.

- [x] **Passo 1: testes que falham** (acrescentar a `App.agoraDoVerso.test.tsx`):
  1. **Suspenso** (critério 7): `processoLido(caminho(), { situacao: 'suspenso', motivoDaSituacao: 'Aguardando decisão' })` → na região Agora: `getByText('Suspenso: Aguardando decisão')`, botão `Retomar` (principal) e nenhum `Iniciar`/`Concluir`; a classe `agora-suspenso`. Clicar `Retomar` abre `Retomar o processo Emitir Ofício?`, com o botão `Retomar processo` desabilitado até haver motivo; confirmar com `Decisão tomada` grava (`falso.processos[0]` com `situacao: 'em_andamento'`) e o Agora volta a mostrar `Concluir Reunião de modelagem`.
  2. **Cancelado**: `Cancelado: Aguardando decisão`, classe `agora-cancelado`, botão `Retomar`.
  3. **O aviso antigo saiu** (critério 7): `queryByText(/Retome-o para registrar o andamento/)` é nulo.
  4. **Concluído** (critério 8): etapas obrigatórias concluídas (`resolvidaEm` `2026-10-10` e `2026-10-12`) e Publicação opcional pendente; `situacao: 'concluido'`; no Agora: `Concluído em 12/10/2026`, classe `agora-concluido` e, por causa da decisão 1, o botão `Iniciar Publicação` (a etapa atual aberta). Concluído sem etapa aberta (Publicação dispensada): só `Concluído em 12/10/2026`, nenhum botão.
  5. **Consulta parado e concluído**: sem botão `Retomar`, com o texto do motivo; concluído com a data.
  6. **Falha ao retomar** (`falso.falhaDeGravacao = 'sem conexão'`): alerta `A alteração não foi salva: sem conexão.` e o Agora continua suspenso.
- [x] **Passo 2: rodar e ver falhar.**
- [x] **Passo 3: implementar.** Em `AgoraDoProcesso.tsx`: `const variante = varianteDoAgora(processo.situacao)` (`'parado'` para suspenso e cancelado, `'concluido'`, `'andamento'`); classes `agora-suspenso`, `agora-cancelado`, `agora-concluido`. Parado: `<p className="agora-situacao">{`${ROTULO_DA_SITUACAO[processo.situacao]}: ${motivo}`}</p>` (sem motivo gravado, só o rótulo e um ponto final) e, `podeAlterar`, o botão principal `Retomar` que faz `setPedido('retomar')`; ao lado, `<JanelaDeSituacao processo processos pedido executar aoFechar={() => setPedido(null)} aoMudar />` (precisa de `processos`: acrescentar a prop). Concluído: `<p className="agora-situacao">Concluído em {formatarData(concluidoEm(etapas))}</p>` (sem a data, só `Concluído`) e, se `indice !== -1`, o `EtapaDoAgora` da decisão 1 logo abaixo. `Agora.css`: `.agora-suspenso { border-color: var(--vencendo-fundo); background: var(--pendencia-fundo); }`, `.agora-cancelado { border-color: var(--neutra-fundo); background: var(--neutra-fundo); }`, `.agora-concluido { border-color: var(--aprovado-fundo); background: var(--aprovado-fundo); }` (a borda azul de 2 px é só do andamento).
- [x] **Passo 4:** testes novos e `npm test` verdes. Os testes antigos de `App.situacaoDoProcesso.test.tsx` que falam do aviso antigo ainda passam porque o aviso do `CaminhoDoProcesso` segue lá; ele sai na Tarefa 6.
- [x] **Passo 5: commit** `Ticket 17 de processos-etapas: o Agora suspenso, cancelado e concluído, com Retomar`.

---

### Tarefa 5: As etapas em linhas compactas e a gaveta (componentes novos, ainda fora da tela)

**Arquivos:** criar `EtapasDoProcesso.tsx`, `DetalheDaEtapa.tsx`, `src/App.etapasDoVerso.test.tsx`; alterar `Etapas.css`, `CaminhoDoProcesso.tsx`.

**Consome:** `sinalDaEtapa`, `ROTULO_DO_SINAL`, `acoesDaEtapa`, `indiceDaEtapaAtual`, `podeAssumir`, `usuariosParaAEtapa`, `opcoesDeResponsavel`, `formatarData`, `iniciais`, `FormularioDeDatas`, `TrocaDoResponsavel`, `AcoesDaEtapaEmUso`.
**Produz:** `<EtapasDoProcesso etapas podeAlterar usuarios usuarioId ultimaVersao acoes aoCorrigirDatas aoSumir />`, a região "Etapas".

Nesta tarefa as Etapas novas entram **no lugar do caminho antigo** — e os testes antigos que dependem dele são migrados na mesma tarefa (passo 5), porque um commit não pode deixar testes quebrados. Por isso a Tarefa 5 é a maior; a ordem dentro dela evita retrabalho.

- [x] **Passo 1: testes que falham** em `src/App.etapasDoVerso.test.tsx` (ajudante novo em `versoDoCartao.ts`):

```ts
/** A gaveta da etapa, aberta pela linha dela (a linha tem o nome acessível "{nome}: {status}"). */
export async function gavetaDaEtapa(nome: string) {
  const etapas = within(await (await versoAberto()).findByRole('region', { name: 'Etapas' }))
  const linha = await etapas.findByRole('button', { name: new RegExp(`^${nome}:`) })
  if (linha.getAttribute('aria-expanded') !== 'true') fireEvent.click(linha)
  return within(linha.closest('li') as HTMLElement)
}
```

  Casos:
  1. **Nome acessível de cada status** (critério 10): caminho com `concluida`, `realizada_anteriormente`, `em_andamento`, pendente obrigatória, pendente opcional e `dispensada` → os botões da região Etapas têm os nomes `…: concluída`, `…: realizada anteriormente`, `…: atual`, `…: pendente`, `…: opcional, pendente`, `…: dispensada`. Os selos visíveis `opcional`, `dispensada` e `anterior` aparecem como texto; a data aparece (`desde {data}` na atual).
  2. **Uma gaveta por vez, pelo teclado:** `aria-expanded` falso nas linhas; `fireEvent.click` (ou `userEvent`/`keyDown` Enter e Space no botão, que é nativo) abre a primeira (`aria-expanded` verdadeiro, `aria-controls` aponta para o conteúdo); abrir a segunda fecha a primeira; clicar na aberta fecha.
  3. **Gaveta de uma resolvida anterior à atual:** datas (`Início: … · Conclusão: …`), `Nota: …`, `Responsável: Ana Teste`, botões `Corrigir datas` e `Voltar a esta etapa`; `Voltar a esta etapa` abre a janela `Voltar à etapa X?`; `Corrigir datas` abre o formulário (`Início da etapa X`).
  4. **Gaveta da atual:** só datas e nota (sem `Trocar`, sem `Assumir`, sem `Voltar a esta etapa`), com `Corrigir datas` na em andamento (decisão 2).
  5. **Gaveta de pendente depois da atual:** `Trocar` e, sem responsável, `Assumir {etapa}`; escolher alguém no select grava.
  6. **Só leitura em suspenso e cancelado e para a Consulta:** nenhuma das gavetas tem botão, mas mostram datas, nota e responsável.
- [x] **Passo 2: rodar e ver falhar.**
- [x] **Passo 3: implementar.**
  - `EtapasDoProcesso.tsx`: `<section aria-labelledby={idDoTitulo} className="etapas"><h3 id className="painel-subtitulo">Etapas</h3><ol className="etapas-lista">…</ol></section>`; estado `aberta: string | null` (id da etapa); cada `<li className={`etapa-linha etapa-${sinal}`} aria-current={atual ? 'step' : undefined}>` com `<button type="button" className="etapa-cabeca" aria-expanded aria-controls={idDaGaveta} aria-label={`${nome}: ${ROTULO_DO_SINAL[sinal]}`}>` que contém: `<span className="etapa-sinal" aria-hidden="true" />` (✓ verde na concluída, ✓ cinza na anterior, ponto azul na atual, círculo cinza na pendente, círculo tracejado na opcional, traço na dispensada — tudo por CSS), o nome, o selo (`opcional` na opcional pendente, `dispensada`, `anterior`), `<span className="etapa-quando">` (`desde {formatarData(iniciadaEm)}` na atual; `formatarData(resolvidaEm)` nas resolvidas; vazio nas pendentes) e as iniciais do responsável (`iniciais(responsavelNome)`, `aria-hidden`). Abaixo, `{aberta === etapa.id && <DetalheDaEtapa id={idDaGaveta} … />}`. Dividir em `LinhaCompactaDaEtapa` no mesmo arquivo.
  - `DetalheDaEtapa.tsx`: `<div id className="etapa-gaveta">` com `<p className="etapa-datas">Início: … · Conclusão: …</p>` (`formatarData`), `{nota && <p className="etapa-nota">Nota: {nota}</p>}`; responsável: nas pendentes depois da atual e `podeEditar`, `Responsável: ` + `<TrocaDoResponsavel/>` (e `Assumir {etapa}` sem responsável, se `podeAssumir`); nas demais não atuais, `Responsável: {nome ?? '—'}`; na atual, nada. `podeEditar` com `[Corrigir datas]` (abre o `FormularioDeDatas`, como no `EdicaoDaEtapa` antigo, salvando por `aoCorrigirDatas(etapa, datas)`) quando `etapa.status !== 'pendente'`, e `[Voltar a esta etapa]` quando `acoesDaEtapa(etapas, indice).includes('voltar')` (chama `acoes.agir('voltar', etapa, null)`).
  - `Etapas.css`: apagar `.caminho-de-etapas`, `.etapa`, `.etapa[aria-current]`, `.etapa-acoes`, `.etapa-edicao` e o que sobrar sem uso; escrever `.etapas-lista`, `.etapa-linha`, `.etapa-cabeca` (botão de largura total, `display: flex`, `min-height: 36px`, sem borda, fundo transparente, cursor de mão, foco visível herdado), `.etapa-sinal` e suas variantes, `.etapa-selo` (pílula neutra pequena), `.etapa-quando` (mono, `--texto-2`), `.etapa-iniciais`, `.etapa-atual .etapa-cabeca { background: var(--azul-claro); font-weight: 600 }`, `.etapa-dispensada .etapa-nome { text-decoration: line-through; opacity… }` — sem opacidade (contraste): `color: var(--texto-2)`; `.etapa-gaveta` com recuo de 28 px e a mesma largura da linha. Manter `.etapa-datas-form` e `.etapa-campo-de-data`.
  - `CaminhoDoProcesso.tsx`: trocar o `CaminhoDeEtapas` por `<EtapasDoProcesso …/>` e apagar o `avisoDoProcessoParado`, o parágrafo `painel-aviso` e o título "Etapas do processo". `aoCorrigirDatas = async (etapa, datas) => { await processos.corrigirDatasDaEtapa(etapa.id, datas); aoMudar() }`. As gavetas são editáveis com `podeAlterar && !parado`.
- [x] **Passo 4: apagar** `CaminhoDeEtapas.tsx`, `LinhaDaEtapa.tsx`, `EdicaoDaEtapa.tsx`, `SeletorDeResponsavel.tsx`; remover `ROTULO_DO_STATUS` de `caminhoDeEtapas.ts` se `grep` mostrar que ninguém mais o usa (e o teste dele); remover `.painel-aviso` e as regras `.etapa-concluida …::before` e `.etapa-responsavel` do `Painel.css` se ninguém mais as usar.
- [x] **Passo 5: migrar os testes antigos** aos dois lugares novos. Regras (valem para os sete arquivos da tabela do mapa):
  - ação da **etapa atual** (`Iniciar`, `Concluir`, `Dispensar`, `Realizada anteriormente`, `Assumir`, "Responsável de …") → o Agora: `(await agoraDoVerso())` e o botão com o nome novo (`Concluir {etapa}`, `Iniciar {etapa}`; `Dispensar` e `Realizada anteriormente` no `menuitem` de `Mais ações da etapa`; o seletor só aparece depois de clicar `Trocar`);
  - ação de **outra etapa** (`Voltar a esta etapa`, `Corrigir datas`, `Assumir` e o seletor das pendentes) → `(await gavetaDaEtapa(nome))`;
  - "região Caminho de etapas" → `Etapas`; `Nota: …`, `Início: … · Conclusão: …` e `Responsável: …` passam a ser lidos na gaveta aberta; os selos `Pendente`/`Concluída`/`Em andamento` (pílulas antigas) viram o nome acessível do botão da linha;
  - o aviso `Este processo está suspenso/cancelado…` é substituído por `Suspenso: {motivo}` / `Cancelado: {motivo}` no Agora (`App.situacaoDoProcesso.test.tsx`);
  - `App.versoDoCartao.test.tsx:239-270` (as duas colunas, a lista de botões do caminho e a leitura da Consulta) reescritos sobre a região Etapas e o Agora;
  - `App.catalogoNosProcessos.test.tsx:63-81` lê os nomes das etapas pela região `Etapas`.
  Os comportamentos continuam os mesmos; o que muda é onde cada coisa é achada. Rodar arquivo por arquivo (`npx vitest run src/App.<arquivo>.test.tsx`) até ficar verde, e só então a bateria inteira.
- [x] **Passo 6:** `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:circular` verdes.
- [x] **Passo 7: commit** `Ticket 17 de processos-etapas: etapas em linhas compactas com a gaveta; testes ajustados ao Agora e à gaveta`.

---

### Tarefa 6: Teclado, foco e leitor de tela

**Arquivos:** alterar `TrocaDoResponsavel.tsx`, `EtapasDoProcesso.tsx`, `src/App.agoraDoVerso.test.tsx`, `src/App.etapasDoVerso.test.tsx`.

- [x] **Passo 1: testes que falham** (critérios 5 e 10): (a) o "Trocar" aberto pelo teclado (`Enter` no botão) põe o foco no select; `Esc` no select fecha só o select, devolve o foco ao botão `Trocar…` e o verso continua aberto (`versoAberto()` ainda existe); (b) escolher no select devolve o foco ao botão `Trocar…`; (c) `Enter` e `Space` na linha abrem a gaveta e `Esc` **não** fecha a gaveta nem o verso por engano — o `Esc` na gaveta fecha o verso (comportamento da janela), então a gaveta se fecha clicando de novo na linha; documentar isso no teste; (d) o foco volta à linha ao fechar a gaveta pelo botão da linha (continua nela); (e) a gaveta aberta tem `aria-controls`/`id` coerentes e a região do Agora tem o nome `Agora · etapa 1 de 3`.
- [x] **Passo 2: rodar, ver falhar o que faltar e ajustar** o foco em `TrocaDoResponsavel` (ref no botão, `useEffect` que foca o select ao abrir e o botão ao fechar) e o que mais o teste mostrar.
- [x] **Passo 3:** `npm test`, `npm run lint`, `npm run typecheck` verdes.
- [x] **Passo 4: commit** `Ticket 17 de processos-etapas: teclado e foco no Trocar e na gaveta`.

---

### Tarefa 7: Conferir a tela no navegador (critérios `[visual]`)

**Arquivos:** alterar `Agora.css` e `Etapas.css` conforme o que a tela mostrar.

- [x] **Passo 1:** subir a vitrine local (`vitrine.local/`, fora do git, módulos falsos) numa porta própria com o `preview_start`/`npx vite --port 5179` (conferir o `main.tsx` dela; se ela abre um processo só, montar nela os quatro casos: andamento com responsável, andamento sem responsável com mais de 15 dias, suspenso e concluído, mais a Consulta). Se a vitrine quebrar por causa das mudanças de módulo, ajustá-la (ela é local, não entra no commit).
- [x] **Passo 2:** conferir **pelo DOM** (as fotos de tela do navegador do app saem atrasadas — lição do ticket 16) e depois por foto: (1) o Agora é a única coisa acesa: borda de 2 px em azul e o único botão principal; (2) na Consulta, borda cinza e sem botões; (3) suspenso em âmbar claro, cancelado em cinza claro, concluído em verde claro; (4) as etapas são linhas quietas: só o verde da concluída e o azul da atual têm cor, o resto é cinza, com selos neutros; (5) a gaveta abre sem empurrar a janela para fora da tela (conferir com a janela de 880 px e com 375 px de largura: sem rolagem horizontal, o Agora e as linhas quebram bem, o select do Trocar cabe); (6) contraste: o texto cinza `--texto-2` sobre `--folha`, `--azul-claro`, `--pendencia-fundo` e `--aprovado-fundo` passa de 4,5:1.
- [x] **Passo 3:** ajustar o CSS, repetir o passo 2 até ficar bom; encerrar o Vite da vitrine.
- [x] **Passo 4:** `npm test`, `npm run lint`, `npm run typecheck`.
- [x] **Passo 5: commit** `Ticket 17 de processos-etapas: acabamento visual do Agora e das etapas`.

---

### Tarefa 8: Fecho

**Arquivos:** alterar `.scratch/processos-etapas/desvios.md`, `.scratch/melhorias-protocolo.md`, `.scratch/backlog.md` (se algo novo surgir), este plano.

- [x] **Passo 1:** registrar no `desvios.md` (entrada nova, datada, sem editar as antigas) as seis decisões deste plano e o que a conferência da tela mostrou, separando **visto** de **presumido**.
- [x] **Passo 2:** registrar em `.scratch/melhorias-protocolo.md` as ocorrências desta execução e os itens de `.claude/regras/nao-testados.md` que aconteceram (bloco do `/executar-complexo` e "Qualquer momento"), sem concluir se funcionaram; incluir o aviso do claude-mem sem cota.
- [x] **Passo 3:** `npm run test:coverage` (cobertura acima de 70%), `npm run check:circular`, `npm run build` (tipos e empacotamento).
- [x] **Passo 4:** marcar as caixas do plano e dos critérios do ticket que a execução provou (os critérios `[visual]` só com o que foi visto na tela).
- [x] **Passo 5: commit** `Ticket 17 de processos-etapas: desvios e conferência da tela`.
- [x] **Passo 6:** juntar a branch à `main` (`superpowers:finishing-a-development-branch`, opção de merge; `git switch main`), apagar a branch com `git branch -d processos-etapas-17`, gravar `Concluído em AAAA-MM-DD (commit <hash>)` no fim do ticket 17, comitar e enviar a `main` (e o marco) ao GitHub, conferindo o "Testes de banco" só se algo de `supabase/` mudou (não deve ter mudado).

## Cobertura dos critérios do ticket

| Critério | Onde |
|-|-|
| 1. Funções puras com testes | Tarefa 1 |
| 2. Pendente, em andamento, última etapa | Tarefa 3, casos 1 a 3 |
| 3. "⋯" do Agora | Tarefa 3, caso 4 |
| 4. Sem responsável e [Assumir] | Tarefa 3, caso 5 |
| 5. "Trocar" | Tarefa 3, caso 6; Tarefa 6 |
| 6. Dias e pílula | Tarefa 3, caso 7 |
| 7. Suspenso e cancelado, aviso antigo sai | Tarefa 4, casos 1 a 3 e 6 |
| 8. Concluído | Tarefa 4, casos 4 e 5 |
| 9. Consulta | Tarefa 3, caso 8; Tarefa 4, caso 5 |
| 10. Etapas, gaveta, teclado | Tarefas 5 e 6 |
| 11. Testes com o aplicativo inteiro | Tarefas 3 a 6 |
| 12–13. `[visual]` | Tarefa 7 |
