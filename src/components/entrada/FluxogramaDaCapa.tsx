// Fluxograma em marca d'água da capa (prévia capa-m.png): formas de BPMN em traço fraco no alto, no meio e embaixo do painel,
// e a linha azul tracejada, o caminho de um processo. Desenho fixo, em dados, para o componente ficar curto.
type Forma =
  | { tipo: 'tarefa'; x: number; y: number; largura?: number; altura?: number }
  | { tipo: 'evento'; x: number; y: number; raio: number; fim?: boolean }
  | { tipo: 'traco'; d: string }

const losango = (cx: number, cy: number): string => `M${cx} ${cy - 36}L${cx + 36} ${cy}L${cx} ${cy + 36}L${cx - 36} ${cy}Z`
// O "+" do losango de paralelo: o trabalho se divide e depois se junta.
const cruz = (cx: number, cy: number): string => `M${cx} ${cy - 16}V${cy + 16}M${cx - 16} ${cy}H${cx + 16}`

const FORMAS: Forma[] = [
  // Alto
  { tipo: 'evento', x: 70, y: 70, raio: 20 }, { tipo: 'tarefa', x: 172, y: 44 }, { tipo: 'traco', d: losango(420, 70) },
  { tipo: 'tarefa', x: 542, y: 44 }, { tipo: 'evento', x: 804, y: 70, raio: 22, fim: true },
  // Meio: um fluxo com decisão que se divide e se junta
  { tipo: 'evento', x: 120, y: 300, raio: 20 }, { tipo: 'tarefa', x: 212, y: 274 }, { tipo: 'traco', d: losango(460, 300) },
  { tipo: 'tarefa', x: 582, y: 274 }, { tipo: 'tarefa', x: 792, y: 274 }, { tipo: 'tarefa', x: 582, y: 394 },
  // Meio: um fluxo com duas tarefas em paralelo e um evento intermediário (círculo duplo)
  { tipo: 'tarefa', x: 40, y: 564 }, { tipo: 'traco', d: losango(290, 590) + cruz(290, 590) },
  { tipo: 'tarefa', x: 380, y: 514 }, { tipo: 'tarefa', x: 380, y: 630 }, { tipo: 'traco', d: losango(600, 590) + cruz(600, 590) },
  { tipo: 'evento', x: 744, y: 590, raio: 22 }, { tipo: 'evento', x: 744, y: 590, raio: 17 }, { tipo: 'tarefa', x: 852, y: 564 },
  // Embaixo
  { tipo: 'tarefa', x: 602, y: 770, largura: 150, altura: 56 }, { tipo: 'traco', d: losango(820, 796) },
  { tipo: 'evento', x: 70, y: 830, raio: 20 },
]

const SETAS: string[] = [
  'M90 70H170', 'M302 70H380', 'M456 70H540', 'M420 106V170H600', 'M672 70H780',
  'M140 300H210', 'M342 300H422', 'M496 300H580', 'M712 300H790', 'M460 336V420H580', 'M712 420H857V328',
  'M170 590H252', 'M290 554V540H378', 'M290 626V656H378', 'M510 540H600V552', 'M510 656H600V628', 'M636 590H720', 'M766 590H850',
  'M752 798H782', 'M856 796H930', 'M90 830H600',
]

function DesenhoDaForma({ forma }: { forma: Forma }) {
  if (forma.tipo === 'tarefa') return <rect x={forma.x} y={forma.y} width={forma.largura ?? 130} height={forma.altura ?? 52} rx="10" />
  if (forma.tipo === 'evento') return <circle className={forma.fim ? 'capa-fim' : undefined} cx={forma.x} cy={forma.y} r={forma.raio} />
  return <path d={forma.d} />
}

export function FluxogramaDaCapa() {
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
      <g className="capa-forma">{FORMAS.map((forma, i) => <DesenhoDaForma key={i} forma={forma} />)}</g>
      <g className="capa-seta">{SETAS.map((d) => <path key={d} d={d} markerEnd="url(#capa-ponta)" />)}</g>
      <path className="capa-caminho" d="M20 600C220 510 330 700 500 620S760 500 950 580" markerEnd="url(#capa-ponta-azul)" />
    </svg>
  )
}
