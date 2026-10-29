type PeDaColunaDosConcluidosProps = {
  /** Os concluídos fora do Quadro que passam pelos filtros do Quadro. */
  quantos: number
  /** A Lista em Concluídos, com os mesmos filtros do Quadro. */
  enderecoDaLista: string
}

/** "N concluídos fora do Quadro · Ver na Lista" (singular com um); sem concluído fora, não há pé. */
export function PeDaColunaDosConcluidos({ quantos, enderecoDaLista }: PeDaColunaDosConcluidosProps) {
  if (quantos === 0) return null
  return (
    <p className="coluna-pe">
      {quantos === 1 ? '1 concluído fora do Quadro' : `${quantos} concluídos fora do Quadro`} · <a href={enderecoDaLista}>Ver na Lista</a>
    </p>
  )
}
