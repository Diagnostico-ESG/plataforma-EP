import { useCallback, useState } from 'react'
import { avancoDoCartao } from '../processos/destinoDoArrastar'
import type { ModuloDeProcessos, UltimaVersao } from '../processos/tipos'
import type { ModuloDeRevisoes } from '../revisoes/tipos'
import { useAcoesDaEtapa } from './useAcoesDaEtapa'
import { useCarregamento } from './useCarregamento'

/**
 * Soltar o cartão no destino faz o mesmo que [Concluir] no verso: lê o processo (o cartão não traz o id do andamento),
 * acha a etapa atual e a próxima e abre a janela de avanço. Quadro desatualizado (a etapa já não está em andamento ou
 * não há pendente depois): nada abre, o Quadro só recarrega.
 */
export function useConclusaoPeloQuadro(processos: ModuloDeProcessos, revisoes: ModuloDeRevisoes, podeAlterar: boolean, aoMudar: () => void) {
  // Quem não altera não escolhe responsável (nem arrasta): não precisa da lista.
  const ler = useCallback(
    () => (podeAlterar ? processos.listarResponsaveisPossiveis() : Promise.resolve([])), [processos, podeAlterar])
  const { estado } = useCarregamento(ler)
  const acoes = useAcoesDaEtapa(processos, revisoes, aoMudar, aoMudar)
  const [ultimaVersao, setUltimaVersao] = useState<UltimaVersao | null>(null)
  const [falhaDaLeitura, setFalhaDaLeitura] = useState<string | null>(null)

  async function concluirDoCartao(id: string) {
    setFalhaDaLeitura(null)
    try {
      const lido = await processos.lerProcesso(id)
      const avanco = lido ? avancoDoCartao(lido.etapasDoProcesso) : null
      if (!lido || !avanco) return aoMudar()
      setUltimaVersao(lido.ultimaVersao)
      acoes.agir('concluir', avanco.etapa, avanco.proxima)
    } catch (erro) {
      setFalhaDaLeitura(`Não foi possível abrir a conclusão: ${erro instanceof Error ? erro.message : String(erro)}.`)
    }
  }

  return { acoes, usuarios: estado.tipo === 'pronto' ? estado.valor : [], ultimaVersao, falhaDaLeitura, concluirDoCartao }
}
