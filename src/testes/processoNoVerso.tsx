import { render } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { hojeLocal } from '../processos/textoDaModelagemPiloto'
import type { ProcessoLido, UsuarioResponsavel } from '../processos/tipos'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { RevisoesFalso } from '../revisoes/RevisoesFalso'
import { PlanilhasFalso } from '../planilhas/PlanilhasFalso'
import { CATALOGO_DE_TESTE, umProcessoLido } from './processoDaLista'

export const EU: UsuarioResponsavel = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }
export const BIA: UsuarioResponsavel = { id: 'u2', nome: 'Bia Teste' }

/** A data (AAAA-MM-DD) de `dias` dias atrás, no relógio de quem usa. */
export function diasAtras(dias: number): string {
  const dia = new Date()
  dia.setDate(dia.getDate() - dias)
  return hojeLocal(dia)
}

/**
 * O processo "Emitir Ofício" (p1) na etapa pedida (Revisão interna por padrão), sem responsável, com A fazer e entrada de
 * hoje. As etapas do verso saem do catálogo de teste quando a falsa lê o processo.
 */
export function processoLido(mudancas: Partial<ProcessoLido> = {}, etapa = 'revisao_interna'): ProcessoLido {
  return umProcessoLido('Emitir Ofício', { id: 'p1', responsavel: null, entrouNaEtapaEm: diasAtras(0), ...mudancas }, etapa)
}

/** O aplicativo inteiro com o processo aberto no verso (endereço #/processos/{id}); `outros` são o pai e os subprocessos. */
export function montarVerso(
  processo: ProcessoLido, perfil: Perfil = 'integrante_ep', outros: ProcessoLido[] = [],
  /** Prepara a falsa antes de a tela montar (as Anotações, por exemplo, são lidas ao abrir o verso). */
  preparar?: (falso: ProcessosFalso) => void,
): ProcessosFalso {
  window.location.hash = `#/processos/${processo.id}`
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = [processo, ...outros]
  falso.usuariosPossiveis = [EU, BIA]
  falso.etapasDoCatalogo = CATALOGO_DE_TESTE
  preparar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso(falso)} planilhas={new PlanilhasFalso()} />)
  return falso
}
