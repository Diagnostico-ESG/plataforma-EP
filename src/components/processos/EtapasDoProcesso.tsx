import './Etapas.css'
import { useId, useState } from 'react'
import { formatarData } from '../../lib/datas'
import type { EtapaDoVerso, ProcessoLido } from '../../processos/tipos'
import { type DadosDasEtapas, DetalheDaEtapa } from './DetalheDaEtapa'

type EtapasDoProcessoProps = DadosDasEtapas & { processo: ProcessoLido }

type SinalDaEtapa = 'atual' | 'visitada' | 'nao-visitada'

const ROTULO_DO_SINAL: Record<SinalDaEtapa, string> = { atual: 'atual', visitada: 'visitada', 'nao-visitada': 'ainda não visitada' }

// A atual vale mais que o resto; visitada é a que o processo já deixou alguma vez.
function sinalDaEtapa(etapa: EtapaDoVerso, atual: boolean): SinalDaEtapa {
  if (atual) return 'atual'
  return etapa.passagens.some((passagem) => passagem.saiuEm !== null) ? 'visitada' : 'nao-visitada'
}

// A data à direita da linha: na atual, desde quando; nas visitadas, a da última saída; nas outras, nada.
function quandoDaEtapa(etapa: EtapaDoVerso, sinal: SinalDaEtapa): string {
  if (sinal === 'atual') return `desde ${formatarData(etapa.passagens.find((passagem) => passagem.saiuEm === null)?.entrouEm ?? null)}`
  if (sinal === 'visitada') return formatarData(etapa.passagens.find((passagem) => passagem.saiuEm !== null)?.saiuEm ?? null)
  return ''
}

/**
 * As Etapas: as etapas ativas do catálogo, só leitura, com a atual destacada e as visitadas marcadas; clicar abre a
 * gaveta logo abaixo da linha, uma de cada vez, com as entradas e saídas do processo naquela etapa (spec, "Etapas do verso").
 */
export function EtapasDoProcesso(props: EtapasDoProcessoProps) {
  const idDoTitulo = useId()
  const [aberta, setAberta] = useState<string | null>(null)
  return (
    <section className="etapas" aria-labelledby={idDoTitulo}>
      <h3 id={idDoTitulo} className="painel-subtitulo">Etapas</h3>
      <ol className="etapas-lista">
        {props.processo.etapasDoVerso.map((etapa) => (
          <LinhaDaEtapa key={etapa.id} {...props} etapa={etapa} aberta={aberta === etapa.id}
            aoAlternar={() => setAberta(aberta === etapa.id ? null : etapa.id)} />
        ))}
      </ol>
    </section>
  )
}

type LinhaDaEtapaProps = EtapasDoProcessoProps & { etapa: EtapaDoVerso; aberta: boolean; aoAlternar: () => void }

function LinhaDaEtapa({ etapa, aberta, aoAlternar, ...resto }: LinhaDaEtapaProps) {
  const idDaGaveta = useId()
  const sinal = sinalDaEtapa(etapa, resto.processo.etapaAtual?.codigo === etapa.codigo)
  return (
    <li className={`etapa-linha etapa-${sinal}`} aria-current={sinal === 'atual' ? 'step' : undefined}>
      <button type="button" className="etapa-cabeca" aria-expanded={aberta} aria-controls={aberta ? idDaGaveta : undefined}
        aria-label={`${etapa.nome}: ${ROTULO_DO_SINAL[sinal]}`} onClick={aoAlternar}>
        <span className="etapa-sinal" aria-hidden="true" />
        <span className="etapa-nome">{etapa.nome}</span>
        <span className="etapa-quando">{quandoDaEtapa(etapa, sinal)}</span>
      </button>
      {aberta && <DetalheDaEtapa id={idDaGaveta} etapa={etapa} {...resto} />}
    </li>
  )
}
