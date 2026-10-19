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
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} />)
  return falso
}

const painel = async () => within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
async function etapa(nome: string) {
  const caminho = within(await (await painel()).findByRole('region', { name: 'Caminho de etapas' }))
  return within((await caminho.findByText(nome)).closest('li') as HTMLElement)
}

test('a etapa atual pendente tem Iniciar e Realizada anteriormente; a obrigatória não tem Dispensar; as outras não têm ação', async () => {
  montar()
  const atual = await etapa('Reunião de modelagem')
  expect(atual.getAllByRole('button').map((botao) => botao.textContent)).toEqual(['Iniciar', 'Realizada anteriormente'])
  expect((await etapa('Relatório e modelagem técnica')).queryAllByRole('button')).toEqual([])
})

test('a etapa atual opcional tem Dispensar', async () => {
  montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', 'Reunião de modelagem', { status: 'concluida' }),
    doProcesso(9, 'publicacao', 'Publicação', { obrigatoria: false }),
  ] })] })
  expect((await etapa('Publicação')).getByRole('button', { name: 'Dispensar' })).toBeTruthy()
})

test('Iniciar grava, a etapa passa a em andamento e ganha Concluir', async () => {
  const falso = montar()
  fireEvent.click((await etapa('Reunião de modelagem')).getByRole('button', { name: 'Iniciar' }))
  const atual = await etapa('Reunião de modelagem')
  expect(await atual.findByRole('button', { name: 'Concluir' })).toBeTruthy()
  expect(atual.getByText('Em andamento')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'iniciar', id: 'a4' }])
})

test('Concluir passa a etapa atual para a seguinte e o cartão muda de coluna no Quadro', async () => {
  montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', 'Reunião de modelagem', { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
    doProcesso(5, 'relatorio', 'Relatório e modelagem técnica'),
  ] })] })
  fireEvent.click((await etapa('Reunião de modelagem')).getByRole('button', { name: 'Concluir' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Concluir e iniciar Relatório e modelagem técnica' }))
  // O avanço já inicia a seguinte: ela chega em andamento, com Concluir.
  expect(await (await etapa('Relatório e modelagem técnica')).findByRole('button', { name: 'Concluir' })).toBeTruthy()
  const coluna = within(await screen.findByRole('region', { name: 'Relatório e modelagem técnica' }))
  expect(await coluna.findByRole('link', { name: /Emitir Ofício/ })).toBeTruthy()
})

test('Dispensar e Realizada anteriormente pedem nota: vazia não grava, com nota grava e mostra a nota', async () => {
  const falso = montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', 'Reunião de modelagem', { status: 'concluida' }),
    doProcesso(9, 'publicacao', 'Publicação', { obrigatoria: false }),
  ] })] })
  fireEvent.click((await etapa('Publicação')).getByRole('button', { name: 'Dispensar' }))
  const janela = within(screen.getByRole('dialog', { name: 'Dispensar a etapa Publicação?' }))
  expect((janela.getByRole('button', { name: 'Dispensar' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Sem publicação' } })
  fireEvent.click(janela.getByRole('button', { name: 'Dispensar' }))
  expect(await (await etapa('Publicação')).findByText('Nota: Sem publicação')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'dispensar', id: 'a9', nota: 'Sem publicação', usuarioId: null }])
})

test('Realizada anteriormente grava com a nota', async () => {
  const falso = montar()
  fireEvent.click((await etapa('Reunião de modelagem')).getByRole('button', { name: 'Realizada anteriormente' }))
  const janela = within(screen.getByRole('dialog', {
    name: 'Registrar Reunião de modelagem como realizada anteriormente e iniciar Relatório e modelagem técnica' }))
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Feita em 2025' } })
  fireEvent.click(janela.getByRole('button', { name: 'Registrar e iniciar Relatório e modelagem técnica' }))
  expect(await (await etapa('Reunião de modelagem')).findByText('Realizada anteriormente')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'realizada', id: 'a4', nota: 'Feita em 2025', usuarioId: null }])
})

test('resolvidas as obrigatórias, a pílula Concluído aparece no painel e o cartão sai do Quadro', async () => {
  montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', 'Reunião de modelagem', { status: 'concluida' }),
    doProcesso(5, 'relatorio', 'Relatório e modelagem técnica', { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
    doProcesso(9, 'publicacao', 'Publicação', { obrigatoria: false }),
  ], etapaAtual: { codigo: 'relatorio', nome: 'Relatório e modelagem técnica', ordem: 5 } })] })
  fireEvent.click((await etapa('Relatório e modelagem técnica')).getByRole('button', { name: 'Concluir' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Concluir e iniciar Publicação' }))
  expect(await (await painel()).findByText('Concluído')).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Emitir Ofício/ })).toBeNull()
})

const RECUSAS = [
  'Já há uma etapa em andamento neste processo: Reunião de modelagem.',
  'A etapa Reunião de modelagem ainda não foi resolvida.',
  'A etapa Publicação é obrigatória e não pode ser dispensada.',
]

test.each(RECUSAS)('a recusa do banco aparece como alerta, sem mudar a etapa: %s', async (frase) => {
  const falso = montar({ ajustar: (f) => { f.falhaDeGravacao = new TravaDoBanco(frase) } })
  fireEvent.click((await etapa('Reunião de modelagem')).getByRole('button', { name: 'Iniciar' }))
  expect((await (await painel()).findByRole('alert')).textContent).toBe(frase)
  expect((await etapa('Reunião de modelagem')).getByText('Pendente')).toBeTruthy()
  expect(falso.chamadas).toEqual([])
})

test('falha comum de gravação mostra o motivo', async () => {
  montar({ ajustar: (f) => { f.falhaDeGravacao = 'sem conexão' } })
  fireEvent.click((await etapa('Reunião de modelagem')).getByRole('button', { name: 'Iniciar' }))
  expect((await (await painel()).findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
})

test('a Consulta vê o caminho sem nenhuma ação', async () => {
  montar({ perfil: 'consulta' })
  expect((await etapa('Reunião de modelagem')).queryAllByRole('button')).toEqual([])
})
