import './Etapas.css'
import { useId, useState } from 'react'
import { ROTULO_DO_SINAL, type SinalDaEtapa, formatarData, sinalDaEtapa } from '../../processos/caminhoDeEtapas'
import { iniciais } from '../../lib/iniciais'
import type { EtapaDoProcesso } from '../../processos/tipos'
import { type DadosDasEtapas, DetalheDaEtapa } from './DetalheDaEtapa'

type EtapasDoProcessoProps = DadosDasEtapas

const SELO_DO_SINAL: Partial<Record<SinalDaEtapa, string>> = { opcional: 'opcional', dispensada: 'dispensada', anterior: 'anterior' }

// A data à direita da linha: na atual, desde quando; nas resolvidas, quando; nas pendentes, nada.
function quandoDaEtapa(etapa: EtapaDoProcesso, sinal: SinalDaEtapa): string {
  if (sinal === 'atual') return etapa.iniciadaEm ? `desde ${formatarData(etapa.iniciadaEm)}` : ''
  if (sinal === 'pendente' || sinal === 'opcional') return ''
  return formatarData(etapa.resolvidaEm)
}

/** As Etapas: uma linha compacta por etapa; clicar abre o detalhe logo abaixo dela, uma de cada vez (spec, "Etapas"). */
export function EtapasDoProcesso(props: EtapasDoProcessoProps) {
  const idDoTitulo = useId()
  const [aberta, setAberta] = useState<string | null>(null)
  return (
    <section className="etapas" aria-labelledby={idDoTitulo}>
      <h3 id={idDoTitulo} className="painel-subtitulo">Etapas</h3>
      <ol className="etapas-lista">
        {props.etapas.map((etapa, indice) => (
          <LinhaCompactaDaEtapa key={etapa.id} {...props} indice={indice} aberta={aberta === etapa.id}
            aoAlternar={() => setAberta(aberta === etapa.id ? null : etapa.id)} />
        ))}
      </ol>
    </section>
  )
}

type LinhaCompactaProps = EtapasDoProcessoProps & { indice: number; aberta: boolean; aoAlternar: () => void }

function LinhaCompactaDaEtapa({ indice, aberta, aoAlternar, ...resto }: LinhaCompactaProps) {
  const etapa = resto.etapas[indice]
  const sinal = sinalDaEtapa(resto.etapas, indice)
  const idDaGaveta = useId()
  const selo = SELO_DO_SINAL[sinal]
  return (
    <li className={`etapa-linha etapa-${sinal}`} aria-current={sinal === 'atual' ? 'step' : undefined}>
      <button type="button" className="etapa-cabeca" aria-expanded={aberta} aria-controls={aberta ? idDaGaveta : undefined}
        aria-label={`${etapa.nome}: ${ROTULO_DO_SINAL[sinal]}`} onClick={aoAlternar}>
        <span className="etapa-sinal" aria-hidden="true" />
        <span className="etapa-nome">{etapa.nome}</span>
        {selo && <span className="etapa-selo">{selo}</span>}
        <span className="etapa-quando">{quandoDaEtapa(etapa, sinal)}</span>
        <span className="etapa-iniciais" aria-hidden="true">{etapa.responsavelNome ? iniciais(etapa.responsavelNome) : ''}</span>
      </button>
      {aberta && <DetalheDaEtapa id={idDaGaveta} indice={indice} sinal={sinal} {...resto} />}
    </li>
  )
}
