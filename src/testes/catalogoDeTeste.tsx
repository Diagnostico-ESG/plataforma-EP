import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import type { EtapaNoCatalogo } from '../processos/tipos'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { RevisoesFalso } from '../revisoes/RevisoesFalso'
import { PlanilhasFalso } from '../planilhas/PlanilhasFalso'

/** Um catálogo inventado: as duas fixas nas pontas, duas das seis etapas com campos próprios, duas livres (a Divulgação ativa, o Arquivamento desativado). */
export const ETAPAS_DE_TESTE: EtapaNoCatalogo[] = [
  { id: 'e1', codigo: 'nao_iniciados', nome: 'Não iniciados', ordem: 1, fase: null, ativa: true },
  { id: 'e2', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 2, fase: 'IV', ativa: true },
  { id: 'e3', codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', ordem: 3, fase: 'V', ativa: true },
  { id: 'e9', codigo: 'divulgacao', nome: 'Divulgação', ordem: 6, fase: 'VII', ativa: true },
  { id: 'e10', codigo: 'arquivamento', nome: 'Arquivamento', ordem: 7, fase: 'VII', ativa: false },
  { id: 'e11', codigo: 'concluidos', nome: 'Concluídos', ordem: 8, fase: null, ativa: true },
]

type MontagemDoCatalogo = { perfil?: Perfil; ajustar?: (processos: ProcessosFalso) => void }

/** O aplicativo inteiro com o catálogo de teste, para o perfil pedido (administrador por padrão). */
export function montarComCatalogo({ perfil = 'administrador', ajustar }: MontagemDoCatalogo = {}): ProcessosFalso {
  const processos = new ProcessosFalso()
  processos.catalogo.etapas = [...ETAPAS_DE_TESTE]
  processos.etapasDoCatalogo = ETAPAS_DE_TESTE.map(({ id, codigo, nome, ordem, ativa }) => ({ id, codigo, nome, ordem, ativa }))
  ajustar?.(processos)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={processos} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return processos
}

export async function irParaAdministracao(): Promise<void> {
  const navegacao = await screen.findByRole('navigation', { name: 'Áreas do sistema' })
  fireEvent.click(within(navegacao).getByRole('button', { name: 'Administração' }))
}

/** Abre a aba do catálogo na Administração e devolve a seção dela. */
export async function abrirCatalogo() {
  await irParaAdministracao()
  fireEvent.click(await screen.findByRole('tab', { name: 'Catálogo de etapas' }))
  return within(await screen.findByRole('region', { name: 'Catálogo de etapas' }))
}

/** O texto de cada linha da tabela do catálogo, sem o cabeçalho. */
export async function linhasDoCatalogo(secao: ReturnType<typeof within>): Promise<string[]> {
  const linhas = await secao.findAllByRole('row')
  // Sem a terceira célula (a caixa do responsável inicial): o texto das opções entraria no textContent.
  return linhas.slice(1).map((linha: HTMLElement) => [...linha.querySelectorAll('td')].filter((_, posicao) => posicao !== 2).map((celula) => celula.textContent ?? '').join(''))
}
