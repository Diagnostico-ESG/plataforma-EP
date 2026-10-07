import type { ReactNode } from 'react'
import type { UsuarioAtual } from '../../acesso/tipos'
import { BarraSuperior } from './BarraSuperior'
import { FaixaLateral, type AreaDoSistema } from './FaixaLateral'
import './Moldura.css'

type MolduraProps = {
  areaAtual: AreaDoSistema
  titulo: string
  usuario: UsuarioAtual
  aoSair: () => void
  children: ReactNode
}

export function Moldura({ areaAtual, titulo, usuario, aoSair, children }: MolduraProps) {
  return (
    <div className="moldura">
      <BarraSuperior titulo={titulo} usuario={usuario} aoSair={aoSair} />
      <FaixaLateral areaAtual={areaAtual} />
      <main className="area-de-trabalho">{children}</main>
    </div>
  )
}
