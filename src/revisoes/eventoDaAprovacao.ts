import type { EventoDoCadastro } from '../cadastros/tipos'
import type { ProcessoLido } from '../processos/tipos'
import type { Aprovacao } from './tipos'

function estadoDaAprovacao(processo: ProcessoLido, aprovacao: Aprovacao): Record<string, unknown> {
  return {
    processo_nome: processo.nome, setor_sigla: processo.setorSigla, versao: `V${aprovacao.versao}`,
    numero_eprotocolo: aprovacao.numeroEprotocolo, link: aprovacao.link, aprovada_em: aprovacao.aprovadaEm,
    registrada_por_nome: aprovacao.registradaPor,
  }
}

/**
 * O evento que o gatilho do banco grava (migrações aprovacao e editar_registros): entidade "aprovacao", referência no
 * processo, antes e depois. "Editar" leva o estado anterior da aprovação em `anterior`.
 */
export function eventoDaAprovacao(
  processo: ProcessoLido, acao: 'registrar' | 'desfazer' | 'editar', aprovacao: Aprovacao, anterior?: Aprovacao,
): EventoDoCadastro {
  const estado = estadoDaAprovacao(processo, aprovacao)
  const antes = acao === 'editar' && anterior ? estadoDaAprovacao(processo, anterior) : null
  return {
    id: Date.now(), ocorridoEm: aprovacao.registradaEm, autor: aprovacao.registradaPor ?? '—', acao, entidade: 'aprovacao',
    entidadeRef: processo.id, antes: acao === 'desfazer' ? estado : antes, depois: acao === 'desfazer' ? null : estado,
  }
}
