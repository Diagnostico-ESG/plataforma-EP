import { type FormEvent, useId, useState } from 'react'
import { useArquivosDaVersao } from '../../hooks/useArquivosDaVersao'
import { useRolarAteAparecer } from '../../hooks/useRolarAteAparecer'
import type { ProcessoDaLista } from '../../processos/tipos'
import {
  type ModoDoFormulario, PAPEIS_OBRIGATORIOS, type Progresso, arquivosDoPedido, lerNumeroDigitado, nomeNaPrevia, papeisDoFormulario,
  podeSubmeter, textoDaFalhaDoEnvio, textoDoProgresso,
} from '../../versoes/formularioDeVersao'
import { rotuloDaVersao } from '../../versoes/rotulos'
import type { ModuloDeVersoes, PedidoDeVersao } from '../../versoes/tipos'
import { CampoDeArquivo } from './CampoDeArquivo'
import { CampoDoNumeroDaVersao } from './CampoDoNumeroDaVersao'

type FormularioDeVersaoProps = {
  modulo: ModuloDeVersoes
  processo: Pick<ProcessoDaLista, 'id' | 'nome' | 'setorSigla'>
  /**
   * Em sequência: o número da prévia (maior + 1) e o do relatório que vai junto, com que os arquivos são nomeados no Drive. Piloto: o número é digitado
   * e vem preenchido com o menor aceito (6 vira V6P). Histórica: o número é digitado (5 vira V5F) e os arquivos são os
   * que existirem.
   */
  modo: ModoDoFormulario
  /** O botão de enviar; sem ele, "Enviar" ("Registrar" na histórica). A janela da trava de arquivos diz "Enviar e mover". */
  rotuloDoEnvio?: string
  /** Só na versão em sequência: o relatório (.docx) também é obrigatório (a trava da técnica pede a versão e o relatório). */
  relatorioObrigatorio?: boolean
  /** Chamado depois do registro, com o que foi enviado. */
  aoEnviada: (pedido: PedidoDeVersao) => void
  aoCancelar: () => void
}

const TEXTOS_DO_MODO = {
  sequencia: { titulo: 'Enviar versão', botao: 'Enviar' },
  piloto: { titulo: 'Enviar versão piloto', botao: 'Enviar' },
  historica: { titulo: 'Registrar versão histórica', botao: 'Registrar' },
}

const DICA_DO_MODO = {
  sequencia: null,
  piloto: 'Só o .bpm é obrigatório; o .png e o .bpmn podem entrar agora ou depois.',
  historica: 'Informe o .bpm, ou o .bpmn com o .png.',
}

function numeroDoModo(modo: ModoDoFormulario, textoDoNumero: string): number | null {
  return modo.tipo === 'sequencia' ? modo.numero : lerNumeroDigitado(textoDoNumero)
}

function numeroInicial(modo: ModoDoFormulario): string {
  return modo.tipo === 'piloto' ? String(modo.numeroSugerido) : ''
}

// O relatório que vai junto com a versão em sequência leva o número que ele vai receber (a prévia).
function numeroDoRelatorioDoPedido(modo: ModoDoFormulario, escolhidos: { relatorio?: File }): { numeroDoRelatorio?: number } {
  return modo.tipo === 'sequencia' && escolhidos.relatorio ? { numeroDoRelatorio: modo.numeroDoRelatorio } : {}
}

// noValidate: as mensagens são as nossas. Os campos ficam travados durante o envio; na falha, continuam preenchidos.
export function FormularioDeVersao(props: FormularioDeVersaoProps) {
  const { modulo, processo, modo, rotuloDoEnvio, relatorioObrigatorio = false, aoEnviada, aoCancelar } = props
  const arquivos = useArquivosDaVersao(modo.tipo === 'historica')
  const [textoDoNumero, setTextoDoNumero] = useState(numeroInicial(modo))
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const id = useId()
  const ref = useRolarAteAparecer<HTMLFormElement>()
  const historica = modo.tipo === 'historica'
  const piloto = modo.tipo === 'piloto'
  const numero = numeroDoModo(modo, textoDoNumero)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (numero === null) return
    setAviso(null)
    const pedido: PedidoDeVersao = {
      processoId: processo.id, numero, piloto, arquivos: arquivosDoPedido(arquivos.escolhidos), ...numeroDoRelatorioDoPedido(modo, arquivos.escolhidos),
    }
    setProgresso({ enviados: 0, total: pedido.arquivos.length })
    const aoProgredir = (enviados: number, total: number) => setProgresso({ enviados, total })
    try {
      await (historica ? modulo.registrarVersaoHistorica(pedido, aoProgredir) : modulo.enviarVersao(pedido, aoProgredir))
      aoEnviada(pedido)
    } catch (erro) {
      setAviso(textoDaFalhaDoEnvio(erro))
      setProgresso(null)
    }
  }

  const enviando = progresso !== null
  const pronto = podeSubmeter(modo, arquivos, numero, relatorioObrigatorio)
  const { titulo, botao } = TEXTOS_DO_MODO[modo.tipo]
  const dica = DICA_DO_MODO[modo.tipo]
  return (
    <form ref={ref} className="formulario-do-processo formulario-de-versao" aria-label={titulo} noValidate onSubmit={enviar}>
      <h3 className="painel-subtitulo">{titulo}</h3>
      {numero !== null && (
        <p className="formulario-de-versao-previa">
          Esta versão será a <strong>{rotuloDaVersao({ numero, historica, piloto })}</strong>.
        </p>
      )}
      <fieldset className="formulario-de-versao-campos" disabled={enviando} aria-describedby={dica ? `${id}-dica` : undefined}>
        <legend>Arquivos</legend>
        {modo.tipo !== 'sequencia' && <CampoDoNumeroDaVersao texto={textoDoNumero} aoMudar={setTextoDoNumero} />}
        {dica && <p id={`${id}-dica`} className="formulario-de-versao-dica">{dica}</p>}
        {papeisDoFormulario(modo).map((papel) => {
          const arquivo = arquivos.escolhidos[papel]
          const doRelatorio = modo.tipo === 'sequencia' && papel === 'relatorio' ? modo.numeroDoRelatorio : undefined
          return (
            <CampoDeArquivo key={papel} papel={papel} obrigatorio={!historica && (PAPEIS_OBRIGATORIOS.includes(papel) || (relatorioObrigatorio && papel === 'relatorio'))}
              relatorioSemNumero={historica}
              nomePrevisto={arquivo && numero !== null ? nomeNaPrevia(processo, numero, papel, arquivo, modo.tipo, doRelatorio) : null}
              recusa={arquivos.recusas[papel] ?? null} aoEscolher={(escolhido) => void arquivos.escolher(papel, escolhido)} />
          )
        })}
      </fieldset>
      {progresso && <p className="formulario-de-versao-progresso" role="status">{textoDoProgresso(progresso)}</p>}
      <div className="formulario-do-processo-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando || !pronto}>
          {rotuloDoEnvio ?? botao}
        </button>
        <button type="button" className="botao botao-secundario" disabled={enviando} onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
