import { useState } from 'react'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import { type AcaoPrincipal, acaoPrincipalDaEtapa } from '../../processos/acaoPrincipalDaEtapa'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { contextoDoProcesso } from '../../revisoes/opcoesDaRevisao'
import type { EtapaDaRevisao, ModuloDeRevisoes } from '../../revisoes/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { JanelaDaPublicacao } from './JanelaDaPublicacao'
import { JanelaDeRegistroDaAprovacao } from './JanelaDeRegistroDaAprovacao'
import { JanelaDeRegistroDaRevisao } from './JanelaDeRegistroDaRevisao'

type AcaoPrincipalDoVersoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  revisoes: ModuloDeRevisoes
  versoes: ModuloDeVersoes
  registros: RegistrosDoProcesso
  /** Quem está na tela. */
  usuarioId: string
  podeAlterar: boolean
  aoMudar: () => void
}

const ROTULO_DA_ACAO: Record<AcaoPrincipal, string> = {
  registrar_revisao: 'Registrar revisão', registrar_aprovacao: 'Registrar aprovação', registrar_publicacao: 'Registrar publicação',
}

// Enquanto os registros não chegam (ou se a leitura falha), a revisão e a aprovação não aparecem: a revisão da passagem decide se o
// botão existe (como o Agora fazia). Registrar a publicação não depende deles.
function acaoDoCabecalho(props: AcaoPrincipalDoVersoProps): AcaoPrincipal | null {
  const { processo, registros, podeAlterar } = props
  const prontos = registros.revisoes.tipo === 'pronto' && registros.aprovacao.tipo === 'pronto'
  const temRevisao = registros.revisoes.tipo === 'pronto' && registros.revisoes.valor.some((revisao) => revisao.daPassagemAberta)
  const acao = acaoPrincipalDaEtapa(processo, podeAlterar, temRevisao)
  return prontos || acao === 'registrar_publicacao' ? acao : null
}

/** O botão azul do cabeçalho do verso: o registro que a etapa atual pede (revisão, aprovação ou publicação), com a janela dele. */
export function AcaoPrincipalDoVerso(props: AcaoPrincipalDoVersoProps) {
  const [aberta, setAberta] = useState(false)
  const acao = acaoDoCabecalho(props)
  if (acao === null) return null
  return (
    <>
      <button type="button" className="botao botao-principal" onClick={() => setAberta(true)}>{ROTULO_DA_ACAO[acao]}</button>
      {aberta && <JanelaDaAcao acao={acao} {...props} aoFechar={() => setAberta(false)} />}
    </>
  )
}

function JanelaDaAcao({ acao, aoFechar, ...props }: AcaoPrincipalDoVersoProps & { acao: AcaoPrincipal; aoFechar: () => void }) {
  const { processo, processos, revisoes, versoes, registros, usuarioId } = props
  if (acao === 'registrar_revisao') {
    return (
      <JanelaDeRegistroDaRevisao processoId={processo.id} usuarioId={usuarioId}
        contexto={contextoDoProcesso(processo, processo.etapaAtual?.codigo as EtapaDaRevisao)}
        revisoes={revisoes} aoGravar={registros.atualizar} aoFechar={aoFechar} />
    )
  }
  if (acao === 'registrar_aprovacao') {
    const anterior = registros.aprovacao.tipo === 'pronto' ? registros.aprovacao.valor : null
    return (
      <JanelaDeRegistroDaAprovacao processo={processo} ultimaVersao={processo.ultimaVersao} anterior={anterior}
        revisoes={revisoes} versoes={versoes} aoGravar={registros.atualizar} aoFechar={aoFechar} />
    )
  }
  return <JanelaDaPublicacao processo={processo} processos={processos} aoGravar={props.aoMudar} aoFechar={aoFechar} />
}
