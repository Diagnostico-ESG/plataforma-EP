import { useState } from 'react'
import { TravaDoBanco } from '../../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import { hojeLocal, textoDaReuniao } from '../../processos/textoDaReuniao'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'

type ReuniaoDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  podeAlterar: boolean
  aoMudar: () => void
  aoSumir: () => void
}

const ROTULO = 'Reunião de modelagem piloto'

function textoDaFalhaDaReuniao(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `A data da reunião não foi salva: ${erro instanceof Error ? erro.message : String(erro)}.`
}

/** A data da modelagem piloto: só um dado do processo, sem efeito nas etapas (ADR 0013). */
export function ReuniaoDoProcesso(props: ReuniaoDoProcessoProps) {
  const { processo, podeAlterar } = props
  return (
    <section className="painel-dados" aria-label={ROTULO}>
      <dl className="painel-lista-de-dados">
        <dt>{ROTULO}</dt>
        <dd>{textoDaReuniao(processo.dataDaReuniao, hojeLocal())}</dd>
      </dl>
      {/* A chave recomeça o campo quando a data gravada muda (depois de salvar ou remover). */}
      {podeAlterar && <EdicaoDaReuniao key={processo.dataDaReuniao ?? ''} {...props} />}
    </section>
  )
}

// Remover não pede confirmação: a data volta com dois cliques e o histórico guarda a antiga.
function EdicaoDaReuniao({ processo, processos, aoMudar, aoSumir }: ReuniaoDoProcessoProps) {
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
    setGravando(false)
    aoMudar()
  }

  return (
    <div className="reuniao-edicao">
      <input type="date" aria-label={`Data da ${ROTULO.toLowerCase()}`} value={data}
        onChange={(mudanca) => setData(mudanca.target.value)} />
      <button type="button" className="botao botao-principal" disabled={gravando || data === '' || data === gravada}
        onClick={() => gravar(data)}>Salvar</button>
      {gravada !== null && (
        <button type="button" className="botao botao-secundario" disabled={gravando}
          onClick={() => gravar(null)}>Remover</button>
      )}
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
    </div>
  )
}
