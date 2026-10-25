import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { hojeLocal } from './processos/textoDaModelagemPiloto'
import { cartaoDe, dia, ETAPAS, montar, processo } from './testes/quadroDeTeste'
import { montarVerso, processoLido } from './testes/processoNoVerso'
import { agoraDoVerso } from './testes/versoDoCartao'

// A janela de chegada a Concluídos (ticket 04 de publicacao-e-arquivamento, histórias 46 a 51 e 55), pela lista Etapa do
// Agora e pelo arrastar: duas opções sem nenhuma marcada, o botão desabilitado até a escolhida estar completa, Esc e
// [Cancelar] que não gravam, a recusa em vermelho sem perder o preenchido, e a ida direta com a data já registrada.

const TITULO = 'Levar Emitir Ofício a Concluídos'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }
const coluna = (nome: string) => screen.getByRole('region', { name: nome })
const cartoesDa = (nome: string) => within(coluna(nome)).queryAllByRole('link').map((cartao) => cartao.textContent ?? '')
const janela = async () => within(await screen.findByRole('dialog', { name: TITULO }))
const levar = (aberta: ReturnType<typeof within>) => aberta.getByRole('button', { name: 'Levar a Concluídos' }) as HTMLButtonElement

async function abrirPelaLista() {
  const falso = montarVerso(processoLido())
  const etapa = (await agoraDoVerso()).getByRole('combobox', { name: 'Etapa' })
  fireEvent.change(etapa, { target: { value: 'e8' } })
  return falso
}

test('escolher Concluídos na lista Etapa abre a janela, sem opção marcada e com o botão desabilitado', async () => {
  const falso = await abrirPelaLista()
  const aberta = await janela()
  expect((aberta.getByRole('radio', { name: 'Publicado' }) as HTMLInputElement).checked).toBe(false)
  expect((aberta.getByRole('radio', { name: 'Concluir sem publicação' }) as HTMLInputElement).checked).toBe(false)
  expect(levar(aberta).disabled).toBe(true)
  expect(falso.chamadas).toEqual([])
})

test('"Publicado" mostra a data (hoje) e o link, habilita o botão e grava a chegada', async () => {
  const falso = await abrirPelaLista()
  const aberta = await janela()
  fireEvent.click(aberta.getByRole('radio', { name: 'Publicado' }))
  expect((aberta.getByLabelText('Data da publicação') as HTMLInputElement).value).toBe(hojeLocal())
  expect(aberta.queryByLabelText('Explicação')).toBeNull()
  fireEvent.change(aberta.getByLabelText('Link (opcional)'), { target: { value: 'https://diario.exemplo/1' } })
  expect(levar(aberta).disabled).toBe(false)
  fireEvent.click(levar(aberta))
  await screen.findByText('Agora · etapa 8 de 8')
  expect(falso.chamadas).toEqual([{
    acao: 'mover', id: 'p1', etapaId: 'e8',
    chegada: { dataDaPublicacao: hojeLocal(), linkDaPublicacao: 'https://diario.exemplo/1', explicacao: null },
  }])
  expect(screen.queryByRole('dialog', { name: TITULO })).toBeNull()
})

test('"Concluir sem publicação" pede a explicação e só habilita o botão com texto', async () => {
  const falso = await abrirPelaLista()
  const aberta = await janela()
  fireEvent.click(aberta.getByRole('radio', { name: 'Concluir sem publicação' }))
  expect(aberta.queryByLabelText('Data da publicação')).toBeNull()
  const explicacao = aberta.getByLabelText('Explicação') as HTMLTextAreaElement
  expect(explicacao.placeholder).toBe('Por que este processo não será publicado?')
  expect(levar(aberta).disabled).toBe(true)
  fireEvent.change(explicacao, { target: { value: '   ' } })
  expect(levar(aberta).disabled).toBe(true)
  fireEvent.change(explicacao, { target: { value: 'Não será divulgado' } })
  fireEvent.click(levar(aberta))
  await screen.findByText('Agora · etapa 8 de 8')
  expect(falso.chamadas).toEqual([{
    acao: 'mover', id: 'p1', etapaId: 'e8', chegada: { dataDaPublicacao: null, linkDaPublicacao: null, explicacao: 'Não será divulgado' },
  }])
})

