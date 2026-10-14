import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { EventoDoCadastro } from './cadastros/tipos'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, EtapaDoSetor, ProcessoLido } from './processos/tipos'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function etapaDoSetor(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoSetor> = {}): EtapaDoSetor {
  return {
    id: `s${ordem}`, codigo, nome, ordem, obrigatoria: false, status: 'dispensada', nota: 'Setor já conhecido',
    iniciadaEm: null, resolvidaEm: '2026-10-10', ...mudancas,
  }
}

function etapaDoProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelNome: null, ...mudancas,
  }
}

const PROCESSO: ProcessoLido = {
  id: 'p1', nome: 'Emitir Ofício', tipo: 'a_classificar', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
  macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
  etapaAtual: { codigo: 'relatorio', nome: 'Relatório e modelagem técnica', ordem: 5 }, aguardandoOSetor: false,
  responsavel: null, origem: 'retomado', contexto: 'Contexto inventado', observacoes: 'Observação inventada',
  motivoDaSituacao: null,
  etapasDoSetor: [
    etapaDoSetor(1, 'identificacao_responsaveis', 'Identificação dos responsáveis'),
    etapaDoSetor(3, 'identificacao_processos', 'Identificação dos processos', { status: 'concluida', nota: null, obrigatoria: true }),
  ],
  etapasDoProcesso: [
    etapaDoProcesso(4, 'modelagem', 'Reunião de modelagem', {
      status: 'concluida', iniciadaEm: '2026-10-11', resolvidaEm: '2026-10-12', responsavelNome: 'Ana Teste' }),
    etapaDoProcesso(5, 'relatorio', 'Relatório e modelagem técnica', { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
    etapaDoProcesso(6, 'revisao_interna', 'Revisão interna'),
  ],
}

const EVENTO: EventoDoCadastro = {
  id: 1, ocorridoEm: '2026-10-14T13:00:00Z', autor: 'Ana Teste', acao: 'criar', entidade: 'processo', entidadeRef: 'p1',
  antes: null, depois: { nome: 'Emitir Ofício', setor_sigla: 'TSA' },
}

type Montagem = { perfil?: Perfil; processos?: ProcessoLido[]; ajustar?: (processos: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', processos = [PROCESSO], ajustar }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = processos
  falso.etapasDoCatalogo = [{ id: 'e5', codigo: 'relatorio', nome: 'Relatório e modelagem técnica', ordem: 5, ativa: true }]
  falso.historicoDosProcessos = { p1: [EVENTO] }
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} />)
  return falso
}

const painel = async () => within(await screen.findByRole('complementary', { name: 'Painel do processo' }))

test('carregando: o aviso "Carregando processo…"', async () => {
  montar({ ajustar: (falso) => { falso.segurarLeituraDoProcesso = true } })
  expect((await (await painel()).findByText('Carregando processo…')).getAttribute('role')).toBe('status')
})

test('erro ao carregar: a mensagem e [Tentar de novo], que carrega de novo', async () => {
  const falso = montar({ ajustar: (f) => { f.falharLeituraDoProcesso = true } })
  const alerta = await (await painel()).findByRole('alert')
  expect(alerta.textContent).toContain('Não foi possível carregar o processo. Verifique a conexão e tente de novo.')
  falso.falharLeituraDoProcesso = false
  fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }))
  expect(await (await painel()).findByRole('heading', { name: 'Emitir Ofício' })).toBeTruthy()
})

