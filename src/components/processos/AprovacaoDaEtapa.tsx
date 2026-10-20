import { useState } from 'react'
import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import { formatarData } from '../../processos/caminhoDeEtapas'
import type { Aprovacao, ModuloDeRevisoes } from '../../revisoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { JanelaDaAprovacao } from './JanelaDaAprovacao'

type AprovacaoDaEtapaProps = {
  estado: EstadoDoCarregamento<Aprovacao | null>
  aoTentarDeNovo: () => void
  revisoes: ModuloDeRevisoes
  podeEditar: boolean
  /** Lê a aprovação de novo (sem piscar o "Carregando…"), depois de editar. */
  aoAtualizar: () => void
}

// Só endereço http(s) vira link (o banco já garante; a tela não confia no que vem de fora para abrir uma página).
function linkSeguro(link: string | null): string | null {
  return link !== null && /^https?:\/\//i.test(link) ? link : null
}

/**
 * A aprovação na gaveta da Aprovação pelo setor: a versão aprovada, o número do E-protocolo (link em aba nova, quando há
 * link), a data e quem registrou, com o [Editar] para quem pode alterar. A leitura é do verso, que a refaz quando as
 * etapas mudam (conclusão ou volta) e depois de editar.
 */
export function AprovacaoDaEtapa({ estado, aoTentarDeNovo, revisoes, podeEditar, aoAtualizar }: AprovacaoDaEtapaProps) {
  const [editando, setEditando] = useState(false)
  if (estado.tipo === 'carregando') return <p className="etapa-registros-aviso" role="status">Carregando…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="a aprovação" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.valor === null) return <p className="etapa-registros-aviso">Sem aprovação registrada.</p>
  return (
    <>
      <ul className="etapa-registros">
        <RegistroDaAprovacao aprovacao={estado.valor} aoEditar={podeEditar ? () => setEditando(true) : null} />
      </ul>
      {editando && (
        <JanelaDaAprovacao aprovacao={estado.valor} revisoes={revisoes} aoGravar={aoAtualizar} aoFechar={() => setEditando(false)} />
      )}
    </>
  )
}

function AbrirEmAbaNova({ link, texto }: { link: string; texto: string }) {
  return <a href={link} target="_blank" rel="noopener noreferrer">{texto}<span className="etapa-so-leitor"> (abre em nova aba)</span></a>
}

function NumeroDoEProtocolo({ numero, link }: { numero: string | null; link: string | null }) {
  if (numero === null) {
    return <>Sem número do E-protocolo{link && <> · <AbrirEmAbaNova link={link} texto="Abrir o E-protocolo" /></>}</>
  }
  return link ? <AbrirEmAbaNova link={link} texto={numero} /> : <>{numero}</>
}

type RegistroDaAprovacaoProps = { aprovacao: Aprovacao; aoEditar: (() => void) | null }

function RegistroDaAprovacao({ aprovacao, aoEditar }: RegistroDaAprovacaoProps) {
  return (
    <li className="etapa-registro">
      <span className="etapa-registro-cabeca">
        <strong>{`V${aprovacao.versao} aprovada`}</strong>{aprovacao.aprovadaEm && ` · ${formatarData(aprovacao.aprovadaEm)}`}
      </span>
      <span className="etapa-registro-resultado">
        <NumeroDoEProtocolo numero={aprovacao.numeroEprotocolo} link={linkSeguro(aprovacao.link)} />
      </span>
      <span className="etapa-nota">{`Registrada por ${aprovacao.registradaPor ?? '—'}`}</span>
      {aoEditar && (
        <button type="button" className="botao botao-secundario etapa-registro-editar"
          aria-label={`Editar a aprovação da V${aprovacao.versao}`} onClick={aoEditar}>
          Editar
        </button>
      )}
    </li>
  )
}
