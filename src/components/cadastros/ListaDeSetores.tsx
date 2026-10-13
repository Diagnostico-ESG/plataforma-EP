import type { Setor } from '../../cadastros/tipos'
import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'

const LINHAS_FANTASMA = 3

type ListaDeSetoresProps = { estado: EstadoDoCarregamento<Setor[]>; aoTentarDeNovo: () => void }

// Neste ticket a lista mostra só os ativos; "Mostrar inativos" chega no ticket 02.
export function ListaDeSetores({ estado, aoTentarDeNovo }: ListaDeSetoresProps) {
  if (estado.tipo === 'erro') {
    return (
      <div className="cadastros-erro" role="alert">
        <p>Não foi possível carregar os setores. Verifique a conexão e tente de novo.</p>
        <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>
      </div>
    )
  }
  const ativos = estado.tipo === 'pronto' ? estado.valor.filter((setor) => setor.ativo) : []
  if (estado.tipo === 'pronto' && ativos.length === 0) {
    return <p className="cadastros-vazio">Nenhum setor cadastrado ainda.</p>
  }
  return (
    <table className="tabela-cadastros" aria-busy={estado.tipo === 'carregando'}>
      {estado.tipo === 'carregando' && <caption>Carregando setores…</caption>}
      <thead>
        <tr><th scope="col">Sigla</th><th scope="col">Nome</th></tr>
      </thead>
      <tbody>
        {estado.tipo === 'carregando'
          ? Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} />)
          : ativos.map((setor) => <tr key={setor.id}><td>{setor.sigla}</td><td>{setor.nome}</td></tr>)}
      </tbody>
    </table>
  )
}

function LinhaFantasma() {
  return (
    <tr className="linha-fantasma" aria-hidden="true">
      <td><span className="fantasma-barra" /></td><td><span className="fantasma-barra" /></td>
    </tr>
  )
}
