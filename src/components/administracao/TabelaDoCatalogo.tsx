import type { EtapaNoCatalogo, SentidoDaOrdem } from '../../processos/tipos'
import { Pilula } from '../Pilula'

export type AcoesDoCatalogo = {
  aoEditar: (etapa: EtapaNoCatalogo) => void
  aoMover: (etapa: EtapaNoCatalogo, sentido: SentidoDaOrdem) => void
  aoAlternarAtiva: (etapa: EtapaNoCatalogo) => void
  aoExcluir: (etapa: EtapaNoCatalogo) => void
}

type TabelaDoCatalogoProps = { etapas: EtapaNoCatalogo[]; acoes: AcoesDoCatalogo }

export function TabelaDoCatalogo({ etapas, acoes }: TabelaDoCatalogoProps) {
  if (etapas.length === 0) return <p className="cadastros-vazio">Nenhuma etapa no catálogo ainda.</p>
  return (
    <table className="tabela-cadastros">
      <thead>
        <tr>
          <th scope="col">Etapa</th><th scope="col">Obrigatória</th><th scope="col">Fase</th><th scope="col">Ações</th>
        </tr>
      </thead>
      <tbody>
        {etapas.map((etapa, posicao) => (
          <tr key={etapa.id}>
            <td>{etapa.nome}{!etapa.ativa && <Pilula situacao="neutra">Inativa</Pilula>}</td>
            <td>{etapa.obrigatoria ? 'Obrigatória' : 'Opcional'}</td>
            <td>{etapa.fase}</td>
            <td>
              <BotoesDaEtapa etapa={etapa} acoes={acoes}
                naPrimeira={posicao === 0} naUltima={posicao === etapas.length - 1} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type BotoesDaEtapaProps = { etapa: EtapaNoCatalogo; acoes: AcoesDoCatalogo; naPrimeira: boolean; naUltima: boolean }

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
