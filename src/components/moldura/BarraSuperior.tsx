import { Icone } from '../Icone'

type BarraSuperiorProps = {
  titulo: string
}

// Sem login ainda: o lugar do avatar mostra o ícone de conta até a funcionalidade "Login e perfis".
export function BarraSuperior({ titulo }: BarraSuperiorProps) {
  return (
    <header className="barra-superior">
      <span className="barra-marca">EP</span>
      <h1 className="barra-titulo">{titulo}</h1>
      <div className="alternancia" role="group" aria-label="Forma de ver os processos">
        <button type="button" className="alternancia-opcao" aria-pressed="true">
          Quadro
        </button>
        <button type="button" className="alternancia-opcao" aria-pressed="false">
          Lista
        </button>
      </div>
      <div className="barra-acoes">
        <button type="button" className="botao-icone barra-icone" aria-label="Filtrar" title="Filtrar">
          <Icone nome="filtro" />
        </button>
        <button type="button" className="botao-icone barra-icone" aria-label="Sua conta" title="Sua conta">
          <Icone nome="conta" />
        </button>
      </div>
    </header>
  )
}
