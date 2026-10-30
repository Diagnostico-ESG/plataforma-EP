import { ROTULO_DA_ETIQUETA } from '../../processos/rotulos'
import type { EtiquetaDaEtapa } from '../../processos/tipos'

// Os três desenhos da identidade: círculo vazio, meio preenchido em azul e círculo verde com visto.
function Desenho({ valor, tamanho }: { valor: EtiquetaDaEtapa; tamanho: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      {valor === 'a_fazer' && <circle cx="12" cy="12" r="8.5" stroke="var(--etiqueta-a-fazer)" strokeWidth="2" />}
      {valor === 'em_andamento' && (
        <>
          <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="var(--etiqueta-iniciado)" />
          <circle cx="12" cy="12" r="8.5" stroke="var(--etiqueta-iniciado)" strokeWidth="2" />
        </>
      )}
      {valor === 'concluido' && (
        <>
          <circle cx="12" cy="12" r="10" fill="var(--etiqueta-finalizado)" />
          <path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}

type EtiquetaDoProcessoProps = {
  etiqueta?: EtiquetaDaEtapa
  /** No cartão a etiqueta é só o ícone; o nome vai no title e no texto para o leitor de tela. */
  soIcone?: boolean
}

/** O ícone da etiqueta; sem `soIcone`, o nome vem ao lado, porque a cor sozinha nunca diz o valor. */
export function EtiquetaDoProcesso({ etiqueta, soIcone = false }: EtiquetaDoProcessoProps) {
  const valor = etiqueta ?? 'a_fazer'
  const rotulo = ROTULO_DA_ETIQUETA[valor]
  if (soIcone) {
    return (
      <span className={`etiqueta etiqueta-${valor}`} title={`Etiqueta: ${rotulo}`}>
        <Desenho valor={valor} tamanho={18} />
        <span className="visualmente-oculto">{rotulo}</span>
      </span>
    )
  }
  return <span className={`etiqueta etiqueta-${valor}`}><Desenho valor={valor} tamanho={14} />{rotulo}</span>
}
