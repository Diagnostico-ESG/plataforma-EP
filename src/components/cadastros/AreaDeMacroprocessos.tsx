import { useCallback, useState } from 'react'
import type { DadosDoMacroprocesso, ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { FormularioDeMacroprocesso } from './FormularioDeMacroprocesso'
import { ListaDeMacroprocessos } from './ListaDeMacroprocessos'

type AreaDeMacroprocessosProps = { cadastros: ModuloDeCadastros; podeAlterar: boolean }

export function AreaDeMacroprocessos({ cadastros, podeAlterar }: AreaDeMacroprocessosProps) {
  const listar = useCallback(() => cadastros.listarMacroprocessos(), [cadastros])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(listar)
  const [criando, setCriando] = useState(false)

  // A falha segue para o formulário, que a mostra e mantém os dados.
  async function criar(dados: DadosDoMacroprocesso) {
    await cadastros.criarMacroprocesso(dados)
    setCriando(false)
    recarregar()
  }

  return (
    <div className="cadastros-secao">
      {podeAlterar && !criando && (
        <button type="button" className="botao botao-principal cadastros-novo" onClick={() => setCriando(true)}>
          Novo macroprocesso
        </button>
      )}
      {criando && <FormularioDeMacroprocesso aoSalvar={criar} aoCancelar={() => setCriando(false)} />}
      <ListaDeMacroprocessos estado={estado} aoTentarDeNovo={tentarDeNovo} aoAbrir={() => {}} />
    </div>
  )
}
