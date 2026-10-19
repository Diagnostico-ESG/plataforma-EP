import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import type { EventoDoCadastro } from './cadastros/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { agoraDoVerso, escolherNoMenuDoProcesso, etapasDoVerso, gavetaDaEtapa, janelaPorCima } from './testes/versoDoCartao'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function doProcesso(ordem: number, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo: `c${ordem}`, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

const MODELAGEM = 'Reunião de modelagem'
const RELATORIO = 'Relatório e modelagem técnica'
const REVISAO = 'Revisão interna'

// A modelagem e o relatório concluídos, a revisão em andamento e a publicação (opcional) pendente.
function processo(mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento', etapaAtual: { codigo: 'c6', nome: REVISAO, ordem: 6 },
    processoPaiId: null, processoPai: null, subprocessos: [],
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null,
    dataDaReuniao: null, ultimaVersao: null,
    etapasDoProcesso: [
      doProcesso(4, MODELAGEM, { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11' }),
      doProcesso(5, RELATORIO, { status: 'concluida', iniciadaEm: '2026-10-11', resolvidaEm: '2026-10-12' }),
      doProcesso(6, REVISAO, { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
      doProcesso(9, 'Publicação', { obrigatoria: false }),
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
  falso.usuariosPossiveis = [{ id: 'u1', nome: 'Ana Teste' }, { id: 'u2', nome: 'Bia Teste' }]
  falso.etapasDoCatalogo = [
    { id: 'e4', codigo: 'c4', nome: MODELAGEM, ordem: 4, ativa: true },
    { id: 'e5', codigo: 'c5', nome: RELATORIO, ordem: 5, ativa: true },
    { id: 'e6', codigo: 'c6', nome: REVISAO, ordem: 6, ativa: true },
    { id: 'e9', codigo: 'c9', nome: 'Publicação', ordem: 9, ativa: true },
  ]
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} />)
  return falso
}

const painel = async () => within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
// A gaveta da etapa, aberta pela linha dela.
const etapa = gavetaDaEtapa
// A linha da etapa na lista, pelo nome acessível "{nome}: {status}".
const rotulada = async (nome: string, status: string) => (await etapasDoVerso()).findByRole('button', { name: `${nome}: ${status}` })

async function voltarA(nome: string, motivo: string) {
  fireEvent.click((await etapa(nome)).getByRole('button', { name: 'Voltar a esta etapa' }))
  const janela = within(screen.getByRole('dialog', { name: `Voltar à etapa ${nome}?` }))
  fireEvent.change(janela.getByLabelText('Motivo'), { target: { value: motivo } })
  fireEvent.click(janela.getByRole('button', { name: 'Voltar' }))
}

// O Trocar do Agora, aberto: a etapa atual troca de responsável ali.
async function abrirTrocaDoAgora(nome: string) {
  const agora = await agoraDoVerso()
  fireEvent.click(agora.getByRole('button', { name: `Trocar o responsável de ${nome}` }))
  return { agora, seletor: agora.getByRole('combobox', { name: `Responsável de ${nome}` }) as HTMLSelectElement }
}

test('Voltar a esta etapa só aparece nas resolvidas anteriores à atual', async () => {
  montar()
  expect((await etapa(MODELAGEM)).getByRole('button', { name: 'Voltar a esta etapa' })).toBeTruthy()
  expect((await etapa(RELATORIO)).getByRole('button', { name: 'Voltar a esta etapa' })).toBeTruthy()
  expect((await etapa(REVISAO)).queryByRole('button', { name: 'Voltar a esta etapa' })).toBeNull()
  const publicacao = await etapa('Publicação')
  expect(publicacao.queryByRole('button', { name: 'Voltar a esta etapa' })).toBeNull()
  expect(publicacao.getByRole('button', { name: 'Assumir Publicação' })).toBeTruthy()
})

test('voltar à modelagem pede o motivo, grava e devolve as seguintes a pendente', async () => {
  const falso = montar()
  fireEvent.click((await etapa(MODELAGEM)).getByRole('button', { name: 'Voltar a esta etapa' }))
  const janela = within(screen.getByRole('dialog', { name: `Voltar à etapa ${MODELAGEM}?` }))
  expect((janela.getByRole('button', { name: 'Voltar' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(janela.getByLabelText('Motivo'), { target: { value: 'Mudou o escopo' } })
  fireEvent.click(janela.getByRole('button', { name: 'Voltar' }))
  expect(await rotulada(MODELAGEM, 'atual')).toBeTruthy()
  expect(await rotulada(RELATORIO, 'pendente')).toBeTruthy()
  expect(await rotulada(REVISAO, 'pendente')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'voltar', id: 'a4', nota: 'Mudou o escopo', usuarioId: null }])
})

test('cancelar a janela do motivo não grava', async () => {
  const falso = montar()
  fireEvent.click((await etapa(MODELAGEM)).getByRole('button', { name: 'Voltar a esta etapa' }))
  fireEvent.click(within(janelaPorCima()).getByRole('button', { name: 'Cancelar' }))
  expect(falso.chamadas).toEqual([])
  expect(await rotulada(MODELAGEM, 'concluída')).toBeTruthy()
})

test.each([
  [new TravaDoBanco('O motivo é obrigatório.'), 'O motivo é obrigatório.'],
  ['sem conexão', 'A alteração não foi salva: sem conexão.'],
])('falha ao voltar aparece como alerta, sem mudar a etapa (%s)', async (falha, texto) => {
  const falso = montar({ ajustar: (f) => { f.falhaDeGravacao = falha } })
  await voltarA(MODELAGEM, 'Mudou o escopo')
  expect((await (await painel()).findByRole('alert')).textContent).toBe(texto)
  expect(await rotulada(MODELAGEM, 'concluída')).toBeTruthy()
  expect(falso.chamadas).toEqual([])
})

test('voltar uma etapa do processo concluído tira a pílula Concluído', async () => {
  montar({ processos: [processo({
    situacao: 'concluido', etapaAtual: { codigo: 'c9', nome: 'Publicação', ordem: 9 },
    etapasDoProcesso: [
      doProcesso(4, MODELAGEM, { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11' }),
      doProcesso(5, RELATORIO, { status: 'concluida', iniciadaEm: '2026-10-11', resolvidaEm: '2026-10-12' }),
      doProcesso(9, 'Publicação', { obrigatoria: false }),
    ],
  })] })
  expect(await (await painel()).findByText('Concluído')).toBeTruthy()
  await voltarA(RELATORIO, 'Faltou revisar')
  expect(await rotulada(RELATORIO, 'atual')).toBeTruthy()
  expect((await painel()).queryByText('Concluído')).toBeNull()
})

async function corrigirDatas(nome: string) {
  const linha = await etapa(nome)
  fireEvent.click(linha.getByRole('button', { name: 'Corrigir datas' }))
  return {
    linha,
    inicio: linha.getByLabelText(`Início da etapa ${nome}`) as HTMLInputElement,
    conclusao: linha.getByLabelText(`Conclusão da etapa ${nome}`) as HTMLInputElement,
  }
}

test('corrigir as datas grava início e conclusão e mostra as datas novas', async () => {
  const falso = montar()
  const { linha, inicio, conclusao } = await corrigirDatas(MODELAGEM)
  fireEvent.change(inicio, { target: { value: '2026-10-08' } })
  fireEvent.change(conclusao, { target: { value: '2026-10-09' } })
  fireEvent.click(linha.getByRole('button', { name: 'Salvar datas' }))
  expect(await (await etapa(MODELAGEM)).findByText('Início: 08/10/2026 · Conclusão: 09/10/2026')).toBeTruthy()
  expect(falso.chamadas).toEqual([{
    acao: 'datas', id: 'a4', datas: { iniciadaEm: '2026-10-08', resolvidaEm: '2026-10-09' } }])
})

test('a etapa em andamento só tem o campo de início, e Cancelar fecha o formulário sem gravar', async () => {
  const falso = montar()
  const linha = await etapa(REVISAO)
  fireEvent.click(linha.getByRole('button', { name: 'Corrigir datas' }))
  expect(linha.getByLabelText(`Início da etapa ${REVISAO}`)).toBeTruthy()
  expect(linha.queryByLabelText(`Conclusão da etapa ${REVISAO}`)).toBeNull()
  fireEvent.click(linha.getByRole('button', { name: 'Cancelar' }))
  expect(linha.queryByLabelText(`Início da etapa ${REVISAO}`)).toBeNull()
  expect(falso.chamadas).toEqual([])
})

test('data no futuro é recusada com o valor recebido, e o formulário continua preenchido', async () => {
  montar()
  const { linha, conclusao } = await corrigirDatas(MODELAGEM)
  fireEvent.change(conclusao, { target: { value: '2026-10-20' } })
  fireEvent.click(linha.getByRole('button', { name: 'Salvar datas' }))
  expect((await linha.findByRole('alert')).textContent).toBe('A data 20/10/2026 está no futuro.')
  expect((linha.getByLabelText(`Conclusão da etapa ${MODELAGEM}`) as HTMLInputElement).value).toBe('2026-10-20')
})

test('conclusão antes do início é recusada com as duas datas', async () => {
  montar()
  const { linha, inicio, conclusao } = await corrigirDatas(MODELAGEM)
  fireEvent.change(inicio, { target: { value: '2026-10-12' } })
  fireEvent.change(conclusao, { target: { value: '2026-10-01' } })
  fireEvent.click(linha.getByRole('button', { name: 'Salvar datas' }))
  expect((await linha.findByRole('alert')).textContent)
    .toBe('A conclusão (01/10/2026) não pode ser antes do início (12/10/2026).')
})

test('o Trocar do Agora lista só os usuários possíveis, e escolher grava e põe o avatar no cartão', async () => {
  const falso = montar()
  const { agora, seletor } = await abrirTrocaDoAgora(REVISAO)
  expect([...seletor.options].map((opcao) => opcao.textContent)).toEqual(['Ana Teste', 'Bia Teste', 'Ninguém por enquanto'])
  fireEvent.change(seletor, { target: { value: 'u1' } })
  const cartao = await screen.findByRole('link', { name: /Emitir Ofício/ })
  expect(await within(cartao).findByRole('img', { name: 'Ana Teste' })).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'a6', usuarioId: 'u1' }])
  expect(await agora.findByText('Ana Teste')).toBeTruthy()
})

test('escolher "Ninguém por enquanto" tira o responsável da etapa', async () => {
  const falso = montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(6, REVISAO, { status: 'em_andamento', iniciadaEm: '2026-10-13', responsavelId: 'u2', responsavelNome: 'Bia Teste' }),
  ] })] })
  const { agora, seletor } = await abrirTrocaDoAgora(REVISAO)
  fireEvent.change(seletor, { target: { value: '' } })
  await waitFor(() => expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'a6', usuarioId: null }]))
  expect(await agora.findByText('Sem responsável')).toBeTruthy()
})

