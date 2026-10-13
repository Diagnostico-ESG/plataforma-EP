import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { ResponsaveisEditaveis } from './ResponsaveisEditaveis'
import { TabelaDeResponsaveis } from './TabelaDeResponsaveis'
import './Etapas.css'

type ResponsaveisDoSetorProps = { processos: ModuloDeProcessos; setorId: string; podeAlterar: boolean }

/** Seção "Responsáveis do setor" da tela do setor. Esconder os botões da Consulta é conveniência: quem protege é a RLS. */
export function ResponsaveisDoSetor({ processos, setorId, podeAlterar }: ResponsaveisDoSetorProps) {
  const ler = useCallback(() => processos.lerResponsaveisDoSetor(setorId), [processos, setorId])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  return (
    <section className="responsaveis-do-setor" aria-label="Responsáveis do setor">
      <h3 className="form-setor-titulo">Responsáveis do setor</h3>
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando responsáveis…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="os responsáveis" aoTentarDeNovo={tentarDeNovo} />}
      {estado.tipo === 'pronto' && (podeAlterar
        ? <ResponsaveisEditaveis processos={processos} setorId={setorId} responsaveis={estado.valor} aoMudar={recarregar} />
        : <TabelaDeResponsaveis responsaveis={estado.valor} />)}
    </section>
  )
}
