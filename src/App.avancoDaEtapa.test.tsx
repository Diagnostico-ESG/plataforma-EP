import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { EventoDoCadastro } from './cadastros/tipos'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido, UsuarioResponsavel } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { agoraDoVerso, escolherNoMenuDoProcesso, etapasDoVerso, janelasPorCima } from './testes/versoDoCartao'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const EU: UsuarioResponsavel = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }
const BIA: UsuarioResponsavel = { id: 'u2', nome: 'Bia Teste' }
const PERGUNTA = 'Quem fica com a próxima etapa?'

function doProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

const MODELAGEM_EM_ANDAMENTO = doProcesso(4, 'modelagem', 'Reunião de modelagem', { status: 'em_andamento', iniciadaEm: '2026-10-13' })
const MODELAGEM_CONCLUIDA = doProcesso(4, 'modelagem', 'Reunião de modelagem', { status: 'concluida', iniciadaEm: '2026-10-12', resolvidaEm: '2026-10-13' })
const RELATORIO = doProcesso(5, 'relatorio', 'Relatório e modelagem técnica')
const PUBLICACAO = doProcesso(9, 'publicacao', 'Publicação')

function processo(etapas: EtapaDoProcesso[]): ProcessoLido {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: etapas[0].codigo, nome: etapas[0].nome, ordem: etapas[0].ordem },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo', contexto: null,
    observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao: null, etapasDoProcesso: etapas,
  }
}

type Montagem = { perfil?: Perfil; usuarios?: UsuarioResponsavel[]; ajustar?: (falso: ProcessosFalso) => void }

function montar(etapas: EtapaDoProcesso[] = [MODELAGEM_EM_ANDAMENTO, RELATORIO, PUBLICACAO],
  { perfil = 'integrante_ep', usuarios = [EU, BIA], ajustar }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = [processo(etapas)]
  falso.usuariosPossiveis = usuarios
  falso.etapasDoCatalogo = etapas.map((etapa) => ({ id: `e${etapa.ordem}`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, ativa: true }))
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} />)
  return falso
}

const painel = async () => within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
async function clicar(nomeDaEtapa: string, botao: string) {
  const agora = await agoraDoVerso()
  if (botao === 'Concluir' || botao === 'Iniciar') return fireEvent.click(agora.getByRole('button', { name: `${botao} ${nomeDaEtapa}` }))
  // Dispensar e Realizada anteriormente ficam no "⋯" do Agora.
  fireEvent.click(agora.getByRole('button', { name: 'Mais ações da etapa' }))
  fireEvent.click(agora.getByRole('menuitem', { name: botao }))
}
// A linha da etapa na lista, pelo nome acessível "{nome}: {status}".
const linha = async (nome: string, status: string) => (await etapasDoVerso()).findByRole('button', { name: `${nome}: ${status}` })
const janela = (titulo: string) => within(screen.getByRole('dialog', { name: titulo }))
const marcado = (aberta: ReturnType<typeof janela>) =>
  (aberta.getAllByRole('radio') as HTMLInputElement[]).find((radio) => radio.checked)?.closest('label')?.textContent

test('Concluir abre a janela da próxima etapa, com os usuários e "Ninguém por enquanto" por último, sem gravar', async () => {
  const falso = montar()
  await clicar('Reunião de modelagem', 'Concluir')
  const aberta = janela('Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica')
  const grupo = aberta.getByRole('radiogroup', { name: PERGUNTA })
  expect(within(grupo).getAllByRole('radio').map((radio) => radio.closest('label')?.textContent))
    .toEqual(['Pessoa de Teste', 'Bia Teste', 'Ninguém por enquanto'])
  expect(aberta.getByRole('button', { name: 'Concluir e iniciar Relatório e modelagem técnica' })).toBeTruthy()
  expect(falso.chamadas).toEqual([])
})

test.each([
  ['a próxima sem responsável: quem está na tela', {}, [EU, BIA], 'Pessoa de Teste'],
  ['a próxima com responsável na lista: ele', { responsavelId: 'u2', responsavelNome: 'Bia Teste' }, [EU, BIA], 'Bia Teste'],
  ['responsável e usuário da tela fora da lista: ninguém', { responsavelId: 'u9', responsavelNome: 'Zé' }, [BIA], 'Ninguém por enquanto'],
])('marcado ao abrir — %s', async (_caso, mudancasDaProxima, usuarios, esperado) => {
  montar([MODELAGEM_EM_ANDAMENTO, { ...RELATORIO, ...mudancasDaProxima }, PUBLICACAO], { usuarios })
  await clicar('Reunião de modelagem', 'Concluir')
  expect(marcado(janela('Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica'))).toBe(esperado)
})

