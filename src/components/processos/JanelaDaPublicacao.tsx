import { useId, useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarPublicacao } from '../../processos/gravarAcoes'
import { hojeLocal } from '../../processos/textoDaReuniao'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDaPublicacaoProps = {
  processoId: string
  processos: Pick<ModuloDeProcessos, 'registrarPublicacao'>
  /** A data da aprovação (AAAA-MM-DD), o mínimo da data; null sem data, sem mínimo. */
  aprovadaEm: string | null
  /** Chamado quando gravou, antes de a janela fechar: o verso e o Quadro leem de novo. */
  aoGravar: () => void
  aoSumir: () => void
  aoFechar: () => void
}

/**
 * Registrar a publicação que aconteceu depois (ADR 0020): a data, com hoje por padrão e entre a aprovação e hoje, e a
 * nota opcional, que vai para o histórico. O banco confere as datas de novo; a recusa fica na janela, com o preenchido.
 */
export function JanelaDaPublicacao({ processoId, processos, aprovadaEm, aoGravar, aoSumir, aoFechar }: JanelaDaPublicacaoProps) {
  const hoje = hojeLocal(new Date())
  const [data, setData] = useState(hoje)
  const [nota, setNota] = useState('')
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)
  const idDaData = useId()
  const idDaNota = useId()

  const salvar = () => gravar(async () => {
    const falhou = await gravarPublicacao(processos, processoId, data, nota, aoSumir)
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo="Registrar publicação" salvando={salvando} falha={falha} aoSalvar={salvar} aoFechar={aoFechar}>
      <label htmlFor={idDaData} className="janela-escolha-pergunta janela-revisao-rotulo">Data da publicação</label>
      <input id={idDaData} type="date" className="janela-campo" required max={hoje} min={aprovadaEm ?? undefined} value={data}
        onChange={(mudanca) => setData(mudanca.target.value)} />
      <label htmlFor={idDaNota} className="janela-escolha-pergunta janela-revisao-rotulo">Nota (opcional)</label>
      <textarea id={idDaNota} className="janela-campo" rows={2} maxLength={2000} value={nota}
        onChange={(mudanca) => setNota(mudanca.target.value)} />
      <p className="janela-ajuda">Não anote dado pessoal de pessoas do setor.</p>
    </JanelaDeEdicao>
  )
}
