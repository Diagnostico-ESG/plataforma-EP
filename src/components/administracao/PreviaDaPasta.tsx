import { contar } from '../../importacao/frasesDaImportacao'
import { avisosDaPasta, foraDaImportacao, fraseDaPrevia } from '../../importacao/frasesDaPasta'
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
            <td>{processo.nome}</td><td className="mono">{rotulos(entram)}</td>
            <td className="mono">{rotulos(entram.filter((v) => v.relatorio !== null))}</td><td className="mono">{rotulos(puladas)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function NadaAEnviar({ previa }: { previa: Previa }) {
  if (previa.totalDeArquivos > 0) return null
  const motivo = previa.totalDePuladas > 0 ? 'todas as versões da pasta já existem' : 'nenhuma versão da pasta é de um processo da plataforma'
  return <p className="cadastros-vazio">Nada a enviar: {motivo}.</p>
}

export function PreviaDaPasta({ previa, aoEnviar, aoEscolherOutra }: PreviaDaPastaProps) {
  const fora = foraDaImportacao(previa)
  const avisos = avisosDaPasta(previa)
  const temOQueEnviar = previa.totalDeArquivos > 0
  return (
    <>
      {temOQueEnviar && <p className="importacao-contagens">{fraseDaPrevia(previa)}</p>}
      {previa.porProcesso.length > 0 && <TabelaDaPasta previa={previa} />}
      <ListaDaPasta titulo={contar(fora.length, 'fora da importação', 'fora da importação')} itens={fora} />
      <ListaDaPasta titulo={contar(avisos.length, 'aviso', 'avisos')} itens={avisos} />
      <NadaAEnviar previa={previa} />
      <div className="importacao-acoes">
        <button type="button" className="botao botao-principal" disabled={!temOQueEnviar} onClick={aoEnviar}>Enviar arquivos</button>
        <button type="button" className="botao botao-secundario" onClick={aoEscolherOutra}>Escolher outra pasta</button>
      </div>
    </>
  )
}
