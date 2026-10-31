import { useCallback, useEffect, useRef, useState } from 'react'
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

// Um terceiro trecho que não é aba (#/setores/<id>, um endereço guardado ou compartilhado) abre o setor direto.
function idDoSetorNoEndereco(endereco: string): string | null {
  const trecho = endereco.split('/')[2]
  return trecho && trecho !== 'macroprocessos' && trecho !== 'historico' ? trecho : null
}

type JanelaDoNovoSetorProps = { aoSalvar: (dados: DadosDoSetor) => Promise<void>; aoCancelar: () => void }

// A janela nativa, como a JanelaDeEdicao: abre ao montar, o foco vai ao Nome e Esc fecha sem gravar. O formulário é o
// mesmo do setor aberto, com as mesmas validações; quem a monta a desmonta ao salvar ou cancelar.
function JanelaDoNovoSetor({ aoSalvar, aoCancelar }: JanelaDoNovoSetorProps) {
  const janela = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    janela.current?.showModal()
    janela.current?.querySelector<HTMLElement>('input')?.focus()
  }, [])
  return (
    <dialog ref={janela} className="janela-confirmacao janela-do-setor" aria-label="Novo setor" onClose={aoCancelar}>
      <FormularioDeSetor aoSalvar={aoSalvar} aoCancelar={aoCancelar} />
    </dialog>
  )
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
      {criando && <JanelaDoNovoSetor aoSalvar={criar} aoCancelar={() => setCriando(false)} />}
      <ListaDeSetores estado={estado} aoTentarDeNovo={tentarDeNovo} aoAbrir={setAberto} />
    </div>
  )
}
