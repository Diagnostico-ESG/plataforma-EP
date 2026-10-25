import './Agora.css'
import { useState } from 'react'
import type { MovimentoDoProcessoEmUso } from '../../hooks/useMovimentoDoProcesso'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import type { Executar } from '../../hooks/useGravacaoComFalha'
import { fraseDaConsulta, rotuloDoAgora } from '../../processos/agoraDoProcesso'
import { diasDoProcessoNaEtapa, passouDoLimite } from '../../processos/diasNaEtapa'
import type { PedidoDeSituacao } from '../../processos/pedidosDeSituacao'
import { ROTULO_DA_SITUACAO } from '../../processos/rotulos'
import { textoDaPublicacaoNoAgora } from '../../processos/publicacao'
import { hojeLocal } from '../../processos/textoDaReuniao'
import type { ModuloDeProcessos, ProcessoLido, UsuarioResponsavel } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import { JanelaDeSituacao } from './AcoesDeSituacao'
import { LinhaDaPublicacao } from './AgoraDaPublicacao'
import { AgoraDoArquivado } from './AgoraDoConcluido'
import { CorpoDoAgora } from './CorpoDoAgora'
import { DiasNaEtapa } from './DiasNaEtapa'
import { RegistrosDoAgora } from './RegistrosDoAgora'

type AgoraDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  usuarios: UsuarioResponsavel[]
  /** Quem está na tela. */
  usuarioId: string
  podeAlterar: boolean
  movimento: MovimentoDoProcessoEmUso
  /** O módulo e os registros (revisões e aprovação) que o Agora mostra e grava na Revisão interna e na Aprovação pelo setor. */
  revisoes: ModuloDeRevisoes
  registros: RegistrosDoProcesso
  /** Grava a situação (Retomar) e o arquivamento, e guarda a falha para o verso mostrar. */
  executar: Executar
  aoMudar: () => void
}

/**
 * O cartão "Agora": o que há a fazer no processo, no alto da coluna esquerda do verso (spec, "Agora do verso"). Quem altera
 * move o processo, muda a etiqueta e troca o responsável por listas que gravam ao escolher; a Consulta lê uma frase.
 * Suspenso e cancelado congelam tudo e oferecem só [Retomar]; o arquivado, só [Desarquivar].
 */
export function AgoraDoProcesso(props: AgoraDoProcessoProps) {
  const { processo, processos, podeAlterar, executar, aoMudar } = props
  const [pedido, setPedido] = useState<PedidoDeSituacao | null>(null)
  const { situacao, etapaAtual } = processo
  if (etapaAtual === null) return null
  const arquivado = Boolean(processo.arquivadoEm)
  const parado = situacao === 'suspenso' || situacao === 'cancelado'
  const rotulo = parado || arquivado ? 'Agora' : rotuloDoAgora(etapaAtual.posicao, etapaAtual.total)
  return (
    <section className={classeDoAgora(situacao, podeAlterar, arquivado)} aria-label={rotulo}>
      <ConteudoDoAgora {...props} rotulo={rotulo} arquivado={arquivado} parado={parado} aoRetomar={() => setPedido('retomar')} />
      <JanelaDeSituacao processo={processo} processos={processos} pedido={pedido} executar={executar}
        aoFechar={() => setPedido(null)} aoMudar={aoMudar} />
    </section>
  )
}

type ConteudoDoAgoraProps = AgoraDoProcessoProps & { rotulo: string; arquivado: boolean; parado: boolean; aoRetomar: () => void }

// Arquivado, suspenso e cancelado têm o seu texto; o resto é o corpo com as listas (quem altera) ou a frase (Consulta).
function ConteudoDoAgora(props: ConteudoDoAgoraProps) {
  const { processo, processos, podeAlterar, executar, aoMudar, rotulo } = props
  if (props.arquivado) {
    return <AgoraDoArquivado processo={processo} processos={processos} podeAlterar={podeAlterar} executar={executar} aoMudar={aoMudar} />
  }
  if (props.parado) {
    return <SituacaoParada processo={processo} processos={processos} podeAlterar={podeAlterar} executar={executar} aoMudar={aoMudar} aoRetomar={props.aoRetomar} />
  }
  if (!podeAlterar) return <AgoraDaConsulta processo={processo} rotulo={rotulo} revisoes={props.revisoes} registros={props.registros} usuarioId={props.usuarioId} />
  return <CorpoDoAgora {...props} rotulo={rotulo} />
}

function classeDoAgora(situacao: ProcessoLido['situacao'], podeAlterar: boolean, arquivado: boolean): string {
  if (arquivado) return 'agora agora-concluido'
  if (situacao === 'suspenso' || situacao === 'cancelado') return `agora agora-${situacao}`
  return podeAlterar ? 'agora' : 'agora agora-leitura'
}

type SituacaoParadaProps = Pick<AgoraDoProcessoProps, 'processo' | 'processos' | 'podeAlterar' | 'executar' | 'aoMudar'> & { aoRetomar: () => void }

// Suspenso e cancelado congelam a etapa, a etiqueta e o responsável; a tela diz onde o processo parou e por quê, e oferece
// [Arquivar] ao lado de [Retomar].
function SituacaoParada({ processo, processos, podeAlterar, executar, aoMudar, aoRetomar }: SituacaoParadaProps) {
  const rotulo = ROTULO_DA_SITUACAO[processo.situacao]
  return (
    <>
      <p className="agora-rotulo">Agora</p>
      <p className="agora-situacao">{processo.motivoDaSituacao ? `${rotulo}: ${processo.motivoDaSituacao}` : rotulo}</p>
      <p className="agora-linha-de-texto">{fraseDaConsulta(processo, hojeLocal())}</p>
      <p className="agora-explicacao">Retome o processo para mudar a etapa, a etiqueta ou o responsável.</p>
      {podeAlterar && (
        <div className="agora-botoes">
          <button type="button" className="botao botao-secundario" onClick={() => executar(() => processos.arquivar(processo.id), aoMudar)}>
            Arquivar
          </button>
          <button type="button" className="botao botao-principal" onClick={aoRetomar}>Retomar</button>
        </div>
      )}
    </>
  )
}

// A Consulta só lê: a frase com a etapa, a etiqueta e o responsável, e o selo âmbar quando o processo está parado.
type AgoraDaConsultaProps = Pick<AgoraDoProcessoProps, 'processo' | 'revisoes' | 'registros' | 'usuarioId'> & { rotulo: string }

function AgoraDaConsulta({ processo, rotulo, revisoes, registros, usuarioId }: AgoraDaConsultaProps) {
  const dias = diasDoProcessoNaEtapa(processo, hojeLocal())
  const publicacao = textoDaPublicacaoNoAgora(processo)
  return (
    <>
      <p className="agora-rotulo">{rotulo}</p>
      <p className="agora-responsavel">
        <span>{fraseDaConsulta(processo, hojeLocal())}</span>
        {dias !== null && passouDoLimite(dias) && <DiasNaEtapa dias={dias} />}
      </p>
      {publicacao && <LinhaDaPublicacao texto={publicacao} link={processo.linkDaPublicacao} />}
      <RegistrosDoAgora processo={processo} revisoes={revisoes} registros={registros} usuarioId={usuarioId} podeAlterar={false} />
    </>
  )
}
