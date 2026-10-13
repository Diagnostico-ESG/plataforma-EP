import { Icone, type NomeIcone } from '../Icone'
import { temTela, type AreaComTela, type AreaDoSistema } from './areas'

type ItemDaFaixa = { area: AreaDoSistema; icone: NomeIcone; rotulo: string }

const ITENS: ItemDaFaixa[] = [
  { area: 'quadro', icone: 'quadro', rotulo: 'Quadro' },
  { area: 'lista', icone: 'lista', rotulo: 'Lista' },
  { area: 'setores', icone: 'setores', rotulo: 'Setores' },
  { area: 'reunioes', icone: 'reunioes', rotulo: 'Reuniões' },
  { area: 'painel', icone: 'painel', rotulo: 'Painel' },
  { area: 'administracao', icone: 'administracao', rotulo: 'Administração' },
]

type FaixaLateralProps = {
  areaAtual: AreaDoSistema
  mostrarAdministracao: boolean
  aoIrPara: (area: AreaComTela) => void
}

// Quadro, Setores e Administração têm tela; as outras áreas ganham tela na sua funcionalidade.
export function FaixaLateral({ areaAtual, mostrarAdministracao, aoIrPara }: FaixaLateralProps) {
  const itens = mostrarAdministracao ? ITENS : ITENS.filter((item) => item.area !== 'administracao')
  return (
    <nav className="faixa-lateral" aria-label="Áreas do sistema">
      {itens.map(({ area, icone, rotulo }) => (
        <button
          key={area}
          type="button"
          className="faixa-item"
          aria-label={rotulo}
          title={rotulo}
          aria-current={area === areaAtual ? 'page' : undefined}
          onClick={temTela(area) ? () => aoIrPara(area) : undefined}
        >
          <Icone nome={icone} />
        </button>
      ))}
    </nav>
  )
}
