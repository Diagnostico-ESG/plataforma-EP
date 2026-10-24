import { useCallback, useState } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import { formatarData } from '../../lib/datas'
import { ROTULO_DO_ESCOPO, rotuloDoResultado } from '../../revisoes/frasesDeRevisao'
import type { ModuloDeRevisoes, RevisaoInterna } from '../../revisoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { JanelaDaRevisao } from './JanelaDaRevisao'

type RevisoesDaEtapaProps = { revisoes: ModuloDeRevisoes; processoId: string; podeEditar: boolean }

/**
 * As revisões na gaveta da Revisão interna, da mais recente para a mais antiga: a versão revisada, o revisor, a data, o
 * resultado (com o escopo) e o comentário, com o [Editar] para quem pode alterar. Lê ao abrir a gaveta, e o Verso a
 * desmonta ao fechar, então a lista sempre vem atual; depois de editar, lê de novo.
 */
export function RevisoesDaEtapa({ revisoes, processoId, podeEditar }: RevisoesDaEtapaProps) {
  const ler = useCallback(() => revisoes.listarRevisoes(processoId), [revisoes, processoId])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const [editando, setEditando] = useState<RevisaoInterna | null>(null)
  if (estado.tipo === 'carregando') return <p className="etapa-registros-aviso" role="status">Carregando…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="as revisões" aoTentarDeNovo={tentarDeNovo} />
  if (estado.valor.length === 0) return <p className="etapa-registros-aviso">Nenhuma revisão registrada.</p>
  return (
    <>
      <ul className="etapa-registros">
        {estado.valor.map((revisao) => (
          <RegistroDaRevisao key={revisao.id} revisao={revisao} aoEditar={podeEditar ? () => setEditando(revisao) : null} />
        ))}
      </ul>
      {editando && (
        <JanelaDaRevisao revisao={editando} revisoes={revisoes} aoGravar={recarregar} aoFechar={() => setEditando(null)} />
      )}
    </>
  )
}

type RegistroDaRevisaoProps = { revisao: RevisaoInterna; aoEditar: (() => void) | null }

function RegistroDaRevisao({ revisao, aoEditar }: RegistroDaRevisaoProps) {
  const resultado = revisao.escopo ? `${rotuloDoResultado(revisao)} · ${ROTULO_DO_ESCOPO[revisao.escopo]}` : rotuloDoResultado(revisao)
  return (
    <li className="etapa-registro">
      <span className="etapa-registro-cabeca">V{revisao.versaoRevisada} · {revisao.revisor ?? '—'} · {formatarData(revisao.revisadaEm)}</span>
      <span className="etapa-registro-resultado">{resultado}</span>
      {revisao.comentario && <span className="etapa-nota">{revisao.comentario}</span>}
      {aoEditar && (
        <button type="button" className="botao botao-secundario etapa-registro-editar"
          aria-label={`Editar a revisão da V${revisao.versaoRevisada}`} onClick={aoEditar}>
          Editar
        </button>
      )}
    </li>
  )
}
