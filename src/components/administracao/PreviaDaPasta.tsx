import { contar } from '../../importacao/frasesDaImportacao'
import { foraDaImportacao, fraseDaPrevia } from '../../importacao/frasesDaPasta'
import type { VersaoDaPasta } from '../../importacao/lerPasta'
import type { PreviaDaPasta as Previa } from '../../importacao/previaDaPasta'
import { ListaDaPasta } from './ListaDaPasta'

type PreviaDaPastaProps = { previa: Previa; aoEnviar: () => void; aoEscolherOutra: () => void }

function rotulos(versoes: VersaoDaPasta[]): string {
  return versoes.length === 0 ? '—' : versoes.map((v) => v.rotulo).join(', ')
}

function TabelaDaPasta({ previa }: { previa: Previa }) {
  return (
    <table className="tabela-cadastros">
      <thead>
        <tr>
          <th scope="col">Processo</th><th scope="col">Versões que entram</th><th scope="col">Com relatório</th>
          <th scope="col">Já existem</th>
        </tr>
      </thead>
      <tbody>
        {previa.porProcesso.map(({ processo, entram, puladas }) => (
          <tr key={processo.id}>
            <td>{processo.nome}</td><td>{rotulos(entram)}</td><td>{rotulos(entram.filter((v) => v.relatorio !== null))}</td>
            <td>{rotulos(puladas)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function NadaAEnviar({ previa }: { previa: Previa }) {
  if (previa.totalDeVersoes > 0) return null
  const motivo = previa.totalDePuladas > 0 ? 'todas as versões da pasta já existem' : 'nenhuma versão da pasta é de um processo da plataforma'
  return <p className="cadastros-vazio">Nada a enviar: {motivo}.</p>
}

export function PreviaDaPasta({ previa, aoEnviar, aoEscolherOutra }: PreviaDaPastaProps) {
  const fora = foraDaImportacao(previa)
  return (
    <>
      <p className="importacao-contagens">{fraseDaPrevia(previa)}</p>
      {previa.porProcesso.length > 0 && <TabelaDaPasta previa={previa} />}
      <ListaDaPasta titulo={contar(fora.length, 'fora da importação', 'fora da importação')} itens={fora} />
      <NadaAEnviar previa={previa} />
      <div className="importacao-acoes">
        <button type="button" className="botao botao-principal" disabled={previa.totalDeVersoes === 0} onClick={aoEnviar}>Enviar arquivos</button>
        <button type="button" className="botao" onClick={aoEscolherOutra}>Escolher outra pasta</button>
      </div>
    </>
  )
}
