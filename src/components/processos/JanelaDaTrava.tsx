import { useCallback, useEffect, useId, useRef } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { PedidoDeTrava } from '../../hooks/useMovimentoDoProcesso'
import { fraseDaTrava } from '../../processos/frasesDeTravaDeArquivos'
import type { ArquivosDoProcesso } from '../../processos/tipos'
import { modoParaEnviar } from '../../versoes/formularioDeVersao'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import '../JanelaDeConfirmacao.css'
import { FormularioDeRelatorio } from '../versoes/FormularioDeRelatorio'
import { FormularioDeVersao } from '../versoes/FormularioDeVersao'
import './JanelaDaTrava.css'

type JanelaDaTravaProps = {
  pedido: PedidoDeTrava
  versoes: ModuloDeVersoes
  /** Chamado depois do envio, com o que o processo passou a ter; a tela segue o movimento. */
  aoEnviar: (enviados: Partial<ArquivosDoProcesso>) => void
  aoFechar: () => void
}

const ROTULO_DO_ENVIO = 'Enviar e mover'

type FormularioDaTravaProps = JanelaDaTravaProps & { lidas: Versao[] }

// O formulário do que falta: a piloto, a versão em sequência (com o relatório obrigatório quando ele também falta) ou só o
// relatório. É o mesmo do verso, com o botão que diz que o processo se move depois.
function FormularioDaTrava({ pedido, versoes, lidas, aoEnviar, aoFechar }: FormularioDaTravaProps) {
  const { processo, trava } = pedido
  if (trava.falta.includes('versao_piloto')) {
    return (
      <FormularioDeVersao modulo={versoes} processo={processo} modo={modoParaEnviar('piloto', lidas)} rotuloDoEnvio={ROTULO_DO_ENVIO}
        aoEnviada={() => aoEnviar({ versaoPiloto: true })} aoCancelar={aoFechar} />
    )
  }
  if (trava.falta.includes('versao')) {
    return (
      <FormularioDeVersao modulo={versoes} processo={processo} modo={modoParaEnviar('sequencia', lidas)} rotuloDoEnvio={ROTULO_DO_ENVIO}
        relatorioObrigatorio={trava.falta.includes('relatorio')} aoCancelar={aoFechar}
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
 * A trava de arquivos (ADR 0025): o processo não se move enquanto faltam os arquivos da etapa de que ele sai. A janela diz o
 * que falta na primeira linha e traz o formulário de envio de sempre; depois do envio, quem a abriu segue o movimento.
 * Fechar (Esc ou [Cancelar]) deixa o processo onde estava. Quem a monta a desmonta ao fechar.
 */
export function JanelaDaTrava({ pedido, versoes, aoEnviar, aoFechar }: JanelaDaTravaProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const idDoTitulo = useId()
  const processoId = pedido.processo.id
  const ler = useCallback(() => versoes.listarVersoes(processoId), [versoes, processoId])
  const { estado, tentarDeNovo } = useCarregamento(ler)

  useEffect(() => {
    janela.current?.showModal()
  }, [])

  return (
    <dialog ref={janela} className="janela-confirmacao janela-da-trava" aria-labelledby={idDoTitulo} onClose={aoFechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">{fraseDaTrava(pedido.trava)}</h3>
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="as versões" aoTentarDeNovo={tentarDeNovo} />}
      {estado.tipo === 'pronto' && (
        <FormularioDaTrava pedido={pedido} versoes={versoes} lidas={estado.valor} aoEnviar={aoEnviar} aoFechar={aoFechar} />
      )}
    </dialog>
  )
}
