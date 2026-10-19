import { useCallback } from 'react'
import { useAcoesDaEtapa } from '../../hooks/useAcoesDaEtapa'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { Executar } from '../../hooks/useGravacaoComFalha'
import type { DatasDaEtapa, EtapaDoCaminho, ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import { AgoraDoProcesso } from './AgoraDoProcesso'
import { EtapasDoProcesso } from './EtapasDoProcesso'
import { JanelasDaEtapa } from './JanelasDaEtapa'

type CaminhoDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  revisoes: ModuloDeRevisoes
  podeAlterar: boolean
  /** Quem está na tela, para a janela de avanço o marcar como responsável. */
  usuarioId: string
  /** Grava a situação (Retomar do Agora) e guarda a falha para o verso mostrar. */
  executar: Executar
  aoMudar: () => void
  aoSumir: () => void
}

/**
 * O trabalho do processo no verso: o cartão Agora, as Etapas e as janelas das ações. Quem pode alterar age pelo Agora
 * e pela gaveta das etapas (a RLS é quem protege); suspenso e cancelado só leem, até o Retomar.
 */
export function CaminhoDoProcesso({ processo, processos, revisoes, podeAlterar, usuarioId, executar, aoMudar, aoSumir }: CaminhoDoProcessoProps) {
  // Quem não altera não escolhe responsável: não precisa da lista. Falha ao lê-la deixa a escolha só com "Ninguém".
  const ler = useCallback(
    () => (podeAlterar ? processos.listarResponsaveisPossiveis() : Promise.resolve([])), [processos, podeAlterar])
  const { estado } = useCarregamento(ler)
  const usuarios = estado.tipo === 'pronto' ? estado.valor : []
  const acoes = useAcoesDaEtapa(processos, revisoes, aoMudar, aoSumir)
  const parado = processo.situacao === 'suspenso' || processo.situacao === 'cancelado'

  async function corrigirDatas(etapa: EtapaDoCaminho, datas: DatasDaEtapa) {
    await processos.corrigirDatasDaEtapa(etapa.id, datas)
    aoMudar()
  }

  return (
    <>
      <AgoraDoProcesso processo={processo} processos={processos} usuarios={usuarios} usuarioId={usuarioId}
        podeAlterar={podeAlterar} acoes={acoes} executar={executar} aoMudar={aoMudar} />
      {acoes.falha && <p className="cadastros-falha" role="alert">{acoes.falha}</p>}
      <EtapasDoProcesso etapas={processo.etapasDoProcesso} processoId={processo.id} revisoes={revisoes} podeEditar={podeAlterar && !parado} usuarios={usuarios}
        usuarioId={usuarioId} ultimaVersao={processo.ultimaVersao} acoes={acoes} aoCorrigirDatas={corrigirDatas}
        aoSumir={aoSumir} />
      <JanelasDaEtapa acoes={acoes} usuarios={usuarios} usuarioId={usuarioId} ultimaVersao={processo.ultimaVersao} />
    </>
  )
}
