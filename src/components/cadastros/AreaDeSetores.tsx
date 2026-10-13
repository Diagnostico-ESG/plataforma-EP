import { useCallback, useState } from 'react'
import type { DadosDoSetor, ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { FormularioDeSetor } from './FormularioDeSetor'
import { ListaDeSetores } from './ListaDeSetores'

type AreaDeSetoresProps = { cadastros: ModuloDeCadastros; podeAlterar: boolean }

export function AreaDeSetores({ cadastros, podeAlterar }: AreaDeSetoresProps) {
  const listar = useCallback(() => cadastros.listarSetores(), [cadastros])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(listar)
  const [criando, setCriando] = useState(false)
  const [, setAberto] = useState<string | null>(null)

  // A falha segue para o formulário, que a mostra e mantém os dados.
  async function criar(dados: DadosDoSetor) {
    await cadastros.criarSetor(dados)
    setCriando(false)
    recarregar()
  }

  return (
    <div className="cadastros-secao">
      {podeAlterar && !criando && (
        <button type="button" className="botao botao-principal cadastros-novo" onClick={() => setCriando(true)}>
          Novo setor
        </button>
      )}
      {criando && <FormularioDeSetor aoSalvar={criar} aoCancelar={() => setCriando(false)} />}
      <ListaDeSetores estado={estado} aoTentarDeNovo={tentarDeNovo} aoAbrir={setAberto} />
    </div>
  )
}
