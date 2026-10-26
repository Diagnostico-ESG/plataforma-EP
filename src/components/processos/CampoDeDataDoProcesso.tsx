import './Contexto.css'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import { formatarData } from '../../lib/datas'

export type CampoDeDataDoProcessoProps = {
  /** A data gravada (AAAA-MM-DD); null quando não há. */
  data: string | null
  /** O nome do campo para quem usa leitor de tela (o `aria-label` do campo de data). */
  rotulo: string
  podeAlterar: boolean
  /** Grava a data nova (null: apagar). A recusa pronta (TravaDoBanco) ou a falha vira o aviso em vermelho. */
  gravar: (nova: string | null) => Promise<void>
  textoDaFalha: (erro: unknown) => string
  /** O que acompanha a data lida ("· próxima"). */
  complemento?: (data: string) => ReactNode
  /** O maior dia que o campo aceita (AAAA-MM-DD); o banco confere de novo. */
  maximo?: string
  aoMudar: () => void
  aoSumir: () => void
}

/**
 * Uma data do processo que se marca, altera e apaga ali mesmo (a Data da modelagem piloto e a Data da validação): a linha vira o
 * campo, e Salvar e Remover gravam na hora, sem confirmação, porque a data volta com dois cliques e o histórico guarda a antiga.
 */
export function CampoDeDataDoProcesso(props: CampoDeDataDoProcessoProps) {
  const [editando, setEditando] = useState(false)
  // O botão some ao abrir o campo e volta ao fechar: o foco acompanha, para quem usa o teclado não perder o lugar.
  const [voltouDaEdicao, setVoltouDaEdicao] = useState(false)
  const terminar = () => {
    setEditando(false)
    setVoltouDaEdicao(true)
  }
  if (editando) return <EdicaoDaData {...props} aoTerminar={terminar} />
  return <LeituraDaData {...props} focar={voltouDaEdicao} aoEditar={() => setEditando(true)} />
}

type LeituraProps = CampoDeDataDoProcessoProps & { focar: boolean; aoEditar: () => void }

function LeituraDaData({ data, podeAlterar, complemento, focar, aoEditar }: LeituraProps) {
  const botao = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (focar) botao.current?.focus()
  }, [focar])
  return (
    <div className="modelagem-linha">
      {data
        ? (
            <p className="modelagem-data">
              <time dateTime={data}>{formatarData(data)}</time>
              {complemento?.(data)}
            </p>
          )
        : <p className="modelagem-sem-data">Ainda não marcada</p>}
      {podeAlterar && (
        <button ref={botao} type="button" className="contexto-link" onClick={aoEditar}>{data ? 'Alterar data' : 'Marcar data'}</button>
      )}
    </div>
  )
}

type EdicaoProps = CampoDeDataDoProcessoProps & { aoTerminar: () => void }

// Remover não pede confirmação: a data volta com dois cliques e o histórico guarda a antiga.
function EdicaoDaData({ data: gravada, rotulo, gravar, textoDaFalha, maximo, aoMudar, aoSumir, aoTerminar }: EdicaoProps) {
  const [data, setData] = useState(gravada ?? '')
  const [gravando, setGravando] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)
  const campo = useRef<HTMLInputElement>(null)
  useEffect(() => campo.current?.focus(), [])

  async function gravarNaHora(nova: string | null) {
    setFalha(null)
    setGravando(true)
    try {
      await gravar(nova)
    } catch (erro) {
      setGravando(false)
      if (erro instanceof CadastroInexistente) return aoSumir()
      return setFalha(textoDaFalha(erro))
    }
    aoTerminar()
    aoMudar()
  }

  return (
    <div className="modelagem-edicao">
      <input ref={campo} type="date" aria-label={rotulo} max={maximo} value={data} onChange={(mudanca) => setData(mudanca.target.value)} />
      <div className="modelagem-botoes">
        <button type="button" className="botao botao-principal" disabled={gravando || data === '' || data === gravada}
          onClick={() => gravarNaHora(data)}>Salvar</button>
        {gravada !== null && (
          <button type="button" className="botao botao-secundario" disabled={gravando} onClick={() => gravarNaHora(null)}>Remover</button>
        )}
        <button type="button" className="botao botao-secundario" disabled={gravando} onClick={aoTerminar}>Cancelar</button>
      </div>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
    </div>
  )
}
