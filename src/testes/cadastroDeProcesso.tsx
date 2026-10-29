import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect } from 'vitest'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import type { ProcessoLido } from '../processos/tipos'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { RevisoesFalso } from '../revisoes/RevisoesFalso'
import { PlanilhasFalso } from '../planilhas/PlanilhasFalso'
import { escolherNoMenuDoProcesso } from './versoDoCartao'

/** Apoio dos testes do cadastro e da edição de processo (App.cadastrarProcesso e App.anotacoesNoCadastro). */

export const EMITIR: ProcessoLido = {
  id: 'p1', nome: 'Emitir Ofício', tipo: 'a_classificar', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
  macroprocessoNome: 'Macro A', situacao: 'em_andamento', etapaAtual: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, id: 'e', posicao: 1, total: 1 },
  responsavel: null, origem: 'retomado', contexto: 'Contexto inventado', observacoes: null,
  processoPaiId: null, processoPai: null, subprocessos: [],
  motivoDaSituacao: null, dataDaModelagemPiloto: null, ultimaVersao: null, etapasDoVerso: [],
}

export type Montagem = { perfil?: Perfil; processos?: ProcessoLido[] }

export function montar({ perfil = 'integrante_ep', processos = [] }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [
    { id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true },
    { id: 's2', sigla: 'TSB', nome: 'Setor Teste B', observacoes: null, ativo: true },
    { id: 's3', sigla: 'TSI', nome: 'Setor Inativo', observacoes: null, ativo: false },
  ]
  const comum = { codigo: null, descricao: null, categoria: null }
  cadastros.macroprocessos = [
    { id: 'm1', nome: 'Macro A', ativo: true, ...comum },
    { id: 'm2', nome: 'Macro B', ativo: true, ...comum },
    { id: 'm3', nome: 'Macro Inativo', ativo: false, ...comum },
  ]
  cadastros.vinculos = [{ macroprocessoId: 'm1', setorId: 's1', observacao: null }]
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [{ id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true }]
  falso.siglasDosSetores = { s1: 'TSA', s2: 'TSB' }
  falso.nomesDosMacroprocessos = { m1: 'Macro A', m2: 'Macro B' }
  falso.processos = processos
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return falso
}

export const opcoes = (seletor: HTMLElement) => Array.from((seletor as HTMLSelectElement).options).map((opcao) => opcao.textContent)
export const escrever = (campo: HTMLElement, valor: string) => fireEvent.change(campo, { target: { value: valor } })

export async function formulario(nome = 'Cadastrar processo') {
  const form = within(await screen.findByRole('form', { name: nome }))
  await waitFor(() => expect(form.getByLabelText('Setor').querySelectorAll('option').length).toBeGreaterThan(1))
  return form
}

export function preencher(form: ReturnType<typeof within>, campos: { nome?: string; setor?: string; macro?: string }) {
  if (campos.nome !== undefined) escrever(form.getByLabelText('Nome'), campos.nome)
  if (campos.setor !== undefined) escrever(form.getByLabelText('Setor'), campos.setor)
  if (campos.macro !== undefined) escrever(form.getByLabelText('Macroprocesso'), campos.macro)
}

export const salvar = (form: ReturnType<typeof within>) => fireEvent.click(form.getByRole('button', { name: 'Salvar' }))
export const cadastrar = (form: ReturnType<typeof within>) => fireEvent.click(form.getByRole('button', { name: 'Cadastrar' }))

export async function abrirEdicao() {
  window.location.hash = '#/processos/p1'
  const falso = montar({ processos: [EMITIR] })
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  await escolherNoMenuDoProcesso('Editar')
  return { falso, painel, form: await formulario('Editar processo') }
}

