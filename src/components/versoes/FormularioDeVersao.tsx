import { type FormEvent, useId, useState } from 'react'
import { useArquivosDaVersao } from '../../hooks/useArquivosDaVersao'
import type { ProcessoLido } from '../../processos/tipos'
import {
  type ModoDoFormulario, PAPEIS_OBRIGATORIOS, type Progresso, arquivosDoPedido, lerNumeroHistorico, nomeNaPrevia, podeSubmeter,
  textoDaFalhaDoEnvio, textoDoProgresso,
} from '../../versoes/formularioDeVersao'
import { PAPEIS, rotuloDaVersao } from '../../versoes/rotulos'
import type { ModuloDeVersoes, PedidoDeVersao } from '../../versoes/tipos'
import { CampoDeArquivo } from './CampoDeArquivo'
import { CampoDoNumeroHistorico } from './CampoDoNumeroHistorico'

type FormularioDeVersaoProps = {
  modulo: ModuloDeVersoes
  processo: ProcessoLido
  /**
   * Nova: o número da prévia (maior + 1), com que os arquivos são nomeados no Drive. Histórica: o número é digitado
   * (5 vira V5F) e os arquivos são os que existirem.
   */
  modo: ModoDoFormulario
  aoEnviada: () => void
  aoCancelar: () => void
}

const LIMITE_DA_OBSERVACAO = 2000
const TEXTOS_DO_MODO = {
  nova: { titulo: 'Enviar versão', botao: 'Enviar' },
  historica: { titulo: 'Registrar versão histórica', botao: 'Registrar' },
}

// noValidate: as mensagens são as nossas. Os campos ficam travados durante o envio; na falha, continuam preenchidos.
export function FormularioDeVersao({ modulo, processo, modo, aoEnviada, aoCancelar }: FormularioDeVersaoProps) {
  const arquivos = useArquivosDaVersao()
  const [observacao, setObservacao] = useState('')
  const [textoDoNumero, setTextoDoNumero] = useState('')
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const id = useId()
  const historica = modo.tipo === 'historica'
  const numero = modo.tipo === 'nova' ? modo.numero : lerNumeroHistorico(textoDoNumero)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (numero === null) return
    setAviso(null)
    const pedido: PedidoDeVersao = {
      processoId: processo.id, numero, observacao: observacao.trim() || null, arquivos: arquivosDoPedido(arquivos.escolhidos),
    }
    setProgresso({ enviados: 0, total: pedido.arquivos.length })
    const aoProgredir = (enviados: number, total: number) => setProgresso({ enviados, total })
    try {
      await (historica ? modulo.registrarVersaoHistorica(pedido, aoProgredir) : modulo.enviarVersao(pedido, aoProgredir))
      aoEnviada()
    } catch (erro) {
      setAviso(textoDaFalhaDoEnvio(erro))
      setProgresso(null)
    }
  }

  const enviando = progresso !== null
  const pronto = podeSubmeter(modo, arquivos, numero)
  const { titulo, botao } = TEXTOS_DO_MODO[modo.tipo]
  return (
    <form className="formulario-do-processo formulario-de-versao" aria-label={titulo} noValidate onSubmit={enviar}>
      <h3 className="painel-subtitulo">{titulo}</h3>
      {numero !== null && (
        <p className="formulario-de-versao-previa">Esta versão será a <strong>{rotuloDaVersao({ numero, historica })}</strong>.</p>
      )}
      <fieldset className="formulario-de-versao-campos" disabled={enviando}>
        <legend>Arquivos</legend>
        {historica && <CampoDoNumeroHistorico texto={textoDoNumero} aoMudar={setTextoDoNumero} />}
        {historica && <p className="formulario-de-versao-dica">Informe o .bpm, ou o .bpmn com o .png.</p>}
        {PAPEIS.map((papel) => {
          const arquivo = arquivos.escolhidos[papel]
          return (
            <CampoDeArquivo key={papel} papel={papel} obrigatorio={!historica && PAPEIS_OBRIGATORIOS.includes(papel)}
              nomePrevisto={arquivo && numero !== null ? nomeNaPrevia(processo, numero, papel, arquivo, historica) : null}
              recusa={arquivos.recusas[papel] ?? null} aoEscolher={(escolhido) => void arquivos.escolher(papel, escolhido)} />
          )
        })}
        <label htmlFor={`${id}-observacao`}>Observação (opcional)</label>
        <textarea id={`${id}-observacao`} maxLength={LIMITE_DA_OBSERVACAO} value={observacao}
          onChange={(mudanca) => setObservacao(mudanca.target.value)} />
      </fieldset>
      {progresso && <p className="formulario-de-versao-progresso" role="status">{textoDoProgresso(progresso)}</p>}
      <div className="formulario-do-processo-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando || !pronto}>
          {botao}
        </button>
        <button type="button" className="botao botao-secundario" disabled={enviando} onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
