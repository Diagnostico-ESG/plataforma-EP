import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { EtapaDoProcesso } from './processos/tipos'
import { CONCLUIDA, EU, PUBLICACAO, caminho, montar } from './testes/aprovacaoNoVerso'
import { agoraDoVerso, versoAberto } from './testes/versoDoCartao'

// A Publicação não se dispensa e "Não vai mais para publicação", com motivo, leva o processo a Concluídos como não
// publicado (publicacao-e-arquivamento, ticket 02, histórias 13, 14, 41 e 43).

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function naPublicacao(): EtapaDoProcesso[] {
  return caminho({ status: 'em_andamento', iniciadaEm: '2026-10-12', responsavelId: EU.id, responsavelNome: EU.nome })
    .map((etapa) => (etapa.codigo === 'aprovacao_setor' ? { ...etapa, ...CONCLUIDA } : etapa))
}

const NA_PUBLICACAO = { vaiParaPublicacao: true, etapaAtual: { codigo: 'publicacao', nome: PUBLICACAO, ordem: 6 } }
const TITULO = 'O processo Emitir Ofício não vai mais para publicação?'
const ITEM = 'Não vai mais para publicação'

async function itensDoMenuDaEtapa(): Promise<string[]> {
  const agora = await agoraDoVerso()
  fireEvent.click(agora.getByRole('button', { name: 'Mais ações da etapa' }))
  return agora.getAllByRole('menuitem').map((item) => item.textContent ?? '')
}

async function abrirAJanela() {
  await itensDoMenuDaEtapa()
  fireEvent.click((await agoraDoVerso()).getByRole('menuitem', { name: ITEM }))
  return within(screen.getByRole('dialog', { name: TITULO }))
}

test('o "⋯" da Publicação não tem Dispensar e tem "Não vai mais para publicação"', async () => {
  montar(null, { etapas: naPublicacao(), mudancas: NA_PUBLICACAO })
  expect(await itensDoMenuDaEtapa()).toEqual(['Realizada anteriormente', ITEM])
})

test('"Não vai mais para publicação" pede motivo e leva o processo a Concluídos, não publicado', async () => {
  const { falso } = montar(null, { etapas: naPublicacao(), mudancas: NA_PUBLICACAO })
  const janela = await abrirAJanela()
  const confirmar = janela.getByRole('button', { name: ITEM }) as HTMLButtonElement
  expect(confirmar.disabled).toBe(true)
  fireEvent.change(janela.getByLabelText('Motivo'), { target: { value: 'O setor desistiu' } })
  fireEvent.click(confirmar)
  expect(await (await agoraDoVerso()).findByText('Não publicado')).toBeTruthy()
  expect(falso.processos[0]).toMatchObject({ situacao: 'concluido', vaiParaPublicacao: false })
  const publicacao = falso.processos[0].etapasDoProcesso.find((etapa) => etapa.codigo === 'publicacao')
  expect(publicacao).toMatchObject({ status: 'pendente', responsavelId: null, iniciadaEm: null })
})

test('a recusa do banco aparece em vermelho no verso e o processo fica na Publicação', async () => {
  const frase = 'A Publicação não se dispensa: use "Não vai mais para publicação".'
  const { falso } = montar(null, { etapas: naPublicacao(), mudancas: NA_PUBLICACAO, ajustar: ({ falso: f }) => {
    f.falhaDeGravacao = new TravaDoBanco(frase)
  } })
  const janela = await abrirAJanela()
  fireEvent.change(janela.getByLabelText('Motivo'), { target: { value: 'O setor desistiu' } })
  fireEvent.click(janela.getByRole('button', { name: ITEM }))
  expect(await (await versoAberto()).findByRole('alert')).toHaveProperty('textContent', frase)
  expect(falso.processos[0].vaiParaPublicacao).toBe(true)
})

test('a falha ao gravar aparece em vermelho no verso', async () => {
  montar(null, { etapas: naPublicacao(), mudancas: NA_PUBLICACAO, ajustar: ({ falso }) => { falso.falhaDeGravacao = 'sem conexão' } })
  const janela = await abrirAJanela()
  fireEvent.change(janela.getByLabelText('Motivo'), { target: { value: 'O setor desistiu' } })
  fireEvent.click(janela.getByRole('button', { name: ITEM }))
  expect((await (await versoAberto()).findByRole('alert')).textContent).toMatch(/sem conexão/)
})

test('a Consulta não tem o "⋯" da etapa', async () => {
  montar(null, { perfil: 'consulta', etapas: naPublicacao(), mudancas: NA_PUBLICACAO })
  expect((await agoraDoVerso()).queryByRole('button', { name: 'Mais ações da etapa' })).toBeNull()
})
