import type { PlanilhaLida } from '../../importacao/lerPlanilha'
import { contar } from '../../importacao/frasesDaImportacao'

type AvisosDaImportacaoProps = { lida: PlanilhaLida }

/** O que fugiu da regra na planilha: a leitura seguiu em frente, e cada caso fica listado para conferir. */
export function AvisosDaImportacao({ lida }: AvisosDaImportacaoProps) {
  if (lida.avisos.length === 0 && lida.repetidos.length === 0) return null
  return (
    <section className="importacao-avisos" aria-labelledby="titulo-avisos-da-importacao">
      <h4 id="titulo-avisos-da-importacao" className="importacao-subtitulo">
        {contar(lida.avisos.length + lida.repetidos.length, 'aviso', 'avisos')}
      </h4>
      <ul>
        {lida.avisos.map((aviso, i) => (
          <li key={`a${String(i)}`}>Linha {aviso.linha}, {aviso.nome}: {aviso.texto}</li>
        ))}
        {lida.repetidos.map((repetido, i) => (
          <li key={`r${String(i)}`}>Linha {repetido.linha}, {repetido.setor} · {repetido.nome}: repetido na planilha; vale a primeira linha.</li>
        ))}
      </ul>
    </section>
  )
}
