import { Icone, type NomeIcone } from '../Icone'

export type AreaDoSistema = 'quadro' | 'lista' | 'setores' | 'reunioes' | 'painel' | 'administracao'

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
}

// As áreas ainda não levam a lugar nenhum: cada uma ganha tela na sua funcionalidade.
export function FaixaLateral({ areaAtual }: FaixaLateralProps) {
  return (
    <nav className="faixa-lateral" aria-label="Áreas do sistema">
      {ITENS.map((item) => (
        <button
          key={item.area}
          type="button"
          className="faixa-item"
          aria-label={item.rotulo}
          title={item.rotulo}
          aria-current={item.area === areaAtual ? 'page' : undefined}
        >
          <Icone nome={item.icone} />
        </button>
      ))}
    </nav>
  )
}
