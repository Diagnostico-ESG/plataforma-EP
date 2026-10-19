import './Contexto.css'
import { useId, useState } from 'react'
import { TravaDoBanco } from '../../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import { formatarData } from '../../processos/caminhoDeEtapas'
import { hojeLocal, momentoDaReuniao } from '../../processos/textoDaReuniao'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'

type ReuniaoDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  podeAlterar: boolean
  aoMudar: () => void
  aoSumir: () => void
}

const TEXTO_DO_MOMENTO = { proxima: '· próxima', realizada: '· realizada' } as const

function textoDaFalhaDaReuniao(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `A data da reunião não foi salva: ${erro instanceof Error ? erro.message : String(erro)}.`
}

/**
 * A data da modelagem piloto na coluna direita do verso: só um dado do processo, sem efeito nas etapas (ADR 0013).
 * "Marcar data" ou "Alterar data" vira ali mesmo o campo (spec, "Verso do cartão", Reunião).
 */
export function ReuniaoDoProcesso(props: ReuniaoDoProcessoProps) {
  const { processo, podeAlterar } = props
  const idDoTitulo = useId()
  const [editando, setEditando] = useState(false)
  return (
    <section className="contexto-secao" aria-labelledby={idDoTitulo}>
      <h3 id={idDoTitulo} className="contexto-titulo">Reunião</h3>
      {editando
        ? <EdicaoDaReuniao {...props} aoTerminar={() => setEditando(false)} />
        : <LeituraDaReuniao data={processo.dataDaReuniao} podeAlterar={podeAlterar} aoEditar={() => setEditando(true)} />}
    </section>
  )
}

type LeituraProps = { data: string | null; podeAlterar: boolean; aoEditar: () => void }

function LeituraDaReuniao({ data, podeAlterar, aoEditar }: LeituraProps) {
  const momento = momentoDaReuniao(data, hojeLocal())
  return (
    <div className="reuniao-linha">
      {data && momento
        ? (
            <p className="reuniao-data">
              <time dateTime={data}>{formatarData(data)}</time>
              <span className="reuniao-momento">{TEXTO_DO_MOMENTO[momento]}</span>
            </p>
          )
        : <p className="reuniao-sem-data">Ainda não marcada</p>}
      {podeAlterar && (
        <button type="button" className="contexto-link" onClick={aoEditar}>{data ? 'Alterar data' : 'Marcar data'}</button>
      )}
    </div>
  )
}

type EdicaoProps = ReuniaoDoProcessoProps & { aoTerminar: () => void }

// Remover não pede confirmação: a data volta com dois cliques e o histórico guarda a antiga.
function EdicaoDaReuniao({ processo, processos, aoMudar, aoSumir, aoTerminar }: EdicaoProps) {
  const gravada = processo.dataDaReuniao
  const [data, setData] = useState(gravada ?? '')
  const [gravando, setGravando] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)

  async function gravar(nova: string | null) {
    setFalha(null)
    setGravando(true)
    try {
      await processos.marcarReuniao(processo.id, nova)
    } catch (erro) {
      setGravando(false)
      if (erro instanceof CadastroInexistente) return aoSumir()
      return setFalha(textoDaFalhaDaReuniao(erro))
    }
    aoTerminar()
    aoMudar()
  }

  return (
    <div className="reuniao-edicao">
      <input type="date" aria-label="Data da reunião de modelagem piloto" value={data}
        onChange={(mudanca) => setData(mudanca.target.value)} />
      <div className="reuniao-botoes">
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
