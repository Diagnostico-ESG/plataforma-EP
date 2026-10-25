import { useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarPublicacao } from '../../processos/gravarAcoes'
import { dadosDaPublicacao, rascunhoDaPublicacao } from '../../processos/rascunhoDaPublicacao'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { CamposDaPublicacao } from './CamposDaPublicacao'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDaPublicacaoProps = {
  processo: ProcessoLido
  processos: Pick<ModuloDeProcessos, 'registrarPublicacao'>
  /** Chamado quando gravou, antes de a janela fechar: o verso lê de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

/**
 * Registrar a publicação (a data e o link, o processo fica onde está) ou, com a data já registrada, corrigi-la, com a janela
 * preenchida. A recusa ou falha aparece em vermelho, sem perder o preenchido.
 */
export function JanelaDaPublicacao({ processo, processos, aoGravar, aoFechar }: JanelaDaPublicacaoProps) {
  const [rascunho, setRascunho] = useState(() => rascunhoDaPublicacao(processo))
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)
  const corrigindo = Boolean(processo.publicadoEm)

  const salvar = () => gravar(async () => {
    const { data, link } = dadosDaPublicacao(rascunho)
    const falhou = await gravarPublicacao(processos, processo.id, data, link)
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo={corrigindo ? 'Corrigir publicação' : 'Registrar publicação'} rotuloDoSalvar={corrigindo ? 'Corrigir' : 'Registrar'}
      salvando={salvando} falha={falha} podeSalvar={rascunho.data !== ''} aoSalvar={salvar} aoFechar={aoFechar}>
      <CamposDaPublicacao valor={rascunho} aoMudar={setRascunho} />
    </JanelaDeEdicao>
  )
}
