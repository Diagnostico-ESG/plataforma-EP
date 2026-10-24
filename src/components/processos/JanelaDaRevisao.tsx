import { useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarEdicaoDaRevisao } from '../../processos/gravarAcoes'
import type { UltimaVersao } from '../../processos/tipos'
import { opcoesDoResultado } from '../../revisoes/opcoesDaRevisao'
import { dadosDaRevisao } from '../../revisoes/rascunhoDaRevisao'
import type { ModuloDeRevisoes, RevisaoInterna } from '../../revisoes/tipos'
import { CampoDoComentario, CampoDoEscopo, CampoDoResultado } from './CamposDaRevisao'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDaRevisaoProps = {
  revisao: RevisaoInterna
  /** A versão mais recente e a da passagem: o resultado só se troca na revisão da passagem aberta, e "corrigida" depende dela. */
  ultimaVersao?: UltimaVersao | null
  revisoes: Pick<ModuloDeRevisoes, 'editarRevisao'>
  /** Chamado quando gravou, antes de a janela fechar: quem lista as revisões lê de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

/**
 * Editar a revisão: o comentário, o escopo (na "corrigida") e, na revisão da passagem aberta, o resultado, que recalcula as
 * versões. Preenchidos com o que está gravado; o revisor, a data e a passagem não mudam.
 */
export function JanelaDaRevisao({ revisao, ultimaVersao = null, revisoes, aoGravar, aoFechar }: JanelaDaRevisaoProps) {
  const [resultado, setResultado] = useState(revisao.resultado)
  const [escopo, setEscopo] = useState(revisao.escopo)
  const [comentario, setComentario] = useState(revisao.comentario ?? '')
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)

  const salvar = () => gravar(async () => {
    const dados = dadosDaRevisao({ resultado, escopo, comentario })
    const falhou = await gravarEdicaoDaRevisao(revisoes, revisao.id, dados)
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo={`Editar a revisão da V${revisao.versaoRevisada}`} salvando={salvando} falha={falha}
      podeSalvar={resultado !== 'corrigida' || escopo !== null} aoSalvar={salvar} aoFechar={aoFechar}>
      {revisao.daPassagemAberta && <CampoDoResultado opcoes={opcoesDoResultado(ultimaVersao)} valor={resultado} aoMudar={setResultado} />}
      {resultado === 'corrigida' && <CampoDoEscopo valor={escopo} aoMudar={setEscopo} />}
      <CampoDoComentario valor={comentario} aoMudar={setComentario} />
    </JanelaDeEdicao>
  )
}
