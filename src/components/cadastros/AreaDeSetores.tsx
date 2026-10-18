import { useCallback, useState } from 'react'
import type { DadosDoSetor, ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useEndereco } from '../../hooks/useEndereco'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { FormularioDeSetor } from './FormularioDeSetor'
import { ListaDeSetores } from './ListaDeSetores'
import { SetorAberto } from './SetorAberto'

type AreaDeSetoresProps = {
  cadastros: ModuloDeCadastros; processos: ModuloDeProcessos; podeAlterar: boolean
}

// Um terceiro trecho que não é aba (#/setores/<id>, de "Ver no setor") abre o setor direto.
function idDoSetorNoEndereco(endereco: string): string | null {
  const trecho = endereco.split('/')[2]
  return trecho && trecho !== 'macroprocessos' && trecho !== 'historico' ? trecho : null
}

export function AreaDeSetores({ cadastros, processos, podeAlterar }: AreaDeSetoresProps) {
  const listar = useCallback(() => cadastros.listarSetores(), [cadastros])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(listar)
  const [endereco, irParaEndereco] = useEndereco()
  const [criando, setCriando] = useState(false)
  const [aberto, setAberto] = useState<string | null>(() => idDoSetorNoEndereco(endereco))

  // A falha segue para o formulário, que a mostra e mantém os dados.
  async function criar(dados: DadosDoSetor) {
    await cadastros.criarSetor(dados)
    setCriando(false)
    recarregar()
  }

  function voltar() {
    setAberto(null)
    if (idDoSetorNoEndereco(endereco) !== null) irParaEndereco('#/setores')
    recarregar()
  }

  if (aberto !== null) {
    return (
      <SetorAberto cadastros={cadastros} processos={processos} podeAlterar={podeAlterar} id={aberto}
        aoVoltar={voltar} />
    )
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
