import { useState } from 'react'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import { formatarData } from '../../lib/datas'
import type { ProcessoLido } from '../../processos/tipos'
import { ROTULO_DO_ESCOPO, rotuloDoResultado } from '../../revisoes/frasesDeRevisao'
import { alvoDaRevisao, tituloDaEdicao } from '../../revisoes/opcoesDaRevisao'
import type { EtapaDaRevisao, ModuloDeRevisoes, RevisaoInterna } from '../../revisoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { JanelaDaRevisao } from './JanelaDaRevisao'

type RevisoesDaEtapaProps = {
  /** De qual revisão é a gaveta: ela lista só as revisões dela (as antigas, sem etapa, são da Revisão do fluxograma). */
  etapa: EtapaDaRevisao
  revisoes: ModuloDeRevisoes
  registros: RegistrosDoProcesso
  /** A versão e o relatório mais recentes, para a janela de editar a revisão. */
  processo: Pick<ProcessoLido, 'ultimaVersao' | 'ultimoRelatorio'>
  podeEditar: boolean
}

/**
 * As revisões na gaveta de cada revisão, de todas as passagens, da mais recente para a mais antiga: o que foi revisado, o
 * revisor, a data, o resultado (com o escopo) e o comentário, com o [Editar] para quem pode alterar. A leitura é do verso,
 * que a refaz quando o processo muda de etapa e depois de registrar ou editar.
 */
export function RevisoesDaEtapa({ etapa, revisoes, registros, processo, podeEditar }: RevisoesDaEtapaProps) {
  const { revisoes: estado, tentarDeNovo, atualizar } = registros
  const [editando, setEditando] = useState<RevisaoInterna | null>(null)
  if (estado.tipo === 'carregando') return <p className="etapa-registros-aviso" role="status">Carregando…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="as revisões" aoTentarDeNovo={tentarDeNovo} />
  const dela = estado.valor.filter((revisao) => (revisao.etapa ?? 'revisao_interna') === etapa)
  if (dela.length === 0) return <p className="etapa-registros-aviso">Nenhuma revisão registrada.</p>
  return (
    <>
      <ul className="etapa-registros">
        {dela.map((revisao) => (
          <RegistroDaRevisao key={revisao.id} revisao={revisao} aoEditar={podeEditar ? () => setEditando(revisao) : null} />
        ))}
      </ul>
      {editando && (
        <JanelaDaRevisao revisao={editando} processo={processo} revisoes={revisoes} aoGravar={atualizar}
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
      <span className="etapa-registro-cabeca">{alvoDaRevisao(revisao)} · {revisao.revisor ?? '—'} · {formatarData(revisao.revisadaEm)}</span>
      <span className="etapa-registro-resultado">{resultado}</span>
      {revisao.comentario && <span className="etapa-nota">{revisao.comentario}</span>}
      {aoEditar && (
        <button type="button" className="botao botao-secundario etapa-registro-editar"
          aria-label={tituloDaEdicao(revisao)} onClick={aoEditar}>
          Editar
        </button>
      )}
    </li>
  )
}
