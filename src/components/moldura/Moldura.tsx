import type { ReactNode } from 'react'
import type { UsuarioAtual } from '../../acesso/tipos'
import { ehAreaDeProcessos, type AreaComTela, type AreaDoSistema } from './areas'
import { BarraSuperior } from './BarraSuperior'
import { FaixaLateral } from './FaixaLateral'
import './Moldura.css'

type MolduraProps = {
  areaAtual: AreaDoSistema
  aoIrPara: (area: AreaComTela) => void
  titulo: string
  usuario: UsuarioAtual
  aoSair: () => Promise<void>
  children: ReactNode
}

export function Moldura({ areaAtual, aoIrPara, titulo, usuario, aoSair, children }: MolduraProps) {
  return (
    <div className="moldura">
      <BarraSuperior titulo={titulo} usuario={usuario} aoSair={aoSair}
        visao={ehAreaDeProcessos(areaAtual) ? areaAtual : null} aoIrPara={aoIrPara} />
      <FaixaLateral
        areaAtual={areaAtual}
        mostrarAdministracao={usuario.perfil === 'administrador'}
        aoIrPara={aoIrPara}
      />
      <main className="area-de-trabalho">{children}</main>
    </div>
  )
}
