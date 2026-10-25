import { useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarAprovacao } from '../../processos/gravarAcoes'
import type { UltimaVersao } from '../../processos/tipos'
import { MOTIVO_SEM_VERSAO, avisoDaAprovacaoSubstituida } from '../../revisoes/opcoesDaRevisao'
import { RASCUNHO_DA_APROVACAO_VAZIO, dadosDaAprovacao } from '../../revisoes/rascunhoDaAprovacao'
import type { Aprovacao, ModuloDeRevisoes } from '../../revisoes/tipos'
import { CamposDoEProtocolo } from './CamposDoEProtocolo'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDeRegistroDaAprovacaoProps = {
  processoId: string
  /** A versão mais recente: é a que a aprovação cobre. */
  ultimaVersao: UltimaVersao | null
  /** A aprovação que já existe, que a nova substitui; null na primeira. */
  anterior: Aprovacao | null
  revisoes: Pick<ModuloDeRevisoes, 'registrarAprovacao'>
  /** Chamado quando gravou, antes de a janela fechar: quem mostra os registros lê de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

/**
 * Registrar a aprovação (ADR 0023): mostra a versão aprovada (a mais recente) e pede o número, o link e a data do
 * E-protocolo, os três opcionais. Se já há aprovação, avisa que a nova toma o lugar dela.
 */
export function JanelaDeRegistroDaAprovacao({ processoId, ultimaVersao, anterior, revisoes, aoGravar, aoFechar }: JanelaDeRegistroDaAprovacaoProps) {
  const [rascunho, setRascunho] = useState(RASCUNHO_DA_APROVACAO_VAZIO)
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)
  const aviso = avisoDaAprovacaoSubstituida(anterior)

  const registrar = () => gravar(async () => {
    const falhou = await gravarAprovacao(revisoes, processoId, dadosDaAprovacao(rascunho))
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo="Registrar aprovação" rotuloDoSalvar="Registrar" salvando={salvando} falha={falha}
      podeSalvar={ultimaVersao !== null} aoSalvar={registrar} aoFechar={aoFechar}>
      <p className="janela-escolha-pergunta">{ultimaVersao ? `Versão aprovada: V${ultimaVersao.numero}` : MOTIVO_SEM_VERSAO}</p>
      <CamposDoEProtocolo valor={rascunho} aoMudar={setRascunho} />
      {aviso && <p className="agora-aviso" role="status">{aviso}</p>}
    </JanelaDeEdicao>
  )
}
