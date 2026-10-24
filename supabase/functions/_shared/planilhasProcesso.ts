// Rótulo, datas, tipo e última versão de um processo nas planilhas (exportacao-e-manutencao, tickets 03 e 06; spec,
// "Andamento livre"). Arquivo puro, testado no Vitest. Data vazia é o texto vazio: é o que a célula da planilha mostra.
import { situacaoDasFases, type FaseDoProcesso } from './planilhasFases.ts'
import type { EtapaDoPacote, PacoteDasPlanilhas, ProcessoDoPacote, TipoDeProcesso } from './planilhasPacote.ts'

const ROTULOS_DO_TIPO: Record<TipoDeProcesso, string> = {
  processo: 'Processo',
  subprocesso: 'Subprocesso',
  a_classificar: 'A classificar',
}

export function rotuloDoTipo(tipo: TipoDeProcesso): string {
  return ROTULOS_DO_TIPO[tipo]
}

export function rotuloDaVersao(numero: number | null): string {
  return numero === null ? '' : `V${numero}`
}

/** "Publicado" e "Concluído" (em Concluídos), "Não iniciado", ou "Em andamento · {fase da etapa atual}". */
export function rotuloDoProcesso(processo: ProcessoDoPacote, etapas: EtapaDoPacote[]): string {
  const atual = etapas.find((etapa) => etapa.id === processo.etapa_atual_id)
  if (atual?.codigo === 'concluidos') return processo.publicado_em === null ? 'Concluído' : 'Publicado'
  if (atual?.codigo === 'nao_iniciados') return 'Não iniciado'
  return atual?.fase ? `Em andamento · ${atual.fase}` : 'Em andamento'
}

/** A data da reunião; sem ela, o dia em que a fase IV (Modelagem piloto) passou a contar como concluída. */
export function dataDaModelagemPiloto(processo: ProcessoDoPacote, fases: FaseDoProcesso[]): string {
  return processo.data_da_reuniao ?? fases.find((fase) => fase.fase === 'IV')?.concluidaEm ?? ''
}

export function dataDaPublicacao(processo: ProcessoDoPacote): string {
  return processo.publicado_em ?? ''
}

export interface ProcessoAnalisado {
  processo: ProcessoDoPacote
  fases: FaseDoProcesso[]
}

/** Os processos que entram nas planilhas (só os em andamento; suspenso e cancelado ficam de fora), com as fases de cada um. */
export function analisarProcessos(pacote: PacoteDasPlanilhas): ProcessoAnalisado[] {
  return pacote.processos
    .filter((processo) => processo.situacao_guardada === 'em_andamento')
    .map((processo) => {
      const passagens = pacote.passagens.filter((passagem) => passagem.processo_id === processo.id)
      return { processo, fases: situacaoDasFases(pacote.etapas, processo, passagens) }
    })
}
