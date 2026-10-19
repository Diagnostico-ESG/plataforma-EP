import { FRASE_SEM_VERSAO } from '../processos/frasesDaVersaoCompleta'
import type { UltimaVersao } from '../processos/tipos'
import { FRASE_DA_CORRIGIDA_SEM_ANTERIOR, FRASE_DA_CORRIGIDA_SEM_VERSAO_DO_REVISOR, fraseDoRevisorQueEAutor } from './frasesDeRevisao'

export type OpcaoDaRevisao = { disponivel: boolean; previa: string; motivo: string | null }
/** `bloqueio` é a frase da janela quando nenhuma opção cabe (o botão principal fica desabilitado). */
export type OpcoesDaRevisao = { semAlteracao: OpcaoDaRevisao; corrigida: OpcaoDaRevisao; bloqueio: string | null }

const indisponivel = (motivo: string): OpcaoDaRevisao => ({ disponivel: false, previa: '', motivo })

function corrigidaDoAutor(ultima: UltimaVersao, usuarioId: string): OpcaoDaRevisao {
  const anterior = ultima.anterior
  if (!anterior) return indisponivel(FRASE_DA_CORRIGIDA_SEM_ANTERIOR)
  if (anterior.autorId === usuarioId) return indisponivel(fraseDoRevisorQueEAutor(anterior.numero))
  return { disponivel: true, previa: `a V${ultima.numero}, enviada por você, corrige a V${anterior.numero}`, motivo: null }
}

/**
 * O que a janela de concluir a Revisão interna oferece a quem conclui: "Sem alteração" revisa a versão mais recente,
 * que não pode ser de quem revisa; "Corrigida" só cabe quando a mais recente é de quem revisa e a anterior, de outra
 * pessoa (as mesmas regras do banco, que é quem recusa).
 */
export function opcoesDaRevisao(ultima: UltimaVersao | null, usuarioId: string): OpcoesDaRevisao {
  if (ultima === null) {
    const sem = indisponivel(FRASE_SEM_VERSAO)
    return { semAlteracao: sem, corrigida: sem, bloqueio: FRASE_SEM_VERSAO }
  }
  if (ultima.autorId !== usuarioId) {
    return {
      semAlteracao: { disponivel: true, previa: `segue a V${ultima.numero}`, motivo: null },
      corrigida: indisponivel(FRASE_DA_CORRIGIDA_SEM_VERSAO_DO_REVISOR),
      bloqueio: null,
    }
  }
  const corrigida = corrigidaDoAutor(ultima, usuarioId)
  const frase = fraseDoRevisorQueEAutor(ultima.numero)
  return { semAlteracao: indisponivel(frase), corrigida, bloqueio: corrigida.disponivel ? null : frase }
}