test('confirmar com outra pessoa conclui a etapa e inicia a próxima com ela', async () => {
  const falso = montar()
  await clicar('Reunião de modelagem', 'Concluir')
  const aberta = janela('Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica')
  fireEvent.click(aberta.getByRole('radio', { name: 'Bia Teste' }))
  fireEvent.click(aberta.getByRole('button', { name: 'Concluir e iniciar Relatório e modelagem técnica' }))
  expect(await linha('Reunião de modelagem', 'concluída')).toBeTruthy()
  expect(await linha('Relatório e modelagem técnica', 'atual')).toBeTruthy()
  expect((await agoraDoVerso()).getByText('Bia Teste')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'concluir', id: 'a4', usuarioId: 'u2' }])
  expect(janelasPorCima()).toEqual([])
})

test('"Ninguém por enquanto" inicia a próxima sem responsável', async () => {
  const falso = montar()
  await clicar('Reunião de modelagem', 'Concluir')
  const aberta = janela('Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica')
  fireEvent.click(aberta.getByRole('radio', { name: 'Ninguém por enquanto' }))
  fireEvent.click(aberta.getByRole('button', { name: 'Concluir e iniciar Relatório e modelagem técnica' }))
  expect((await linha('Relatório e modelagem técnica', 'atual'))).toBeTruthy()
  expect((await agoraDoVerso()).getByText('Sem responsável')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'concluir', id: 'a4', usuarioId: null }])
})

test('Dispensar com etapa pendente depois pede a nota e a escolha na mesma janela', async () => {
  const falso = montar([MODELAGEM_CONCLUIDA, { ...RELATORIO, obrigatoria: false }, PUBLICACAO])
  await clicar('Relatório e modelagem técnica', 'Dispensar')
  const aberta = janela('Dispensar Relatório e modelagem técnica e iniciar Publicação')
  const botao = aberta.getByRole('button', { name: 'Dispensar e iniciar Publicação' }) as HTMLButtonElement
  expect(aberta.getByRole('radiogroup', { name: PERGUNTA })).toBeTruthy()
  expect(botao.disabled).toBe(true)
  fireEvent.change(aberta.getByLabelText('Nota'), { target: { value: 'Não se aplica' } })
  expect(botao.disabled).toBe(false)
  fireEvent.click(botao)
  expect(await linha('Relatório e modelagem técnica', 'dispensada')).toBeTruthy()
  expect(await linha('Publicação', 'atual')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'dispensar', id: 'a5', nota: 'Não se aplica', usuarioId: 'usuario-de-teste' }])
})

test('Realizada anteriormente com etapa pendente depois pede a nota e a escolha, e avança', async () => {
  const falso = montar()
  await clicar('Reunião de modelagem', 'Realizada anteriormente')
  const aberta = janela('Registrar Reunião de modelagem como realizada anteriormente e iniciar Relatório e modelagem técnica')
  fireEvent.change(aberta.getByLabelText('Nota'), { target: { value: 'Feita em 2025' } })
  fireEvent.click(aberta.getByRole('button', { name: 'Registrar e iniciar Relatório e modelagem técnica' }))
  expect(await linha('Reunião de modelagem', 'realizada anteriormente')).toBeTruthy()
  expect(await linha('Relatório e modelagem técnica', 'atual')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'realizada', id: 'a4', nota: 'Feita em 2025', usuarioId: 'usuario-de-teste' }])
})

test('sem etapa pendente depois, Concluir grava direto e o processo fica concluído', async () => {
  const falso = montar([MODELAGEM_CONCLUIDA, { ...RELATORIO, status: 'em_andamento', iniciadaEm: '2026-10-13' }])
  await clicar('Relatório e modelagem técnica', 'Concluir')
  expect(await (await painel()).findByText('Concluído')).toBeTruthy()
  expect(janelasPorCima()).toEqual([])
  expect(falso.chamadas).toEqual([{ acao: 'concluir', id: 'a5', usuarioId: null }])
})

test('sem etapa pendente depois, Dispensar mostra só a nota', async () => {
  const falso = montar([MODELAGEM_CONCLUIDA, { ...PUBLICACAO, obrigatoria: false }])
  await clicar('Publicação', 'Dispensar')
  const aberta = janela('Dispensar a etapa Publicação?')
  expect(aberta.queryByRole('radiogroup')).toBeNull()
  fireEvent.change(aberta.getByLabelText('Nota'), { target: { value: 'Sem publicação' } })
  fireEvent.click(aberta.getByRole('button', { name: 'Dispensar' }))
  expect(await linha('Publicação', 'dispensada')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'dispensar', id: 'a9', nota: 'Sem publicação', usuarioId: null }])
})

test('o foco abre na opção marcada e, com nota, no campo da nota', async () => {
  montar()
  await clicar('Reunião de modelagem', 'Concluir')
  expect(document.activeElement).toBe(janela('Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica')
    .getByRole('radio', { name: 'Pessoa de Teste' }))
  cleanup()
  montar()
  await clicar('Reunião de modelagem', 'Realizada anteriormente')
  expect(document.activeElement)
    .toBe(janela('Registrar Reunião de modelagem como realizada anteriormente e iniciar Relatório e modelagem técnica').getByLabelText('Nota'))
})

