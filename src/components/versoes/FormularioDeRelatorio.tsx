import { type FormEvent, useId, useState } from 'react'
import { useArquivosDaVersao } from '../../hooks/useArquivosDaVersao'
import { useRolarAteAparecer } from '../../hooks/useRolarAteAparecer'
import type { ProcessoLido } from '../../processos/tipos'
import { type Progresso, nomeNaPrevia, podeAcrescentarRelatorio, textoDaFalhaDoRelatorio, textoDoProgresso } from '../../versoes/formularioDeVersao'
import { rotuloDaVersao } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { CampoDeArquivo } from './CampoDeArquivo'

type FormularioDeRelatorioProps = {
  modulo: ModuloDeVersoes
  processo: ProcessoLido
  /** As versões com relatório pendente, da mais recente para a mais antiga: a primeira vem escolhida. */
  pendentes: Versao[]
  aoEnviada: () => void
  aoCancelar: () => void
}

// noValidate: as mensagens são as nossas. A versão e o arquivo ficam travados durante o envio; na falha, continuam.
export function FormularioDeRelatorio({ modulo, processo, pendentes, aoEnviada, aoCancelar }: FormularioDeRelatorioProps) {
  const arquivos = useArquivosDaVersao()
  const [versaoId, setVersaoId] = useState(pendentes[0].id)
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const id = useId()
  const ref = useRolarAteAparecer<HTMLFormElement>()
  const versao = pendentes.find((outra) => outra.id === versaoId) ?? pendentes[0]
  const escolhido = arquivos.escolhidos.relatorio

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!escolhido) return
    setAviso(null)
    setProgresso({ enviados: 0, total: 1 })
    try {
      await modulo.acrescentarRelatorio(
        { processoId: processo.id, versaoId: versao.id, numero: versao.numero, piloto: versao.piloto, arquivo: escolhido },
        (enviados, total) => setProgresso({ enviados, total }),
      )
      aoEnviada()
    } catch (erro) {
      setAviso(textoDaFalhaDoRelatorio(erro))
      setProgresso(null)
    }
  }

  const enviando = progresso !== null
  const pronto = podeAcrescentarRelatorio(arquivos.escolhidos, arquivos.recusas, arquivos.conferindo)
  return (
    <form ref={ref} className="formulario-do-processo formulario-de-versao" aria-label="Acrescentar relatório" noValidate onSubmit={enviar}>
      <h3 className="painel-subtitulo">Acrescentar relatório</h3>
      <fieldset className="formulario-de-versao-campos" disabled={enviando}>
        <legend>Relatório</legend>
        <label htmlFor={`${id}-versao`}>Versão</label>
        <select id={`${id}-versao`} value={versao.id} onChange={(mudanca) => setVersaoId(mudanca.target.value)}>
          {pendentes.map((pendente) => <option key={pendente.id} value={pendente.id}>{rotuloDaVersao(pendente)}</option>)}
        </select>
        <CampoDeArquivo papel="relatorio" obrigatorio
          nomePrevisto={escolhido ? nomeNaPrevia(processo, versao.numero, 'relatorio', escolhido, versao.piloto ? 'piloto' : 'sequencia') : null}
          recusa={arquivos.recusas.relatorio ?? null} aoEscolher={(arquivo) => void arquivos.escolher('relatorio', arquivo)} />
      </fieldset>
      {progresso && <p className="formulario-de-versao-progresso" role="status">{textoDoProgresso(progresso)}</p>}
      <div className="formulario-do-processo-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando || !pronto}>Acrescentar</button>
        <button type="button" className="botao botao-secundario" disabled={enviando} onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
