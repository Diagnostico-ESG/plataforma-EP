import type { EventoDoCadastro } from '../cadastros/tipos'
import type { ProcessoLido } from '../processos/tipos'
import { rotuloDoRelatorio as rotuloDoNumero } from '../versoes/rotuloDoRelatorio'
import type { RevisaoInterna } from './tipos'

const rotuloDoRelatorio = (numero: number | null | undefined) => (numero ? rotuloDoNumero(numero) : null)

// O estado como o gatilho do banco o guarda (migrações revisao_interna, duas_revisoes_registro e relatorio_com_r): a etapa, as
// versões como "V7", os relatórios como "Relatório R2", o resultado, o escopo, o comentário, o revisor e a data da revisão.
function estadoDaRevisao(processo: ProcessoLido, revisao: RevisaoInterna): Record<string, unknown> {
  return {
    processo_nome: processo.nome, setor_sigla: processo.setorSigla, etapa: revisao.etapa ?? 'revisao_interna',
    versao_revisada: `V${revisao.versaoRevisada}`, versao_corrigida: revisao.versaoCorrigida === null ? null : `V${revisao.versaoCorrigida}`,
    relatorio_revisado: rotuloDoRelatorio(revisao.relatorioRevisado), relatorio_corrigido: rotuloDoRelatorio(revisao.relatorioCorrigido),
    resultado: revisao.resultado,
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
