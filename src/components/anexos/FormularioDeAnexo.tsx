import { type FormEvent, useState } from 'react'
import { recusaDoArquivoDoAnexo } from '../../anexos/regrasDoAnexo'
import { textoDaFalhaDoAnexo } from '../../anexos/recusasDeAnexos'
import type { ModuloDeAnexos } from '../../anexos/tipos'
import { useRolarAteAparecer } from '../../hooks/useRolarAteAparecer'
import { type Progresso, textoDoProgresso } from '../../versoes/formularioDeVersao'
import { CampoDeArquivo } from '../versoes/CampoDeArquivo'

type FormularioDeAnexoProps = {
  modulo: ModuloDeAnexos
  processoId: string
  /** Chamado depois do registro. */
  aoEnviado: () => void
  aoCancelar: () => void
}

// noValidate: as mensagens são as nossas. O campo fica travado durante o envio; na falha, o arquivo continua escolhido.
// Um arquivo por envio, com o nome original (sem descrição). O aviso de formato e tamanho vem antes de enviar.
export function FormularioDeAnexo({ modulo, processoId, aoEnviado, aoCancelar }: FormularioDeAnexoProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const ref = useRolarAteAparecer<HTMLFormElement>()
  const recusa = arquivo ? recusaDoArquivoDoAnexo(arquivo) : null

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!arquivo || recusa) return
    setAviso(null)
    setProgresso({ enviados: 0, total: 1 })
    try {
      await modulo.enviarAnexo({ processoId, arquivo }, (enviados, total) => setProgresso({ enviados, total }))
      aoEnviado()
    } catch (erro) {
      setAviso(textoDaFalhaDoAnexo(erro))
      setProgresso(null)
    }
  }

  const enviando = progresso !== null
  return (
    <form ref={ref} className="formulario-do-processo formulario-de-versao" aria-label="Enviar anexo" noValidate onSubmit={enviar}>
      <h3 className="painel-subtitulo">Enviar anexo</h3>
      <fieldset className="formulario-de-versao-campos" disabled={enviando}>
        <legend>Arquivo</legend>
        <CampoDeArquivo papel="anexo" obrigatorio nomePrevisto={arquivo && !recusa ? arquivo.name : null} recusa={recusa}
          aoEscolher={setArquivo} />
      </fieldset>
      {progresso && <p className="formulario-de-versao-progresso" role="status">{textoDoProgresso(progresso)}</p>}
      <div className="formulario-do-processo-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando || !arquivo || recusa !== null}>Enviar</button>
        <button type="button" className="botao botao-secundario" disabled={enviando} onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
