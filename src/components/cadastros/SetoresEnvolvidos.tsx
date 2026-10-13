import type { ModuloDeCadastros, SetorEnvolvido } from '../../cadastros/tipos'
import { Pilula } from '../Pilula'
import { LinhaDeSetorEnvolvido } from './LinhaDeSetorEnvolvido'
import { PorSetor } from './PorSetor'

type Edicao = { cadastros: ModuloDeCadastros; macroprocessoId: string; aoMudar: () => void; aoSumir: () => void }
type SetoresEnvolvidosProps = { envolvidos: SetorEnvolvido[]; edicao?: Edicao }

/** Lista dos setores do macroprocesso aberto; com `edicao` pode pôr, tirar e anotar, sem ela é só leitura (Consulta). */
export function SetoresEnvolvidos({ envolvidos, edicao }: SetoresEnvolvidosProps) {
  return (
    <section className="setores-envolvidos" aria-label="Setores envolvidos">
      <h3 className="form-setor-titulo">Setores envolvidos</h3>
      {envolvidos.length === 0
        ? <p className="cadastros-vazio">Nenhum setor envolvido ainda.</p>
        : (
          <table className="tabela-cadastros">
            <thead>
              <tr>
                <th scope="col">Sigla</th><th scope="col">Nome</th><th scope="col">Observação</th>
                {edicao && <th scope="col">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {envolvidos.map((setor) => (edicao
                ? <LinhaDeSetorEnvolvido key={setor.setorId} setor={setor} {...edicao} />
                : <LinhaEmLeitura key={setor.setorId} setor={setor} />))}
            </tbody>
          </table>
        )}
      {edicao && <PorSetor envolvidos={envolvidos} {...edicao} />}
    </section>
  )
}

function LinhaEmLeitura({ setor }: { setor: SetorEnvolvido }) {
  return (
    <tr>
      <td>{setor.sigla}</td>
      <td>{setor.nome}{!setor.ativo && <> <Pilula situacao="neutra">Inativo</Pilula></>}</td>
      <td>{setor.observacao ?? '—'}</td>
    </tr>
  )
}
