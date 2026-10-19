import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { StatusDaEtapa, UsuarioResponsavel } from './processos/tipos'
import { cartaoDe, ETAPAS, montar, processo } from './testes/quadroDeTeste'

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

/** O que o navegador entrega nos eventos de arrastar; o jsdom não faz o gesto, mas aceita o objeto. */
const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }

const coluna = (nome: string) => screen.getByRole('region', { name: nome })
const colunasAcesas = () => ETAPAS.filter((etapa) => coluna(etapa.nome).classList.contains('coluna-destino')).map((etapa) => etapa.nome)

function levantar(cartao: HTMLElement) {
  fireEvent.dragStart(cartao, { dataTransfer })
}

function soltarEm(nomeDaColuna: string) {
  fireEvent.dragOver(coluna(nomeDaColuna), { dataTransfer })
  fireEvent.drop(coluna(nomeDaColuna), { dataTransfer })
}

test('o cartão só se arrasta com a etapa em andamento, o processo em andamento e etapa pendente depois', async () => {
  montar([
    processo('Pode Arrastar'),
    processo('Suspenso', { processo: { situacao: 'suspenso' } }),
    processo('Etapa Pendente', { cartao: { etapaAtualStatus: 'pendente' } }),
    processo('Na Última', { posicao: 6 }),
  ])
  expect((await cartaoDe('Pode Arrastar')).getAttribute('draggable')).toBe('true')
  expect((await cartaoDe('Suspenso')).getAttribute('draggable')).toBe('false')
  expect((await cartaoDe('Etapa Pendente')).getAttribute('draggable')).toBe('false')
  expect((await cartaoDe('Na Última')).getAttribute('draggable')).toBe('false')
})

test('a Consulta não arrasta nenhum cartão', async () => {
  montar([processo('Para a Consulta')], 'consulta')
  expect((await cartaoDe('Para a Consulta')).getAttribute('draggable')).toBe('false')
})

test('durante o arrastar só a coluna de destino acende, e some ao baixar o cartão', async () => {
  montar([processo('Emitir Ofício')])
  const cartao = await cartaoDe('Emitir Ofício')
  expect(colunasAcesas()).toEqual([])
  levantar(cartao)
  expect(colunasAcesas()).toEqual(['Revisão do setor'])
  fireEvent.dragEnd(cartao)
  expect(colunasAcesas()).toEqual([])
})

test('com a etapa vizinha já resolvida, a coluna que acende é a da primeira pendente depois dela', async () => {
  const caminho = ETAPAS.map((etapa, indice) => ({
    codigo: etapa.codigo, status: (['concluida', 'concluida', 'em_andamento', 'dispensada'][indice] ?? 'pendente') as StatusDaEtapa,
  }))
  montar([processo('Vizinha Resolvida', { cartao: { caminho } })])
  levantar(await cartaoDe('Vizinha Resolvida'))
  expect(colunasAcesas()).toEqual(['Aprovação'])
})

test('soltar em outra coluna avisa onde soltar, não grava e não abre janela', async () => {
  const falso = montar([processo('Emitir Ofício')])
  levantar(await cartaoDe('Emitir Ofício'))
  soltarEm('Aprovação')
  expect(screen.getByRole('status').textContent).toBe('Solte o cartão na coluna Revisão do setor.')
  expect(falso.chamadas).toEqual([])
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(colunasAcesas()).toEqual([])
})

// ---- Soltar no destino: a janela de avanço, o Quadro recarregando e as falhas

const EU: UsuarioResponsavel = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }
const BIA: UsuarioResponsavel = { id: 'u2', nome: 'Bia Teste' }
const TITULO_DA_JANELA = 'Concluir Revisão interna e iniciar Revisão do setor'
// Concluir a Revisão interna pede o resultado: a versão mais recente é de outra pessoa, e a opção é "sem alteração".
const VERSAO_DE_BIA = { numero: 7, autorId: BIA.id, autorNome: BIA.nome, papeis: ['bpmn', 'png', 'relatorio'] } as const
const SEM_ALTERACAO = 'Sem alteração: segue a V7'
const comVersaoDeBia = (nome: string) => processo(nome, { processo: { ultimaVersao: { ...VERSAO_DE_BIA, papeis: [...VERSAO_DE_BIA.papeis] } } })
// A janela abre depois de ler o processo, então ela é esperada.
const janela = async (titulo = TITULO_DA_JANELA) => within(await screen.findByRole('dialog', { name: titulo }))
const cartoesDa = (nome: string) => within(coluna(nome)).queryAllByRole('link').map((cartao) => cartao.querySelector('.cartao-nome')?.textContent)
const marcado = (aberta: Awaited<ReturnType<typeof janela>>) =>
  (aberta.getAllByRole('radio') as HTMLInputElement[]).find((radio) => radio.checked)?.closest('label')?.textContent
const opcoes = (aberta: Awaited<ReturnType<typeof janela>>) => aberta.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)

async function soltarNoDestino(nome: string) {
  levantar(await cartaoDe(nome))
  soltarEm('Revisão do setor')
}

