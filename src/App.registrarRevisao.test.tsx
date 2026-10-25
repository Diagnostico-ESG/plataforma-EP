import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { UltimaVersao } from './processos/tipos'
import { agoraDoVerso, escolherNoMenuDoProcesso, gavetaDaEtapa, versoAberto } from './testes/versoDoCartao'
import { montar, type Falsos } from './testes/aprovacaoNoVerso'
import { BIA, EU } from './testes/processoNoVerso'

// Registrar a revisão interna sem trava (ticket 05 de revisoes-aprovacao, histórias 32 a 39, 43 a 45, 47 e 48): o botão do
// Agora só na Revisão interna, os dois resultados com a versão de cada um, "Corrigida" desabilitada sem versão da passagem,
// o aviso do autor, o [Editar revisão], a recusa, a Consulta sem botões e o histórico. Registrar não move o processo.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const REVISAO_INTERNA = 'revisao_interna'
const PASSAGEM_COM_VERSAO = (mudancas: Partial<UltimaVersao> = {}): UltimaVersao => ({
  numero: 8, autorId: EU.id, autorNome: EU.nome, papeis: ['bpm', 'png'], anterior: { numero: 7, autorId: BIA.id },
  enviadaNestaPassagem: true, ...mudancas,
})
// A V8 de outra pessoa, enviada antes de o processo entrar na Revisão interna: "corrigida" não vale.
const SEM_VERSAO_NA_PASSAGEM = PASSAGEM_COM_VERSAO({ autorId: BIA.id, autorNome: BIA.nome, enviadaNestaPassagem: false })

const abrir = (ultima: UltimaVersao | null, ajustar?: (falsos: Falsos) => void, perfil: 'integrante_ep' | 'consulta' = 'integrante_ep') =>
  montar(ultima, { etapa: REVISAO_INTERNA, perfil, ajustar })

async function abrirARegistro() {
  const agora = await agoraDoVerso()
  fireEvent.click(await agora.findByRole('button', { name: 'Registrar revisão' }))
  return within(await screen.findByRole('dialog', { name: 'Registrar revisão' }))
}

const registrar = (janela: ReturnType<typeof within>) => fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))

test('o botão aparece só na Revisão interna (e a Aprovação tem o dela)', async () => {
  abrir(SEM_VERSAO_NA_PASSAGEM)
  const agora = await agoraDoVerso()
  expect(await agora.findByRole('button', { name: 'Registrar revisão' })).toBeTruthy()
  expect(agora.queryByRole('button', { name: 'Registrar aprovação' })).toBeNull()
})

test('em outra etapa não há botão de revisão', async () => {
  montar(SEM_VERSAO_NA_PASSAGEM, { etapa: 'revisao_setor' })
  const agora = await agoraDoVerso()
  await waitFor(() => expect(agora.getByLabelText('Etapa')).toBeTruthy())
  expect(agora.queryByRole('button', { name: /Registrar/ })).toBeNull()
})

