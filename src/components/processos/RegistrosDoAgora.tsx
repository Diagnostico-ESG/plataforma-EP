import { useState } from 'react'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import { CODIGO_DA_APROVACAO, CODIGO_DA_REVISAO_INTERNA } from '../../processos/codigosDasEtapas'
import type { ProcessoLido } from '../../processos/tipos'
import { resumoDaAprovacao, resumoDaRevisao } from '../../revisoes/opcoesDaRevisao'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import { JanelaDaAprovacao } from './JanelaDaAprovacao'
import { JanelaDaRevisao } from './JanelaDaRevisao'
import { JanelaDeRegistroDaAprovacao } from './JanelaDeRegistroDaAprovacao'
import { JanelaDeRegistroDaRevisao } from './JanelaDeRegistroDaRevisao'

type RegistrosDoAgoraProps = {
  processo: ProcessoLido
  revisoes: ModuloDeRevisoes
  registros: RegistrosDoProcesso
  /** Quem está na tela. */
  usuarioId: string
  /** A Consulta lê o resumo do registro, sem botões. */
  podeAlterar: boolean
}

type Janela = 'registrar' | 'editar' | null

/**
 * O que o Agora acrescenta na Revisão interna e na Aprovação pelo setor (ADR 0023): o registro da passagem ou da
 * aprovação, em resumo, e os botões para registrar e editar. Registrar não move o processo.
 */
export function RegistrosDoAgora(props: RegistrosDoAgoraProps) {
  const codigo = props.processo.etapaAtual?.codigo
  if (codigo === CODIGO_DA_REVISAO_INTERNA) return <RevisaoDoAgora {...props} />
  if (codigo === CODIGO_DA_APROVACAO) return <AprovacaoDoAgora {...props} />
  return null
}

// A revisão da passagem aberta: o resumo com [Editar revisão], ou [Registrar revisão] enquanto não há.
function RevisaoDoAgora({ processo, revisoes, registros, usuarioId, podeAlterar }: RegistrosDoAgoraProps) {
  const [janela, setJanela] = useState<Janela>(null)
  if (registros.revisoes.tipo !== 'pronto') return null
  const atual = registros.revisoes.valor.find((revisao) => revisao.daPassagemAberta)
  const fechar = () => setJanela(null)
  return (
    <>
      {atual && <p className="agora-registro">{resumoDaRevisao(atual)}</p>}
      {podeAlterar && (
        <div className="agora-botoes">
          <button type="button" className={`botao ${atual ? 'botao-secundario' : 'botao-principal'}`}
            onClick={() => setJanela(atual ? 'editar' : 'registrar')}>
            {atual ? 'Editar revisão' : 'Registrar revisão'}
          </button>
        </div>
      )}
      {janela === 'registrar' && (
        <JanelaDeRegistroDaRevisao processoId={processo.id} ultimaVersao={processo.ultimaVersao} usuarioId={usuarioId}
          revisoes={revisoes} aoGravar={registros.atualizar} aoFechar={fechar} />
      )}
      {janela === 'editar' && atual && (
        <JanelaDaRevisao revisao={atual} ultimaVersao={processo.ultimaVersao} revisoes={revisoes} aoGravar={registros.atualizar} aoFechar={fechar} />
      )}
    </>
  )
}

// A aprovação do processo: "V8 aprovada" com [Editar aprovação] quando há, e [Registrar aprovação] para uma nova.
function AprovacaoDoAgora({ processo, revisoes, registros, podeAlterar }: RegistrosDoAgoraProps) {
  const [janela, setJanela] = useState<Janela>(null)
  if (registros.aprovacao.tipo !== 'pronto') return null
  const atual = registros.aprovacao.valor
  const fechar = () => setJanela(null)
  return (
    <>
      {atual && <p className="agora-registro">{resumoDaAprovacao(atual)}</p>}
      {podeAlterar && (
        <div className="agora-botoes">
          {atual && <button type="button" className="botao botao-secundario" onClick={() => setJanela('editar')}>Editar aprovação</button>}
          <button type="button" className={`botao ${atual ? 'botao-secundario' : 'botao-principal'}`} onClick={() => setJanela('registrar')}>
            Registrar aprovação
          </button>
        </div>
      )}
      {janela === 'registrar' && (
        <JanelaDeRegistroDaAprovacao processoId={processo.id} ultimaVersao={processo.ultimaVersao} anterior={atual}
          revisoes={revisoes} aoGravar={registros.atualizar} aoFechar={fechar} />
      )}
      {janela === 'editar' && atual && (
        <JanelaDaAprovacao aprovacao={atual} revisoes={revisoes} aoGravar={registros.atualizar} aoFechar={fechar} />
      )}
    </>
  )
}
