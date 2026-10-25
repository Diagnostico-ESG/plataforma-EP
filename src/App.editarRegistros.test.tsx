import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Aprovacao, RevisaoInterna } from './revisoes/tipos'
import { escolherNoMenuDoProcesso, gavetaDaEtapa, versoAberto } from './testes/versoDoCartao'
import { APROVACAO, montar, versao, type Falsos } from './testes/aprovacaoNoVerso'
import { BIA } from './testes/processoNoVerso'

// Editar as revisões e a aprovação na gaveta da etapa (ticket 04 de revisoes-aprovacao, histórias 21 a 23 e 31): o [Editar]
// de cada registro, a janela com o preenchido, as recusas, quem vê o botão e o histórico com o antes e o depois.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const REVISAO_INTERNA = 'Revisão interna'
const REVISAO: RevisaoInterna = {
  id: 'r1', versaoRevisada: 7, versaoCorrigida: 8, resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei o fluxo',
  revisor: BIA.nome, revisadaEm: '2026-10-13',
}
const SEM_ALTERACAO: RevisaoInterna = { ...REVISAO, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null }
const APROVADA: Aprovacao = {
  id: 'ap1', versao: 8, numeroEprotocolo: 'PROT-2026-0001', link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-09',
  registradaPor: BIA.nome, registradaEm: '2026-10-12T15:00:00Z',
}

const comRevisao = (revisao: RevisaoInterna) => ({ revisoes }: Falsos) => { revisoes.revisoes.p1 = [revisao] }
const aprovadaCom = (mudancas: Partial<Aprovacao>) => ({ revisoes }: Falsos) => { revisoes.aprovacoes.p1 = { ...APROVADA, ...mudancas } }
const CONCLUIDO = { etapa: 'concluidos', mudancas: { situacao: 'concluido' as const, etiqueta: 'concluido' as const } }

async function abrirAEdicao(etapa: string, titulo: string) {
  const gaveta = await gavetaDaEtapa(etapa)
  fireEvent.click(await gaveta.findByRole('button', { name: titulo }))
  return { gaveta, janela: within(await screen.findByRole('dialog', { name: titulo })) }
}

const salvar = (janela: ReturnType<typeof within>) => fireEvent.click(janela.getByRole('button', { name: 'Salvar' }))
const campo = (janela: ReturnType<typeof within>, nome: RegExp) => janela.getByLabelText(nome) as HTMLInputElement

// ---- Revisão interna

test('editar a revisão corrigida troca o escopo e o comentário na gaveta e fecha a janela', async () => {
  montar(versao(), { ajustar: comRevisao(REVISAO) })
  const { gaveta, janela } = await abrirAEdicao(REVISAO_INTERNA, 'Editar a revisão da V7')
  expect((janela.getByRole('radio', { name: 'Fluxograma e relatório' }) as HTMLInputElement).checked).toBe(true)
  expect(campo(janela, /Comentário/).value).toBe('Ajustei o fluxo')
  fireEvent.click(janela.getByRole('radio', { name: 'Relatório' }))
  fireEvent.change(campo(janela, /Comentário/), { target: { value: 'Só o relatório' } })
  salvar(janela)
  expect(await gaveta.findByText(/Corrigida, gerou a V8 · Relatório$/)).toBeTruthy()
  expect(gaveta.getByText('Só o relatório')).toBeTruthy()
  expect(screen.queryByRole('dialog', { name: 'Editar a revisão da V7' })).toBeNull()
})

test('a revisão sem alteração só edita o comentário: não há escopo', async () => {
  const { revisoes } = montar(versao(), { ajustar: comRevisao(SEM_ALTERACAO) })
  const { janela } = await abrirAEdicao(REVISAO_INTERNA, 'Editar a revisão da V7')
  expect(janela.queryByRole('radio')).toBeNull()
  fireEvent.change(campo(janela, /Comentário/), { target: { value: 'Conferi' } })
  salvar(janela)
  await waitFor(() => expect(revisoes.revisoes.p1[0].comentario).toBe('Conferi'))
  expect(revisoes.revisoes.p1[0].escopo).toBeNull()
})