test('Esc e [Cancelar] não gravam, o processo fica e a janela reaberta volta limpa', async () => {
  const falso = await abrirPelaLista()
  let aberta = await janela()
  fireEvent.click(aberta.getByRole('radio', { name: 'Concluir sem publicação' }))
  fireEvent.change(aberta.getByLabelText('Explicação'), { target: { value: 'Texto digitado' } })
  fireEvent.keyDown(document.body, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog', { name: TITULO })).toBeNull())
  expect(falso.chamadas).toEqual([])
  expect(((await agoraDoVerso()).getByRole('combobox', { name: 'Etapa' }) as HTMLSelectElement).selectedOptions[0].textContent).toBe('Revisão interna')
  fireEvent.change((await agoraDoVerso()).getByRole('combobox', { name: 'Etapa' }), { target: { value: 'e8' } })
  aberta = await janela()
  expect((aberta.getByRole('radio', { name: 'Concluir sem publicação' }) as HTMLInputElement).checked).toBe(false)
  fireEvent.click(aberta.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: TITULO })).toBeNull())
  expect(falso.chamadas).toEqual([])
})

test('a recusa aparece em vermelho e a janela mantém o preenchido', async () => {
  const falso = await abrirPelaLista()
  falso.falhaDeGravacao = new TravaDoBanco('A data 24/10/2099 está no futuro.')
  const aberta = await janela()
  fireEvent.click(aberta.getByRole('radio', { name: 'Publicado' }))
  fireEvent.change(aberta.getByLabelText('Link (opcional)'), { target: { value: 'https://diario.exemplo/1' } })
  fireEvent.click(levar(aberta))
  expect((await aberta.findByRole('alert')).textContent).toBe('A data 24/10/2099 está no futuro.')
  expect((aberta.getByLabelText('Link (opcional)') as HTMLInputElement).value).toBe('https://diario.exemplo/1')
  expect(levar(aberta).disabled).toBe(false)
})

test('com a data da publicação já registrada o processo vai direto, sem janela', async () => {
  const falso = montarVerso(processoLido({ publicadoEm: dia(-2) }, 'publicacao'))
  fireEvent.change((await agoraDoVerso()).getByRole('combobox', { name: 'Etapa' }), { target: { value: 'e8' } })
  await screen.findByText('Agora · etapa 8 de 8')
  expect(falso.chamadas).toEqual([{ acao: 'mover', id: 'p1', etapaId: 'e8' }])
  expect(screen.queryByRole('dialog', { name: TITULO })).toBeNull()
})

// ---- Arrastar

function soltarEmConcluidos() {
  fireEvent.dragOver(coluna('Concluídos'), { dataTransfer })
  fireEvent.drop(coluna('Concluídos'), { dataTransfer })
}

test('arrastar o cartão para Concluídos abre a mesma janela; Esc deixa o cartão onde estava', async () => {
  window.location.hash = '#/processos'
  const falso = montar([processo('Emitir Ofício')])
  fireEvent.dragStart(await cartaoDe('Emitir Ofício'), { dataTransfer })
  soltarEmConcluidos()
  expect(await janela()).toBeTruthy()
  fireEvent.keyDown(document.body, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog', { name: TITULO })).toBeNull())
  expect(falso.chamadas).toEqual([])
  expect(cartoesDa('Revisão interna')).toHaveLength(1)
  expect(cartoesDa('Concluídos')).toEqual([])
})

test('arrastar e concluir sem publicação leva o cartão a Concluídos', async () => {
  window.location.hash = '#/processos'
  const falso = montar([processo('Emitir Ofício')])
  fireEvent.dragStart(await cartaoDe('Emitir Ofício'), { dataTransfer })
  soltarEmConcluidos()
  const aberta = await janela()
  fireEvent.click(aberta.getByRole('radio', { name: 'Concluir sem publicação' }))
  fireEvent.change(aberta.getByLabelText('Explicação'), { target: { value: 'Não será divulgado' } })
  fireEvent.click(levar(aberta))
  await waitFor(() => expect(cartoesDa('Concluídos')).toHaveLength(1))
  expect(falso.chamadas).toEqual([{
    acao: 'mover', id: falso.processos[0].id, etapaId: ETAPAS.find((etapa) => etapa.codigo === 'concluidos')?.id,
    chegada: { dataDaPublicacao: null, linkDaPublicacao: null, explicacao: 'Não será divulgado' },
  }])
})

test('a Consulta não tem a lista nem o arrasto: a janela nunca abre', async () => {
  montarVerso(processoLido(), 'consulta')
  const agora = await agoraDoVerso()
  expect(agora.queryByRole('combobox', { name: 'Etapa' })).toBeNull()
  expect(screen.queryByRole('dialog', { name: TITULO })).toBeNull()
})
