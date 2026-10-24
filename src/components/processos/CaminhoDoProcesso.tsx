import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useMovimentoDoProcesso } from '../../hooks/useMovimentoDoProcesso'
import type { Executar } from '../../hooks/useGravacaoComFalha'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import { AgoraDoProcesso } from './AgoraDoProcesso'
import { EtapasDoProcesso } from './EtapasDoProcesso'

type CaminhoDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  revisoes: ModuloDeRevisoes
  podeAlterar: boolean
  /** Quem está na tela, para o [Assumir] e o "(você)" da lista de responsáveis. */
  usuarioId: string
  /** Grava a situação (Retomar do Agora) e o arquivamento, e guarda a falha para o verso mostrar. */
  executar: Executar
  aoMudar: () => void
  aoSumir: () => void
}

/**
 * O trabalho do processo no verso: o cartão Agora e as Etapas. Quem pode alterar age pelo Agora (a RLS é quem protege);
 * suspenso, cancelado e arquivado só leem, até o Retomar ou o Desarquivar.
 */
export function CaminhoDoProcesso({ processo, processos, revisoes, podeAlterar, usuarioId, executar, aoMudar, aoSumir }: CaminhoDoProcessoProps) {
  // Quem não altera não escolhe responsável: não precisa da lista. Falha ao lê-la deixa a escolha só com "Ninguém".
  const ler = useCallback(
    () => (podeAlterar ? processos.listarResponsaveisPossiveis() : Promise.resolve([])), [processos, podeAlterar])
  const { estado } = useCarregamento(ler)
  const usuarios = estado.tipo === 'pronto' ? estado.valor : []
  // A aprovação alimenta a gaveta da Aprovação; lê de novo quando o processo muda de etapa.
  const etapaAtual = processo.etapaAtual?.id
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a etapa atual não é usada dentro: só faz a leitura se refazer quando ela muda
  const lerAprovacao = useCallback(() => revisoes.lerAprovacao(processo.id), [revisoes, processo.id, etapaAtual])
  const aprovacao = useCarregamento(lerAprovacao)
  const movimento = useMovimentoDoProcesso(processos, aoMudar, aoSumir)
  // O arquivado só lê, como o parado: o Agora dele oferece só Desarquivar.
  const parado = processo.situacao === 'suspenso' || processo.situacao === 'cancelado' || Boolean(processo.arquivadoEm)
  return (
    <>
      <AgoraDoProcesso processo={processo} processos={processos} usuarios={usuarios} usuarioId={usuarioId}
        podeAlterar={podeAlterar} movimento={movimento} executar={executar} aoMudar={aoMudar} />
      {movimento.falha && <p className="cadastros-falha" role="alert">{movimento.falha}</p>}
      <EtapasDoProcesso processo={processo} processoId={processo.id} revisoes={revisoes} podeEditar={podeAlterar && !parado}
        aprovacao={aprovacao.estado} aoTentarDeNovoAAprovacao={aprovacao.tentarDeNovo} aoAtualizarAAprovacao={aprovacao.recarregar} />
    </>
  )
}
