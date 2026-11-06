import { DesenhoDaEtiqueta } from '../processos/EtiquetaDoProcesso'
import type { EtiquetaDaEtapa } from '../../processos/tipos'
import { FluxogramaDaCapa } from './FluxogramaDaCapa'

type Pilula = 'neutra' | 'atraso' | 'vence' | 'aprovado' | 'informativa'
type CartaoMudo = { status: EtiquetaDaEtapa; pilula: Pilula; meu?: boolean; destaque?: boolean }

const VAZIO: CartaoMudo = { status: 'a_fazer', pilula: 'neutra' }

// Desenho fixo da capa (prévia capa-m.png): três colunas em degrau, com 3, 2 e 1 cartões, como o ícone do Quadro.
// A tela de entrada é vista antes do login, então nada vem do banco.
const COLUNAS: CartaoMudo[][] = [
  [VAZIO, { status: 'em_andamento', pilula: 'vence', meu: true, destaque: true }, VAZIO],
  [{ status: 'em_andamento', pilula: 'atraso' }, { status: 'concluido', pilula: 'aprovado' }],
  [{ status: 'em_andamento', pilula: 'informativa' }],
]

/** Ilustração da capa: três colunas do Quadro de frente, com cartões sem texto, sobre um fluxograma em marca d'água. */
export function CapaIlustracao() {
  return (
    <div className="capa-ilustracao" aria-hidden="true">
      <FluxogramaDaCapa />
      <div className="capa-quadro">
        {COLUNAS.map((cartoes, coluna) => (
          <div key={coluna} className="capa-coluna">
            <div className="capa-cabeca" />
            {cartoes.map((cartao, i) => <CartaoDaCapa key={i} {...cartao} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

function CartaoDaCapa({ status, pilula, meu, destaque }: CartaoMudo) {
  return (
    <div className={destaque ? 'capa-cartao capa-cartao-destaque' : 'capa-cartao'}>
      <div className="capa-cartao-topo"><span className="capa-selo" /><DesenhoDaEtiqueta valor={status} tamanho={18} /></div>
      <span className="capa-barra" />
      <span className="capa-barra capa-barra-curta" />
      <div className="capa-cartao-rodape">
        <span className={meu ? 'capa-avatar capa-avatar-meu' : 'capa-avatar'} />
        <span className={`capa-pilula capa-pilula-${pilula}`} />
      </div>
    </div>
  )
}
