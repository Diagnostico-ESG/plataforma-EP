import { type FormEvent, useId, useState } from 'react'
import { useArquivosDaVersao } from '../../hooks/useArquivosDaVersao'
import { useRolarAteAparecer } from '../../hooks/useRolarAteAparecer'
import type { ProcessoDaLista } from '../../processos/tipos'
import {
  type Escolhidos, type ModoDoFormulario, PAPEIS_OBRIGATORIOS, type Progresso, arquivosDoPedido, lerNumeroDigitado, nomeNaPrevia,
  papeisDoFormulario, podeSubmeter, previaDoRelatorio, textoDaFalhaDoEnvio, textoDoProgresso,
} from '../../versoes/formularioDeVersao'
import { rotuloDaVersao } from '../../versoes/rotulos'
import type { ModuloDeVersoes, PapelDoArquivo, PedidoDeVersao } from '../../versoes/tipos'
import { CampoDeArquivo } from './CampoDeArquivo'
import { CampoDoNumeroDaVersao } from './CampoDoNumeroDaVersao'

type FormularioDeVersaoProps = {
  modulo: ModuloDeVersoes
  processo: Pick<ProcessoDaLista, 'id' | 'nome' | 'setorSigla'>
  /**
   * Em sequência: o número da prévia (maior + 1) e o do relatório que vai junto, com que os arquivos são nomeados no Drive. Piloto: o número é digitado
   * e vem preenchido com o menor aceito (6 vira V6P). Histórica: o número é digitado (5 vira V5F) e os arquivos são os
   * que existirem. Na Revisão do relatório, a em sequência pede o relatório e aceita ir sem o .bpm (só o relatório).
   */
  modo: ModoDoFormulario
  /** O botão de enviar; sem ele, "Enviar" ("Registrar" na histórica). A janela da trava de arquivos diz "Enviar e mover". */
  rotuloDoEnvio?: string
  /** Só na versão em sequência: o relatório (.docx) também é obrigatório (a trava da técnica pede a versão e o relatório). */
  relatorioObrigatorio?: boolean
  /** Chamado depois do registro, com o que foi enviado; sem argumento quando foi só o relatório (Revisão do relatório). */
  aoEnviada: (pedido?: PedidoDeVersao) => void
  aoCancelar: () => void
}

const TEXTOS_DO_MODO = {
  sequencia: { titulo: 'Enviar versão', botao: 'Enviar' },
  piloto: { titulo: 'Enviar versão piloto', botao: 'Enviar' },
  historica: { titulo: 'Registrar versão histórica', botao: 'Registrar' },
}

const DICA_DO_MODO = {
  sequencia: null,
  piloto: 'Só o .bpm é obrigatório; o .png pode entrar agora ou depois.',
  historica: 'Informe o .bpm; o .png e o relatório são opcionais.',
}

const DICA_DA_REVISAO_DO_RELATORIO = 'O relatório é obrigatório; o .bpm e o .png são opcionais. O .png só vai junto com o .bpm.'