test('a janela mostra a versão de cada resultado, e "Registrar" só habilita com o resultado escolhido', async () => {
  abrir(PASSAGEM_COM_VERSAO({ autorId: BIA.id, autorNome: BIA.nome }))
  const janela = await abrirARegistro()
  expect(janela.getByRole('radio', { name: 'Sem alteração: vale para a V8' })).toBeTruthy()
  expect(janela.getByRole('radio', { name: 'Corrigida: a V8 corrige a V7' })).toBeTruthy()
  expect((janela.getByRole('button', { name: 'Registrar' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(janela.getByRole('radio', { name: 'Sem alteração: vale para a V8' }))
  expect((janela.getByRole('button', { name: 'Registrar' }) as HTMLButtonElement).disabled).toBe(false)
})

test('"sem alteração" registra na versão mais recente, mostra o resumo e o [Editar revisão], e não move o processo', async () => {
  const { revisoes } = abrir(PASSAGEM_COM_VERSAO({ autorId: BIA.id, autorNome: BIA.nome }))
  const janela = await abrirARegistro()
  fireEvent.click(janela.getByRole('radio', { name: 'Sem alteração: vale para a V8' }))
  fireEvent.change(janela.getByLabelText(/Comentário/), { target: { value: '  Conferi  ' } })
  registrar(janela)
  const agora = await agoraDoVerso()
  expect(await agora.findByText(`Sem alteração · V8 · ${EU.nome}`)).toBeTruthy()
  expect(agora.queryByRole('button', { name: 'Registrar revisão' })).toBeNull()
  expect(agora.getByRole('button', { name: 'Editar revisão' })).toBeTruthy()
  expect(screen.queryByRole('dialog', { name: 'Registrar revisão' })).toBeNull()
  expect(revisoes.revisoes.p1[0]).toMatchObject({ resultado: 'sem_alteracao', versaoRevisada: 8, comentario: 'Conferi' })
  expect(((agora.getByLabelText('Etapa') as HTMLSelectElement).selectedOptions[0]).textContent).toBe('Revisão interna')
  const gaveta = await gavetaDaEtapa('Revisão interna')
  expect(await gaveta.findByText('Sem alteração')).toBeTruthy()
})

test('"Corrigida" liga a versão enviada na passagem à anterior e pede o escopo', async () => {
  abrir(PASSAGEM_COM_VERSAO({ autorId: BIA.id, autorNome: BIA.nome }))
  const janela = await abrirARegistro()
  expect(janela.queryByText('Escopo da correção')).toBeNull()
  fireEvent.click(janela.getByRole('radio', { name: 'Corrigida: a V8 corrige a V7' }))
  expect((janela.getByRole('button', { name: 'Registrar' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(janela.getByRole('radio', { name: 'Fluxograma' }))
  registrar(janela)
  expect(await (await agoraDoVerso()).findByText('Corrigida · V8 corrige a V7 · fluxograma')).toBeTruthy()
})

test('"Corrigida" fica desabilitada, com o motivo, sem versão enviada na passagem', async () => {
  abrir(SEM_VERSAO_NA_PASSAGEM)
  const janela = await abrirARegistro()
  const corrigida = janela.getByRole('radio', { name: /^Corrigida/ }) as HTMLInputElement
  expect(corrigida.disabled).toBe(true)
  expect(janela.getByText('Nenhuma versão foi enviada desde que o processo entrou na Revisão interna.')).toBeTruthy()
  expect((janela.getByRole('radio', { name: 'Sem alteração: vale para a V8' }) as HTMLInputElement).disabled).toBe(false)
})

test('quem enviou a versão revisada recebe o aviso amarelo e consegue registrar mesmo assim', async () => {
  const { revisoes } = abrir(PASSAGEM_COM_VERSAO())
  const janela = await abrirARegistro()
  expect(janela.queryByRole('status')).toBeNull()
  fireEvent.click(janela.getByRole('radio', { name: 'Sem alteração: vale para a V8' }))
  expect(janela.getByRole('status').textContent).toBe('Você enviou a V8. A revisão interna deveria ser de outra pessoa.')
  registrar(janela)
  await waitFor(() => expect(revisoes.revisoes.p1).toHaveLength(1))
})

test('na "corrigida" o aviso é pela versão revisada (a anterior), não pela corrigida que o revisor enviou', async () => {
  abrir(PASSAGEM_COM_VERSAO({ anterior: { numero: 7, autorId: EU.id } }))
  const janela = await abrirARegistro()
  fireEvent.click(janela.getByRole('radio', { name: 'Corrigida: a V8 corrige a V7' }))
  expect(janela.getByRole('status').textContent).toBe('Você enviou a V7. A revisão interna deveria ser de outra pessoa.')
})

test('[Editar revisão] troca o resultado, o escopo e o comentário, e o resumo muda', async () => {
  abrir(PASSAGEM_COM_VERSAO({ autorId: BIA.id, autorNome: BIA.nome }))
  let janela = await abrirARegistro()
  fireEvent.click(janela.getByRole('radio', { name: 'Sem alteração: vale para a V8' }))
  registrar(janela)
  const agora = await agoraDoVerso()
  fireEvent.click(await agora.findByRole('button', { name: 'Editar revisão' }))
  janela = within(await screen.findByRole('dialog', { name: 'Editar a revisão da V8' }))
  fireEvent.click(janela.getByRole('radio', { name: 'Corrigida: a V8 corrige a V7' }))
  fireEvent.click(janela.getByRole('radio', { name: 'Relatório' }))
  fireEvent.change(janela.getByLabelText(/Comentário/), { target: { value: 'Ajustei o relatório' } })
  fireEvent.click(janela.getByRole('button', { name: 'Salvar' }))
  expect(await agora.findByText('Corrigida · V8 corrige a V7 · relatório')).toBeTruthy()
})

test('a recusa do banco aparece na janela, sem perder o preenchido, e a falha também', async () => {
  const { revisoes } = abrir(PASSAGEM_COM_VERSAO({ autorId: BIA.id, autorNome: BIA.nome }))
  const janela = await abrirARegistro()
  fireEvent.click(janela.getByRole('radio', { name: 'Sem alteração: vale para a V8' }))
  fireEvent.change(janela.getByLabelText(/Comentário/), { target: { value: 'Meu texto' } })
  revisoes.falhaNaGravacao = new TravaDoBanco('Já há uma revisão registrada nesta passagem pela Revisão interna; edite-a.')
  registrar(janela)
  expect((await janela.findByRole('alert')).textContent).toBe('Já há uma revisão registrada nesta passagem pela Revisão interna; edite-a.')
  expect((janela.getByLabelText(/Comentário/) as HTMLTextAreaElement).value).toBe('Meu texto')
  revisoes.falhaNaGravacao = 'sem conexão'
  registrar(janela)
  await waitFor(() => expect(janela.getByRole('alert').textContent).toBe('A alteração não foi salva: sem conexão.'))
  expect(revisoes.revisoes.p1 ?? []).toHaveLength(0)
})

test('a Consulta lê o resumo no Agora e na gaveta, sem botões', async () => {
  abrir(PASSAGEM_COM_VERSAO({ autorId: BIA.id }), ({ revisoes }) => {
    revisoes.revisoes.p1 = [{
      id: 'r1', versaoRevisada: 8, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null,
      revisor: BIA.nome, revisadaEm: '2026-10-13', daPassagemAberta: true,
    }]
  }, 'consulta')
  const agora = await agoraDoVerso()
  expect(await agora.findByText(`Sem alteração · V8 · ${BIA.nome}`)).toBeTruthy()
  expect(agora.queryByRole('button', { name: /revisão/ })).toBeNull()
  const gaveta = await gavetaDaEtapa('Revisão interna')
  expect(await gaveta.findByText('Sem alteração')).toBeTruthy()
  expect(gaveta.queryByRole('button', { name: /Editar/ })).toBeNull()
})

test('depois de sair da Revisão interna e voltar, a passagem nova pede o registro de novo e a anterior continua na gaveta', async () => {
  abrir(PASSAGEM_COM_VERSAO({ autorId: BIA.id }), ({ revisoes }) => {
    revisoes.revisoes.p1 = [{
      id: 'r0', versaoRevisada: 7, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null,
      revisor: BIA.nome, revisadaEm: '2026-10-01', daPassagemAberta: false,
    }]
  })
  const agora = await agoraDoVerso()
  expect(await agora.findByRole('button', { name: 'Registrar revisão' })).toBeTruthy()
  expect(agora.queryByRole('button', { name: 'Editar revisão' })).toBeNull()
  const gaveta = await gavetaDaEtapa('Revisão interna')
  expect(await gaveta.findByText(/^V7 · Bia Teste/)).toBeTruthy()
})

test('o histórico mostra "Registrou a revisão"', async () => {
  abrir(PASSAGEM_COM_VERSAO({ autorId: BIA.id }))
  const janela = await abrirARegistro()
  fireEvent.click(janela.getByRole('radio', { name: 'Sem alteração: vale para a V8' }))
  registrar(janela)
  await (await agoraDoVerso()).findByText(`Sem alteração · V8 · ${EU.nome}`)
  await escolherNoMenuDoProcesso('Histórico')
  expect(await (await versoAberto()).findByText('Registrou a revisão')).toBeTruthy()
})