test('soltar no destino abre a janela de avanço, sem gravar, com a pergunta e quem está na tela marcado', async () => {
  const falso = montar([processo('Emitir Ofício')], 'integrante_ep', [EU, BIA])
  await soltarNoDestino('Emitir Ofício')
  const aberta = await janela()
  expect(aberta.getByRole('radiogroup', { name: 'Quem fica com a próxima etapa?' })).toBeTruthy()
  expect(marcado(aberta)).toBe(EU.nome)
  expect(aberta.getByRole('button', { name: 'Concluir e iniciar Revisão do setor' })).toBeTruthy()
  expect(falso.chamadas).toEqual([])
})

test('confirmar conclui pela função de avanço e o cartão passa para a coluna nova', async () => {
  const lido = comVersaoDeBia('Emitir Ofício')
  const falso = montar([lido], 'integrante_ep', [EU, BIA])
  await soltarNoDestino('Emitir Ofício')
  fireEvent.click((await janela()).getByRole('radio', { name: SEM_ALTERACAO }))
  fireEvent.click((await janela()).getByRole('radio', { name: BIA.nome }))
  fireEvent.click((await janela()).getByRole('button', { name: 'Concluir e iniciar Revisão do setor' }))
  await waitFor(() => expect(cartoesDa('Revisão do setor')).toEqual(['Emitir Ofício']))
  expect(cartoesDa('Revisão interna')).toEqual([])
  expect(falso.chamadas).toEqual([{ acao: 'concluir', id: `${lido.id}-a3`, usuarioId: BIA.id }])
})

test('Esc e [Cancelar] fecham sem gravar e o cartão fica na coluna de origem', async () => {
  const falso = montar([processo('Emitir Ofício')], 'integrante_ep', [EU, BIA])
  await soltarNoDestino('Emitir Ofício')
  fireEvent.click((await janela()).getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  await soltarNoDestino('Emitir Ofício')
  // O Esc fecha o <dialog> nativo, que dispara "close"; o jsdom não faz o gesto, então o evento vai direto.
  await janela()
  fireEvent(screen.getByRole('dialog'), new Event('close'))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(falso.chamadas).toEqual([])
  expect(cartoesDa('Revisão interna')).toEqual(['Emitir Ofício'])
})

test.each([
  [new TravaDoBanco('Este processo está suspenso; retome-o para registrar o andamento.'),
    'Este processo está suspenso; retome-o para registrar o andamento.'],
  ['sem conexão', 'A alteração não foi salva: sem conexão.'],
])('a falha de gravação mostra a mensagem e nada muda (%s)', async (falha, texto) => {
  const falso = montar([comVersaoDeBia('Emitir Ofício')], 'integrante_ep', [EU, BIA])
  falso.falhaDeGravacao = falha
  await soltarNoDestino('Emitir Ofício')
  fireEvent.click((await janela()).getByRole('radio', { name: SEM_ALTERACAO }))
  fireEvent.click((await janela()).getByRole('button', { name: 'Concluir e iniciar Revisão do setor' }))
  expect((await screen.findByRole('alert')).textContent).toBe(texto)
  expect(cartoesDa('Revisão interna')).toEqual(['Emitir Ofício'])
  expect(falso.chamadas).toEqual([])
})

test('a falha ao ler o processo ao soltar mostra o aviso e não abre janela', async () => {
  const falso = montar([processo('Emitir Ofício')], 'integrante_ep', [EU, BIA])
  const cartao = await cartaoDe('Emitir Ofício')
  falso.falharLeituraDoProcesso = true
  levantar(cartao)
  soltarEm('Revisão do setor')
  expect((await screen.findByRole('alert')).textContent).toBe('Não foi possível abrir a conclusão: falha de conexão simulada.')
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('clicar no cartão continua abrindo o verso; o cartão segue sendo um link', async () => {
  montar([processo('Emitir Ofício')], 'integrante_ep', [EU, BIA])
  const cartao = await cartaoDe('Emitir Ofício')
  expect(cartao.getAttribute('href')).toMatch(/^#\/processos\//)
  levantar(cartao)
  fireEvent.dragEnd(cartao)
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(cartao)
  expect(await screen.findByRole('dialog', { name: /^Processo Emitir Ofício/ })).toBeTruthy()
})

test('na Revisão interna como próxima, a janela não oferece o autor da versão mais recente', async () => {
  const lido = processo('Emitir Ofício', { posicao: 2, processo: { ultimaVersao: { numero: 3, autorId: EU.id, autorNome: EU.nome, papeis: ['bpmn', 'png'] } } })
  montar([lido], 'integrante_ep', [EU, BIA])
  levantar(await cartaoDe('Emitir Ofício'))
  soltarEm('Revisão interna')
  expect(opcoes(await janela('Concluir Relatório e modelagem técnica e iniciar Revisão interna'))).toEqual([BIA.nome, 'Ninguém por enquanto'])
})

test('com o Quadro desatualizado (a etapa já foi concluída em outro lugar), nada abre e o Quadro recarrega', async () => {
  const lido = processo('Emitir Ofício')
  const falso = montar([lido], 'integrante_ep', [EU, BIA])
  const cartao = await cartaoDe('Emitir Ofício')
  let listagens = 0
  const listar = falso.listarProcessos.bind(falso)
  falso.listarProcessos = async () => {
    listagens += 1
    return listar()
  }
  falso.processos = [{ ...lido, etapasDoProcesso: lido.etapasDoProcesso.map((etapa) => ({ ...etapa, status: 'concluida' })) }]
  levantar(cartao)
  soltarEm('Revisão do setor')
  await waitFor(() => expect(listagens).toBe(1))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(falso.chamadas).toEqual([])
})
