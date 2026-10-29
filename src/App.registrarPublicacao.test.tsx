import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { ProcessoLido } from './processos/tipos'
import { hojeLocal } from './processos/textoDaModelagemPiloto'
import { montar } from './testes/aprovacaoNoVerso'
import { agoraDoVerso } from './testes/versoDoCartao'

// Registrar e corrigir a publicação (ticket 04 de publicacao-e-arquivamento, histórias 52 a 55, 57 e 63): o botão na
// Publicação e em Concluídos (inclusive o que saiu do Quadro); a janela com a Data e o Link; o modo Corrigir publicação,
// preenchido; as recusas em vermelho sem perder o preenchido; a Consulta sem botões.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const SEM_PUBLICACAO: Partial<ProcessoLido> = {
  situacao: 'concluido', etiqueta: 'concluido', publicadoEm: null, explicacaoSemPublicacao: 'Não será divulgado',
}
const PUBLICADO: Partial<ProcessoLido> = {
  situacao: 'concluido', etiqueta: 'concluido', publicadoEm: '2026-10-05', linkDaPublicacao: 'https://diario.exemplo/1',
}
const FORA_DO_QUADRO = { noQuadro: false, tiradoDoQuadroEm: '2026-10-12T12:00:00Z' }
// Os botões da publicação; Trocar e Assumir (o responsável) não entram na conta.
const DA_PUBLICACAO = ['Registrar publicação', 'Corrigir publicação']
const botoesDoAgora = async () => (await agoraDoVerso()).getAllByRole('button')
  .map((botao) => botao.textContent ?? '').filter((nome) => DA_PUBLICACAO.includes(nome))
const janela = async (nome: string) => within(await screen.findByRole('dialog', { name: nome }))

async function abrir(botao: string, titulo = botao) {
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: botao }))
  return janela(titulo)
}

test('na Publicação, [Registrar publicação] abre a janela com hoje e grava a data e o link sem mover o processo', async () => {
  const { falso } = montar(null, { etapa: 'publicacao' })
  const aberta = await abrir('Registrar publicação')
  expect((aberta.getByLabelText('Data da publicação') as HTMLInputElement).value).toBe(hojeLocal())
  fireEvent.change(aberta.getByLabelText('Data da publicação'), { target: { value: '2026-10-10' } })
  fireEvent.change(aberta.getByLabelText('Link (opcional)'), { target: { value: 'https://diario.exemplo/p' } })
  fireEvent.click(aberta.getByRole('button', { name: 'Registrar' }))
  expect(await (await agoraDoVerso()).findByText('Publicado em 10/10/2026')).toBeTruthy()
  expect(await botoesDoAgora()).toContain('Corrigir publicação')
  expect(falso.processos[0]).toMatchObject({ publicadoEm: '2026-10-10', linkDaPublicacao: 'https://diario.exemplo/p' })
  expect((await agoraDoVerso()).getByText('Agora · etapa 7 de 8')).toBeTruthy()
})

test('em Concluídos sem publicação: a explicação no Agora e [Registrar publicação]', async () => {
  montar(null, { etapa: 'concluidos', mudancas: SEM_PUBLICACAO })
  const agora = await agoraDoVerso()
  expect(await agora.findByText('Concluído sem publicação: Não será divulgado')).toBeTruthy()
  expect(await botoesDoAgora()).toEqual(['Registrar publicação'])
})

test('registrar em Concluídos troca a explicação pela linha "Concluído · Publicado em" e o botão vira [Corrigir publicação]', async () => {
  montar(null, { etapa: 'concluidos', mudancas: SEM_PUBLICACAO })
  const aberta = await abrir('Registrar publicação')
  fireEvent.change(aberta.getByLabelText('Data da publicação'), { target: { value: '2026-10-11' } })
  fireEvent.click(aberta.getByRole('button', { name: 'Registrar' }))
  expect(await (await agoraDoVerso()).findByText('Concluído · Publicado em 11/10/2026')).toBeTruthy()
  expect(await botoesDoAgora()).toEqual(['Corrigir publicação'])
})

test('publicado: a linha traz o link numa aba nova, e [Corrigir publicação] abre a janela preenchida e grava a correção', async () => {
  const { falso } = montar(null, { etapa: 'concluidos', mudancas: PUBLICADO })
  const agora = await agoraDoVerso()
  expect(await agora.findByText('Concluído · Publicado em 05/10/2026')).toBeTruthy()
  const link = agora.getByRole('link', { name: 'Abrir o link' })
  expect(link.getAttribute('href')).toBe('https://diario.exemplo/1')
  expect(link.getAttribute('target')).toBe('_blank')
  expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  const aberta = await abrir('Corrigir publicação')
  expect((aberta.getByLabelText('Data da publicação') as HTMLInputElement).value).toBe('2026-10-05')
  expect((aberta.getByLabelText('Link (opcional)') as HTMLInputElement).value).toBe('https://diario.exemplo/1')
  fireEvent.change(aberta.getByLabelText('Data da publicação'), { target: { value: '2026-10-06' } })
  fireEvent.click(aberta.getByRole('button', { name: 'Corrigir' }))
  expect(await (await agoraDoVerso()).findByText('Concluído · Publicado em 06/10/2026')).toBeTruthy()
  expect(falso.processos[0].publicadoEm).toBe('2026-10-06')
})

test('o concluído fora do Quadro registra a publicação e depois a corrige, como qualquer concluído', async () => {
  const { falso } = montar(null, { etapa: 'concluidos', mudancas: { ...SEM_PUBLICACAO, ...FORA_DO_QUADRO } })
  expect(await botoesDoAgora()).toEqual(['Registrar publicação'])
  const aberta = await abrir('Registrar publicação')
  fireEvent.click(aberta.getByRole('button', { name: 'Registrar' }))
  expect(await (await agoraDoVerso()).findByText(/Publicado em/)).toBeTruthy()
  expect(await botoesDoAgora()).toEqual(['Corrigir publicação'])
  expect(falso.processos[0].tiradoDoQuadroEm).toBe(FORA_DO_QUADRO.tiradoDoQuadroEm)
})

test('a recusa aparece em vermelho na janela e o preenchido fica', async () => {
  const { falso } = montar(null, { etapa: 'publicacao' })
  falso.falhaDeGravacao = new TravaDoBanco('O link do E-protocolo precisa começar com http:// ou https://.')
  const aberta = await abrir('Registrar publicação')
  fireEvent.change(aberta.getByLabelText('Link (opcional)'), { target: { value: 'ftp://diario.exemplo' } })
  fireEvent.click(aberta.getByRole('button', { name: 'Registrar' }))
  expect((await aberta.findByRole('alert')).textContent).toBe('O link do E-protocolo precisa começar com http:// ou https://.')
  expect((aberta.getByLabelText('Link (opcional)') as HTMLInputElement).value).toBe('ftp://diario.exemplo')
})

test('a Consulta lê a linha da publicação e a explicação, sem botões', async () => {
  montar(null, { perfil: 'consulta', etapa: 'concluidos', mudancas: SEM_PUBLICACAO })
  const agora = await agoraDoVerso()
  expect(await agora.findByText('Concluído sem publicação: Não será divulgado')).toBeTruthy()
  expect(agora.queryAllByRole('button')).toEqual([])
})