test('processo que não existe mais: o aviso e [Voltar], que volta ao Quadro', async () => {
  window.location.hash = '#/processos/p9'
  montar()
  const alerta = await (await painel()).findByRole('alert')
  expect(alerta.textContent).toContain('Este processo não existe mais. Ele pode ter sido excluído; veja o Histórico.')
  fireEvent.click(within(alerta).getByRole('button', { name: 'Voltar' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
})

test('o cabeçalho traz sigla, nome, macroprocesso e as pílulas de tipo e de situação', async () => {
  montar()
  const titulo = await (await painel()).findByRole('heading', { name: 'Emitir Ofício' })
  const cabecalho = within(titulo.closest('header') as HTMLElement)
  expect(cabecalho.getByText('TSA')).toBeTruthy()
  expect(cabecalho.getByText('Macro de Teste')).toBeTruthy()
  expect(cabecalho.getByText('A classificar')).toBeTruthy()
  expect(cabecalho.getByText('Em andamento')).toBeTruthy()
})

test('o botão fechar volta ao Quadro', async () => {
  montar()
  fireEvent.click(await (await painel()).findByRole('button', { name: 'Fechar o painel' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect(screen.queryByRole('complementary', { name: 'Painel do processo' })).toBeNull()
})

test('Esc fecha o painel e devolve o foco ao cartão', async () => {
  montar()
  const aside = await screen.findByRole('complementary', { name: 'Painel do processo' })
  await within(aside).findByRole('heading', { name: 'Emitir Ofício' })
  fireEvent.keyDown(aside, { key: 'Escape' })
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  await waitFor(() => expect(document.activeElement?.id).toBe('cartao-p1'))
})

test('os dados do processo aparecem no painel', async () => {
  montar()
  const secao = await painel()
  await secao.findByRole('heading', { name: 'Emitir Ofício' })
  for (const texto of ['Retomado', 'Contexto inventado', 'Observação inventada']) expect(secao.getByText(texto)).toBeTruthy()
})

test('o caminho mostra as etapas do setor primeiro, só leitura, e depois as do processo, com a atual destacada e com as ações', async () => {
  montar()
  const caminho = within(await (await painel()).findByRole('region', { name: 'Caminho de etapas' }))
  const nomes = caminho.getAllByRole('listitem').map((item) => item.querySelector('.etapa-nome')?.textContent)
  expect(nomes).toEqual(['Identificação dos responsáveis', 'Identificação dos processos', 'Reunião de modelagem',
    'Relatório e modelagem técnica', 'Revisão interna'])
  const atuais = caminho.getAllByRole('listitem').filter((item) => item.getAttribute('aria-current') === 'step')
  expect(atuais.map((item) => item.querySelector('.etapa-nome')?.textContent)).toEqual(['Relatório e modelagem técnica'])
  // As do setor seguem só leitura; as ações são só as da etapa atual do processo (ticket 05).
  expect(caminho.getAllByRole('button').map((botao) => botao.textContent)).toEqual(['Concluir', 'Realizada anteriormente'])
})

test('o caminho mostra status, responsável, datas e nota das etapas do processo', async () => {
  montar()
  const caminho = within(await (await painel()).findByRole('region', { name: 'Caminho de etapas' }))
  const modelagem = within((await caminho.findByText('Reunião de modelagem')).closest('li') as HTMLElement)
  expect(modelagem.getByText('Concluída')).toBeTruthy()
  expect(modelagem.getByText('Responsável: Ana Teste')).toBeTruthy()
  expect(modelagem.getByText('Início: 11/10/2026 · Conclusão: 12/10/2026')).toBeTruthy()
  const revisao = within((await caminho.findByText('Revisão interna')).closest('li') as HTMLElement)
  expect(revisao.getByText('Responsável: —')).toBeTruthy()
  expect(caminho.getByText('Nota: Setor já conhecido')).toBeTruthy()
})

test('"Ver no setor" abre a tela do setor, e voltar à lista limpa o endereço', async () => {
  montar()
  const caminho = within(await (await painel()).findByRole('region', { name: 'Caminho de etapas' }))
  expect(caminho.getByRole('link', { name: 'Ver no setor' }).getAttribute('href')).toBe('#/setores/s1')
  fireEvent.click(caminho.getByRole('link', { name: 'Ver no setor' }))
  expect(await screen.findByRole('form', { name: 'Setor TSA' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  await waitFor(() => expect(window.location.hash).toBe('#/setores'))
  expect(await screen.findByRole('cell', { name: 'TSA' })).toBeTruthy()
})

test('a aba Histórico lista os eventos do processo', async () => {
  montar()
  fireEvent.click(await (await painel()).findByRole('tab', { name: 'Histórico' }))
  const lista = await (await painel()).findByRole('list')
  expect(within(lista).getByText('Criou')).toBeTruthy()
  expect(within(lista).getByText('Ana Teste')).toBeTruthy()
})

test('a aba Histórico: carregando, erro com [Tentar de novo] e vazio', async () => {
  montar({ ajustar: (f) => { f.segurarHistoricoDoProcesso = true } })
  fireEvent.click(await (await painel()).findByRole('tab', { name: 'Histórico' }))
  expect(await (await painel()).findByText('Carregando histórico…')).toBeTruthy()
  cleanup()
  montar({ ajustar: (f) => { f.falharHistoricoDoProcesso = true } })
  fireEvent.click(await (await painel()).findByRole('tab', { name: 'Histórico' }))
  expect((await (await painel()).findByRole('alert')).textContent)
    .toContain('Não foi possível carregar o histórico. Verifique a conexão e tente de novo.')
  cleanup()
  montar({ ajustar: (f) => { f.historicoDosProcessos = {} } })
  fireEvent.click(await (await painel()).findByRole('tab', { name: 'Histórico' }))
  expect(await (await painel()).findByText('Nenhuma alteração registrada ainda.')).toBeTruthy()
})

test('a Consulta vê o painel sem botões de alteração', async () => {
  montar({ perfil: 'consulta' })
  const secao = await painel()
  await secao.findByRole('heading', { name: 'Emitir Ofício' })
  expect(secao.queryByRole('button', { name: 'Editar' })).toBeNull()
  expect(secao.queryByRole('button', { name: 'Excluir' })).toBeNull()
})
