import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { UltimaVersao } from './processos/tipos'
import { BIA, EU, diasAtras, montarVerso, processoLido } from './testes/processoNoVerso'
import { comResponsavelInicial } from './testes/responsavelInicialDeTeste'
import { agoraDoVerso, janelasPorCima } from './testes/versoDoCartao'

// O cartão "Agora" do verso (ticket 25 de processos-etapas, Andamento livre): a etapa e a etiqueta com listas que gravam ao
// escolher, o responsável pelo nome (que abre a troca) e [Assumir], o selo de processo parado e o aviso do revisor.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const COM_EU = { responsavel: { id: EU.id, nome: EU.nome, fotoUrl: null } }
const COM_BIA = { responsavel: { id: BIA.id, nome: BIA.nome, fotoUrl: null } }
const lista = async (nome: string) => (await agoraDoVerso()).getByRole('combobox', { name: nome }) as HTMLSelectElement
const ETAPAS_NA_ORDEM = [
  'Não iniciados', 'Modelagem piloto', 'Relatório e modelagem técnica', 'Revisão interna', 'Validação com o setor',
  'Aprovação pelo setor', 'Publicação', 'Concluídos',
]

test('o rótulo diz a posição entre as etapas ativas, e a lista Etapa traz todas na ordem do catálogo, na atual', async () => {
  montarVerso(processoLido())
  const agora = await agoraDoVerso()
  expect(agora.getByText('Agora · etapa 4 de 8')).toBeTruthy()
  const etapa = await lista('Etapa')
  expect([...etapa.options].map((opcao) => opcao.textContent)).toEqual(ETAPAS_NA_ORDEM)
  expect(etapa.selectedOptions[0].textContent).toBe('Revisão interna')
})

test('escolher outra etapa move na hora, sem janela: a etiqueta volta a A fazer e o responsável é o inicial da etapa nova', async () => {
  const falso = montarVerso(processoLido({ etiqueta: 'em_andamento', ...COM_BIA }))
  comResponsavelInicial(falso, 'aprovacao_setor', { ...EU, fotoUrl: null, ativo: true, perfil: 'integrante_ep' })
  fireEvent.change(await lista('Etapa'), { target: { value: 'e6' } })
  await screen.findByText('Agora · etapa 6 de 8')
  expect(falso.chamadas).toEqual([{ acao: 'mover', id: 'p1', etapaId: 'e6' }])
  expect(janelasPorCima()).toEqual([])
  expect((await lista('Etiqueta')).value).toBe('a_fazer')
  expect((await agoraDoVerso()).getByText(EU.nome)).toBeTruthy()
})

test('mover para trás também vale, inclusive para Não iniciados', async () => {
  const falso = montarVerso(processoLido())
  fireEvent.change(await lista('Etapa'), { target: { value: 'e1' } })
  await screen.findByText('Agora · etapa 1 de 8')
  expect(falso.chamadas).toEqual([{ acao: 'mover', id: 'p1', etapaId: 'e1' }])
})

test('escolher a etapa em que o processo já está não grava nada', async () => {
  const falso = montarVerso(processoLido())
  fireEvent.change(await lista('Etapa'), { target: { value: 'e4' } })
  await Promise.resolve()
  expect(falso.chamadas).toEqual([])
})

test('a falha ao mover aparece em vermelho e o processo fica onde estava', async () => {
  const falso = montarVerso(processoLido())
  falso.falhaDeGravacao = 'falha de conexão simulada'
  fireEvent.change(await lista('Etapa'), { target: { value: 'e6' } })
  expect((await screen.findByRole('alert')).textContent).toBe('A alteração não foi salva: falha de conexão simulada.')
  expect((await lista('Etapa')).selectedOptions[0].textContent).toBe('Revisão interna')
  expect((await agoraDoVerso()).getByText('Agora · etapa 4 de 8')).toBeTruthy()
})

test('a recusa do banco aparece com a frase pronta', async () => {
  const falso = montarVerso(processoLido())
  falso.falhaDeGravacao = new TravaDoBanco('A etapa Publicação está inativa.')
  fireEvent.change(await lista('Etapa'), { target: { value: 'e7' } })
  expect((await screen.findByRole('alert')).textContent).toBe('A etapa Publicação está inativa.')
})

// Mover para Concluídos (a janela da chegada e a ida direta com a data registrada) está em App.chegadaAConcluidos.test.tsx.

// ---- Etiqueta

