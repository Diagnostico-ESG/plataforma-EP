import { ehEtapaFixa } from '../../processos/codigosDasEtapas'
import type { EtapaNoCatalogo, SentidoDaOrdem } from '../../processos/tipos'
import { Pilula } from '../Pilula'

export type AcoesDoCatalogo = {
  aoEditar: (etapa: EtapaNoCatalogo) => void
  aoMover: (etapa: EtapaNoCatalogo, sentido: SentidoDaOrdem) => void
  aoAlternarAtiva: (etapa: EtapaNoCatalogo) => void
  aoExcluir: (etapa: EtapaNoCatalogo) => void
}

type TabelaDoCatalogoProps = { etapas: EtapaNoCatalogo[]; acoes: AcoesDoCatalogo }

/** O catálogo em tabela: nome, fase ("—" nas duas fixas) e situação. Não iniciados e Concluídos levam o selo "Fixa" e nenhum botão. */
export function TabelaDoCatalogo({ etapas, acoes }: TabelaDoCatalogoProps) {
  if (etapas.length === 0) return <p className="cadastros-vazio">Nenhuma etapa no catálogo ainda.</p>
  return (
    <table className="tabela-cadastros">
      <thead>
        <tr>
          <th scope="col">Etapa</th><th scope="col">Fase</th><th scope="col">Situação</th><th scope="col">Ações</th>
        </tr>
      </thead>
      <tbody>
        {etapas.map((etapa, posicao) => (
          <tr key={etapa.id}>
            <td>{etapa.nome}</td>
            <td>{etapa.fase ?? '—'}</td>
            <td>{etapa.ativa ? 'Ativa' : <Pilula situacao="neutra">Inativa</Pilula>}</td>
            <td>
              {ehEtapaFixa(etapa.codigo)
                ? <Pilula situacao="neutra">Fixa</Pilula>
                : <BotoesDaEtapa etapa={etapa} acoes={acoes}
                    naPrimeira={ehEtapaFixa(etapas[posicao - 1]?.codigo ?? '')} naUltima={ehEtapaFixa(etapas[posicao + 1]?.codigo ?? '')} />}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type BotoesDaEtapaProps = { etapa: EtapaNoCatalogo; acoes: AcoesDoCatalogo; naPrimeira: boolean; naUltima: boolean }

// Subir e Descer não atravessam as fixas: a primeira etapa de trabalho não sobe e a última não desce.
function BotoesDaEtapa({ etapa, acoes, naPrimeira, naUltima }: BotoesDaEtapaProps) {
  const botao = (acao: string, aoClicar: () => void, desabilitado = false) => (
    <button type="button" className="botao botao-secundario" aria-label={`${acao} ${etapa.nome}`}
      disabled={desabilitado} onClick={aoClicar}>{acao}</button>
  )
  return (
    <div className="acoes-do-responsavel">
      {botao('Subir', () => acoes.aoMover(etapa, 'subir'), naPrimeira)}
      {botao('Descer', () => acoes.aoMover(etapa, 'descer'), naUltima)}
      {botao('Editar', () => acoes.aoEditar(etapa))}
      {botao(etapa.ativa ? 'Desativar' : 'Reativar', () => acoes.aoAlternarAtiva(etapa))}
      {botao('Excluir', () => acoes.aoExcluir(etapa))}
    </div>
  )
}
