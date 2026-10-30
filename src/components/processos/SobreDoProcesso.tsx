import './Contexto.css'
import { useId } from 'react'
import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import type { ProcessoLido } from '../../processos/tipos'

/** O Sobre do verso: rótulo pequeno acima do valor; campo vazio não aparece (spec, "Verso do cartão", Sobre). */
export function SobreDoProcesso({ processo }: { processo: ProcessoLido }) {
  const idDoTitulo = useId()
  return (
    <section className="contexto-secao" aria-labelledby={idDoTitulo}>
      <h3 id={idDoTitulo} className="contexto-titulo">Sobre</h3>
      <dl className="sobre-lista">
        <Dado rotulo="Setor" valor={processo.setorSigla} />
        <Dado rotulo="Macroprocesso" valor={processo.macroprocessoNome} />
        <Dado rotulo="Tipo" valor={ROTULO_DO_TIPO[processo.tipo]} />
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
