import { useState } from 'react'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import { ehEtapaDeRevisao, oQueSeRevisa, semOQueRevisar } from '../../processos/acaoPrincipalDaEtapa'
import { CODIGO_DA_APROVACAO, CODIGO_DA_VALIDACAO } from '../../processos/codigosDasEtapas'
import type { ProcessoLido } from '../../processos/tipos'
import { resumoDaAprovacao, resumoDaRevisao } from '../../revisoes/opcoesDaRevisao'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { DataDaValidacao } from './DataDaValidacao'
import { JanelaDaAprovacao } from './JanelaDaAprovacao'
import { JanelaDaRevisao } from './JanelaDaRevisao'

type RegistrosDoAgoraProps = {
  processo: ProcessoLido
  revisoes: ModuloDeRevisoes
  /** O módulo de versões: a janela de registrar a aprovação envia o .pdf protocolado por ele. */
  versoes: ModuloDeVersoes
  registros: RegistrosDoProcesso
  /** Quem está na tela. */
  usuarioId: string
  /** A Consulta lê o resumo do registro, sem botões. */
  podeAlterar: boolean
  /** Lê o processo de novo, depois de gravar a data da validação. */
  aoMudar: () => void
}

type Janela = 'editar' | null

/**
 * O que o Agora acrescenta nas duas revisões, na Validação com o setor e na Aprovação pelo setor (ADR 0023 e 0046): o registro da
 * passagem ou da aprovação, em resumo, e os botões para registrar e editar, e a data da validação. Registrar não move o processo.
 */
export function RegistrosDoAgora(props: RegistrosDoAgoraProps) {
  const codigo = props.processo.etapaAtual?.codigo
  if (codigo === CODIGO_DA_VALIDACAO) {
    return <DataDaValidacao processo={props.processo} revisoes={props.revisoes} podeAlterar={props.podeAlterar} aoMudar={props.aoMudar} />
  }
  if (ehEtapaDeRevisao(codigo)) return <RevisaoDoAgora {...props} />
  if (codigo === CODIGO_DA_APROVACAO) return <AprovacaoDoAgora {...props} />
  return null
}

// A revisão da passagem aberta: o resumo com [Editar revisão], ou [Registrar revisão] enquanto não há; sem o que revisar,
// a frase do que falta (a ação principal passa a ser o [Enviar versão]).
function RevisaoDoAgora({ processo, revisoes, registros, podeAlterar }: RegistrosDoAgoraProps) {
  const [janela, setJanela] = useState<Janela>(null)
  if (registros.revisoes.tipo !== 'pronto') return null
  const atual = registros.revisoes.valor.find((revisao) => revisao.daPassagemAberta)
  // Sem registro, uma frase só: o que falta para revisar ou o que se revisa.
  const semRegistro = atual ? null : semOQueRevisar(processo) ?? oQueSeRevisa(processo)
  const fechar = () => setJanela(null)
  return (
    <>
      {atual && <p className="agora-registro">{resumoDaRevisao(atual)}</p>}
      {semRegistro && <p className="agora-registro">{semRegistro}</p>}
      {podeAlterar && atual && (
        <div className="agora-botoes">
          <button type="button" className="botao botao-secundario" onClick={() => setJanela('editar')}>Editar revisão</button>
        </div>
      )}
      {janela === 'editar' && atual && (
        <JanelaDaRevisao revisao={atual} processo={processo} revisoes={revisoes} aoGravar={registros.atualizar} aoFechar={fechar} />
      )}
    </>
  )
}

// A aprovação do processo: "V8 aprovada" com [Editar aprovação] quando há; registrar uma nova é a ação principal do cabeçalho.
function AprovacaoDoAgora({ revisoes, registros, podeAlterar }: RegistrosDoAgoraProps) {
  const [janela, setJanela] = useState<Janela>(null)
  if (registros.aprovacao.tipo !== 'pronto') return null
  const atual = registros.aprovacao.valor
  const fechar = () => setJanela(null)
  return (
    <>
      {atual && <p className="agora-registro">{resumoDaAprovacao(atual)}</p>}
      {podeAlterar && atual && (
        <div className="agora-botoes">
          <button type="button" className="botao botao-secundario" onClick={() => setJanela('editar')}>Editar aprovação</button>
        </div>
      )}
      {janela === 'editar' && atual && (
        <JanelaDaAprovacao aprovacao={atual} revisoes={revisoes} aoGravar={registros.atualizar} aoFechar={fechar} />
      )}
    </>
  )
}
