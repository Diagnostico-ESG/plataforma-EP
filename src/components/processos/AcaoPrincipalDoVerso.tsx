import { useState } from 'react'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import { type AcaoPrincipal, acaoPrincipalDaEtapa } from '../../processos/acaoPrincipalDaEtapa'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
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

// Enquanto os registros não chegam, o botão não aparece: a revisão da passagem decide se ele existe (como o Agora fazia).
function acaoDoCabecalho(props: AcaoPrincipalDoVersoProps): AcaoPrincipal | null {
  const { processo, registros, podeAlterar } = props
  if (registros.revisoes.tipo !== 'pronto' || registros.aprovacao.tipo !== 'pronto') return null
  const temRevisao = registros.revisoes.valor.some((revisao) => revisao.daPassagemAberta)
  return acaoPrincipalDaEtapa(processo, podeAlterar, temRevisao)
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
      <JanelaDeRegistroDaRevisao processoId={processo.id} ultimaVersao={processo.ultimaVersao} usuarioId={usuarioId}
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
