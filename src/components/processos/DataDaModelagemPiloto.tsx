import './Contexto.css'
import { useEffect, useId, useRef, useState } from 'react'
import { TravaDoBanco } from '../../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import { formatarData } from '../../lib/datas'
import { hojeLocal, momentoDaModelagemPiloto } from '../../processos/textoDaModelagemPiloto'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'

type DataDaModelagemPilotoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  podeAlterar: boolean
  aoMudar: () => void
  aoSumir: () => void
}

const TEXTO_DO_MOMENTO = { proxima: '· próxima', realizada: '· realizada' } as const

function textoDaFalhaDaModelagemPiloto(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `A Data da modelagem piloto não foi salva: ${erro instanceof Error ? erro.message : String(erro)}.`
}

/**
 * A data da modelagem piloto na coluna direita do verso: só um dado do processo, sem efeito nas etapas (ADR 0013).
 * "Marcar data" ou "Alterar data" vira ali mesmo o campo (spec, "Cartão e verso", Data da modelagem piloto).
 */
export function DataDaModelagemPiloto(props: DataDaModelagemPilotoProps) {
  const { processo, podeAlterar } = props
  const idDoTitulo = useId()
  const [editando, setEditando] = useState(false)
  // O botão some ao abrir o campo e volta ao fechar: o foco acompanha, para quem usa o teclado não perder o lugar.
  const [voltouDaEdicao, setVoltouDaEdicao] = useState(false)
  const terminar = () => {
    setEditando(false)
    setVoltouDaEdicao(true)
  }
  return (
    <section className="contexto-secao" aria-labelledby={idDoTitulo}>
      <h3 id={idDoTitulo} className="contexto-titulo">Data da modelagem piloto</h3>
      {editando
        ? <EdicaoDaModelagemPiloto {...props} aoTerminar={terminar} />
        : (
            <LeituraDaModelagemPiloto data={processo.dataDaModelagemPiloto} podeAlterar={podeAlterar} focar={voltouDaEdicao}
              aoEditar={() => setEditando(true)} />
          )}
    </section>
  )
}

type LeituraProps = { data: string | null; podeAlterar: boolean; focar: boolean; aoEditar: () => void }

function LeituraDaModelagemPiloto({ data, podeAlterar, focar, aoEditar }: LeituraProps) {
  const momento = momentoDaModelagemPiloto(data, hojeLocal())
  const botao = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (focar) botao.current?.focus()
  }, [focar])
  return (
    <div className="modelagem-linha">
      {data && momento
        ? (
            <p className="modelagem-data">
              <time dateTime={data}>{formatarData(data)}</time>
              <span className="modelagem-momento">{TEXTO_DO_MOMENTO[momento]}</span>
            </p>
          )
        : <p className="modelagem-sem-data">Ainda não marcada</p>}
      {podeAlterar && (
        <button ref={botao} type="button" className="contexto-link" onClick={aoEditar}>{data ? 'Alterar data' : 'Marcar data'}</button>
      )}
    </div>
  )
}

type EdicaoProps = DataDaModelagemPilotoProps & { aoTerminar: () => void }

// Remover não pede confirmação: a data volta com dois cliques e o histórico guarda a antiga.
function EdicaoDaModelagemPiloto({ processo, processos, aoMudar, aoSumir, aoTerminar }: EdicaoProps) {
  const gravada = processo.dataDaModelagemPiloto
  const [data, setData] = useState(gravada ?? '')
  const [gravando, setGravando] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)
  const campo = useRef<HTMLInputElement>(null)
  useEffect(() => campo.current?.focus(), [])

  async function gravar(nova: string | null) {
    setFalha(null)
    setGravando(true)
    try {
      await processos.marcarDataDaModelagemPiloto(processo.id, nova)
    } catch (erro) {
      setGravando(false)
      if (erro instanceof CadastroInexistente) return aoSumir()
      return setFalha(textoDaFalhaDaModelagemPiloto(erro))
    }
    aoTerminar()
    aoMudar()
  }

  return (
    <div className="modelagem-edicao">
      <input ref={campo} type="date" aria-label="Data da modelagem piloto" value={data}
        onChange={(mudanca) => setData(mudanca.target.value)} />
      <div className="modelagem-botoes">
        <button type="button" className="botao botao-principal" disabled={gravando || data === '' || data === gravada}
          onClick={() => gravar(data)}>Salvar</button>
        {gravada !== null && (
          <button type="button" className="botao botao-secundario" disabled={gravando} onClick={() => gravar(null)}>Remover</button>
        )}
        <button type="button" className="botao botao-secundario" disabled={gravando} onClick={aoTerminar}>Cancelar</button>
      </div>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
    </div>
  )
}
