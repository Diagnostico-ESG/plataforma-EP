import { type FormEvent, useState } from 'react'
import { useArquivosDaVersao } from '../../hooks/useArquivosDaVersao'
import { useRolarAteAparecer } from '../../hooks/useRolarAteAparecer'
import type { ProcessoLido } from '../../processos/tipos'
import {
  type Progresso, nomeNaPrevia, podeEnviarRelatorio, previaDoRelatorio, textoDaFalhaDoRelatorio, textoDoProgresso,
} from '../../versoes/formularioDeVersao'
import { proximoNumeroDoRelatorio } from '../../versoes/relatorioQueVale'
import { ordenarVersoes } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { CampoDeArquivo } from './CampoDeArquivo'

type FormularioDeRelatorioProps = {
  modulo: ModuloDeVersoes
  processo: ProcessoLido
  /** Todas as versões do processo: o relatório acompanha a mais recente que não é histórica e recebe o próximo número. */
  versoes: Versao[]
  aoEnviada: () => void
  aoCancelar: () => void
}

// noValidate: as mensagens são as nossas. O arquivo fica travado durante o envio; na falha, continua escolhido.
export function FormularioDeRelatorio({ modulo, processo, versoes, aoEnviada, aoCancelar }: FormularioDeRelatorioProps) {
  const arquivos = useArquivosDaVersao()
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const ref = useRolarAteAparecer<HTMLFormElement>()
  const alvo = ordenarVersoes(versoes).find((versao) => !versao.historica)
  const escolhido = arquivos.escolhidos.relatorio
  if (!alvo) return null
  const previa = { numeroDaVersao: alvo.numero, piloto: alvo.piloto, numeroDoRelatorio: proximoNumeroDoRelatorio(versoes) }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!escolhido) return
    setAviso(null)
    setProgresso({ enviados: 0, total: 1 })
    try {
      await modulo.enviarRelatorio({ processoId: processo.id, ...previa, arquivo: escolhido }, (enviados, total) => setProgresso({ enviados, total }))
      aoEnviada()
    } catch (erro) {
      setAviso(textoDaFalhaDoRelatorio(erro))
      setProgresso(null)
    }
  }

  const enviando = progresso !== null
  const pronto = podeEnviarRelatorio(arquivos.escolhidos, arquivos.recusas, arquivos.conferindo)
  const tipo = alvo.piloto ? 'piloto' : 'sequencia'
  return (
    <form ref={ref} className="formulario-do-processo formulario-de-versao" aria-label="Enviar relatório" noValidate onSubmit={enviar}>
      <h3 className="painel-subtitulo">Enviar relatório</h3>
      <p className="formulario-de-versao-previa"><strong>{previaDoRelatorio(previa)}</strong></p>
      <fieldset className="formulario-de-versao-campos" disabled={enviando}>
        <legend>Relatório</legend>
        <CampoDeArquivo papel="relatorio" obrigatorio
          nomePrevisto={escolhido ? nomeNaPrevia(processo, alvo.numero, 'relatorio', escolhido, tipo, previa.numeroDoRelatorio) : null}
          recusa={arquivos.recusas.relatorio ?? null} aoEscolher={(arquivo) => void arquivos.escolher('relatorio', arquivo)} />
      </fieldset>
      {progresso && <p className="formulario-de-versao-progresso" role="status">{textoDoProgresso(progresso)}</p>}
      <div className="formulario-do-processo-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando || !pronto}>Enviar</button>
        <button type="button" className="botao botao-secundario" disabled={enviando} onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
