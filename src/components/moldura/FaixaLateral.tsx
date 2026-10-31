import { Icone } from '../Icone'
import { ICONE_DA_AREA, type AreaDoSistema } from './areas'

type ItemDaFaixa = { area: AreaDoSistema; rotulo: string }

const ITENS: ItemDaFaixa[] = [
  { area: 'processos', rotulo: 'Processos' },
  { area: 'setores', rotulo: 'Setores' },
  { area: 'painel', rotulo: 'Painel' },
  { area: 'administracao', rotulo: 'Administração' },
  { area: 'ajuda', rotulo: 'Ajuda' },
]

type FaixaLateralProps = {
  areaAtual: AreaDoSistema
  mostrarAdministracao: boolean
  aoIrPara: (area: AreaDoSistema) => void
}

// A Ajuda fica no pé da faixa (.faixa-item-ajuda), como na proposta 6.
export function FaixaLateral({ areaAtual, mostrarAdministracao, aoIrPara }: FaixaLateralProps) {
  const itens = mostrarAdministracao ? ITENS : ITENS.filter((item) => item.area !== 'administracao')
  return (
    <nav className="faixa-lateral" aria-label="Áreas do sistema">
      <span className="faixa-marca" aria-hidden="true">EP</span>
      {itens.map(({ area, rotulo }) => (
        <button
          key={area}
          type="button"
          className={area === 'ajuda' ? 'faixa-item faixa-item-ajuda' : 'faixa-item'}
          aria-label={rotulo}
          title={rotulo}
          aria-current={area === areaAtual ? 'page' : undefined}
          onClick={() => aoIrPara(area)}
        >
          <Icone nome={ICONE_DA_AREA[area]} />
        </button>
      ))}
    </nav>
  )
}
