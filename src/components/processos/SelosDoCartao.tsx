import { selosDoCartao, type Selo } from '../../processos/selosDoCartao'
import type { EtapaDoCatalogo, ProcessoDaLista } from '../../processos/tipos'
import { Pilula } from '../Pilula'

/** Versão e subprocessos são só texto neutro, sem fundo; os demais são pílulas (âmbar só nos dois alertas). */
function SeloDoCartao({ selo }: { selo: Selo }) {
  if (selo.tipo === 'versao') return <span className="selo-texto selo-versao">{selo.texto}</span>
  if (selo.tipo === 'subprocessos') return <span className="selo-texto">{selo.texto}</span>
  const corpo = selo.tipo === 'modelagem' ? <span className="selo-modelagem">{selo.texto}</span> : selo.texto
  return <Pilula situacao={selo.tom === 'alerta' ? 'vencendo' : 'neutra'}>{corpo}</Pilula>
}

type SelosDoCartaoProps = { processo: ProcessoDaLista; hoje: string; etapas: EtapaDoCatalogo[]; semSeloDeResponsavel: boolean }

/** Só o que há a dizer, na ordem da spec; o cartão normal não ganha nada. */
export function SelosDoCartao({ processo, hoje, etapas, semSeloDeResponsavel }: SelosDoCartaoProps) {
  const selos = selosDoCartao(processo, hoje, etapas).filter((selo) => !(semSeloDeResponsavel && selo.tipo === 'sem_responsavel'))
  if (selos.length === 0) return null
  return (
    <span className="cartao-selos">
      {selos.map((selo) => <SeloDoCartao key={selo.tipo} selo={selo} />)}
    </span>
  )
}
