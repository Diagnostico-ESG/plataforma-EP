import type { EventoDoCadastro } from '../cadastros/tipos'
import type { ProcessoLido } from '../processos/tipos'
import type { RevisaoInterna } from './tipos'

// O estado como o gatilho do banco o guarda (migração revisao_interna): as versões como "V7", o resultado, o escopo,
// o comentário, o revisor e a data da revisão.
function estadoDaRevisao(processo: ProcessoLido, revisao: RevisaoInterna): Record<string, unknown> {
  return {
    processo_nome: processo.nome, setor_sigla: processo.setorSigla, versao_revisada: `V${revisao.versaoRevisada}`,
    versao_corrigida: revisao.versaoCorrigida === null ? null : `V${revisao.versaoCorrigida}`, resultado: revisao.resultado,
    escopo: revisao.escopo, comentario: revisao.comentario, revisor_nome: revisao.revisor, revisada_em: revisao.revisadaEm,
  }
}

/**
 * O evento que o gatilho do banco grava (migrações revisao_interna, editar_registros e registrar_revisao_e_aprovacao):
 * entidade "revisao_interna", referência no processo. "Registrar" tem o antes vazio; "editar" leva o estado anterior.
 */
export function eventoDaRevisao(
  processo: ProcessoLido, acao: 'registrar' | 'editar', depois: RevisaoInterna, autor: string, antes?: RevisaoInterna,
): EventoDoCadastro {
  return {
    id: Date.now(), ocorridoEm: `${depois.revisadaEm}T12:00:00Z`, autor, acao, entidade: 'revisao_interna',
    entidadeRef: processo.id, antes: antes ? estadoDaRevisao(processo, antes) : null, depois: estadoDaRevisao(processo, depois),
  }
}