test('o responsável desativado aparece marcado "Inativo" e não se escolhe de novo', async () => {
  montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(6, REVISAO, { status: 'em_andamento', iniciadaEm: '2026-10-13',
      responsavelId: 'u9', responsavelNome: 'Caio Teste', responsavelInativo: true }),
  ] })] })
  const { seletor } = await abrirTrocaDoAgora(REVISAO)
  expect(seletor.selectedOptions[0].textContent).toBe('Caio Teste (Inativo)')
  expect(seletor.selectedOptions[0].disabled).toBe(true)
  expect([...seletor.options].filter((opcao) => !opcao.disabled).map((opcao) => opcao.textContent))
    .toEqual(['Ana Teste', 'Bia Teste', 'Ninguém por enquanto'])
})

test('a recusa ao mudar o responsável aparece como alerta', async () => {
  const frase = 'Maria Teste não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.'
  montar({ ajustar: (f) => { f.falhaDeGravacao = new TravaDoBanco(frase) } })
  const { seletor } = await abrirTrocaDoAgora(REVISAO)
  fireEvent.change(seletor, { target: { value: 'u1' } })
  expect((await (await painel()).findByRole('alert')).textContent).toBe(frase)
})

test('a Consulta não vê Voltar, Corrigir datas nem o Trocar, só o nome do responsável', async () => {
  montar({ perfil: 'consulta', processos: [processo({ etapasDoProcesso: [
    doProcesso(4, MODELAGEM, { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11',
      responsavelId: 'u9', responsavelNome: 'Caio Teste', responsavelInativo: true }),
    doProcesso(6, REVISAO, { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
  ] })] })
  const modelagem = await etapa(MODELAGEM)
  expect(modelagem.getAllByRole('button')).toHaveLength(1)
  expect((await agoraDoVerso()).queryAllByRole('button')).toEqual([])
  expect((await painel()).queryAllByRole('combobox')).toEqual([])
  expect(modelagem.getByText('Responsável: Caio Teste (Inativo)')).toBeTruthy()
})

const ESTADO_DA_ETAPA = { processo_id: 'p1', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', etapa_codigo: 'c4', etapa_nome: MODELAGEM }

function evento(id: number, acao: string, antes: Record<string, string | null>, depois: Record<string, string | null>, motivo?: string) {
  return {
    id, ocorridoEm: '2026-10-14T13:00:00Z', autor: 'Ana Teste', acao, entidade: 'andamento', entidadeRef: 'p1:a4',
    antes: { ...ESTADO_DA_ETAPA, ...antes }, depois: { ...ESTADO_DA_ETAPA, ...depois }, motivo,
  } satisfies EventoDoCadastro
}

test('a aba Histórico mostra voltar (com o motivo), corrigir as datas e mudar o responsável', async () => {
  montar({ ajustar: (f) => {
    f.historicoDosProcessos = { p1: [
      evento(3, 'mudar_responsavel', { responsavel_nome: null }, { responsavel_nome: 'Ana Teste' }),
      evento(2, 'corrigir_datas', { iniciada_em: '2026-10-10' }, { iniciada_em: '2026-10-08' }),
      evento(1, 'voltar', { status: 'concluida' }, { status: 'em_andamento' }, 'Mudou o escopo'),
    ] }
  } })
  await escolherNoMenuDoProcesso('Histórico')
  const lista = within(await (await painel()).findByRole('list'))
  expect(lista.getByText('Voltou à etapa')).toBeTruthy()
  expect(lista.getByText('Corrigiu as datas da etapa')).toBeTruthy()
  expect(lista.getByText('Mudou o responsável da etapa')).toBeTruthy()
  expect(lista.getByText('Motivo: Mudou o escopo')).toBeTruthy()
  expect(lista.getByText(/Depois: .*Responsável: Ana Teste/)).toBeTruthy()
})
