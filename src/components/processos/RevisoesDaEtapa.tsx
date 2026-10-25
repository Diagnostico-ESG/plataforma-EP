import { useState } from 'react'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import { formatarData } from '../../lib/datas'
import type { UltimaVersao } from '../../processos/tipos'
import { ROTULO_DO_ESCOPO, rotuloDoResultado } from '../../revisoes/frasesDeRevisao'
import type { ModuloDeRevisoes, RevisaoInterna } from '../../revisoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { JanelaDaRevisao } from './JanelaDaRevisao'

type RevisoesDaEtapaProps = {
  revisoes: ModuloDeRevisoes
  registros: RegistrosDoProcesso
  ultimaVersao: UltimaVersao | null
  podeEditar: boolean
}

/**
 * As revisões na gaveta da Revisão interna, de todas as passagens, da mais recente para a mais antiga: a versão revisada, o
 * revisor, a data, o resultado (com o escopo) e o comentário, com o [Editar] para quem pode alterar. A leitura é do verso,
 * que a refaz quando o processo muda de etapa e depois de registrar ou editar.
 */
export function RevisoesDaEtapa({ revisoes, registros, ultimaVersao, podeEditar }: RevisoesDaEtapaProps) {
  const { revisoes: estado, tentarDeNovo, atualizar } = registros
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
        <JanelaDaRevisao revisao={editando} ultimaVersao={ultimaVersao} revisoes={revisoes} aoGravar={atualizar}
          aoFechar={() => setEditando(null)} />
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
