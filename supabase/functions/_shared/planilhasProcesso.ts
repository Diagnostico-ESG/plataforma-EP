// Rótulo, datas, tipo e última versão de um processo nas planilhas (exportacao-e-manutencao, ticket 03; sabatina,
// decisões 6 a 9). Arquivo puro, testado no Vitest. Data vazia é o texto vazio: é o que a célula da planilha mostra.
import { situacaoDasFases, type FaseDoProcesso } from './planilhasFases.ts'
import type {
  AndamentoDoPacote,
  EtapaDoPacote,
  PacoteDasPlanilhas,
  ProcessoDoPacote,
  TipoDeProcesso,
} from './planilhasPacote.ts'

// Os códigos que o catálogo de fábrica dá a estas duas etapas (a Fase do Regimento delas é IV e VII).
export const CODIGO_DA_MODELAGEM_PILOTO = 'modelagem'
export const CODIGO_DA_PUBLICACAO = 'publicacao'

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

// A fase atual é a primeira, de IV a VII, que ainda não terminou nem foi dispensada nem está sem etapa.
function faseAtual(fases: FaseDoProcesso[]): FaseDoProcesso | undefined {
  const abertas = ['Em andamento', 'Pronto para iniciar', 'Aguardando etapa anterior']
  return fases.slice(3).find((fase) => abertas.includes(fase.situacao))
}

function comAFase(rotulo: string, fase: FaseDoProcesso | undefined): string {
  return fase ? `${rotulo} · ${fase.fase}` : rotulo
}

/** `fases` é o resultado de `situacaoDasFases` do processo. */
export function rotuloDoProcesso(processo: ProcessoDoPacote, fases: FaseDoProcesso[]): string {
  const atual = faseAtual(fases)
  if (processo.situacao_guardada === 'suspenso') return comAFase('Suspenso', atual)
  if (fases[fases.length - 1].situacao === 'Concluída') return 'Publicado'
  if (processo.concluido) return 'Concluído'
  return comAFase(atual?.situacao === 'Pronto para iniciar' ? 'Próxima' : 'Em andamento', atual)
}

// Etapa dispensada não dá data: ela não aconteceu.
function dataDaEtapa(codigo: string, etapas: EtapaDoPacote[], andamentos: AndamentoDoPacote[]): string {
  const etapa = etapas.find((candidata) => candidata.codigo === codigo)
  const andamento = andamentos.find((candidato) => candidato.etapa_id === etapa?.id)
  const aconteceu = andamento?.status === 'concluida' || andamento?.status === 'realizada_anteriormente'
  return (aconteceu && andamento.resolvida_em) || ''
}

/** A data da reunião; sem ela, o dia em que a etapa Modelagem piloto foi resolvida. */
export function dataDaModelagemPiloto(
  processo: ProcessoDoPacote,
  etapas: EtapaDoPacote[],
  andamentos: AndamentoDoPacote[],
): string {
  return processo.data_da_reuniao ?? dataDaEtapa(CODIGO_DA_MODELAGEM_PILOTO, etapas, andamentos)
}

export function dataDaPublicacao(etapas: EtapaDoPacote[], andamentos: AndamentoDoPacote[]): string {
  return dataDaEtapa(CODIGO_DA_PUBLICACAO, etapas, andamentos)
}

export interface ProcessoAnalisado {
  processo: ProcessoDoPacote
  andamentos: AndamentoDoPacote[]
  fases: FaseDoProcesso[]
}

function andamentosPorProcesso(andamentos: AndamentoDoPacote[]): Map<string, AndamentoDoPacote[]> {
  const porProcesso = new Map<string, AndamentoDoPacote[]>()
  for (const andamento of andamentos) {
    const doProcesso = porProcesso.get(andamento.processo_id) ?? []
    doProcesso.push(andamento)
    porProcesso.set(andamento.processo_id, doProcesso)
  }
  return porProcesso
}

/** Os processos que entram nas planilhas (o cancelado fica de fora, o suspenso entra), com as fases de cada um. */
export function analisarProcessos(pacote: PacoteDasPlanilhas): ProcessoAnalisado[] {
  const porProcesso = andamentosPorProcesso(pacote.andamentos)
  return pacote.processos
    .filter((processo) => processo.situacao_guardada !== 'cancelado')
    .map((processo) => {
      const andamentos = porProcesso.get(processo.id) ?? []
      return { processo, andamentos, fases: situacaoDasFases(pacote.etapas, andamentos) }
    })
}
