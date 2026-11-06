import { Icone } from '../Icone'
import { iconeDaEtapa } from '../../processos/iconeDaEtapa'
import {
  CODIGO_CONCLUIDOS, CODIGO_DA_APROVACAO, CODIGO_DA_MODELAGEM_PILOTO, CODIGO_DA_PUBLICACAO, CODIGO_DA_REVISAO_INTERNA,
  CODIGO_DA_TECNICA, CODIGO_DA_VALIDACAO, CODIGO_NAO_INICIADOS,
} from '../../processos/codigosDasEtapas'

type Status = 'vazio' | 'meio' | 'cheio'
type Pilula = 'neutra' | 'atraso' | 'vence' | 'aprovado' | 'informativa'
type CartaoMudo = { status: Status; pilula: Pilula; meu?: boolean; destaque?: boolean }

const VAZIO: CartaoMudo = { status: 'vazio', pilula: 'neutra' }

// Desenho fixo da capa (prévia B aprovada): a tela de entrada é vista antes do login, então nada vem do banco.
const COLUNAS: { etapa: string; cartoes: CartaoMudo[] }[] = [
  { etapa: CODIGO_NAO_INICIADOS, cartoes: [VAZIO, VAZIO, VAZIO] },
  { etapa: CODIGO_DA_MODELAGEM_PILOTO, cartoes: [{ status: 'meio', pilula: 'vence', meu: true, destaque: true }, VAZIO] },
  { etapa: CODIGO_DA_TECNICA, cartoes: [{ status: 'meio', pilula: 'neutra' }, { status: 'cheio', pilula: 'atraso' }, VAZIO] },
  { etapa: CODIGO_DA_REVISAO_INTERNA, cartoes: [{ status: 'meio', pilula: 'informativa' }] },
  { etapa: CODIGO_DA_VALIDACAO, cartoes: [{ status: 'vazio', pilula: 'neutra', meu: true }, { status: 'meio', pilula: 'vence' }] },
  { etapa: CODIGO_DA_APROVACAO, cartoes: [{ status: 'meio', pilula: 'neutra' }] },
  { etapa: CODIGO_DA_PUBLICACAO, cartoes: [{ status: 'cheio', pilula: 'aprovado' }, { status: 'meio', pilula: 'neutra' }] },
  { etapa: CODIGO_CONCLUIDOS, cartoes: [{ status: 'cheio', pilula: 'aprovado' }, { status: 'cheio', pilula: 'aprovado' }, { status: 'cheio', pilula: 'aprovado' }] },
]

/** Ilustração da capa: um Quadro inclinado com os ícones das etapas e cartões sem texto, sobre um fluxograma em traço. */
export function CapaIlustracao() {
  return (
    <div className="capa-ilustracao" aria-hidden="true">
      <FluxogramaDeFundo />
      <div className="capa-quadro">
        {COLUNAS.map(({ etapa, cartoes }) => (
          <div key={etapa} className="capa-coluna">
            <div className="capa-cabeca"><Icone nome={iconeDaEtapa(etapa)} tamanho={20} /></div>
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
      <div className="capa-cartao-topo"><span className="capa-selo" /><span className={`capa-status capa-status-${status}`} /></div>
      <span className="capa-barra" />
      <span className="capa-barra capa-barra-curta" />
      <div className="capa-cartao-rodape">
        <span className={meu ? 'capa-avatar capa-avatar-meu' : 'capa-avatar'} />
        <span className={`capa-pilula capa-pilula-${pilula}`} />
      </div>
    </div>
  )
}

// Início, tarefas, decisão e fim, como num BPMN; a linha tracejada é o caminho de um processo atravessando o Quadro.
function FluxogramaDeFundo() {
  return (
    <svg className="capa-fluxo" viewBox="0 0 960 900" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <marker id="capa-ponta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path className="capa-ponta" d="M0 0L10 5L0 10z" />
        </marker>
        <marker id="capa-ponta-azul" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path className="capa-ponta-azul" d="M0 0L10 5L0 10z" />
        </marker>
      </defs>
      <g className="capa-forma">
        <circle cx="70" cy="70" r="20" />
        <rect x="172" y="44" width="130" height="52" rx="10" />
        <path d="M420 34L456 70L420 106L384 70Z" />
        <rect x="542" y="44" width="130" height="52" rx="10" />
        <circle className="capa-fim" cx="804" cy="70" r="22" />
        <rect x="602" y="770" width="150" height="56" rx="10" />
        <path d="M820 760L856 796L820 832L784 796Z" />
        <circle cx="70" cy="830" r="20" />
      </g>
      <g className="capa-seta">
        <path d="M90 70H170" markerEnd="url(#capa-ponta)" />
        <path d="M302 70H380" markerEnd="url(#capa-ponta)" />
        <path d="M456 70H540" markerEnd="url(#capa-ponta)" />
        <path d="M420 106V170H600" markerEnd="url(#capa-ponta)" />
        <path d="M672 70H780" markerEnd="url(#capa-ponta)" />
        <path d="M752 798H782" markerEnd="url(#capa-ponta)" />
        <path d="M856 796H930" markerEnd="url(#capa-ponta)" />
        <path d="M90 830H600" markerEnd="url(#capa-ponta)" />
      </g>
      <path className="capa-caminho" d="M20 600C220 510 330 700 500 620S760 500 950 580" markerEnd="url(#capa-ponta-azul)" />
    </svg>
  )
}
