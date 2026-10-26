import { useId } from 'react'
import { acceptDoCampo, rotuloDoCampo } from '../../versoes/rotulos'
import type { PapelDoArquivo } from '../../versoes/tipos'

type CampoDeArquivoProps = {
  papel: PapelDoArquivo
  obrigatorio: boolean
  /** O nome que o arquivo escolhido vai ter; null sem arquivo. */
  nomePrevisto: string | null
  /** A frase da conferência que falhou; null se o arquivo serve (ou não há arquivo). */
  recusa: string | null
  aoEscolher: (arquivo: File | null) => void
  /** O relatório sem número (o da histórica e o .pdf antigo) ainda aceita .docx e .pdf; nos demais, só .docx. */
  relatorioSemNumero?: boolean
}

/** Um campo de arquivo nativo por papel, com a prévia do nome ou a recusa ao lado. */
export function CampoDeArquivo({ papel, obrigatorio, nomePrevisto, recusa, aoEscolher, relatorioSemNumero = false }: CampoDeArquivoProps) {
  const id = useId()
  return (
    <div className="campo-de-arquivo">
      <label htmlFor={id}>{rotuloDoCampo(papel, relatorioSemNumero)}{obrigatorio ? '' : ' (opcional)'}</label>
      <input id={id} type="file" accept={acceptDoCampo(papel, relatorioSemNumero)} aria-invalid={recusa ? true : undefined}
        aria-describedby={recusa ? `${id}-recusa` : undefined}
        onChange={(evento) => aoEscolher(evento.target.files?.[0] ?? null)} />
      {recusa && <p id={`${id}-recusa`} className="cadastros-falha">{recusa}</p>}
      {!recusa && nomePrevisto && <p className="campo-de-arquivo-nome">Será gravado como: {nomePrevisto}</p>}
    </div>
  )
}
