import type { LinhaDoCsv } from './csv'

/** As colunas que a leitura usa, pelo nome do cabeçalho da aba PRODUTO 33 (I, II, III, D, VIII, IX e V1 a V8 não entram). */
export const COLUNAS = {
  area: 'Área', macros: 'Macros', processo: 'Processos', modelagemPiloto: 'Modelagem Piloto',
  dataDoPiloto: 'Data da Modelagem Piloto', tecnica: 'Modelagem Técnica', revisaoInterna: 'Revisão Interna',
  relatorioPiloto: 'V - Relatório Piloto', validacao: 'VI - Revisão e validação', publicacao: 'VII - Publicação',
  dataDaPublicacao: 'Data da Publicação', observacoes: 'Observações',
} as const

export type ChaveDaColuna = keyof typeof COLUNAS
export type PosicoesDasColunas = Record<ChaveDaColuna, number>

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export type Cabecalho = { indice: number; posicoes: PosicoesDasColunas }

const TODOS_OS_NOMES = Object.values(COLUNAS)

/** O cabeçalho é a primeira linha com "Área" e "Processos" (as de cima são título). Devolve os nomes que faltam, se faltar algum. */
export function localizarCabecalho(linhas: LinhaDoCsv[]): Cabecalho | { faltam: string[] } {
  const indice = linhas.findIndex((linha) => {
    const nomes = linha.map(normalizar)
    return nomes.includes(normalizar(COLUNAS.area)) && nomes.includes(normalizar(COLUNAS.processo))
  })
  if (indice < 0) return { faltam: [...TODOS_OS_NOMES] }
  const nomes = linhas[indice].map(normalizar)
  const entradas = (Object.entries(COLUNAS) as [ChaveDaColuna, string][]).map(([chave, nome]) => [chave, nomes.indexOf(normalizar(nome)), nome] as const)
  const faltam = entradas.filter(([, posicao]) => posicao < 0).map(([, , nome]) => nome)
  if (faltam.length > 0) return { faltam }
  return { indice, posicoes: Object.fromEntries(entradas.map(([chave, posicao]) => [chave, posicao])) as PosicoesDasColunas }
}

/** Na ordem da planilha: a etapa da plataforma que a última coluna "Concluído" indica. */
export const SEQUENCIA_DE_ETAPAS: { chave: ChaveDaColuna; codigo: string; coluna: string }[] = [
  { chave: 'modelagemPiloto', codigo: 'modelagem', coluna: COLUNAS.modelagemPiloto },
  { chave: 'tecnica', codigo: 'relatorio_modelagem_tecnica', coluna: COLUNAS.tecnica },
  { chave: 'revisaoInterna', codigo: 'revisao_interna', coluna: COLUNAS.revisaoInterna },
  { chave: 'relatorioPiloto', codigo: 'relatorio_modelagem_tecnica', coluna: COLUNAS.relatorioPiloto },
  { chave: 'validacao', codigo: 'aprovacao_setor', coluna: COLUNAS.validacao },
  { chave: 'publicacao', codigo: 'concluidos', coluna: COLUNAS.publicacao },
]

export const NOME_DA_ETAPA: Record<string, string> = {
  nao_iniciados: 'Não iniciados', modelagem: 'Modelagem piloto', relatorio_modelagem_tecnica: 'Relatório e modelagem técnica',
  revisao_interna: 'Revisão interna', aprovacao_setor: 'Aprovação pelo setor', publicacao: 'Publicação', concluidos: 'Concluídos',
}

/** "Não realizada" conta como "Concluído" (a época em que não se fazia a modelagem técnica). */
export function estaConcluida(valor: string): boolean {
  const v = normalizar(valor)
  return v === 'concluido' || v === 'nao realizada'
}
