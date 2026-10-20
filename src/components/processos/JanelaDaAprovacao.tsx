import { useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarEdicaoDaAprovacao } from '../../processos/gravarAcoes'
import { dadosDaAprovacao } from '../../revisoes/rascunhoDaAprovacao'
import type { Aprovacao, ModuloDeRevisoes } from '../../revisoes/tipos'
import { CamposDoEProtocolo } from './CamposDoEProtocolo'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDaAprovacaoProps = {
  aprovacao: Aprovacao
  revisoes: Pick<ModuloDeRevisoes, 'editarAprovacao'>
  /** Chamado quando gravou, antes de a janela fechar: quem mostra a aprovação lê de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

/** Editar a aprovação: o número, o link e a data do E-protocolo preenchidos com o que está gravado (inclusive para acrescentar o número). */
export function JanelaDaAprovacao({ aprovacao, revisoes, aoGravar, aoFechar }: JanelaDaAprovacaoProps) {
  const [rascunho, setRascunho] = useState({
    numero: aprovacao.numeroEprotocolo ?? '', link: aprovacao.link ?? '', data: aprovacao.aprovadaEm ?? '',
  })
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)

  const salvar = () => gravar(async () => {
    const falhou = await gravarEdicaoDaAprovacao(revisoes, aprovacao.id, dadosDaAprovacao(rascunho))
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo={`Editar a aprovação da V${aprovacao.versao}`} salvando={salvando} falha={falha}
      aoSalvar={salvar} aoFechar={aoFechar}>
      <CamposDoEProtocolo valor={rascunho} aoMudar={setRascunho} />
    </JanelaDeEdicao>
  )
}
