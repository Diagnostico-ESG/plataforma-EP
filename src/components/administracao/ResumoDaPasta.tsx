import type { ResumoDaPasta as Resumo } from '../../importacao/enviarPasta'
import { contar } from '../../importacao/frasesDaImportacao'
import { avisosDaPasta, foraDaImportacao, fraseDoResumo, frasesDasLacunas } from '../../importacao/frasesDaPasta'
import { ListaDaPasta } from './ListaDaPasta'

type ResumoDaPastaProps = { resumo: Resumo; aoImportarDeNovo: () => void }

function FalhasDoEnvio({ falhas }: { falhas: string[] }) {
  if (falhas.length === 0) return null
  return (
    <div className="administracao-falha" role="alert">
      <p>{contar(falhas.length, 'envio falhou', 'envios falharam')}. Escolha a pasta de novo para completar: o que já entrou é pulado.</p>
      <ul>{falhas.map((falha) => <li key={falha}>{falha}</li>)}</ul>
    </div>
  )
}

/** O resumo do envio e o relatório final (história 48c): o que não entrou, o que entrou com ajuste e as lacunas. */
export function ResumoDaPasta({ resumo, aoImportarDeNovo }: ResumoDaPastaProps) {
  const fora = foraDaImportacao(resumo.previa)
  const avisos = avisosDaPasta(resumo.previa)
  const lacunas = frasesDasLacunas(resumo.previa.lacunas)
  return (
    <div role="status">
      <h4 className="importacao-subtitulo">{resumo.falhas.length === 0 ? 'Envio concluído' : 'Envio com falhas'}</h4>
      <p className="importacao-contagens">{fraseDoResumo(resumo)}</p>
      <FalhasDoEnvio falhas={resumo.falhas} />
      <ListaDaPasta titulo={contar(fora.length, 'fora da importação', 'fora da importação')} itens={fora} />
      <ListaDaPasta titulo={contar(avisos.length, 'aviso', 'avisos')} itens={avisos} />
      <ListaDaPasta titulo={contar(lacunas.length, 'lacuna', 'lacunas')} itens={lacunas} />
      <div className="importacao-acoes">
        <button type="button" className="botao botao-secundario" onClick={aoImportarDeNovo}>Importar de novo</button>
      </div>
    </div>
  )
}