function dicaDoModo(modo: ModoDoFormulario): string | null {
  return modo.tipo === 'sequencia' && modo.doRelatorio ? DICA_DA_REVISAO_DO_RELATORIO : DICA_DO_MODO[modo.tipo]
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

type RelatorioSozinho = { numeroDaVersao: number; piloto: boolean; numeroDoRelatorio: number }

// Na Revisão do relatório sem o .bpm, o envio é só o relatório, na versão mais recente que não é histórica; null nos outros casos.
function relatorioSozinho(modo: ModoDoFormulario, escolhidos: Escolhidos): RelatorioSozinho | null {
  if (modo.tipo !== 'sequencia' || !modo.doRelatorio?.versaoQueRecebe || escolhidos.bpm) return null
  const { numero, piloto } = modo.doRelatorio.versaoQueRecebe
  return { numeroDaVersao: numero, piloto, numeroDoRelatorio: modo.numeroDoRelatorio }
}

// Na Revisão do relatório o obrigatório é o relatório; nos outros, o .bpm (e o relatório, quando a trava o pede).
function campoObrigatorio(papel: PapelDoArquivo, modo: ModoDoFormulario, relatorioObrigatorio: boolean): boolean {
  if (modo.tipo === 'sequencia' && modo.doRelatorio) return papel === 'relatorio'
  return PAPEIS_OBRIGATORIOS.includes(papel) || (relatorioObrigatorio && papel === 'relatorio')
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
  const sozinho = relatorioSozinho(modo, arquivos.escolhidos)
  const aoProgredir = (enviados: number, total: number) => setProgresso({ enviados, total })

  async function enviarAVersao(numeroDaVersao: number) {
    const pedido: PedidoDeVersao = {
      processoId: processo.id, numero: numeroDaVersao, piloto, arquivos: arquivosDoPedido(arquivos.escolhidos),
      ...numeroDoRelatorioDoPedido(modo, arquivos.escolhidos),
    }
    setProgresso({ enviados: 0, total: pedido.arquivos.length })
    await (historica ? modulo.registrarVersaoHistorica(pedido, aoProgredir) : modulo.enviarVersao(pedido, aoProgredir))
    aoEnviada(pedido)
  }

  // O mesmo envio do [Enviar relatório]: nenhum caminho novo até o Drive.
  async function enviarORelatorio(relatorio: RelatorioSozinho, arquivo: File) {
    setProgresso({ enviados: 0, total: 1 })
    await modulo.enviarRelatorio({ processoId: processo.id, ...relatorio, arquivo }, aoProgredir)
    aoEnviada()
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (numero === null) return
    setAviso(null)
    try {
      await (sozinho && arquivos.escolhidos.relatorio ? enviarORelatorio(sozinho, arquivos.escolhidos.relatorio) : enviarAVersao(numero))
    } catch (erro) {
      setAviso(textoDaFalhaDoEnvio(erro))
      setProgresso(null)
    }
  }

  const enviando = progresso !== null
  const pronto = podeSubmeter(modo, arquivos, numero, relatorioObrigatorio)
  const { titulo, botao } = TEXTOS_DO_MODO[modo.tipo]
  const dica = dicaDoModo(modo)
  return (
    <form ref={ref} className="formulario-do-processo formulario-de-versao" aria-label={titulo} noValidate onSubmit={enviar}>
      <h3 className="painel-subtitulo">{titulo}</h3>
      <PreviaDoEnvio numero={numero} historica={historica} piloto={piloto} sozinho={sozinho} />
      <fieldset className="formulario-de-versao-campos" disabled={enviando} aria-describedby={dica ? `${id}-dica` : undefined}>
        <legend>Arquivos</legend>
        {modo.tipo !== 'sequencia' && <CampoDoNumeroDaVersao texto={textoDoNumero} aoMudar={setTextoDoNumero} />}
        {dica && <p id={`${id}-dica`} className="formulario-de-versao-dica">{dica}</p>}
        {papeisDoFormulario(modo).map((papel) => {
          const arquivo = arquivos.escolhidos[papel]
          const doRelatorio = modo.tipo === 'sequencia' && papel === 'relatorio' ? modo.numeroDoRelatorio : undefined
          return (
            <CampoDeArquivo key={papel} papel={papel} obrigatorio={campoObrigatorio(papel, modo, relatorioObrigatorio)}
              relatorioSemNumero={historica} desligado={papel === 'png' && Boolean(modo.tipo === 'sequencia' && modo.doRelatorio) && !arquivos.escolhidos.bpm}
              nomePrevisto={arquivo ? nomeDoArquivo(processo, { numero, papel, arquivo, tipo: modo.tipo, doRelatorio, sozinho }) : null}
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

type DadosDoNome = {
  numero: number | null; papel: PapelDoArquivo; arquivo: File; tipo: ModoDoFormulario['tipo']; doRelatorio?: number
  sozinho: RelatorioSozinho | null
}

// O nome que o arquivo vai ter no Drive; o relatório sozinho leva o número da versão que o recebe.
function nomeDoArquivo(processo: Pick<ProcessoDaLista, 'nome' | 'setorSigla'>, dados: DadosDoNome): string | null {
  const { numero, papel, arquivo, tipo, doRelatorio, sozinho } = dados
  if (sozinho && papel === 'relatorio') {
    return nomeNaPrevia(processo, sozinho.numeroDaVersao, papel, arquivo, sozinho.piloto ? 'piloto' : 'sequencia', sozinho.numeroDoRelatorio)
  }
  return numero === null ? null : nomeNaPrevia(processo, numero, papel, arquivo, tipo, doRelatorio)
}

type PreviaDoEnvioProps = { numero: number | null; historica: boolean; piloto: boolean; sozinho: RelatorioSozinho | null }

// "Esta versão será a V8." ou, só com o relatório, "Relatório R2, acompanha a V7".
function PreviaDoEnvio({ numero, historica, piloto, sozinho }: PreviaDoEnvioProps) {
  if (sozinho) return <p className="formulario-de-versao-previa"><strong>{previaDoRelatorio(sozinho)}</strong></p>
  if (numero === null) return null
  return (
    <p className="formulario-de-versao-previa">
      Esta versão será a <strong>{rotuloDaVersao({ numero, historica, piloto })}</strong>.
    </p>
  )
}
