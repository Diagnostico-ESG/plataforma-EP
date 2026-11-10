import { useId } from 'react'

type ListaDaPastaProps = { titulo: string; itens: string[] }

/** Uma lista do relatório da importação dos arquivos (fora da importação, avisos, lacunas); some quando está vazia. */
export function ListaDaPasta({ titulo, itens }: ListaDaPastaProps) {
  const idDoTitulo = useId()
  if (itens.length === 0) return null
  return (
    <section className="importacao-avisos" aria-labelledby={idDoTitulo}>
      <h4 id={idDoTitulo} className="importacao-subtitulo">{titulo}</h4>
      <ul>
        {itens.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  )
}
