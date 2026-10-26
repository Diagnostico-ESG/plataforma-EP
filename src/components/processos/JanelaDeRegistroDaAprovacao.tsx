import { useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarAprovacao, gravarAprovacaoComPdf } from '../../processos/gravarAcoes'
import type { ProcessoLido, UltimaVersao } from '../../processos/tipos'
import { MOTIVO_SEM_VERSAO, avisoDaAprovacaoSubstituida } from '../../revisoes/opcoesDaRevisao'
import { nomeDoPdf, recusaDoPdf } from '../../revisoes/pdfDaAprovacao'
import { RASCUNHO_DA_APROVACAO_VAZIO, dadosDaAprovacao } from '../../revisoes/rascunhoDaAprovacao'
import type { Aprovacao, ModuloDeRevisoes } from '../../revisoes/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { CampoDeArquivo } from '../versoes/CampoDeArquivo'
import { CamposDoEProtocolo } from './CamposDoEProtocolo'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDeRegistroDaAprovacaoProps = {
  processo: Pick<ProcessoLido, 'id' | 'nome' | 'setorSigla'>
  /** A versão mais recente: é a que a aprovação cobre. */
  ultimaVersao: UltimaVersao | null
  /** A aprovação que já existe, que a nova substitui; null na primeira. */
  anterior: Aprovacao | null
  revisoes: Pick<ModuloDeRevisoes, 'registrarAprovacao'>
  /** Envia o .pdf protocolado, quando há. */
  versoes: Pick<ModuloDeVersoes, 'enviarPdfDaAprovacao'>
  /** Chamado quando gravou, antes de a janela fechar: quem mostra os registros lê de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

/**
 * Registrar a aprovação (ADR 0023): mostra a versão aprovada (a mais recente) e pede o número, o link e a data do
 * E-protocolo e o .pdf protocolado, todos opcionais. Se já há aprovação, avisa que a nova toma o lugar dela. Com o .pdf, ele
 * sobe ao Drive antes de a aprovação ser registrada: se o envio falhar, nada é registrado.
 */
export function JanelaDeRegistroDaAprovacao({ processo, ultimaVersao, anterior, revisoes, versoes, aoGravar, aoFechar }: JanelaDeRegistroDaAprovacaoProps) {
  const [rascunho, setRascunho] = useState(RASCUNHO_DA_APROVACAO_VAZIO)
  const [pdf, setPdf] = useState<File | null>(null)
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)
  const aviso = avisoDaAprovacaoSubstituida(anterior)
  const recusa = recusaDoPdf(pdf)

  const registrar = () => gravar(async () => {
    const dados = dadosDaAprovacao(rascunho)
    if (pdf && ultimaVersao) {
      return await gravarAprovacaoComPdf(revisoes, versoes, { processoId: processo.id, numero: ultimaVersao.numero, arquivo: pdf, dados }, aoGravar)
    }
    const falhou = await gravarAprovacao(revisoes, processo.id, dados)
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo="Registrar aprovação" rotuloDoSalvar="Registrar" salvando={salvando} falha={falha}
      podeSalvar={ultimaVersao !== null && recusa === null} aoSalvar={registrar} aoFechar={aoFechar}>
      <p className="janela-escolha-pergunta">{ultimaVersao ? `Versão aprovada: V${ultimaVersao.numero}` : MOTIVO_SEM_VERSAO}</p>
      <CamposDoEProtocolo valor={rascunho} aoMudar={setRascunho} />
      <CampoDeArquivo papel="pdf_da_aprovacao" obrigatorio={false} recusa={recusa} aoEscolher={setPdf}
        nomePrevisto={ultimaVersao && pdf && !recusa ? nomeDoPdf(processo, ultimaVersao.numero) : null} />
      {salvando && pdf && <p className="formulario-de-versao-progresso" role="status">Enviando…</p>}
      {aviso && <p className="agora-aviso" role="status">{aviso}</p>}
    </JanelaDeEdicao>
  )
}
