import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
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
  /** As revisões e a aprovação lidas pelo verso: o Agora registra e a gaveta lista. */
  registros: RegistrosDoProcesso
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
export function CaminhoDoProcesso({ processo, processos, revisoes, registros, podeAlterar, usuarioId, executar, aoMudar, aoSumir }: CaminhoDoProcessoProps) {
  // Quem não altera não escolhe responsável: não precisa da lista. Falha ao lê-la deixa a escolha só com "Ninguém".
  const ler = useCallback(
    () => (podeAlterar ? processos.listarResponsaveisPossiveis() : Promise.resolve([])), [processos, podeAlterar])
  const { estado } = useCarregamento(ler)
  const usuarios = estado.tipo === 'pronto' ? estado.valor : []
  const movimento = useMovimentoDoProcesso(processos, aoMudar, aoSumir)
  // O arquivado só lê, como o parado: o Agora dele oferece só Desarquivar.
  const parado = processo.situacao === 'suspenso' || processo.situacao === 'cancelado' || Boolean(processo.arquivadoEm)
  return (
    <>
      <AgoraDoProcesso processo={processo} processos={processos} usuarios={usuarios} usuarioId={usuarioId}
        podeAlterar={podeAlterar} movimento={movimento} executar={executar} aoMudar={aoMudar} revisoes={revisoes} registros={registros} />
      {movimento.falha && <p className="cadastros-falha" role="alert">{movimento.falha}</p>}
      <EtapasDoProcesso processo={processo} revisoes={revisoes} registros={registros} ultimaVersao={processo.ultimaVersao}
        podeEditar={podeAlterar && !parado} />
    </>
  )
}
