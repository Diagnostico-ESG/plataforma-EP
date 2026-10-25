import { useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarRevisao } from '../../processos/gravarAcoes'
import type { UltimaVersao } from '../../processos/tipos'
import { avisoDoAutorDaRevisao, opcoesDoResultado } from '../../revisoes/opcoesDaRevisao'
import { RASCUNHO_VAZIO, type RascunhoDaRevisao, dadosDaRevisao, rascunhoPronto } from '../../revisoes/rascunhoDaRevisao'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import { CampoDoComentario, CampoDoEscopo, CampoDoResultado } from './CamposDaRevisao'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDeRegistroDaRevisaoProps = {
  processoId: string
  /** A versão mais recente e a da passagem: de onde vêm as duas opções. */
  ultimaVersao: UltimaVersao | null
  /** Quem está na tela, para o aviso de quem enviou a versão. */
  usuarioId: string
  revisoes: Pick<ModuloDeRevisoes, 'registrarRevisao'>
  /** Chamado quando gravou, antes de a janela fechar: quem mostra os registros lê de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

/**
 * Registrar a revisão interna (ADR 0023): o resultado com a versão de cada opção, o escopo só na "corrigida" e o
 * comentário opcional. O aviso amarelo diz quando quem registra enviou a versão revisada, e não impede nada.
 */
export function JanelaDeRegistroDaRevisao({ processoId, ultimaVersao, usuarioId, revisoes, aoGravar, aoFechar }: JanelaDeRegistroDaRevisaoProps) {
  const [rascunho, setRascunho] = useState<RascunhoDaRevisao>(RASCUNHO_VAZIO)
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)
  const aviso = rascunho.resultado ? avisoDoAutorDaRevisao(ultimaVersao, rascunho.resultado, usuarioId) : null

  const registrar = () => gravar(async () => {
    const falhou = await gravarRevisao(revisoes, processoId, dadosDaRevisao(rascunho))
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo="Registrar revisão" rotuloDoSalvar="Registrar" salvando={salvando} falha={falha}
      podeSalvar={rascunhoPronto(rascunho)} aoSalvar={registrar} aoFechar={aoFechar}>
      <CampoDoResultado opcoes={opcoesDoResultado(ultimaVersao)} valor={rascunho.resultado}
        aoMudar={(resultado) => setRascunho({ ...rascunho, resultado })} />
      {rascunho.resultado === 'corrigida' && <CampoDoEscopo valor={rascunho.escopo} aoMudar={(escopo) => setRascunho({ ...rascunho, escopo })} />}
      <CampoDoComentario valor={rascunho.comentario} aoMudar={(comentario) => setRascunho({ ...rascunho, comentario })} />
      {aviso && <p className="agora-aviso" role="status">{aviso}</p>}
    </JanelaDeEdicao>
  )
}
