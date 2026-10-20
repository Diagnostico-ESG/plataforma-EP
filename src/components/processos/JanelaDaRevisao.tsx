import { useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarEdicaoDaRevisao } from '../../processos/gravarAcoes'
import { dadosDaRevisao } from '../../revisoes/rascunhoDaRevisao'
import type { ModuloDeRevisoes, RevisaoInterna } from '../../revisoes/tipos'
import { CampoDoComentario, CampoDoEscopo } from './CamposDaRevisao'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDaRevisaoProps = {
  revisao: RevisaoInterna
  revisoes: Pick<ModuloDeRevisoes, 'editarRevisao'>
  /** Chamado quando gravou, antes de a janela fechar: quem lista as revisões lê de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

/** Editar a revisão: o comentário e, na "corrigida", o escopo, preenchidos com o que está gravado. O resto não muda. */
export function JanelaDaRevisao({ revisao, revisoes, aoGravar, aoFechar }: JanelaDaRevisaoProps) {
  const [escopo, setEscopo] = useState(revisao.escopo)
  const [comentario, setComentario] = useState(revisao.comentario ?? '')
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)

  const salvar = () => gravar(async () => {
    const dados = dadosDaRevisao({ resultado: revisao.resultado, escopo, comentario })
    const falhou = await gravarEdicaoDaRevisao(revisoes, revisao.id, { escopo: dados.escopo, comentario: dados.comentario })
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo={`Editar a revisão da V${revisao.versaoRevisada}`} salvando={salvando} falha={falha}
      aoSalvar={salvar} aoFechar={aoFechar}>
      {revisao.resultado === 'corrigida' && <CampoDoEscopo valor={escopo} aoMudar={setEscopo} />}
      <CampoDoComentario valor={comentario} aoMudar={setComentario} />
    </JanelaDeEdicao>
  )
}
