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

/** O evento "editar" que o gatilho do banco grava (migração editar_registros): entidade "revisao_interna", antes e depois. */
export function eventoDaRevisaoEditada(
  processo: ProcessoLido, antes: RevisaoInterna, depois: RevisaoInterna, autor: string,
): EventoDoCadastro {
  return {
    id: Date.now(), ocorridoEm: `${depois.revisadaEm}T12:00:00Z`, autor, acao: 'editar', entidade: 'revisao_interna',
    entidadeRef: processo.id, antes: estadoDaRevisao(processo, antes), depois: estadoDaRevisao(processo, depois),
  }
}
