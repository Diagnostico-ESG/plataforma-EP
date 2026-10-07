import type { ReactNode } from 'react'
import type { NomeIcone } from '../Icone'
import { BarraSuperior } from './BarraSuperior'
import { FaixaLateral } from './FaixaLateral'
import './Moldura.css'

type MolduraProps = {
  areaAtual: NomeIcone
  titulo: string
  children: ReactNode
}

export function Moldura({ areaAtual, titulo, children }: MolduraProps) {
  return (
    <div className="moldura">
      <BarraSuperior titulo={titulo} />
      <FaixaLateral areaAtual={areaAtual} />
      <main className="area-de-trabalho">{children}</main>
    </div>
  )
}
