import { useState } from 'react'
import type { Setor } from '../../cadastros/tipos'
import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import { Pilula } from '../Pilula'
import { ErroAoCarregar } from './ErroAoCarregar'

const LINHAS_FANTASMA = 3

type ListaDeSetoresProps = {
  estado: EstadoDoCarregamento<Setor[]>
  aoTentarDeNovo: () => void
  aoAbrir: (id: string) => void
}

export function ListaDeSetores({ estado, aoTentarDeNovo, aoAbrir }: ListaDeSetoresProps) {
  const [mostrarInativos, setMostrarInativos] = useState(false)
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os setores" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.tipo === 'pronto' && estado.valor.length === 0) {
    return <p className="cadastros-vazio">Nenhum setor cadastrado ainda.</p>
  }
  const visiveis = estado.tipo === 'pronto' ? estado.valor.filter((setor) => mostrarInativos || setor.ativo) : []
  return (
    <>
      {estado.tipo === 'pronto' && (
        <label className="cadastros-inativos">
          <input type="checkbox" checked={mostrarInativos} onChange={(evento) => setMostrarInativos(evento.target.checked)} />
          Mostrar inativos
        </label>
      )}
      {estado.tipo === 'pronto' && visiveis.length === 0
        ? <p className="cadastros-vazio">Nenhum setor ativo para mostrar.</p>
        : <TabelaDeSetores carregando={estado.tipo === 'carregando'} setores={visiveis} aoAbrir={aoAbrir} />}
    </>
  )
}

type TabelaDeSetoresProps = { carregando: boolean; setores: Setor[]; aoAbrir: (id: string) => void }

function TabelaDeSetores({ carregando, setores, aoAbrir }: TabelaDeSetoresProps) {
  return (
    <table className="tabela-cadastros" aria-busy={carregando}>
      {carregando && <caption>Carregando setores…</caption>}
      <thead>
        <tr><th scope="col">Sigla</th><th scope="col">Nome</th><th scope="col">Situação</th></tr>
      </thead>
      <tbody>
        {carregando
          ? Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} />)
          : setores.map((setor) => <LinhaDeSetor key={setor.id} setor={setor} aoAbrir={aoAbrir} />)}
      </tbody>
    </table>
  )
}

// A linha inteira abre o setor; o botão na sigla dá o mesmo caminho a quem usa o teclado.
function LinhaDeSetor({ setor, aoAbrir }: { setor: Setor; aoAbrir: (id: string) => void }) {
  return (
    <tr className="linha-clicavel" onClick={() => aoAbrir(setor.id)}>
      <td><button type="button" className="cadastros-abrir">{setor.sigla}</button></td>
      <td>{setor.nome}</td>
      <td>{!setor.ativo && <Pilula situacao="neutra">Inativo</Pilula>}</td>
    </tr>
  )
}

function LinhaFantasma() {
  return (
    <tr className="linha-fantasma" aria-hidden="true">
      <td><span className="fantasma-barra" /></td><td><span className="fantasma-barra" /></td>
      <td><span className="fantasma-barra" /></td>
    </tr>
  )
}
