import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import { formatarData } from '../../processos/caminhoDeEtapas'
import { ROTULO_DO_ESCOPO, rotuloDoResultado } from '../../revisoes/frasesDeRevisao'
import type { ModuloDeRevisoes, RevisaoInterna } from '../../revisoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'

type RevisoesDaEtapaProps = { revisoes: ModuloDeRevisoes; processoId: string }

/**
 * As revisões na gaveta da Revisão interna, da mais recente para a mais antiga: a versão revisada, o revisor, a data, o
 * resultado (com o escopo) e o comentário. Só leitura: a edição é de outro ticket. Lê ao abrir a gaveta, e o Verso a
 * desmonta ao fechar, então a lista sempre vem atual.
 */
export function RevisoesDaEtapa({ revisoes, processoId }: RevisoesDaEtapaProps) {
  const ler = useCallback(() => revisoes.listarRevisoes(processoId), [revisoes, processoId])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  if (estado.tipo === 'carregando') return <p className="etapa-registros-aviso" role="status">Carregando…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="as revisões" aoTentarDeNovo={tentarDeNovo} />
  if (estado.valor.length === 0) return <p className="etapa-registros-aviso">Nenhuma revisão registrada.</p>
  return (
    <ul className="etapa-registros">
      {estado.valor.map((revisao) => <RegistroDaRevisao key={revisao.id} revisao={revisao} />)}
    </ul>
  )
}

function RegistroDaRevisao({ revisao }: { revisao: RevisaoInterna }) {
  const resultado = revisao.escopo ? `${rotuloDoResultado(revisao)} · ${ROTULO_DO_ESCOPO[revisao.escopo]}` : rotuloDoResultado(revisao)
  return (
    <li className="etapa-registro">
      <span className="etapa-registro-cabeca">V{revisao.versaoRevisada} · {revisao.revisor ?? '—'} · {formatarData(revisao.revisadaEm)}</span>
      <span className="etapa-registro-resultado">{resultado}</span>
      {revisao.comentario && <span className="etapa-nota">{revisao.comentario}</span>}
    </li>
  )
}
