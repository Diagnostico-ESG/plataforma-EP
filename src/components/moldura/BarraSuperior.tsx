import type { UsuarioAtual } from '../../acesso/tipos'
import { Icone } from '../Icone'
import { MenuDaConta } from './MenuDaConta'

type BarraSuperiorProps = {
  titulo: string
  usuario: UsuarioAtual
  aoSair: () => void
  /** O Quadro/Lista só faz sentido na área de processos. */
  mostrarAlternancia: boolean
}

export function BarraSuperior({ titulo, usuario, aoSair, mostrarAlternancia }: BarraSuperiorProps) {
  return (
    <header className="barra-superior">
      <span className="barra-marca">EP</span>
      <h1 className="barra-titulo">{titulo}</h1>
      {mostrarAlternancia && (
        <div className="alternancia" role="group" aria-label="Forma de ver os processos">
          <button type="button" className="alternancia-opcao" aria-pressed="true">
            Quadro
          </button>
          <button type="button" className="alternancia-opcao" aria-pressed="false">
            Lista
          </button>
        </div>
      )}
      <div className="barra-acoes">
        <button type="button" className="botao-icone barra-icone" aria-label="Filtrar" title="Filtrar">
          <Icone nome="filtro" />
        </button>
        <MenuDaConta usuario={usuario} aoSair={aoSair} />
      </div>
    </header>
  )
}
