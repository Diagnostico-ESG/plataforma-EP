import type { ResponsavelDoSetor } from '../../processos/tipos'

export type AcoesDoResponsavel = {
  aoEditar: (responsavel: ResponsavelDoSetor) => void
  aoExcluir: (responsavel: ResponsavelDoSetor) => void
}

type TabelaDeResponsaveisProps = { responsaveis: ResponsavelDoSetor[]; acoes?: AcoesDoResponsavel }

/** Responsáveis do setor; sem `acoes` é só leitura (Consulta). */
export function TabelaDeResponsaveis({ responsaveis, acoes }: TabelaDeResponsaveisProps) {
  if (responsaveis.length === 0) return <p className="cadastros-vazio">Nenhum responsável cadastrado ainda.</p>
  return (
    <table className="tabela-cadastros">
      <thead>
        <tr>
          <th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Cargo</th>
          {acoes && <th scope="col">Ações</th>}
        </tr>
      </thead>
      <tbody>
        {responsaveis.map((responsavel) => (
          <tr key={responsavel.id}>
            <td>{responsavel.nome}</td><td>{responsavel.email ?? '—'}</td><td>{responsavel.cargo ?? '—'}</td>
            {acoes && <td><BotoesDoResponsavel responsavel={responsavel} acoes={acoes} /></td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BotoesDoResponsavel({ responsavel, acoes }: { responsavel: ResponsavelDoSetor; acoes: AcoesDoResponsavel }) {
  return (
    <div className="acoes-do-responsavel">
      <button type="button" className="botao botao-secundario" aria-label={`Editar ${responsavel.nome}`}
        onClick={() => acoes.aoEditar(responsavel)}>Editar</button>
      <button type="button" className="botao botao-secundario" aria-label={`Excluir ${responsavel.nome}`}
        onClick={() => acoes.aoExcluir(responsavel)}>Excluir</button>
    </div>
  )
}
