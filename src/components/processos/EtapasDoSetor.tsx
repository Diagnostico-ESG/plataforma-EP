import { useCallback } from 'react'
import { type EstadoDoCarregamento, useCarregamento } from '../../hooks/useCarregamento'
import type { EtapaDoSetor, ModuloDeProcessos } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { CaminhoDeEtapas } from './CaminhoDeEtapas'
import './Etapas.css'

type EtapasDoSetorProps = { processos: ModuloDeProcessos; setorId: string; podeAlterar: boolean; aoSumir: () => void }

/** Seção "Etapas do setor" da tela do setor. Esconder as ações da Consulta é conveniência: quem protege é a RLS. */
export function EtapasDoSetor({ processos, setorId, podeAlterar, aoSumir }: EtapasDoSetorProps) {
  const ler = useCallback(() => processos.lerEtapasDoSetor(setorId), [processos, setorId])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  return (
    <section className="etapas-do-setor" aria-label="Etapas do setor">
      <h3 className="form-setor-titulo">Etapas do setor</h3>
      <ConteudoDasEtapas estado={estado} aoTentarDeNovo={tentarDeNovo} processos={processos}
        podeAlterar={podeAlterar} aoMudar={recarregar} aoSumir={aoSumir} />
    </section>
  )
}

type ConteudoProps = Omit<EtapasDoSetorProps, 'setorId'> & {
  estado: EstadoDoCarregamento<EtapaDoSetor[]>
  aoTentarDeNovo: () => void
  aoMudar: () => void
}

function ConteudoDasEtapas({ estado, aoTentarDeNovo, ...caminho }: ConteudoProps) {
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando etapas do setor…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="as etapas do setor" aoTentarDeNovo={aoTentarDeNovo} />
  return <CaminhoDeEtapas etapas={estado.valor} {...caminho} />
}
