import { useCallback, useState } from 'react'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { ErroAoCarregar } from './ErroAoCarregar'
import { SetorEditavel } from './SetorEditavel'
import { ItemInexistente } from './ItemInexistente'
import { SetorSomenteLeitura } from './SetorSomenteLeitura'

type SetorAbertoProps = { cadastros: ModuloDeCadastros; podeAlterar: boolean; id: string; aoVoltar: () => void }

export function SetorAberto({ cadastros, podeAlterar, id, aoVoltar }: SetorAbertoProps) {
  const ler = useCallback(() => cadastros.lerSetor(id), [cadastros, id])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const [sumiu, setSumiu] = useState(false)

  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="o setor" aoTentarDeNovo={tentarDeNovo} />
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio">Carregando setor…</p>
  if (sumiu || estado.valor === null) return <ItemInexistente aoVoltar={aoVoltar} />
  if (!podeAlterar) return <SetorSomenteLeitura setor={estado.valor} aoVoltar={aoVoltar} />
  return (
    <SetorEditavel cadastros={cadastros} setor={estado.valor} aoVoltar={aoVoltar}
      aoSumir={() => setSumiu(true)} aoMudar={recarregar} />
  )
}
