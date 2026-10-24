import { render } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import type { ProcessoLido, UltimaVersao } from '../processos/tipos'
import { RevisoesFalso } from '../revisoes/RevisoesFalso'
import { PlanilhasFalso } from '../planilhas/PlanilhasFalso'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { CATALOGO_DE_TESTE } from './processoDaLista'
import { BIA, EU, processoLido } from './processoNoVerso'

// O verso do processo no aplicativo inteiro, na Aprovação pelo setor por padrão, para as suítes de tela que leem ou
// editam os registros de revisão e aprovação (registrar sem trava chega no ticket 05 de revisoes-aprovacao).

export const REVISAO_DO_SETOR = 'Validação com o setor'
export const APROVACAO = 'Aprovação pelo setor'
export const PUBLICACAO = 'Publicação'
export const COMPLETA = ['bpm', 'png', 'relatorio'] as const

export const versao = (papeis: UltimaVersao['papeis'] = [...COMPLETA]): UltimaVersao =>
  ({ numero: 8, autorId: BIA.id, autorNome: BIA.nome, papeis })

export type Falsos = { falso: ProcessosFalso; revisoes: RevisoesFalso; versoes: VersoesFalso }
export type Opcoes = {
  perfil?: Perfil
  mudancas?: Partial<ProcessoLido>
  /** O código da etapa atual (a Aprovação pelo setor por padrão). */
  etapa?: string
  /** Prepara os falsos antes de o aplicativo montar (as leituras começam ao montar). */
  ajustar?: (falsos: Falsos) => void
}

// O verso do processo no aplicativo inteiro, sob quem está na tela como responsável.
export function montar(ultimaVersao: UltimaVersao | null, { perfil = 'integrante_ep', mudancas = {}, etapa = 'aprovacao_setor', ajustar }: Opcoes = {}) {
  window.location.hash = '#/processos/p1'
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = [processoLido({ responsavel: { id: EU.id, nome: EU.nome, fotoUrl: null }, ultimaVersao, ...mudancas }, etapa)]
  falso.usuariosPossiveis = [EU, BIA]
  falso.quemChama = EU
  falso.etapasDoCatalogo = CATALOGO_DE_TESTE
  const versoes = new VersoesFalso()
  const revisoes = new RevisoesFalso(falso, EU)
  ajustar?.({ falso, revisoes, versoes })
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso}
    versoes={versoes} revisoes={revisoes} planilhas={new PlanilhasFalso()} />)
  return { falso, revisoes, versoes }
}