test('a lista Etiqueta tem A fazer, Iniciado e Finalizado, grava ao escolher e não mexe na etapa nem no responsável', async () => {
  const falso = montarVerso(processoLido(COM_BIA))
  const etiqueta = await lista('Etiqueta')
  expect([...etiqueta.options].map((opcao) => opcao.textContent)).toEqual(['A fazer', 'Iniciado', 'Finalizado'])
  fireEvent.change(etiqueta, { target: { value: 'em_andamento' } })
  await waitFor(() => expect(falso.chamadas).toEqual([{ acao: 'etiqueta', id: 'p1', etiqueta: 'em_andamento' }]))
  expect((await lista('Etiqueta')).value).toBe('em_andamento')
  expect((await agoraDoVerso()).getByText('Agora · etapa 4 de 8')).toBeTruthy()
  expect((await agoraDoVerso()).getByText(BIA.nome)).toBeTruthy()
})

test('a falha ao mudar a etiqueta aparece em vermelho e a etiqueta fica como estava', async () => {
  const falso = montarVerso(processoLido())
  falso.falhaDeGravacao = 'falha de conexão simulada'
  fireEvent.change(await lista('Etiqueta'), { target: { value: 'concluido' } })
  expect((await screen.findByRole('alert')).textContent).toBe('A alteração não foi salva: falha de conexão simulada.')
  expect((await lista('Etiqueta')).value).toBe('a_fazer')
})

test('em Concluídos a etiqueta é só o texto "Finalizado", sem lista', async () => {
  montarVerso(processoLido({ situacao: 'concluido', etiqueta: 'concluido', publicadoEm: '2026-10-05' }, 'concluidos'))
  const agora = await agoraDoVerso()
  expect(agora.queryByRole('combobox', { name: 'Etiqueta' })).toBeNull()
  expect(agora.getByText('Finalizado', { selector: '.agora-etiqueta' })).toBeTruthy()
  expect(agora.getByRole('combobox', { name: 'Etapa' })).toBeTruthy()
})

// ---- Responsável

test('sem responsável: "Escolher responsável", que abre a escolha, e [Assumir]; sem "Sem responsável" nem "Trocar"', async () => {
  const falso = montarVerso(processoLido())
  const agora = await agoraDoVerso()
  expect(agora.queryByText('Sem responsável')).toBeNull()
  expect(agora.queryByRole('button', { name: /^Trocar/ })).toBeNull()
  expect(agora.getByRole('button', { name: 'Assumir' })).toBeTruthy()
  fireEvent.click(agora.getByRole('button', { name: 'Escolher responsável' }))
  fireEvent.change((await agoraDoVerso()).getByRole('combobox', { name: 'Responsável' }), { target: { value: BIA.id } })
  await waitFor(() => expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'p1', usuarioId: BIA.id }]))
})

test('com responsável: a foto em 32 px e o nome, sem o tempo na etapa e sem "Trocar"', async () => {
  montarVerso(processoLido({ ...COM_BIA, entrouNaEtapaEm: diasAtras(3) }))
  const agora = await agoraDoVerso()
  const nome = agora.getByRole('button', { name: `Trocar o responsável: ${BIA.nome}` })
  expect(nome.textContent).toBe(BIA.nome)
  expect(agora.queryByText('há 3 dias')).toBeNull()
  expect(agora.queryByText('Trocar')).toBeNull()
  const foto = nome.closest('.agora-responsavel')?.querySelector<HTMLElement>('.avatar')
  expect(foto?.style.width).toBe('32px')
})

test('Esc fecha só a lista do responsável e devolve o foco ao nome', async () => {
  montarVerso(processoLido(COM_BIA))
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Trocar o responsável: ${BIA.nome}` }))
  fireEvent.keyDown((await agoraDoVerso()).getByRole('combobox', { name: 'Responsável' }), { key: 'Escape' })
  const nome = await (await agoraDoVerso()).findByRole('button', { name: `Trocar o responsável: ${BIA.nome}` })
  await waitFor(() => expect(document.activeElement).toBe(nome))
  expect(screen.getByRole('dialog')).toBeTruthy()
})

test('[Assumir] põe quem está na tela como responsável sem mover o processo', async () => {
  const falso = montarVerso(processoLido(COM_BIA))
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: 'Assumir' }))
  await waitFor(() => expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'p1', usuarioId: EU.id }]))
  const agora = await agoraDoVerso()
  expect(await agora.findByText(EU.nome)).toBeTruthy()
  expect(agora.queryByRole('button', { name: 'Assumir' })).toBeNull()
  expect(agora.getByText('Agora · etapa 4 de 8')).toBeTruthy()
})

test('quem já é o responsável não vê [Assumir]', async () => {
  montarVerso(processoLido(COM_EU))
  expect((await agoraDoVerso()).queryByRole('button', { name: 'Assumir' })).toBeNull()
})

test('o nome abre a lista com quem está na tela primeiro, "(você)", e "Ninguém por enquanto" no fim; escolher grava', async () => {
  const falso = montarVerso(processoLido(COM_BIA))
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Trocar o responsável: ${BIA.nome}` }))
  const troca = (await agoraDoVerso()).getByRole('combobox', { name: 'Responsável' }) as HTMLSelectElement
  expect([...troca.options].map((opcao) => opcao.textContent)).toEqual([`${EU.nome} (você)`, BIA.nome, 'Ninguém por enquanto'])
  fireEvent.change(troca, { target: { value: EU.id } })
  await waitFor(() => expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'p1', usuarioId: EU.id }]))
})

