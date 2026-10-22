import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'
import { agoraDoVerso, etapasDoVerso, gavetaDaEtapa, janelaPorCima } from './testes/versoDoCartao'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function doProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

function processo(mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4 },
    processoPaiId: null, processoPai: null, subprocessos: [],
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao: null,
    etapasDoProcesso: [
      doProcesso(4, 'modelagem', 'Reunião de modelagem'),
      doProcesso(5, 'relatorio', 'Relatório e modelagem técnica'),
      doProcesso(9, 'publicacao', 'Publicação', { obrigatoria: false }),
    ],
    ...mudancas,
  }
}

type Montagem = { perfil?: Perfil; processos?: ProcessoLido[]; ajustar?: (falso: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', processos = [processo()], ajustar }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = processos
  falso.etapasDoCatalogo = [
    { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true },
    { id: 'e5', codigo: 'relatorio', nome: 'Relatório e modelagem técnica', ordem: 5, ativa: true },
    { id: 'e9', codigo: 'publicacao', nome: 'Publicação', ordem: 9, ativa: true },
  ]
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return falso
}

const painel = async () => within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
const MODELAGEM = 'Reunião de modelagem'
const RELATORIO = 'Relatório e modelagem técnica'

test('a etapa atual pendente tem Iniciar e, no "⋯", só Realizada anteriormente; as outras só têm Assumir', async () => {
  montar()
  const atual = await agoraDoVerso()
  expect(atual.getByRole('button', { name: `Iniciar ${MODELAGEM}` })).toBeTruthy()
  fireEvent.click(atual.getByRole('button', { name: 'Mais ações da etapa' }))
  expect(atual.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Realizada anteriormente'])
  const gaveta = await gavetaDaEtapa(RELATORIO)
  expect(gaveta.queryByRole('button', { name: /^Iniciar/ })).toBeNull()
  expect(gaveta.getByRole('button', { name: `Assumir ${RELATORIO}` })).toBeTruthy()
})

test('a etapa atual opcional tem Dispensar', async () => {
  montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', MODELAGEM, { status: 'concluida' }),
    doProcesso(9, 'publicacao', 'Publicação', { obrigatoria: false }),
  ] })] })
  const atual = await agoraDoVerso()
  fireEvent.click(atual.getByRole('button', { name: 'Mais ações da etapa' }))
  expect(atual.getByRole('menuitem', { name: 'Dispensar' })).toBeTruthy()
})

test('Iniciar grava, a etapa passa a em andamento e ganha Concluir', async () => {
  const falso = montar()
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Iniciar ${MODELAGEM}` }))
  expect(await (await agoraDoVerso()).findByRole('button', { name: `Concluir ${MODELAGEM}` })).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'iniciar', id: 'a4' }])
})

test('Concluir passa a etapa atual para a seguinte e o cartão muda de coluna no Quadro', async () => {
  montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', MODELAGEM, { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
    doProcesso(5, 'relatorio', RELATORIO),
  ] })] })
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Concluir ${MODELAGEM}` }))
  fireEvent.click(within(janelaPorCima()).getByRole('button', { name: `Concluir e iniciar ${RELATORIO}` }))
  // O avanço já inicia a seguinte: ela chega em andamento, com Concluir.
  expect(await (await agoraDoVerso()).findByRole('button', { name: `Concluir ${RELATORIO}` })).toBeTruthy()
  const coluna = within(await screen.findByRole('region', { name: RELATORIO }))
  expect(await coluna.findByRole('link', { name: /Emitir Ofício/ })).toBeTruthy()
})

test('Dispensar e Realizada anteriormente pedem nota: vazia não grava, com nota grava e mostra a nota', async () => {
  const falso = montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', MODELAGEM, { status: 'concluida' }),
    doProcesso(9, 'publicacao', 'Publicação', { obrigatoria: false }),
  ] })] })
  const atual = await agoraDoVerso()
  fireEvent.click(atual.getByRole('button', { name: 'Mais ações da etapa' }))
  fireEvent.click(atual.getByRole('menuitem', { name: 'Dispensar' }))
  const janela = within(screen.getByRole('dialog', { name: 'Dispensar a etapa Publicação?' }))
  expect((janela.getByRole('button', { name: 'Dispensar' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Sem publicação' } })
  fireEvent.click(janela.getByRole('button', { name: 'Dispensar' }))
  expect(await (await gavetaDaEtapa('Publicação')).findByText('Nota: Sem publicação')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'dispensar', id: 'a9', nota: 'Sem publicação', usuarioId: null }])
})

test('Realizada anteriormente grava com a nota', async () => {
  const falso = montar()
  const atual = await agoraDoVerso()
  fireEvent.click(atual.getByRole('button', { name: 'Mais ações da etapa' }))
  fireEvent.click(atual.getByRole('menuitem', { name: 'Realizada anteriormente' }))
  const janela = within(screen.getByRole('dialog', {
    name: `Registrar ${MODELAGEM} como realizada anteriormente e iniciar ${RELATORIO}` }))
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Feita em 2025' } })
  fireEvent.click(janela.getByRole('button', { name: `Registrar e iniciar ${RELATORIO}` }))
  expect(await (await etapasDoVerso()).findByRole('button', { name: `${MODELAGEM}: realizada anteriormente` })).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'realizada', id: 'a4', nota: 'Feita em 2025', usuarioId: null }])
})

// Com a Publicação no caminho, o concluído depende da escolha de publicação (App.escolhaDePublicacao); aqui não há Publicação.
test('resolvidas as obrigatórias, a pílula Concluído aparece no painel e o cartão vai para a coluna Concluídos', async () => {
  montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', MODELAGEM, { status: 'concluida' }),
    doProcesso(5, 'relatorio', RELATORIO, { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
  ], etapaAtual: { codigo: 'relatorio', nome: RELATORIO, ordem: 5 } })] })
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Concluir ${RELATORIO}` }))
  expect(await (await painel()).findByText('Concluído')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'Concluídos' })).getByRole('link', { name: /Emitir Ofício/ })).toBeTruthy()
})

const RECUSAS = [
  'Já há uma etapa em andamento neste processo: Reunião de modelagem.',
  'A etapa Reunião de modelagem ainda não foi resolvida.',
  'A etapa Publicação é obrigatória e não pode ser dispensada.',
]

test.each(RECUSAS)('a recusa do banco aparece como alerta, sem mudar a etapa: %s', async (frase) => {
  const falso = montar({ ajustar: (f) => { f.falhaDeGravacao = new TravaDoBanco(frase) } })
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Iniciar ${MODELAGEM}` }))
  expect((await (await painel()).findByRole('alert')).textContent).toBe(frase)
  expect((await agoraDoVerso()).getByRole('button', { name: `Iniciar ${MODELAGEM}` })).toBeTruthy()
  expect(falso.chamadas).toEqual([])
})

test('falha comum de gravação mostra o motivo', async () => {
  montar({ ajustar: (f) => { f.falhaDeGravacao = 'sem conexão' } })
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Iniciar ${MODELAGEM}` }))
  expect((await (await painel()).findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
})

test('a Consulta vê o caminho sem nenhuma ação', async () => {
  montar({ perfil: 'consulta' })
  expect((await agoraDoVerso()).queryAllByRole('button')).toEqual([])
  expect((await gavetaDaEtapa(MODELAGEM)).getAllByRole('button')).toHaveLength(1)
})
