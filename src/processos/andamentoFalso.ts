import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { formatarData, indiceDaEtapaAtual } from './caminhoDeEtapas'
import type { DatasDaEtapa, EtapaDoProcesso, EtapaDoSetor, ProcessoLido, ResponsavelDaEtapa, StatusDaEtapa } from './tipos'

const RESOLVIDOS: StatusDaEtapa[] = ['concluida', 'realizada_anteriormente', 'dispensada']

type TrocaDeEtapas = <T extends EtapaDoSetor>(etapas: T[]) => T[]

/** Recalcula, como a view, a etapa atual e o "concluído" a partir das etapas do processo. */
export function recalcularProcesso(processo: ProcessoLido, etapasDoProcesso: EtapaDoProcesso[]): ProcessoLido {
  const atual = etapasDoProcesso[indiceDaEtapaAtual(etapasDoProcesso)]
  const concluido = etapasDoProcesso.every((etapa) => !etapa.obrigatoria || RESOLVIDOS.includes(etapa.status))
  // "Concluído" é calculado: a situação guardada de quem está concluído é "em andamento".
  const guardada = processo.situacao === 'concluido' ? 'em_andamento' : processo.situacao
  return {
    ...processo, etapasDoProcesso,
    etapaAtual: atual ? { codigo: atual.codigo, nome: atual.nome, ordem: atual.ordem } : null,
    situacao: concluido && guardada === 'em_andamento' ? 'concluido' : guardada,
  }
}

/** Troca as etapas do processo que contém a etapa `id` e recalcula; processo sem a etapa fica como está. */
export function trocarEtapaDoProcesso(processo: ProcessoLido, id: string, trocar: TrocaDeEtapas): ProcessoLido {
  if (!processo.etapasDoProcesso.some((etapa) => etapa.id === id)) return processo
  return recalcularProcesso(processo, trocar(processo.etapasDoProcesso))
}

/** Aplica a mudança à etapa do processo e recalcula a etapa atual e o "concluído". */
export function mudarEtapaDoProcesso(processo: ProcessoLido, id: string, mudancas: Partial<EtapaDoProcesso>): ProcessoLido {
  return trocarEtapaDoProcesso(processo, id, (etapas) => etapas.map((etapa) => (etapa.id === id ? { ...etapa, ...mudancas } : etapa)))
}

/** As etapas do setor mudaram: o processo passa a mostrá-las. */
export function atualizarSetorDoProcesso(processo: ProcessoLido, etapasDoSetor: EtapaDoSetor[]): ProcessoLido {
  return { ...processo, etapasDoSetor }
}

/** O responsável do cartão é o da etapa atual: só muda quando a etapa trocada é ela. */
export function responsavelDoCartao(processo: ProcessoLido, id: string, responsavel: ResponsavelDaEtapa | null): ProcessoLido {
  const etapa = processo.etapasDoProcesso.find((candidata) => candidata.id === id)
  if (!etapa || processo.etapaAtual?.codigo !== etapa.codigo) return processo
  return { ...processo, responsavel }
}

/**
 * Como a função do banco: a escolhida volta a em andamento (mantém o início, ou recebe hoje se não tinha) e as
 * seguintes que não estão pendentes voltam a pendente, sem datas nem nota. Etapa fora da lista não muda nada.
 */
export function voltarEtapas<T extends EtapaDoSetor>(etapas: T[], id: string, hoje: string): T[] {
  const escolhida = etapas.find((etapa) => etapa.id === id)
  if (!escolhida) return etapas
  return etapas.map((etapa) => {
    if (etapa.id === id) return { ...etapa, status: 'em_andamento', nota: null, resolvidaEm: null, iniciadaEm: etapa.iniciadaEm ?? hoje }
    if (etapa.ordem > escolhida.ordem && etapa.status !== 'pendente') {
      return { ...etapa, status: 'pendente', nota: null, iniciadaEm: null, resolvidaEm: null }
    }
    return etapa
  })
}

/** As recusas de datas do banco: nunca no futuro e a conclusão nunca antes do início, com o valor recebido. */
export function conferirDatasDaEtapa({ iniciadaEm, resolvidaEm }: DatasDaEtapa, hoje: string): void {
  for (const data of [iniciadaEm, resolvidaEm]) {
    if (data !== null && data > hoje) throw new TravaDoBanco(`A data ${formatarData(data)} está no futuro.`)
  }
  if (iniciadaEm !== null && resolvidaEm !== null && resolvidaEm < iniciadaEm) {
    throw new TravaDoBanco(
      `A conclusão (${formatarData(resolvidaEm)}) não pode ser antes do início (${formatarData(iniciadaEm)}).`)
  }
}