test('"Ninguém por enquanto" tira o responsável', async () => {
  const falso = montarVerso(processoLido(COM_BIA))
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Trocar o responsável: ${BIA.nome}` }))
  fireEvent.change((await agoraDoVerso()).getByRole('combobox', { name: 'Responsável' }), { target: { value: '' } })
  await waitFor(() => expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'p1', usuarioId: null }]))
  expect(await (await agoraDoVerso()).findByRole('button', { name: 'Escolher responsável' })).toBeTruthy()
})

test('a falha ao trocar o responsável aparece em vermelho e o responsável fica como estava', async () => {
  const falso = montarVerso(processoLido(COM_BIA))
  falso.falhaDeGravacao = 'falha de conexão simulada'
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Trocar o responsável: ${BIA.nome}` }))
  fireEvent.change((await agoraDoVerso()).getByRole('combobox', { name: 'Responsável' }), { target: { value: EU.id } })
  expect((await screen.findByRole('alert')).textContent).toBe('A alteração não foi salva: falha de conexão simulada.')
  expect((await agoraDoVerso()).getByRole('button', { name: `Trocar o responsável: ${BIA.nome}` })).toBeTruthy()
})

test('o responsável desativado aparece com "(Inativo)" e não se escolhe de novo', async () => {
  montarVerso(processoLido({
    responsavel: { id: 'u9', nome: 'Caio Antigo', fotoUrl: null }, cartao: { responsavelAtivo: false, ultimaVersao: null, subprocessos: 0 },
  }))
  const agora = await agoraDoVerso()
  expect(agora.getByText('Caio Antigo (Inativo)')).toBeTruthy()
  fireEvent.click(agora.getByRole('button', { name: 'Trocar o responsável: Caio Antigo (Inativo)' }))
  const inativo = (await agoraDoVerso()).getByRole('option', { name: 'Caio Antigo (Inativo)' }) as HTMLOptionElement
  expect(inativo.disabled).toBe(true)
})

// ---- Dias na etapa

test('até 7 dias não há contagem; a partir do oitavo, o selo âmbar', async () => {
  montarVerso(processoLido({ entrouNaEtapaEm: diasAtras(7) }))
  const agora = await agoraDoVerso()
  expect(agora.queryByText('há 7 dias')).toBeNull()
  expect(agora.queryByText('8 dias nesta etapa')).toBeNull()
  cleanup()
  montarVerso(processoLido({ entrouNaEtapaEm: diasAtras(8) }))
  const depois = await agoraDoVerso()
  expect(depois.getByText('8 dias nesta etapa')).toBeTruthy()
})

test('mudar só a etiqueta não zera a contagem de dias', async () => {
  montarVerso(processoLido({ entrouNaEtapaEm: diasAtras(9) }))
  fireEvent.change(await lista('Etiqueta'), { target: { value: 'em_andamento' } })
  await waitFor(async () => expect((await lista('Etiqueta')).value).toBe('em_andamento'))
  expect((await agoraDoVerso()).getByText('9 dias nesta etapa')).toBeTruthy()
})

test('em Não iniciados e em Concluídos não há contagem de dias', async () => {
  montarVerso(processoLido({ entrouNaEtapaEm: diasAtras(30) }, 'nao_iniciados'))
  const naoIniciados = await agoraDoVerso()
  expect(naoIniciados.queryByText(/dias nesta etapa/)).toBeNull()
  expect(naoIniciados.queryByText(/^há \d+ dias$/)).toBeNull()
  cleanup()
  montarVerso(processoLido({ entrouNaEtapaEm: diasAtras(30), situacao: 'concluido', etiqueta: 'concluido' }, 'concluidos'))
  const concluidos = await agoraDoVerso()
  expect(concluidos.queryByText(/dias nesta etapa/)).toBeNull()
})

// ---- Aviso do revisor

const DE_BIA: UltimaVersao = { numero: 4, autorId: BIA.id, autorNome: BIA.nome, papeis: ['bpm', 'png'] }

