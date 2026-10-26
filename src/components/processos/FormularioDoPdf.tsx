import { type FormEvent, useState } from 'react'
import { recusaDoPdf, textoDaFalhaDoPdf } from '../../revisoes/pdfDaAprovacao'
import type { ArquivoDaVersao, ModuloDeVersoes } from '../../versoes/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'
import { CampoDeArquivo } from '../versoes/CampoDeArquivo'

type FormularioDoPdfProps = {
  modulo: ModuloDeVersoes
  processoId: string
  /** A versão aprovada: é o número do nome do arquivo no Drive. */
  numero: number
  /** O nome com que o arquivo novo será gravado, mostrado ao escolher. */
  nomePrevisto: string
  /** O .pdf atual, que a troca substitui; null para enviar o primeiro. */
  atual: ArquivoDaVersao | null
  aoConcluir: () => void
  aoCancelar: () => void
}

const AVISO_DA_TROCA = 'O arquivo anterior não fica guardado: o histórico registra a troca, mas o conteúdo que sai não pode ser recuperado.'

/** Envia o .pdf novo ou troca o conteúdo do atual (no mesmo arquivo do Drive, ADR 0007). */
async function levarOPdfAoDrive(modulo: ModuloDeVersoes, processoId: string, numero: number, arquivo: File, atual: ArquivoDaVersao | null) {
  const semProgresso = () => {}
  if (atual) await modulo.substituirArquivo({ processoId, numero, arquivo: atual, novo: arquivo }, semProgresso)
  else await modulo.enviarPdfDaAprovacao({ processoId, numero, arquivo }, semProgresso)
}

/** O envio em andamento e a falha dele: na falha o formulário continua, com o arquivo escolhido. */
function useEnvioDoPdf({ modulo, processoId, numero, atual, aoConcluir }: FormularioDoPdfProps) {
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  async function enviar(arquivo: File | null) {
    if (!arquivo) return
    setAviso(null)
    setEnviando(true)
    try {
      await levarOPdfAoDrive(modulo, processoId, numero, arquivo, atual)
      aoConcluir()
    } catch (erro) {
      setAviso(textoDaFalhaDoPdf(erro))
      setEnviando(false)
    }
  }

  return { enviando, aviso, enviar }
}

/** O nome que o campo mostra ao escolher: o do .pdf que fica (na troca) ou o previsto; nada sem arquivo ou com recusa. */
function nomeDoQueSobe(arquivo: File | null, recusa: string | null, atual: ArquivoDaVersao | null, nomePrevisto: string): string | null {
  if (arquivo === null || recusa !== null) return null
  return atual?.nome ?? nomePrevisto
}

const semArquivoValido = (arquivo: File | null, recusa: string | null) => arquivo === null || recusa !== null

type BotoesProps = { rotulo: string; desabilitado: boolean; enviando: boolean; aoCancelar: () => void }

function BotoesDoFormulario({ rotulo, desabilitado, enviando, aoCancelar }: BotoesProps) {
  return (
    <div className="formulario-do-processo-botoes">
      <button type="submit" className="botao botao-principal" disabled={desabilitado}>{rotulo}</button>
      <button type="button" className="botao botao-secundario" disabled={enviando} onClick={aoCancelar}>Cancelar</button>
    </div>
  )
}

/**
 * Envia o .pdf protocolado da aprovação ou troca o conteúdo do atual. A troca só começa depois da janela de confirmação; o
 * campo fica travado durante o envio e, na falha, o arquivo escolhido continua no formulário.
 */
export function FormularioDoPdf(props: FormularioDoPdfProps) {
  const { nomePrevisto, atual, aoCancelar } = props
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const { enviando, aviso, enviar } = useEnvioDoPdf(props)
  const recusa = recusaDoPdf(arquivo)

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (atual) setConfirmando(true)
    else void enviar(arquivo)
  }

  const rotulo = atual ? 'Substituir' : 'Enviar'
  return (
    <>
      <form className="formulario-do-processo formulario-de-versao" aria-label={`${rotulo} o .pdf da aprovação`} noValidate onSubmit={aoEnviar}>
        <fieldset className="formulario-de-versao-campos" disabled={enviando}>
          <CampoDeArquivo papel="pdf_da_aprovacao" obrigatorio nomePrevisto={nomeDoQueSobe(arquivo, recusa, atual, nomePrevisto)}
            recusa={recusa} aoEscolher={setArquivo} />
        </fieldset>
        {enviando && <p className="formulario-de-versao-progresso" role="status">Enviando…</p>}
        <BotoesDoFormulario rotulo={rotulo} enviando={enviando} desabilitado={enviando || semArquivoValido(arquivo, recusa)} aoCancelar={aoCancelar} />
        {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
      </form>
      {atual && (
        <JanelaDeConfirmacao aberta={confirmando} titulo={`Substituir ${atual.nome}?`} texto={AVISO_DA_TROCA} rotuloDaAcao="Substituir"
          aoConfirmar={() => void enviar(arquivo)} aoFechar={() => setConfirmando(false)} />
      )}
    </>
  )
}
