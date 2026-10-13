import type { MacroprocessoDoSetor } from '../../cadastros/tipos'

const SEM_VALOR = '—'

/** Macroprocessos de que o setor aberto participa; só leitura (pôr e tirar se faz no macroprocesso). */
export function MacroprocessosDoSetor({ macroprocessos }: { macroprocessos: MacroprocessoDoSetor[] }) {
  return (
    <section className="macroprocessos-do-setor" aria-label="Macroprocessos em que participa">
      <h3 className="form-setor-titulo">Macroprocessos em que participa</h3>
      {macroprocessos.length === 0
        ? <p className="cadastros-vazio">Este setor ainda não participa de nenhum macroprocesso.</p>
        : (
          <table className="tabela-cadastros">
            <thead>
              <tr><th scope="col">Código</th><th scope="col">Nome</th><th scope="col">Observação</th></tr>
            </thead>
            <tbody>
              {macroprocessos.map((macroprocesso) => (
                <tr key={macroprocesso.id}>
                  <td>{macroprocesso.codigo ?? SEM_VALOR}</td>
                  <td>{macroprocesso.nome}</td>
                  <td>{macroprocesso.observacao ?? SEM_VALOR}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </section>
  )
}
