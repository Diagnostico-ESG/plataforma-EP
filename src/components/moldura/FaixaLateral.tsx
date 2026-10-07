import { Icone, type NomeIcone } from '../Icone'

type AreaDoSistema = { nome: NomeIcone; rotulo: string }

const AREAS: AreaDoSistema[] = [
  { nome: 'quadro', rotulo: 'Quadro' },
  { nome: 'lista', rotulo: 'Lista' },
  { nome: 'setores', rotulo: 'Setores' },
  { nome: 'reunioes', rotulo: 'Reuniões' },
  { nome: 'painel', rotulo: 'Painel' },
  { nome: 'administracao', rotulo: 'Administração' },
]

type FaixaLateralProps = {
  areaAtual: NomeIcone
}

// As áreas ainda não levam a lugar nenhum: cada uma ganha tela na sua funcionalidade.
export function FaixaLateral({ areaAtual }: FaixaLateralProps) {
  return (
    <nav className="faixa-lateral" aria-label="Áreas do sistema">
      {AREAS.map((area) => (
        <button
          key={area.nome}
          type="button"
          className="faixa-item"
          aria-label={area.rotulo}
          title={area.rotulo}
          aria-current={area.nome === areaAtual ? 'page' : undefined}
        >
          <Icone nome={area.nome} />
        </button>
      ))}
    </nav>
  )
}
