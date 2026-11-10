import { useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarRevisao } from '../../processos/gravarAcoes'
import { type ContextoDaRevisao, avisoDoAutorDaRevisao, opcoesDoResultado } from '../../revisoes/opcoesDaRevisao'
import { RASCUNHO_VAZIO, type RascunhoDaRevisao, dadosDaRevisao, rascunhoPronto } from '../../revisoes/rascunhoDaRevisao'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import { CampoDoComentario, CampoDoResultado } from './CamposDaRevisao'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDeRegistroDaRevisaoProps = {
  processoId: string
  /** Em qual das duas revisões o processo está e o que ele tem a revisar: de onde vêm as duas opções. */
  contexto: ContextoDaRevisao
  /** Quem está na tela, para o aviso de quem enviou o que se revisa. */
  usuarioId: string
  revisoes: Pick<ModuloDeRevisoes, 'registrarRevisao'>
  /** Chamado quando gravou, antes de a janela fechar: quem mostra os registros lê de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

/**
 * Registrar a revisão (ADR 0023 e 0046), nas duas revisões: o resultado com o que cada opção liga (versão, relatório ou os
 * dois) e o comentário opcional; o escopo o banco deduz. O aviso amarelo diz quando quem registra enviou o que se revisa, e
 * não impede nada.
 */
export function JanelaDeRegistroDaRevisao({ processoId, contexto, usuarioId, revisoes, aoGravar, aoFechar }: JanelaDeRegistroDaRevisaoProps) {
  const [rascunho, setRascunho] = useState<RascunhoDaRevisao>(RASCUNHO_VAZIO)
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)
  const aviso = rascunho.resultado ? avisoDoAutorDaRevisao(contexto, rascunho.resultado, usuarioId) : null

  const registrar = () => gravar(async () => {
    const falhou = await gravarRevisao(revisoes, processoId, dadosDaRevisao(rascunho))
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo="Registrar revisão" rotuloDoSalvar="Registrar" salvando={salvando} falha={falha}
      podeSalvar={rascunhoPronto(rascunho)} aoSalvar={registrar} aoFechar={aoFechar}>
      <CampoDoResultado opcoes={opcoesDoResultado(contexto)} valor={rascunho.resultado}
        aoMudar={(resultado) => setRascunho({ ...rascunho, resultado })} />
      <CampoDoComentario valor={rascunho.comentario} aoMudar={(comentario) => setRascunho({ ...rascunho, comentario })} />
      {aviso && <p className="agora-aviso" role="status">{aviso}</p>}
    </JanelaDeEdicao>
  )
}