test('Enter confirma; com a nota vazia, não grava', async () => {
  const falso = montar()
  await clicar('Reunião de modelagem', 'Realizada anteriormente')
  const comNota = janela('Registrar Reunião de modelagem como realizada anteriormente e iniciar Relatório e modelagem técnica')
  fireEvent.keyDown(comNota.getByRole('radio', { name: 'Pessoa de Teste' }), { key: 'Enter' })
  expect(falso.chamadas).toEqual([])
  fireEvent.click(comNota.getByRole('button', { name: 'Cancelar' }))
  await clicar('Reunião de modelagem', 'Concluir')
  fireEvent.keyDown(janela('Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica')
    .getByRole('radio', { name: 'Pessoa de Teste' }), { key: 'Enter' })
  expect(await linha('Reunião de modelagem', 'concluída')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'concluir', id: 'a4', usuarioId: 'usuario-de-teste' }])
})

test('Cancelar fecha sem gravar, a etapa fica como estava e a janela recomeça marcada', async () => {
  const falso = montar()
  await clicar('Reunião de modelagem', 'Concluir')
  const aberta = janela('Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica')
  fireEvent.click(aberta.getByRole('radio', { name: 'Bia Teste' }))
  fireEvent.click(aberta.getByRole('button', { name: 'Cancelar' }))
  expect(janelasPorCima()).toEqual([])
  expect(await linha('Reunião de modelagem', 'atual')).toBeTruthy()
  expect(falso.chamadas).toEqual([])
  await clicar('Reunião de modelagem', 'Concluir')
  expect(marcado(janela('Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica'))).toBe('Pessoa de Teste')
})

test.each([
  [new TravaDoBanco('Este processo está suspenso; retome-o para registrar o andamento.'),
    'Este processo está suspenso; retome-o para registrar o andamento.'],
  ['sem conexão', 'A alteração não foi salva: sem conexão.'],
])('falha na gravação aparece como alerta, com as etapas como estavam (%s)', async (falha, texto) => {
  const falso = montar([MODELAGEM_EM_ANDAMENTO, RELATORIO, PUBLICACAO], { ajustar: (f) => { f.falhaDeGravacao = falha } })
  await clicar('Reunião de modelagem', 'Concluir')
  fireEvent.click(janela('Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica')
    .getByRole('button', { name: 'Concluir e iniciar Relatório e modelagem técnica' }))
  expect((await (await painel()).findByRole('alert')).textContent).toBe(texto)
  expect(await linha('Reunião de modelagem', 'atual')).toBeTruthy()
  expect(falso.chamadas).toEqual([])
})

test('Iniciar continua um clique, sem janela', async () => {
  const falso = montar([{ ...MODELAGEM_EM_ANDAMENTO, status: 'pendente', iniciadaEm: null }, RELATORIO])
  await clicar('Reunião de modelagem', 'Iniciar')
  expect(await linha('Reunião de modelagem', 'atual')).toBeTruthy()
  expect(janelasPorCima()).toEqual([])
  expect(falso.chamadas).toEqual([{ acao: 'iniciar', id: 'a4' }])
})

test('a Consulta não tem Concluir, Dispensar nem Realizada anteriormente', async () => {
  montar([MODELAGEM_EM_ANDAMENTO, RELATORIO], { perfil: 'consulta' })
  expect((await agoraDoVerso()).queryAllByRole('button')).toEqual([])
  expect(janelasPorCima()).toEqual([])
})

const DO_PROCESSO = { processo_id: 'p1', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA' }

test('o histórico mostra os dois registros do avanço, o da etapa resolvida e o "Iniciou a etapa" com o responsável', async () => {
  const evento = (id: number, acao: string, depois: EventoDoCadastro['depois']): EventoDoCadastro => ({
    id, ocorridoEm: '2026-10-14T13:00:00Z', autor: 'Ana Teste', acao, entidade: 'andamento', entidadeRef: `p1:a${id}`,
    antes: null, depois,
  })
  montar(undefined, { ajustar: (f) => {
    f.historicoDosProcessos = { p1: [
      evento(5, 'iniciar', { ...DO_PROCESSO, etapa_nome: 'Relatório e modelagem técnica', status: 'em_andamento', responsavel_nome: 'Bia Teste' }),
      evento(4, 'concluir', { ...DO_PROCESSO, etapa_nome: 'Reunião de modelagem', status: 'concluida' }),
    ] }
  } })
  await escolherNoMenuDoProcesso('Histórico')
  const aberto = await painel()
  expect(await aberto.findByText('Iniciou a etapa', { exact: false })).toBeTruthy()
  expect(aberto.getByText('Concluiu a etapa', { exact: false })).toBeTruthy()
  expect(aberto.getByText('Bia Teste', { exact: false })).toBeTruthy()
})
