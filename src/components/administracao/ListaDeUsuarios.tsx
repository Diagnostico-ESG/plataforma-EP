import type { EstadoDaLista } from '../../hooks/useUsuarios'
import { type AcoesDaLinha, LinhaDaTabelaDeUsuarios } from './LinhaDaTabelaDeUsuarios'

const LINHAS_FANTASMA = 3

type ListaDeUsuariosProps = AcoesDaLinha & { lista: EstadoDaLista; aoTentarDeNovo: () => void }

export function ListaDeUsuarios({ lista, aoTentarDeNovo, ...acoes }: ListaDeUsuariosProps) {
  if (lista.tipo === 'erro') {
    return (
      <div className="administracao-erro" role="alert">
        <p>Não foi possível carregar os usuários. Verifique a conexão e tente de novo.</p>
        <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>
      </div>
    )
  }
  return (
    <table className="tabela-usuarios" aria-busy={lista.tipo === 'carregando'}>
      {lista.tipo === 'carregando' && <caption>Carregando usuários…</caption>}
      <thead>
        <tr>
          <th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Perfil</th>
          <th scope="col">Situação</th><th scope="col"><span className="visualmente-oculto">Ações</span></th>
        </tr>
      </thead>
      <tbody>
        {lista.tipo === 'carregando'
          ? Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} />)
          : lista.linhas.map((linha) => <LinhaDaTabelaDeUsuarios key={linha.chave} linha={linha} {...acoes} />)}
      </tbody>
    </table>
  )
}

function LinhaFantasma() {
  return (
    <tr className="linha-fantasma" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => <td key={i}><span className="fantasma-barra" /></td>)}
    </tr>
  )
}
