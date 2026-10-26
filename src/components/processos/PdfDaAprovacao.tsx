import { useState } from 'react'
import { useSituacaoDoPdf } from '../../hooks/useSituacaoDoPdf'
import type { ProcessoLido } from '../../processos/tipos'
import { nomeDoPdf } from '../../revisoes/pdfDaAprovacao'
import type { Aprovacao } from '../../revisoes/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { LinkDoArquivo } from '../versoes/LinkDoArquivo'
import { MarcaNoDrive } from '../versoes/MarcaNoDrive'
import { FormularioDoPdf } from './FormularioDoPdf'

type PdfDaAprovacaoProps = {
  versoes: ModuloDeVersoes
  processo: Pick<ProcessoLido, 'id' | 'nome' | 'setorSigla'>
  aprovacao: Aprovacao
  /** Administrador ou Integrante, com o processo em andamento ou concluído e não arquivado (a regra do [Editar]). */
  podeEditar: boolean
  /** Lê a aprovação de novo (o .pdf entrou ou foi trocado). */
  aoAlterar: () => void
}

/**
 * O .pdf protocolado na gaveta da Aprovação pelo setor: o nome padrão como link de download, com a marca da conferência e o
 * [Substituir], ou o [Enviar .pdf] enquanto não há. Todo perfil ativo baixa; quem recusa o resto é a função do servidor e o banco.
 */
export function PdfDaAprovacao({ versoes, processo, aprovacao, podeEditar, aoAlterar }: PdfDaAprovacaoProps) {
  const [aberto, setAberto] = useState(false)
  const pdf = aprovacao.pdf ?? null
  const situacao = useSituacaoDoPdf(versoes, processo.id, pdf)
  const concluir = () => {
    setAberto(false)
    aoAlterar()
  }
  if (aberto) {
    return (
      <FormularioDoPdf modulo={versoes} processoId={processo.id} numero={aprovacao.versao} nomePrevisto={nomeDoPdf(processo, aprovacao.versao)}
        atual={pdf} aoConcluir={concluir} aoCancelar={() => setAberto(false)} />
    )
  }
  if (!pdf) {
    return (
      <div className="etapa-pdf">
        <span className="etapa-nota">Sem .pdf protocolado.</span>
        {podeEditar && <button type="button" className="botao botao-secundario" onClick={() => setAberto(true)}>Enviar .pdf</button>}
      </div>
    )
  }
  return (
    <div className="etapa-pdf">
      <LinkDoArquivo versoes={versoes} arquivo={pdf} />
      <MarcaNoDrive situacao={situacao} />
      {podeEditar && <button type="button" className="botao botao-secundario" onClick={() => setAberto(true)}>Substituir</button>}
    </div>
  )
}
