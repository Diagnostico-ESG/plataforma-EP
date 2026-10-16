import { type FormEvent, useId, useState } from 'react'
import { useArquivosDaVersao } from '../../hooks/useArquivosDaVersao'
import type { ProcessoLido } from '../../processos/tipos'
import {
  PAPEIS_OBRIGATORIOS, type Progresso, arquivosDoPedido, nomeNaPrevia, podeEnviar, textoDaFalhaDoEnvio, textoDoProgresso,
} from '../../versoes/formularioDeVersao'
import { PAPEIS } from '../../versoes/rotulos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { CampoDeArquivo } from './CampoDeArquivo'

type FormularioDeVersaoProps = {
  modulo: ModuloDeVersoes
  processo: ProcessoLido
  /** O número da prévia (maior + 1); é com ele que os arquivos são nomeados no Drive. */
  numero: number
  aoEnviada: () => void
  aoCancelar: () => void
}

const LIMITE_DA_OBSERVACAO = 2000

// noValidate: as mensagens são as nossas. Os campos ficam travados durante o envio; na falha, continuam preenchidos.
export function FormularioDeVersao({ modulo, processo, numero, aoEnviada, aoCancelar }: FormularioDeVersaoProps) {
  const arquivos = useArquivosDaVersao()
  const [observacao, setObservacao] = useState('')
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const id = useId()

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setAviso(null)
    const pedido = { processoId: processo.id, numero, observacao: observacao.trim() || null, arquivos: arquivosDoPedido(arquivos.escolhidos) }
    setProgresso({ enviados: 0, total: pedido.arquivos.length })
    try {
      await modulo.enviarVersao(pedido, (enviados, total) => setProgresso({ enviados, total }))
      aoEnviada()
    } catch (erro) {
      setAviso(textoDaFalhaDoEnvio(erro))
      setProgresso(null)
    }
  }

  const enviando = progresso !== null
  const habilitado = !enviando && podeEnviar(arquivos.escolhidos, arquivos.recusas, arquivos.conferindo)
  return (
    <form className="formulario-do-processo formulario-de-versao" aria-label="Enviar versão" noValidate onSubmit={enviar}>
      <h3 className="painel-subtitulo">Enviar versão</h3>
      <p className="formulario-de-versao-previa">Esta versão será a <strong>V{numero}</strong>.</p>
      <fieldset className="formulario-de-versao-campos" disabled={enviando}>
        <legend>Arquivos</legend>
        {PAPEIS.map((papel) => {
          const arquivo = arquivos.escolhidos[papel]
          return (
            <CampoDeArquivo key={papel} papel={papel} obrigatorio={PAPEIS_OBRIGATORIOS.includes(papel)}
              nomePrevisto={arquivo ? nomeNaPrevia(processo, numero, papel, arquivo) : null}
              recusa={arquivos.recusas[papel] ?? null} aoEscolher={(escolhido) => void arquivos.escolher(papel, escolhido)} />
          )
        })}
        <label htmlFor={`${id}-observacao`}>Observação (opcional)</label>
        <textarea id={`${id}-observacao`} maxLength={LIMITE_DA_OBSERVACAO} value={observacao}
          onChange={(mudanca) => setObservacao(mudanca.target.value)} />
      </fieldset>
      {progresso && <p className="formulario-de-versao-progresso" role="status">{textoDoProgresso(progresso)}</p>}
      <div className="formulario-do-processo-botoes">
        <button type="submit" className="botao botao-principal" disabled={!habilitado}>Enviar</button>
        <button type="button" className="botao botao-secundario" disabled={enviando} onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
