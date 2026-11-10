import { cleanup, createEvent, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { umSetor } from './testes/processoDaLista'
import { cartaoDe, ETAPAS, montar, processo } from './testes/quadroDeTeste'
import { comResponsavelInicial } from './testes/responsavelInicialDeTeste'

// Linhas do Quadro por etapa, ícone por etapa e "Você" no cartão (ticket 03 de redesenho-do-quadro).

beforeEach(() => {
  window.location.hash = '#/processos?linhas=setor'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const SETORES = [umSetor('s1', 'SGA', 'Secretaria de Gestão', true, 3), umSetor('s2', 'CDI', 'Coordenadoria de Documentos'), umSetor('s3', 'OUV', 'Ouvidoria')]
const ANA = { id: 'u1', nome: 'Ana Teste', fotoUrl: null }
const BRUNO = { id: 'u2', nome: 'Bruno Teste', fotoUrl: null }
const EU = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome, fotoUrl: null }
const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }

const doSetor = (nome: string, setorId: string, setorSigla: string, extra = {}) =>
  processo(nome, { processo: { setorId, setorSigla, ...extra } })
const celula = (linha: string, etapa: string) => screen.getByRole('region', { name: `${linha}: ${etapa}` })
const nomesDaCelula = (linha: string, etapa: string) => within(celula(linha, etapa)).queryAllByRole('link').map((c) => c.querySelector('.cartao-nome')?.textContent)
const cabecasDasLinhas = () => Array.from(document.querySelectorAll('.matriz-linha-cabeca'))
const textosDasLinhas = () => cabecasDasLinhas().map((cabeca) => cabeca.textContent)
const comTresSetores = () => montar([
  doSetor('Do SGA', 's1', 'SGA'), doSetor('Do CDI', 's2', 'CDI'), doSetor('Do SGA em Publicação', 's1', 'SGA'),
], 'integrante_ep', [], undefined, SETORES)

test('Linhas só aparece no Quadro por etapa; Nenhuma é o padrão e mostra o quadro de hoje', async () => {
  window.location.hash = '#/processos'
  comTresSetores()
  await cartaoDe('Do SGA')
  const grupo = screen.getByRole('group', { name: 'Linhas' })
  expect(within(grupo).getByRole('button', { name: 'Nenhuma' }).getAttribute('aria-pressed')).toBe('true')
  expect(document.querySelector('.quadro-matriz')).toBeNull()
  expect(screen.getByRole('region', { name: 'Revisão do fluxograma' })).toBeTruthy()
  cleanup()
  window.location.hash = '#/processos?agrupar=setor'
  comTresSetores()
  await screen.findByRole('region', { name: /SGA/ })
  expect(screen.queryByRole('group', { name: 'Linhas' })).toBeNull()
  cleanup()
  window.location.hash = '#/processos/lista'
  comTresSetores()
  await screen.findByText('Do SGA')
  expect(screen.queryByRole('group', { name: 'Linhas' })).toBeNull()
})

test('escolher Setor ou Responsável grava no endereço e Nenhuma o tira', async () => {
  window.location.hash = '#/processos'
  comTresSetores()
  await cartaoDe('Do SGA')
  const grupo = screen.getByRole('group', { name: 'Linhas' })
  fireEvent.click(within(grupo).getByRole('button', { name: 'Responsável' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos?linhas=responsavel'))
  expect(document.querySelector('.quadro-matriz')).not.toBeNull()
  fireEvent.click(within(grupo).getByRole('button', { name: 'Nenhuma' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
})

test('por setor: uma linha por setor com cartão, em ordem de sigla, com o selo (nome no leitor de tela) e a contagem; o selo sai dos cartões', async () => {
  comTresSetores()
  await cartaoDe('Do SGA')
  expect(textosDasLinhas()).toEqual(['CDI1', 'SGA2'])
  expect(within(cabecasDasLinhas()[1] as HTMLElement).getByRole('img', { name: 'Secretaria de Gestão' })).toBeTruthy()
  expect(nomesDaCelula('SGA', 'Revisão do fluxograma')).toEqual(['Do SGA', 'Do SGA em Publicação'])
  expect(within(await cartaoDe('Do SGA')).queryByRole('img', { name: 'Secretaria de Gestão' })).toBeNull()
})

test('o cabeçalho das etapas aparece uma vez no alto e as colunas se repetem alinhadas em cada linha', async () => {
  comTresSetores()
  await cartaoDe('Do SGA')
  expect(document.querySelectorAll('.matriz-cabecalho')).toHaveLength(ETAPAS.length)
  expect(document.querySelectorAll('.matriz-cabecalho svg').length).toBe(ETAPAS.length)
  for (const etapa of ETAPAS) expect(screen.getAllByRole('region', { name: new RegExp(`: ${etapa.nome}$`) })).toHaveLength(2)
})

test('por responsável: ordem alfabética, Sem responsável por último, Você para quem está na tela, Inativo para o desativado; a linha do responsável sai dos cartões', async () => {
  window.location.hash = '#/processos?linhas=responsavel'
  montar([
    doSetor('Do Bruno', 's1', 'SGA', { responsavel: BRUNO }), doSetor('Da Ana', 's1', 'SGA', { responsavel: ANA }),
    doSetor('Minha', 's1', 'SGA', { responsavel: EU }), doSetor('De ninguém', 's1', 'SGA', { responsavel: null }),
    processo('Do desativado', { cartao: { responsavelAtivo: false }, processo: { responsavel: { id: 'u7', nome: 'Zeca Teste', fotoUrl: null } } }),
  ], 'integrante_ep', [], undefined, SETORES)
  await cartaoDe('Da Ana')
  expect(textosDasLinhas()).toEqual(['Ana Teste1', 'Bruno Teste1', 'Você1', 'Zeca TesteInativo1', 'Sem responsável1'])
  expect(within(await cartaoDe('Da Ana')).queryByText('Ana Teste')).toBeNull()
  expect(within(await cartaoDe('De ninguém')).queryByText('Sem responsável')).toBeNull()
})

test('cada linha recolhe e abre pela setinha, e o estado não vai ao endereço', async () => {
  comTresSetores()
  await cartaoDe('Do SGA')
  const setinha = screen.getByRole('button', { name: 'Recolher a linha SGA' })
  expect(setinha.getAttribute('aria-expanded')).toBe('true')
  fireEvent.click(setinha)
  expect(screen.queryByText('Do SGA')).toBeNull()
  expect(screen.getByText('2 processos · linha recolhida')).toBeTruthy()
  expect(screen.getByText('Do CDI')).toBeTruthy()
  expect(window.location.hash).toBe('#/processos?linhas=setor')
  fireEvent.click(screen.getByRole('button', { name: 'Abrir a linha SGA' }))
  expect(await cartaoDe('Do SGA')).toBeTruthy()
})

test('só aparecem as linhas com cartão depois dos filtros; sem nenhum, vale o vazio dos filtros', async () => {
  window.location.hash = '#/processos?linhas=setor&setor=s2'
  comTresSetores()
  await cartaoDe('Do CDI')
  expect(textosDasLinhas()).toEqual(['CDI1'])
  cleanup()
  window.location.hash = '#/processos?linhas=setor&setor=s3'
  comTresSetores()
  expect(await screen.findByText('Nenhum processo com estes filtros.')).toBeTruthy()
  expect(document.querySelector('.quadro-matriz')).toBeNull()
})

// ---- Arrastar

const passarPor = (celulaAlvo: HTMLElement) => fireEvent.dragOver(celulaAlvo, { dataTransfer })
const soltarEm = (celulaAlvo: HTMLElement) => {
  passarPor(celulaAlvo)
  fireEvent.drop(celulaAlvo, { dataTransfer })
}

test('arrastar para outra coluna da mesma linha move o processo', async () => {
  const falso = comTresSetores()
  fireEvent.dragStart(await cartaoDe('Do CDI'), { dataTransfer })
  soltarEm(celula('CDI', 'Publicação'))
  await waitFor(() => expect(nomesDaCelula('CDI', 'Publicação')).toEqual(['Do CDI']))
  expect(falso.chamadas).toHaveLength(1)
})

test('só a célula da própria linha acende; soltar em outra linha não muda nada e avisa', async () => {
  const falso = comTresSetores()
  fireEvent.dragStart(await cartaoDe('Do CDI'), { dataTransfer })
  passarPor(celula('SGA', 'Publicação'))
  expect(document.querySelectorAll('.coluna-destino')).toHaveLength(0)
  passarPor(celula('CDI', 'Publicação'))
  expect(document.querySelectorAll('.coluna-destino')).toHaveLength(1)
  soltarEm(celula('SGA', 'Publicação'))
  expect(screen.getByText('Solte o cartão na mesma linha.')).toBeTruthy()
  expect(falso.chamadas).toEqual([])
  expect(nomesDaCelula('CDI', 'Revisão do fluxograma')).toEqual(['Do CDI'])
})

test('por responsável, o processo movido vai para a linha do responsável inicial da etapa de destino', async () => {
  window.location.hash = '#/processos?linhas=responsavel'
  const falso = montar([doSetor('Emitir Ofício', 's1', 'SGA', { responsavel: ANA })], 'integrante_ep', [], undefined, SETORES)
  comResponsavelInicial(falso, 'publicacao', { ...EU, ativo: true, perfil: 'integrante_ep' })
  fireEvent.dragStart(await cartaoDe('Emitir Ofício'), { dataTransfer })
  soltarEm(celula('Ana Teste', 'Publicação'))
  await waitFor(() => expect(nomesDaCelula('Você', 'Publicação')).toEqual(['Emitir Ofício']))
  expect(textosDasLinhas()).toEqual(['Você1'])
})

test('a coluna Concluídos aparece nas linhas, com o Tirar do Quadro', async () => {
  montar([
    processo('Pronto', { etapa: 'concluidos', processo: { setorId: 's1', setorSigla: 'SGA', situacao: 'concluido', etiqueta: 'concluido' } }),
    processo('Fora', { etapa: 'concluidos', processo: { setorId: 's1', setorSigla: 'SGA', situacao: 'concluido', etiqueta: 'concluido', noQuadro: false } }),
  ], 'integrante_ep', [], undefined, SETORES)
  await cartaoDe('Pronto')
  expect(nomesDaCelula('SGA', 'Concluídos')).toEqual(['Pronto'])
  expect(screen.getByRole('button', { name: 'Tirar do Quadro: Pronto' })).toBeTruthy()
  expect(screen.getByText(/1 concluído fora do Quadro/)).toBeTruthy()
})

test('a Consulta vê as linhas e não arrasta', async () => {
  montar([doSetor('Do SGA', 's1', 'SGA')], 'consulta', [], undefined, SETORES)
  expect((await cartaoDe('Do SGA')).getAttribute('draggable')).toBe('false')
  expect(screen.getByRole('group', { name: 'Linhas' })).toBeTruthy()
})

// ---- Ícone por etapa e "Você"

test('cada coluna tem o ícone da etapa, só enfeite para o leitor de tela, e a etapa nova recebe o genérico', async () => {
  window.location.hash = '#/processos'
  const falso = montar([processo('Emitir Ofício')])
  falso.etapasDoCatalogo = [...ETAPAS, { id: 'e9', codigo: 'analise_juridica', nome: 'Análise jurídica', ordem: 9, ativa: true }]
  await cartaoDe('Emitir Ofício')
  const titulos = Array.from(document.querySelectorAll('.coluna-titulo-principal'))
  expect(titulos.length).toBeGreaterThanOrEqual(ETAPAS.length)
  for (const titulo of titulos) expect(titulo.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  const desenhos = new Set(titulos.slice(0, ETAPAS.length).map((titulo) => titulo.querySelector('svg')?.innerHTML))
  expect(desenhos.size).toBe(ETAPAS.length)
})

test('o cartão do processo meu diz Você; o dos outros diz o nome; sem contador de arquivos e sem prazo', async () => {
  window.location.hash = '#/processos'
  montar([processo('Meu', { processo: { responsavel: EU } }), processo('Dela')])
  const meu = await cartaoDe('Meu')
  expect(within(meu).getByText('Você')).toBeTruthy()
  expect(within(meu).queryByText(USUARIO_DE_TESTE.nome)).toBeNull()
  expect(within(await cartaoDe('Dela')).getByText('Ana Teste')).toBeTruthy()
  expect(meu.querySelector('.cartao-arquivos, .cartao-prazo')).toBeNull()
})

// Regressão da revisão do /ship (2026-11-02): arrastar um cartão até a borda do Quadro com Linhas também rola o Quadro.
test('nas Linhas, arrastando o cartão até a borda direita, o Quadro rola', async () => {
  comTresSetores()
  fireEvent.dragStart(await cartaoDe('Do CDI'), { dataTransfer })
  const quadro = document.querySelector('.quadro-matriz') as HTMLElement
  quadro.getBoundingClientRect = () => ({ left: 0, right: 1000, top: 0, bottom: 600, width: 1000, height: 600 }) as DOMRect
  let rolagem = 0
  Object.defineProperty(quadro, 'scrollLeft', { get: () => rolagem, set: (valor: number) => { rolagem = valor } })
  // O jsdom não tem DragEvent: o evento genérico ignora o clientX, que vai à mão.
  const evento = createEvent.dragOver(celula('CDI', 'Publicação'), { dataTransfer })
  Object.defineProperty(evento, 'clientX', { value: 995 })
  fireEvent(celula('CDI', 'Publicação'), evento)
  expect(rolagem).toBeGreaterThan(0)
})
