import { useCallback, useEffect, useId, useRef } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { PedidoDeConfirmacao } from '../../hooks/useMovimentoDoProcesso'
import { nomeNaPergunta } from '../../processos/frasesDaConfirmacaoDeArquivos'
import type { ArquivosDoProcesso } from '../../processos/tipos'
import type { TravaDeArquivos } from '../../processos/travaDeArquivos'
import { modoParaEnviar } from '../../versoes/formularioDeVersao'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import '../JanelaDeConfirmacao.css'
import { FormularioDeRelatorio } from '../versoes/FormularioDeRelatorio'
import { FormularioDeVersao } from '../versoes/FormularioDeVersao'
import './JanelaDeEnvioDeArquivos.css'

type JanelaDeEnvioDeArquivosProps = {
  pedido: PedidoDeConfirmacao
  versoes: ModuloDeVersoes
  /** Chamado depois do envio, com o que o processo passou a ter; a tela segue o movimento. */
  aoEnviar: (enviados: Partial<ArquivosDoProcesso>) => void
  aoFechar: () => void
}

const ROTULO_DO_ENVIO = 'Enviar e continuar'

type FormularioDoEnvioProps = Omit<JanelaDeEnvioDeArquivosProps, 'pedido'> & { falta: TravaDeArquivos; processo: PedidoDeConfirmacao['processo']; lidas: Versao[] }

// O formulário do que falta na primeira etapa da lista: a piloto, a versão em sequência (com o relatório obrigatório quando
// ele também falta) ou só o relatório. É o mesmo do verso, com o botão que diz que o processo continua depois.
function FormularioDoEnvio({ falta, processo, versoes, lidas, aoEnviar, aoFechar }: FormularioDoEnvioProps) {
  if (falta.falta.includes('versao_piloto')) {
    return (
      <FormularioDeVersao modulo={versoes} processo={processo} modo={modoParaEnviar('piloto', lidas)} rotuloDoEnvio={ROTULO_DO_ENVIO}
        aoEnviada={() => aoEnviar({ versaoPiloto: true })} aoCancelar={aoFechar} />
    )
  }
  if (falta.falta.includes('versao')) {
    return (
      <FormularioDeVersao modulo={versoes} processo={processo} modo={modoParaEnviar('sequencia', lidas)} rotuloDoEnvio={ROTULO_DO_ENVIO}
        relatorioObrigatorio={falta.falta.includes('relatorio')} aoCancelar={aoFechar}
        aoEnviada={(enviado) => aoEnviar({
          versaoEmSequencia: true, ...(enviado.arquivos.some((arquivo) => arquivo.papel === 'relatorio') && { relatorioNumerado: true }),
        })} />
    )
  }
  return (
    <FormularioDeRelatorio modulo={versoes} processo={processo} versoes={lidas} rotuloDoEnvio={ROTULO_DO_ENVIO}
      aoEnviada={() => aoEnviar({ relatorioNumerado: true })} aoCancelar={aoFechar} />
  )
}

/**
 * O envio aberto por [Enviar arquivos agora] (ADR 0028): o formulário de envio de sempre, para a primeira etapa a que faltam
 * arquivos. Depois do envio, quem a abriu relê o processo e segue (a pergunta volta com o que sobrou, ou o movimento).
 * Fechar (Esc ou [Cancelar]) deixa o processo onde estava. Quem a monta a desmonta ao fechar.
 */
export function JanelaDeEnvioDeArquivos({ pedido, versoes, aoEnviar, aoFechar }: JanelaDeEnvioDeArquivosProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const idDoTitulo = useId()
  const { processo, faltas } = pedido
  const ler = useCallback(() => versoes.listarVersoes(processo.id), [versoes, processo.id])
  const { estado, tentarDeNovo } = useCarregamento(ler)

  useEffect(() => {
    janela.current?.showModal()
  }, [])

  return (
    <dialog ref={janela} className="janela-confirmacao janela-de-envio" aria-labelledby={idDoTitulo} onClose={aoFechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">Enviar os arquivos da {nomeNaPergunta(faltas[0])}</h3>
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="as versões" aoTentarDeNovo={tentarDeNovo} />}
      {estado.tipo === 'pronto' && (
        <FormularioDoEnvio falta={faltas[0]} processo={processo} versoes={versoes} lidas={estado.valor} aoEnviar={aoEnviar} aoFechar={aoFechar} />
      )}
    </dialog>
  )
}
