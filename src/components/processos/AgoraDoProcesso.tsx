import './Agora.css'
import { useState } from 'react'
import type { MovimentoDoProcessoEmUso } from '../../hooks/useMovimentoDoProcesso'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import type { Executar } from '../../hooks/useGravacaoComFalha'
import { fraseDaSituacaoParada, nomeDoResponsavel, ondeEstaOProcesso, rotuloDoAgora } from '../../processos/agoraDoProcesso'
import type { PedidoDeSituacao } from '../../processos/pedidosDeSituacao'
import { ROTULO_DA_SITUACAO } from '../../processos/rotulos'
import { textoDaPublicacaoNoAgora } from '../../processos/publicacao'
import { hojeEmBrasilia } from '../../lib/datas'
import type { ModuloDeProcessos, ProcessoLido, UsuarioResponsavel } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { JanelaDeSituacao } from './AcoesDeSituacao'
import { LinhaDaPublicacao } from './AgoraDaPublicacao'
import { CorpoDoAgora, FotoDoResponsavel, SeloDeParadoNoAgora } from './CorpoDoAgora'
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
  /** O módulo de versões: a janela de registrar a aprovação envia o .pdf protocolado por ele. */
  versoes: ModuloDeVersoes
  registros: RegistrosDoProcesso
  /** Grava a situação (Retomar) e guarda a falha para o verso mostrar. */
  executar: Executar
  aoMudar: () => void
}

/**
 * O cartão "Agora": o que há a fazer no processo, no alto da coluna esquerda do verso (spec, "Agora do verso"). Quem altera
 * move o processo, muda a etiqueta e troca o responsável por listas que gravam ao escolher; a Consulta lê uma frase.
 * Suspenso e cancelado congelam tudo e oferecem só [Retomar].
 */
export function AgoraDoProcesso(props: AgoraDoProcessoProps) {
  const { processo, processos, podeAlterar, executar, aoMudar } = props
  const [pedido, setPedido] = useState<PedidoDeSituacao | null>(null)
  const { situacao, etapaAtual } = processo
  if (etapaAtual === null) return null
  const parado = situacao === 'suspenso' || situacao === 'cancelado'
  const rotulo = parado ? 'Agora' : rotuloDoAgora(etapaAtual.posicao, etapaAtual.total)
  return (
    <section className={classeDoAgora(situacao, podeAlterar)} aria-label={rotulo}>
      <ConteudoDoAgora {...props} rotulo={rotulo} parado={parado} aoRetomar={() => setPedido('retomar')} />
      <JanelaDeSituacao processo={processo} processos={processos} pedido={pedido} executar={executar}
        aoFechar={() => setPedido(null)} aoMudar={aoMudar} />
    </section>
  )
}

type ConteudoDoAgoraProps = AgoraDoProcessoProps & { rotulo: string; parado: boolean; aoRetomar: () => void }

// Suspenso e cancelado têm o seu texto; o resto é o corpo com as listas (quem altera) ou a frase (Consulta).
function ConteudoDoAgora(props: ConteudoDoAgoraProps) {
  const { processo, podeAlterar, rotulo } = props
  if (props.parado) {
    return <SituacaoParada processo={processo} podeAlterar={podeAlterar} aoRetomar={props.aoRetomar} />
  }
  if (!podeAlterar) {
    return <AgoraDaConsulta processo={processo} rotulo={rotulo} revisoes={props.revisoes} versoes={props.versoes} registros={props.registros} usuarioId={props.usuarioId} />
  }
  return <CorpoDoAgora {...props} rotulo={rotulo} />
}

function classeDoAgora(situacao: ProcessoLido['situacao'], podeAlterar: boolean): string {
  if (situacao === 'suspenso' || situacao === 'cancelado') return `agora agora-${situacao}`
  return podeAlterar ? 'agora' : 'agora agora-leitura'
}

type SituacaoParadaProps = Pick<AgoraDoProcessoProps, 'processo' | 'podeAlterar'> & { aoRetomar: () => void }

// Suspenso e cancelado congelam a etapa, a etiqueta e o responsável; a tela diz onde o processo parou e por quê, e oferece
// [Retomar].
function SituacaoParada({ processo, podeAlterar, aoRetomar }: SituacaoParadaProps) {
  const rotulo = ROTULO_DA_SITUACAO[processo.situacao]
  return (
    <>
      <p className="agora-rotulo">Agora</p>
      <p className="agora-situacao">{processo.motivoDaSituacao ? `${rotulo}: ${processo.motivoDaSituacao}` : rotulo}</p>
      <p className="agora-linha-de-texto">{fraseDaSituacaoParada(processo, hojeEmBrasilia())}</p>
      <p className="agora-explicacao">Retome o processo para mudar a etapa, a etiqueta ou o responsável.</p>
      {podeAlterar && (
        <div className="agora-botoes">
          <button type="button" className="botao botao-principal" onClick={aoRetomar}>Retomar</button>
        </div>
      )}
    </>
  )
}

// A Consulta só lê: a etapa e a etiqueta, a foto e o nome do responsável em texto (nada sem ninguém) e o selo vermelho
// quando o processo está parado.
type AgoraDaConsultaProps = Pick<AgoraDoProcessoProps, 'processo' | 'revisoes' | 'versoes' | 'registros' | 'usuarioId'> & { rotulo: string }

function AgoraDaConsulta({ processo, rotulo, revisoes, versoes, registros, usuarioId }: AgoraDaConsultaProps) {
  const publicacao = textoDaPublicacaoNoAgora(processo)
  const nome = nomeDoResponsavel(processo)
  return (
    <>
      <p className="agora-rotulo">{rotulo}</p>
      <p className="agora-linha-de-texto">{ondeEstaOProcesso(processo)}</p>
      <p className="agora-responsavel">
        {nome && <><FotoDoResponsavel processo={processo} /><span>{nome}</span></>}
        <SeloDeParadoNoAgora processo={processo} />
      </p>
      {publicacao && <LinhaDaPublicacao texto={publicacao} link={processo.linkDaPublicacao} />}
      <RegistrosDoAgora processo={processo} revisoes={revisoes} versoes={versoes} registros={registros} usuarioId={usuarioId} podeAlterar={false}
        aoMudar={() => {}} />
    </>
  )
}
