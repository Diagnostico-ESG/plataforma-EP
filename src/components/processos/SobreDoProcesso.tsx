import './Contexto.css'
import { useId } from 'react'
import { ROTULO_DA_SITUACAO, ROTULO_DO_TIPO } from '../../processos/rotulos'
import type { ProcessoLido } from '../../processos/tipos'

/** O Sobre do verso, a linha de dados do cabeçalho: setor, macroprocesso, tipo e situação; campo vazio não aparece (spec, "Verso enxuto"). */
export function SobreDoProcesso({ processo }: { processo: ProcessoLido }) {
  const idDoTitulo = useId()
  return (
    <section className="contexto-secao" aria-labelledby={idDoTitulo}>
      <h3 id={idDoTitulo} className="contexto-titulo visualmente-oculto">Sobre</h3>
      <dl className="sobre-lista">
        <Dado rotulo="Setor" valor={processo.setorSigla} />
        <Dado rotulo="Macroprocesso" valor={processo.macroprocessoNome} />
        <Dado rotulo="Tipo" valor={ROTULO_DO_TIPO[processo.tipo]} />
        <Dado rotulo="Situação" valor={ROTULO_DA_SITUACAO[processo.situacao]} />
      </dl>
    </section>
  )
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null
  return (
    <div className="sobre-dado">
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </div>
  )
}
