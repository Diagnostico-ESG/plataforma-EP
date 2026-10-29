// Pacotes inventados para os testes das planilhas (nenhum dado real). Só os testes importam este arquivo.
import type {
  EtapaDoPacote,
  EtiquetaDaEtapa,
  PacoteDasPlanilhas,
  PassagemDoPacote,
  ProcessoDoPacote,
} from './planilhasPacote.ts'

export function uuid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

// O catálogo de fábrica: as duas fixas nas pontas, sem fase, e as seis etapas de trabalho.
const CATALOGO: [string, EtapaDoPacote['fase']][] = [
  ['nao_iniciados', null],
  ['modelagem', 'IV'],
  ['relatorio_modelagem_tecnica', 'V'],
  ['revisao_interna', 'VI'],
  ['revisao_setor', 'VI'],
  ['aprovacao_setor', 'VI'],
  ['publicacao', 'VII'],
  ['concluidos', null],
]

export function etapasDoCatalogo(): EtapaDoPacote[] {
  return CATALOGO.map(([codigo, fase], i) => ({ id: uuid(100 + i), codigo, ordem: i + 1, fase }))
}

export function idDaEtapa(codigo: string): string {
  const etapa = etapasDoCatalogo().find((candidata) => candidata.codigo === codigo)
  if (!etapa) throw new Error(`etapa de exemplo inexistente: "${codigo}"`)
  return etapa.id
}

/** Um processo em Não iniciados, sem publicação; `campos` sobrescreve o que o teste quiser. */
export function processoDe(n: number, campos: Partial<ProcessoDoPacote> = {}): ProcessoDoPacote {
  return {
    id: uuid(n),
    nome: `Processo ${n}`,
    tipo: 'processo',
    setor_sigla: 'SET',
    macroprocesso_nome: 'Macro Inventado',
    situacao_guardada: 'em_andamento',
    data_da_modelagem_piloto: null,
    etapa_atual_id: idDaEtapa('nao_iniciados'),
    etiqueta: 'a_fazer',
    publicado_em: null,
    ultima_versao: null,
    ...campos,
  }
}

/** Uma estadia do processo numa etapa: o código dela, quando entrou (ISO) e, se houver, a etiqueta e o Concluído. */
export interface PassoDaTrilha {
  etapa: string
  entrou: string
  etiqueta?: EtiquetaDaEtapa
  concluidoEm?: string
}

export interface ProcessoComPassagens {
  processo: ProcessoDoPacote
  passagens: PassagemDoPacote[]
}

/** Cada passo vira uma passagem que fecha na entrada do seguinte; a última fica aberta e é a etapa atual. */
export function processoNaTrilha(
  n: number,
  passos: PassoDaTrilha[],
  campos: Partial<ProcessoDoPacote> = {},
): ProcessoComPassagens {
  const passagens = passos.map((passo, i): PassagemDoPacote => ({
    processo_id: uuid(n),
    etapa_id: idDaEtapa(passo.etapa),
    entrou_em: passo.entrou,
    saiu_em: passos[i + 1]?.entrou ?? null,
    etiqueta: passo.etiqueta ?? 'a_fazer',
    concluido_em: passo.concluidoEm ?? null,
  }))
  const atual = passos[passos.length - 1]
  const processo = processoDe(n, { etapa_atual_id: idDaEtapa(atual.etapa), etiqueta: atual.etiqueta ?? 'a_fazer', ...campos })
  return { processo, passagens }
}

export function pacoteDe(
  lista: ProcessoComPassagens[],
  etapas: EtapaDoPacote[] = etapasDoCatalogo(),
): PacoteDasPlanilhas {
  return {
    tentativa: uuid(1),
    ficha: 'a'.repeat(64),
    gerado_em: '2026-10-20T12:00:00Z',
    planilhas: { interna: 'id-da-planilha-interna', publica: 'id-da-planilha-publica' },
    etapas,
    processos: lista.map((item) => item.processo),
    passagens: lista.flatMap((item) => item.passagens),
  }
}

/** Um pacote pequeno e válido: um processo com a Modelagem piloto em andamento. */
export function pacoteMinimo(): PacoteDasPlanilhas {
  const modelagem = { etapa: 'modelagem', entrou: '2026-03-01T12:00:00Z', etiqueta: 'em_andamento' } as const
  return pacoteDe([processoNaTrilha(10, [modelagem])])
}
