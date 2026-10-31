import { selosDoCartao, type Selo } from '../../processos/selosDoCartao'
import type { EtapaDoCatalogo, ProcessoDaLista } from '../../processos/tipos'
import { Icone, type NomeIcone } from '../Icone'

const ICONE_DO_SELO: Partial<Record<Selo['tipo'], NomeIcone>> = { dias: 'relogio', relatorio: 'documento' }

// Parado é vermelho; o outro alerta (relatório pendente) é laranja. Sem fundo: só ícone e texto, em mono.
function classeDoSelo(selo: Selo): string {
  if (selo.tipo === 'dias') return 'selo-texto selo-atraso'
  if (selo.tom === 'alerta') return 'selo-texto selo-vencendo'
  return selo.tipo === 'versao' ? 'selo-texto selo-versao' : 'selo-texto'
}

function SeloDoCartao({ selo }: { selo: Selo }) {
  const icone = ICONE_DO_SELO[selo.tipo]
  return <span className={classeDoSelo(selo)}>{icone && <Icone nome={icone} tamanho={13} />}{selo.texto}</span>
}

type SelosDoCartaoProps = { processo: ProcessoDaLista; hoje: string; etapas: EtapaDoCatalogo[] }

/** Só o que há a dizer, na ordem da spec; o cartão normal não ganha nada. */
export function SelosDoCartao({ processo, hoje, etapas }: SelosDoCartaoProps) {
  const selos = selosDoCartao(processo, hoje, etapas)
  if (selos.length === 0) return null
  return (
    <span className="cartao-selos">
      {selos.map((selo) => <SeloDoCartao key={selo.tipo} selo={selo} />)}
    </span>
  )
}
