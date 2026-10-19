import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, EtapaNoCatalogo, ProcessoLido, SituacaoDoProcesso } from './processos/tipos'
import { ETAPAS_DE_TESTE, abrirCatalogo, montarComCatalogo } from './testes/catalogoDeTeste'
import { VersoesFalso } from './versoes/VersoesFalso'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const [MODELAGEM, , PUBLICACAO] = ETAPAS_DE_TESTE

function etapa(doCatalogo: EtapaNoCatalogo, status: EtapaDoProcesso['status']): EtapaDoProcesso {
  return {
    id: `${doCatalogo.id}-andamento`, codigo: doCatalogo.codigo, nome: doCatalogo.nome, ordem: doCatalogo.ordem,
    obrigatoria: doCatalogo.obrigatoria, status, nota: null, iniciadaEm: null, resolvidaEm: null, responsavelId: null,
    responsavelNome: null, responsavelInativo: false,
  }
}

function processo(id: string, nome: string, situacao: SituacaoDoProcesso, statusDaModelagem: EtapaDoProcesso['status']): ProcessoLido {
  return {
    id, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro de Teste',
    processoPaiId: null, situacao, etapaAtual: { codigo: MODELAGEM.codigo, nome: MODELAGEM.nome, ordem: MODELAGEM.ordem },
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null,
    processoPai: null, subprocessos: [], dataDaReuniao: null, ultimaVersao: null,
    etapasDoProcesso: [etapa(MODELAGEM, statusDaModelagem), etapa(PUBLICACAO, 'pendente')],
  }
}

// O Quadro e o painel leem o catálogo de processos que o falso mantém a cada gravação no catálogo.
function montar(): ProcessosFalso {
  return montarComCatalogo({ ajustar: (processos) => {
    processos.etapasDoCatalogo = ETAPAS_DE_TESTE.map(({ id, codigo, nome, ordem, ativa }) => ({ id, codigo, nome, ordem, ativa }))
    processos.processos = [
      processo('p-andando', 'Andando', 'em_andamento', 'em_andamento'), processo('p-pronto', 'Pronto', 'concluido', 'concluida'),
    ]
  } })
}

// Volta a abrir o aplicativo no endereço pedido, com o mesmo falso (o que foi gravado continua lá).
function abrirEm(processos: ProcessosFalso, endereco: string) {
  cleanup()
  window.location.hash = endereco
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' })} cadastros={new CadastrosFalso()} processos={processos} versoes={new VersoesFalso()} />)
}

async function acrescentarEncerramento() {
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Nova etapa' }))
  const formulario = within(secao.getByRole('form', { name: 'Nova etapa' }))
  fireEvent.change(formulario.getByLabelText('Nome'), { target: { value: 'Encerramento' } })
  fireEvent.change(formulario.getByLabelText('Código'), { target: { value: 'encerramento' } })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(secao.queryByRole('form', { name: 'Nova etapa' })).toBeNull())
}

async function etapasDoCaminho(): Promise<string[]> {
  const caminho = within(await screen.findByRole('region', { name: 'Caminho de etapas' }))
  return caminho.getAllByRole('listitem').map((item) => item.querySelector('.etapa-nome')?.textContent ?? '')
}

test('etapa nova do processo vira coluna do Quadro', async () => {
  const processos = montar()
  await acrescentarEncerramento()
  abrirEm(processos, '#/processos')
  expect(await screen.findByRole('region', { name: 'Encerramento' })).toBeTruthy()
})

test('etapa nova aparece no caminho do processo em andamento e não no do concluído', async () => {
  const processos = montar()
  await acrescentarEncerramento()
  abrirEm(processos, '#/processos/p-andando')
  expect(await etapasDoCaminho()).toContain('Encerramento')
  abrirEm(processos, '#/processos/p-pronto')
  expect(await etapasDoCaminho()).not.toContain('Encerramento')
})

test('a coluna da etapa desativada continua enquanto houver processo nela', async () => {
  const processos = montar()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Desativar Modelagem piloto' }))
  await waitFor(() => expect(processos.etapasDoCatalogo.find((outra) => outra.codigo === 'modelagem')?.ativa).toBe(false))
  abrirEm(processos, '#/processos')
  expect(await screen.findByRole('region', { name: 'Modelagem piloto' })).toBeTruthy()
})