test('a recusa ao gravar a revisão aparece em vermelho, sem perder o preenchido, e a falha também', async () => {
  const { revisoes } = montar(versao(), { ajustar: comRevisao(REVISAO) })
  const { janela } = await abrirAEdicao(REVISAO_INTERNA, 'Editar a revisão da V7')
  fireEvent.change(campo(janela, /Comentário/), { target: { value: 'Novo texto' } })
  revisoes.falhaNaGravacao = new TravaDoBanco('Este processo está suspenso; retome-o para mudar a etapa, a etiqueta ou o responsável.')
  salvar(janela)
  expect((await janela.findByRole('alert')).textContent).toBe('Este processo está suspenso; retome-o para mudar a etapa, a etiqueta ou o responsável.')
  expect(campo(janela, /Comentário/).value).toBe('Novo texto')
  revisoes.falhaNaGravacao = 'sem conexão'
  salvar(janela)
  await waitFor(() => expect(janela.getByRole('alert').textContent).toBe('A alteração não foi salva: sem conexão.'))
  expect(revisoes.revisoes.p1[0].comentario).toBe('Ajustei o fluxo')
})

test('enquanto a revisão grava, o botão mostra "Salvando…"', async () => {
  const { revisoes } = montar(versao(), { ajustar: comRevisao(REVISAO) })
  const { janela } = await abrirAEdicao(REVISAO_INTERNA, 'Editar a revisão da V7')
  revisoes.segurarGravacao = true
  salvar(janela)
  expect(((await janela.findByRole('button', { name: 'Salvando…' })) as HTMLButtonElement).disabled).toBe(true)
})

// ---- Aprovação

test('acrescentar o número a uma aprovação concluída sem ele aparece na gaveta', async () => {
  montar(versao(), { ...CONCLUIDO, ajustar: aprovadaCom({ numeroEprotocolo: null, link: null }) })
  const { gaveta, janela } = await abrirAEdicao(APROVACAO, 'Editar a aprovação da V8')
  expect(gaveta.getByText('Sem número do E-protocolo')).toBeTruthy()
  expect(campo(janela, /Número do E-protocolo/).value).toBe('')
  fireEvent.change(campo(janela, /Número do E-protocolo/), { target: { value: 'PROT-9' } })
  salvar(janela)
  expect(await gaveta.findByText('PROT-9')).toBeTruthy()
  expect(gaveta.queryByText('Sem número do E-protocolo')).toBeNull()
})

test('editar o link troca o endereço do número, que segue abrindo em aba nova', async () => {
  montar(versao(), { ajustar: aprovadaCom({}) })
  const { gaveta, janela } = await abrirAEdicao(APROVACAO, 'Editar a aprovação da V8')
  expect(campo(janela, /Data da aprovação/).value).toBe('2026-10-09')
  fireEvent.change(campo(janela, /Link/), { target: { value: 'https://eprotocolo.example/b' } })
  salvar(janela)
  await waitFor(() => expect((gaveta.getByRole('link', { name: /^PROT-2026-0001/ }) as HTMLAnchorElement).href).toBe('https://eprotocolo.example/b'))
})

test.each([
  ['Link', 'ftp://x.example/a', 'O link do E-protocolo precisa começar com http:// ou https://.'],
  ['Data da aprovação', '2026-10-14', 'A data 14/10/2026 está no futuro.'],
])('a aprovação recusa %s inválido, em vermelho, sem perder o preenchido', async (rotulo, valor, frase) => {
  const { revisoes } = montar(versao(), { ajustar: aprovadaCom({}) })
  const { janela } = await abrirAEdicao(APROVACAO, 'Editar a aprovação da V8')
  fireEvent.change(campo(janela, new RegExp(rotulo)), { target: { value: valor } })
  fireEvent.change(campo(janela, /Número do E-protocolo/), { target: { value: 'PROT-9' } })
  salvar(janela)
  expect((await janela.findByRole('alert')).textContent).toBe(frase)
  expect(campo(janela, new RegExp(rotulo)).value).toBe(valor)
  expect(campo(janela, /Número do E-protocolo/).value).toBe('PROT-9')
  expect(revisoes.aprovacoes.p1.numeroEprotocolo).toBe('PROT-2026-0001')
})

