import { type FormEvent, useState } from 'react'
import { useArquivosDaVersao } from '../../hooks/useArquivosDaVersao'
import { type Progresso, podeTrocarArquivo, recusaDoTipoNaTroca, textoDaFalhaDaTroca, textoDoProgresso } from '../../versoes/formularioDeVersao'
import type { ArquivoDaVersao, ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'
import { CampoDeArquivo } from './CampoDeArquivo'

type FormularioDeSubstituicaoProps = {
  modulo: ModuloDeVersoes
  processoId: string
  versao: Versao
  arquivo: ArquivoDaVersao
  aoSubstituido: () => void
  aoCancelar: () => void
}

const AVISO_DA_TROCA = 'O arquivo anterior não fica guardado: o histórico registra a troca, mas o conteúdo que sai não pode ser recuperado.'

/**
 * Troca o conteúdo de um arquivo da versão nova por outro do mesmo tipo (ADR 0007). O envio só começa depois da janela
 * de confirmação; o campo fica travado durante o envio e, na falha, o arquivo escolhido continua no formulário.
 */
export function FormularioDeSubstituicao({ modulo, processoId, versao, arquivo, aoSubstituido, aoCancelar }: FormularioDeSubstituicaoProps) {
  const semNumero = arquivo.papel === 'relatorio' && arquivo.numeroDoRelatorio === undefined
  const arquivos = useArquivosDaVersao(semNumero)
  const [confirmando, setConfirmando] = useState(false)
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const escolhido = arquivos.escolhidos[arquivo.papel]
  const recusa = arquivos.recusas[arquivo.papel] ?? (escolhido ? recusaDoTipoNaTroca(arquivo.formato, escolhido) : null)

  async function substituir() {
    if (!escolhido) return
    setAviso(null)
    setProgresso({ enviados: 0, total: 1 })
    try {
      await modulo.substituirArquivo({ processoId, numero: versao.numero, arquivo, novo: escolhido }, (enviados, total) => setProgresso({ enviados, total }))
      aoSubstituido()
    } catch (erro) {
      setAviso(textoDaFalhaDaTroca(erro))
      setProgresso(null)
    }
  }

  function pedirConfirmacao(evento: FormEvent) {
    evento.preventDefault()
    setConfirmando(true)
  }

  const enviando = progresso !== null
  const pronto = podeTrocarArquivo(escolhido, recusa, arquivos.conferindo)
  return (
    <>
      <form className="formulario-do-processo formulario-de-versao" aria-label={`Substituir ${arquivo.nome}`} noValidate onSubmit={pedirConfirmacao}>
        <fieldset className="formulario-de-versao-campos" disabled={enviando}>
          <legend>Substituir {arquivo.nome}</legend>
          <CampoDeArquivo papel={arquivo.papel} obrigatorio nomePrevisto={escolhido ? arquivo.nome : null} recusa={recusa}
            relatorioSemNumero={semNumero} aoEscolher={(novo) => void arquivos.escolher(arquivo.papel, novo)} />
        </fieldset>
        {progresso && <p className="formulario-de-versao-progresso" role="status">{textoDoProgresso(progresso)}</p>}
        <div className="formulario-do-processo-botoes">
          <button type="submit" className="botao botao-principal" disabled={enviando || !pronto}>Substituir</button>
          <button type="button" className="botao botao-secundario" disabled={enviando} onClick={aoCancelar}>Cancelar</button>
        </div>
        {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
      </form>
      <JanelaDeConfirmacao aberta={confirmando} titulo={`Substituir ${arquivo.nome}?`} texto={AVISO_DA_TROCA} rotuloDaAcao="Substituir"
        aoConfirmar={() => void substituir()} aoFechar={() => setConfirmando(false)} />
    </>
  )
}
