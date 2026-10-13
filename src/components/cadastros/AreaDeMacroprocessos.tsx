import { useCallback } from 'react'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { ListaDeMacroprocessos } from './ListaDeMacroprocessos'

type AreaDeMacroprocessosProps = { cadastros: ModuloDeCadastros; podeAlterar: boolean }

export function AreaDeMacroprocessos({ cadastros, podeAlterar }: AreaDeMacroprocessosProps) {
  const listar = useCallback(() => cadastros.listarMacroprocessos(), [cadastros])
  const { estado, tentarDeNovo } = useCarregamento(listar)

  return (
    <div className="cadastros-secao">
      {podeAlterar && <button type="button" className="botao botao-principal cadastros-novo">Novo macroprocesso</button>}
      <ListaDeMacroprocessos estado={estado} aoTentarDeNovo={tentarDeNovo} aoAbrir={() => {}} />
    </div>
  )
}
