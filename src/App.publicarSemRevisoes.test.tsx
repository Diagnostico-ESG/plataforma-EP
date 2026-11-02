import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { CATALOGO_DE_TESTE } from './testes/processoDaLista'
import { EU, processoLido } from './testes/processoNoVerso'
import { VersoesFalso } from './versoes/VersoesFalso'

// Regressão da revisão do /ship (2026-11-02): o botão do cabeçalho de Publicação não depende da leitura das revisões.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function montarComRevisoesFalhando(etapa: string) {
  window.location.hash = '#/processos/p1'
  const processos = new ProcessosFalso()
  processos.processos = [processoLido({}, etapa)]
  processos.usuariosPossiveis = [EU]
  processos.etapasDoCatalogo = CATALOGO_DE_TESTE
  const revisoes = new RevisoesFalso(processos)
  revisoes.falharLeitura = true
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'integrante_ep' })} cadastros={cadastros} processos={processos}
    versoes={new VersoesFalso()} revisoes={revisoes} planilhas={new PlanilhasFalso()} />)
}

const cabecalho = async () => within((await screen.findByRole('dialog', { name: /^Processo( |$)/ })).querySelector('header') as HTMLElement)

test('com a leitura das revisões falhando, Publicação ainda mostra [Registrar publicação]', async () => {
  montarComRevisoesFalhando('publicacao')
  expect(await (await cabecalho()).findByRole('button', { name: 'Registrar publicação' })).toBeTruthy()
})

test('com a leitura das revisões falhando, a Revisão interna não mostra [Registrar revisão] (não dá para saber se já há uma)', async () => {
  montarComRevisoesFalhando('revisao_interna')
  await cabecalho()
  expect((await cabecalho()).queryByRole('button', { name: 'Registrar revisão' })).toBeNull()
})
