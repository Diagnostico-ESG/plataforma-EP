import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import type { EtapaNoCatalogo } from '../processos/tipos'
import { VersoesFalso } from '../versoes/VersoesFalso'

/** Um catálogo inventado: três etapas ativas, a Modelagem piloto em primeiro, e uma desativada. */
export const ETAPAS_DE_TESTE: EtapaNoCatalogo[] = [
  { id: 'e1', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 1, obrigatoria: true, ativa: true },
  { id: 'e2', codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', ordem: 2, obrigatoria: true, ativa: true },
  { id: 'e9', codigo: 'publicacao', nome: 'Publicação', ordem: 6, obrigatoria: false, ativa: true },
  { id: 'e10', codigo: 'arquivamento', nome: 'Arquivamento', ordem: 7, obrigatoria: false, ativa: false },
]

type MontagemDoCatalogo = { perfil?: Perfil; ajustar?: (processos: ProcessosFalso) => void }

/** O aplicativo inteiro com o catálogo de teste, para o perfil pedido (administrador por padrão). */
export function montarComCatalogo({ perfil = 'administrador', ajustar }: MontagemDoCatalogo = {}): ProcessosFalso {
  const processos = new ProcessosFalso()
  processos.catalogo.etapas = [...ETAPAS_DE_TESTE]
  ajustar?.(processos)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={processos} versoes={new VersoesFalso()} />)
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
  return linhas.slice(1).map((linha: HTMLElement) => linha.textContent ?? '')
}
