import { Icone } from '../Icone'

type BuscaDaListaProps = { valor: string | null; aoMudar: (valor: string) => void }

/** O campo de busca da Lista: lupa, texto de exemplo e "×" para limpar (só aparece com texto). */
export function BuscaDaLista({ valor, aoMudar }: BuscaDaListaProps) {
  return (
    <div className="busca-da-lista">
      <span className="busca-lupa"><Icone nome="lupa" tamanho={16} /></span>
      <input
        type="text"
        className="busca-campo"
        aria-label="Buscar pelo nome"
        placeholder="Buscar pelo nome"
        value={valor ?? ''}
        onChange={(evento) => aoMudar(evento.target.value)}
      />
      {valor && (
        <button type="button" className="busca-limpar" aria-label="Limpar busca" onClick={() => aoMudar('')}>
          <Icone nome="fechar" tamanho={14} />
        </button>
      )}
    </div>
  )
}
