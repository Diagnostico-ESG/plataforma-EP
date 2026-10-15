import type { UsuarioAtual } from '../../acesso/tipos'
import type { AreaComTela } from './areas'
import { MenuDaConta } from './MenuDaConta'

type BarraSuperiorProps = {
  titulo: string
  usuario: UsuarioAtual
  aoSair: () => Promise<void>
  /** A visão da área de processos; null fora dela, onde o Quadro/Lista não faz sentido. */
  visao: 'quadro' | 'lista' | null
  aoIrPara: (area: AreaComTela) => void
}

export function BarraSuperior({ titulo, usuario, aoSair, visao, aoIrPara }: BarraSuperiorProps) {
  return (
    <header className="barra-superior">
      <span className="barra-marca">EP</span>
      <h1 className="barra-titulo">{titulo}</h1>
      {visao && (
        <div className="alternancia" role="group" aria-label="Forma de ver os processos">
          <button type="button" className="alternancia-opcao" aria-pressed={visao === 'quadro'} onClick={() => aoIrPara('quadro')}>
            Quadro
          </button>
          <button type="button" className="alternancia-opcao" aria-pressed={visao === 'lista'} onClick={() => aoIrPara('lista')}>
            Lista
          </button>
        </div>
      )}
      <div className="barra-acoes">
        <MenuDaConta usuario={usuario} aoSair={aoSair} />
      </div>
    </header>
  )
}
