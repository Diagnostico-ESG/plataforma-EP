import { useId, useState } from 'react'
import { conferirArquivo } from '../../versoes/conferenciaDosArquivos'
import { textoDaFalhaDoAcrescimo, textoDoProgresso } from '../../versoes/formularioDeVersao'
import { ACCEPT_DO_PAPEL } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'

type AcrescentarArquivoProps = {
  modulo: ModuloDeVersoes
  processoId: string
  versao: Versao
  papel: 'png' | 'bpmn'
  aoConcluir: () => void
}

/**
 * O espaço tracejado do .png ou do .bpmn que a versão ainda não tem: escolher o arquivo envia ali mesmo, sem formulário.
 * O arquivo é conferido no navegador antes de subir; na falha, a frase aparece ao lado e a versão não muda.
 */
export function AcrescentarArquivo({ modulo, processoId, versao, papel, aoConcluir }: AcrescentarArquivoProps) {
  const id = useId()
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  async function acrescentar(arquivo: File | null) {
    if (!arquivo) return
    setAviso(null)
    const recusa = await conferirArquivo(papel, arquivo)
    if (recusa) {
      setAviso(recusa)
      return
    }
    setEnviando(true)
    try {
      const pedido = { processoId, versaoId: versao.id, numero: versao.numero, piloto: versao.piloto, papel, arquivo }
      await modulo.acrescentarArquivo(pedido, () => undefined)
      aoConcluir()
    } catch (erro) {
      setAviso(textoDaFalhaDoAcrescimo(erro))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <li className="arquivo-do-destaque">
      <label htmlFor={id} className="arquivo-que-falta">
        <span aria-hidden="true">+ </span>Acrescentar .{papel}
      </label>
      <input id={id} type="file" hidden accept={ACCEPT_DO_PAPEL[papel]} disabled={enviando}
        onChange={(evento) => void acrescentar(evento.target.files?.[0] ?? null)} />
      {enviando && <p className="formulario-de-versao-progresso" role="status">{textoDoProgresso({ enviados: 0, total: 1 })}</p>}
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </li>
  )
}
