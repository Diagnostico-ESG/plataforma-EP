import type { ReactNode } from 'react'
import type { UsuarioAtual } from '../../acesso/tipos'
import type { AreaComTela, AreaDoSistema } from './areas'
import { BarraSuperior } from './BarraSuperior'
import { FaixaLateral } from './FaixaLateral'
import './Moldura.css'

type MolduraProps = {
  areaAtual: AreaDoSistema
  aoIrPara: (area: AreaComTela) => void
  titulo: string
  usuario: UsuarioAtual
  aoSair: () => void
  children: ReactNode
}

export function Moldura({ areaAtual, aoIrPara, titulo, usuario, aoSair, children }: MolduraProps) {
  return (
    <div className="moldura">
      <BarraSuperior titulo={titulo} usuario={usuario} aoSair={aoSair} mostrarAlternancia={areaAtual === 'quadro'} />
      <FaixaLateral
        areaAtual={areaAtual}
        mostrarAdministracao={usuario.perfil === 'administrador'}
        aoIrPara={aoIrPara}
      />
      <main className="area-de-trabalho">{children}</main>
    </div>
  )
}
