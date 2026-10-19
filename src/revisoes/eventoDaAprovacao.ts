import type { EventoDoCadastro } from '../cadastros/tipos'
import type { ProcessoLido } from '../processos/tipos'
import type { Aprovacao } from './tipos'

/** O evento que o gatilho do banco grava (migração aprovacao): entidade "aprovacao", referência no processo, antes e depois. */
export function eventoDaAprovacao(processo: ProcessoLido, acao: 'registrar' | 'desfazer', aprovacao: Aprovacao): EventoDoCadastro {
  const estado = {
    processo_nome: processo.nome, setor_sigla: processo.setorSigla, versao: `V${aprovacao.versao}`,
    numero_eprotocolo: aprovacao.numeroEprotocolo, link: aprovacao.link, aprovada_em: aprovacao.aprovadaEm,
    registrada_por_nome: aprovacao.registradaPor,
  }
  return {
    id: Date.now(), ocorridoEm: aprovacao.registradaEm, autor: aprovacao.registradaPor ?? '—', acao, entidade: 'aprovacao',
    entidadeRef: processo.id, antes: acao === 'desfazer' ? estado : null, depois: acao === 'registrar' ? estado : null,
  }
}
