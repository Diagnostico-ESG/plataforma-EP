import { useCallback, useState } from 'react'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { ErroAoCarregar } from './ErroAoCarregar'
import { ItemInexistente } from './ItemInexistente'
import { MacroprocessoEditavel } from './MacroprocessoEditavel'
import { MacroprocessoSomenteLeitura } from './MacroprocessoSomenteLeitura'

type MacroprocessoAbertoProps = { cadastros: ModuloDeCadastros; podeAlterar: boolean; id: string; aoVoltar: () => void }

export function MacroprocessoAberto({ cadastros, podeAlterar, id, aoVoltar }: MacroprocessoAbertoProps) {
  const ler = useCallback(() => cadastros.lerMacroprocesso(id), [cadastros, id])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const [sumiu, setSumiu] = useState(false)

  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="o macroprocesso" aoTentarDeNovo={tentarDeNovo} />
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio">Carregando macroprocesso…</p>
  if (sumiu || estado.valor === null) return <ItemInexistente aoVoltar={aoVoltar} />
  if (!podeAlterar) return <MacroprocessoSomenteLeitura macroprocesso={estado.valor} aoVoltar={aoVoltar} />
  return (
    <MacroprocessoEditavel cadastros={cadastros} macroprocesso={estado.valor} aoVoltar={aoVoltar}
      aoSumir={() => setSumiu(true)} aoMudar={recarregar} />
  )
}