test('a aprovação desfeita antes de salvar mostra que o registro não existe mais, e o processo segue aberto', async () => {
  const { revisoes } = montar(versao(), { ajustar: aprovadaCom({}) })
  const { janela } = await abrirAEdicao(APROVACAO, 'Editar a aprovação da V8')
  delete revisoes.aprovacoes.p1
  salvar(janela)
  expect((await janela.findByRole('alert')).textContent).toBe('Este registro não existe mais. Feche a janela e confira a gaveta da etapa.')
  expect(await versoAberto()).toBeTruthy()
})

// ---- Quem vê o botão

test.each([
  ['Administrador', { perfil: 'administrador' as const }, true],
  ['Integrante com o processo concluído', CONCLUIDO, true],
  ['Consulta', { perfil: 'consulta' as const }, false],
  ['processo suspenso', { mudancas: { situacao: 'suspenso' as const } }, false],
  ['processo cancelado', { mudancas: { situacao: 'cancelado' as const } }, false],
])('%s: o [Editar] da revisão e o da aprovação aparecem: %s', async (_quem, opcoes, aparece) => {
  montar(versao(), {
    ...opcoes,
    ajustar: (falsos) => { comRevisao(REVISAO)(falsos); aprovadaCom({})(falsos) },
  })
  // Uma gaveta abre de cada vez: a segunda fecha a primeira.
  const revisao = await gavetaDaEtapa(REVISAO_INTERNA)
  await revisao.findByText(/^V7 · /)
  expect(revisao.queryAllByRole('button', { name: /^Editar a revisão/ }).length).toBe(aparece ? 1 : 0)
  const aprovacao = await gavetaDaEtapa(APROVACAO)
  await aprovacao.findByText('V8 aprovada')
  expect(aprovacao.queryAllByRole('button', { name: /^Editar a aprovação/ }).length).toBe(aparece ? 1 : 0)
})

test('sem aprovação registrada não há [Editar]; o subprocesso edita igual', async () => {
  montar(versao())
  const vazia = await gavetaDaEtapa(APROVACAO)
  await vazia.findByText('Sem aprovação registrada.')
  expect(vazia.queryByRole('button', { name: /^Editar/ })).toBeNull()
  cleanup()
  montar(versao(), { mudancas: { tipo: 'subprocesso' }, ajustar: aprovadaCom({}) })
  const { gaveta, janela } = await abrirAEdicao(APROVACAO, 'Editar a aprovação da V8')
  fireEvent.change(campo(janela, /Número do E-protocolo/), { target: { value: 'PROT-SUB' } })
  salvar(janela)
  expect(await gaveta.findByText('PROT-SUB')).toBeTruthy()
})

// ---- Histórico

test('as edições aparecem no histórico do processo com o antes e o depois', async () => {
  montar(versao(), { ajustar: (falsos) => { comRevisao(REVISAO)(falsos); aprovadaCom({ numeroEprotocolo: null, aprovadaEm: '2026-10-13' })(falsos) } })
  const revisao = await abrirAEdicao(REVISAO_INTERNA, 'Editar a revisão da V7')
  fireEvent.click(revisao.janela.getByRole('radio', { name: 'Relatório' }))
  salvar(revisao.janela)
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar a revisão da V7' })).toBeNull())
  const aprovacao = await abrirAEdicao(APROVACAO, 'Editar a aprovação da V8')
  fireEvent.change(campo(aprovacao.janela, /Número do E-protocolo/), { target: { value: 'PROT-9' } })
  salvar(aprovacao.janela)
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar a aprovação da V8' })).toBeNull())
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  expect(await verso.findByText('Editou a revisão')).toBeTruthy()
  expect(verso.getByText(/Escopo: Fluxograma e relatório/)).toBeTruthy()
  expect(verso.getByText(/Escopo: Relatório/)).toBeTruthy()
  expect(verso.getByText('Editou a aprovação')).toBeTruthy()
  expect(verso.getByText(/Número do E-protocolo: —/)).toBeTruthy()
  expect(verso.getByText(/Número do E-protocolo: PROT-9/)).toBeTruthy()
})