test('na Revisão interna, o aviso amarelo aparece quando o responsável é quem enviou a versão mais recente, e some ao trocar', async () => {
  montarVerso(processoLido({ ...COM_BIA, ultimaVersao: DE_BIA }))
  const agora = await agoraDoVerso()
  expect(agora.getByText('Bia Teste enviou a V4; a revisão interna deveria ser de outra pessoa.')).toBeTruthy()
  fireEvent.click(agora.getByRole('button', { name: 'Assumir' }))
  await waitFor(async () => expect((await agoraDoVerso()).queryByText(/deveria ser de outra pessoa/)).toBeNull())
})

test('o aviso não aparece fora da Revisão interna nem quando o responsável é outro', async () => {
  montarVerso(processoLido({ ...COM_BIA, ultimaVersao: DE_BIA }, 'modelagem'))
  expect((await agoraDoVerso()).queryByText(/deveria ser de outra pessoa/)).toBeNull()
  cleanup()
  montarVerso(processoLido({ ...COM_EU, ultimaVersao: DE_BIA }))
  expect((await agoraDoVerso()).queryByText(/deveria ser de outra pessoa/)).toBeNull()
})

test('o aviso não impede de mover nem de marcar a etiqueta', async () => {
  const falso = montarVerso(processoLido({ ...COM_BIA, ultimaVersao: DE_BIA }))
  fireEvent.change(await lista('Etiqueta'), { target: { value: 'concluido' } })
  await waitFor(() => expect(falso.chamadas).toHaveLength(1))
})

// ---- Suspenso, cancelado e Consulta

test.each(['suspenso', 'cancelado'] as const)('o processo %s não tem listas: mostra o motivo, a explicação e [Retomar]', async (situacao) => {
  montarVerso(processoLido({ situacao, motivoDaSituacao: 'Aguardando decisão', ...COM_BIA }))
  const agora = await agoraDoVerso()
  expect(agora.queryByRole('combobox')).toBeNull()
  expect(agora.queryByRole('button', { name: 'Assumir' })).toBeNull()
  expect(agora.getByText(/Aguardando decisão/)).toBeTruthy()
  expect(agora.getByText('Em Revisão interna · A fazer · com Bia Teste')).toBeTruthy()
  expect(agora.getByText(/Retome o processo para mudar a etapa, a etiqueta ou o responsável/)).toBeTruthy()
  expect(agora.getByRole('button', { name: 'Retomar' })).toBeTruthy()
})

test('o suspenso não ganha o selo de dias, por mais tempo que tenha na etapa', async () => {
  montarVerso(processoLido({ situacao: 'suspenso', motivoDaSituacao: 'Parou', entrouNaEtapaEm: diasAtras(40) }))
  expect((await agoraDoVerso()).queryByText(/dias nesta etapa/)).toBeNull()
})

test('a Consulta vê a etapa, a etiqueta e o nome do responsável em texto, sem tempo, listas nem botões', async () => {
  montarVerso(processoLido({ ...COM_BIA, etiqueta: 'em_andamento', entrouNaEtapaEm: diasAtras(3) }), 'consulta')
  const agora = await agoraDoVerso()
  expect(agora.getByText('Em Revisão interna · Iniciado')).toBeTruthy()
  expect(agora.getByText(BIA.nome)).toBeTruthy()
  expect(agora.queryByText(/há 3 dias/)).toBeNull()
  expect(agora.queryByRole('combobox')).toBeNull()
  expect(agora.queryByRole('button')).toBeNull()
})

test('a Consulta, sem responsável, não vê nada do responsável', async () => {
  montarVerso(processoLido(), 'consulta')
  const agora = await agoraDoVerso()
  expect(agora.getByText('Em Revisão interna · A fazer')).toBeTruthy()
  expect(agora.queryByText(/responsável/i)).toBeNull()
})

test('na Consulta o selo âmbar aparece a partir do oitavo dia', async () => {
  montarVerso(processoLido({ ...COM_BIA, entrouNaEtapaEm: diasAtras(9) }), 'consulta')
  expect(await (await agoraDoVerso()).findByText('9 dias nesta etapa')).toBeTruthy()
})

// ---- O que saiu

test('os botões e as janelas do modelo anterior não existem mais', async () => {
  montarVerso(processoLido(COM_EU))
  const agora = await agoraDoVerso()
  for (const nome of [/^Concluir /, /^Iniciar /, 'Corrigir datas', /^Voltar a esta etapa/]) {
    expect(agora.queryByRole('button', { name: nome })).toBeNull()
  }
  expect(agora.queryByRole('button', { name: 'Mais ações da etapa' })).toBeNull()
  expect(screen.queryByRole('dialog', { name: /iniciar/i })).toBeNull()
})
