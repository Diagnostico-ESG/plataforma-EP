import { useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarEdicaoDaRevisao } from '../../processos/gravarAcoes'
import type { ProcessoLido } from '../../processos/tipos'
import { contextoDoProcesso, opcoesDoResultado, tituloDaEdicao } from '../../revisoes/opcoesDaRevisao'
import { dadosDaRevisao } from '../../revisoes/rascunhoDaRevisao'
import type { ModuloDeRevisoes, RevisaoInterna } from '../../revisoes/tipos'
import { CampoDoComentario, CampoDoResultado } from './CamposDaRevisao'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDaRevisaoProps = {
  revisao: RevisaoInterna
  /** A versão e o relatório mais recentes: o resultado só se troca na revisão da passagem aberta, e "corrigida" depende deles. */
  processo?: Pick<ProcessoLido, 'ultimaVersao' | 'ultimoRelatorio'>
  revisoes: Pick<ModuloDeRevisoes, 'editarRevisao'>
  /** Chamado quando gravou, antes de a janela fechar: quem lista as revisões lê de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

const SEM_NADA: Pick<ProcessoLido, 'ultimaVersao' | 'ultimoRelatorio'> = { ultimaVersao: null, ultimoRelatorio: null }

/**
 * Editar a revisão: o comentário e, na revisão da passagem aberta, o resultado, que recalcula o que ela liga (o escopo o
 * banco deduz). Preenchidos com o que está gravado; o revisor, a data e a passagem não mudam.
 */
export function JanelaDaRevisao({ revisao, processo = SEM_NADA, revisoes, aoGravar, aoFechar }: JanelaDaRevisaoProps) {
  const [resultado, setResultado] = useState(revisao.resultado)
  const contexto = contextoDoProcesso(processo, revisao.etapa ?? 'revisao_interna')
  const [comentario, setComentario] = useState(revisao.comentario ?? '')
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)

  const salvar = () => gravar(async () => {
    const dados = dadosDaRevisao({ resultado, comentario })
    const falhou = await gravarEdicaoDaRevisao(revisoes, revisao.id, dados)
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo={tituloDaEdicao(revisao)} salvando={salvando} falha={falha} podeSalvar aoSalvar={salvar} aoFechar={aoFechar}>
      {revisao.daPassagemAberta && <CampoDoResultado opcoes={opcoesDoResultado(contexto)} valor={resultado} aoMudar={setResultado} />}
      <CampoDoComentario valor={comentario} aoMudar={setComentario} />
    </JanelaDeEdicao>
  )
}
