import type { ReactNode } from 'react'
import './Pilula.css'

export type SituacaoPilula = 'atraso' | 'vencendo' | 'informativa' | 'aprovado' | 'neutra'

type PilulaProps = {
  situacao: SituacaoPilula
  /** O texto é obrigatório: a situação nunca é dita só pela cor. */
  children: ReactNode
}

export function Pilula({ situacao, children }: PilulaProps) {
  return <span className={`pilula pilula-${situacao}`}>{children}</span>
}
