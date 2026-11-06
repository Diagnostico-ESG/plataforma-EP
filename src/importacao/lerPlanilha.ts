import {
  type ChaveDaColuna, type PosicoesDasColunas, NOME_DA_ETAPA, SEQUENCIA_DE_ETAPAS, estaConcluida, localizarCabecalho, normalizar,
} from './colunasDaPlanilha'
import { chaveDoProcesso } from './chaves'
import { lerCsv } from './csv'
import { ehFutura, isoDoDia, lerData } from './datasDaPlanilha'

export type ProcessoLido = {
  /** A posição da linha na planilha (a primeira linha de dados do arquivo conta como a seguinte ao cabeçalho). */
  linha: number
  setor: string
  macroprocesso: string
  nome: string
  etapaCodigo: string
  etapaNome: string
  /** aaaa-mm-dd; só em Concluídos (a de hoje se a planilha não tem uma utilizável). */
  dataDaPublicacao: string | null
  /** aaaa-mm-dd; só fora de Não iniciados (a de hoje se a planilha não tem uma utilizável; nula se está no futuro). */
  dataDaModelagemPiloto: string | null
  anotacoes: string | null
}
export type AvisoLido = { linha: number; nome: string; texto: string }
export type RepetidoLido = { linha: number; setor: string; nome: string }
export type PlanilhaLida = { processos: ProcessoLido[]; repetidos: RepetidoLido[]; avisos: AvisoLido[] }

/** O arquivo não é a aba PRODUTO 33: `faltam` traz os nomes das colunas que não foram achadas no cabeçalho. */
export class ColunasFaltando extends Error {
  readonly faltam: string[]
  constructor(faltam: string[]) {
    super(`Faltam colunas na planilha: ${faltam.join(', ')}. Esperado: o cabeçalho da aba PRODUTO 33.`)
    this.faltam = faltam
  }
}

type Celula = (chave: ChaveDaColuna) => string
type Avisar = (texto: string) => void

const LIMITE_DAS_ANOTACOES = 8000
const SEM_MACROPROCESSO = new Set(['subprocesso geral', 'subprocesso de eventos', 'dl - diretor legislativo'])
const MACROPROCESSO_A_DEFINIR = 'A definir'

// A lista suspensa da planilha põe o numeral romano e " - " na frente; "DL - ..." não é numeral (D e L ficam de fora do padrão).
function macroprocessoDe(valor: string): string {
  const bruto = valor.trim()
  const semNumeral = bruto.replace(/^[IVX]+\s*-\s*/, '')
  const semMacro = bruto === '' || SEM_MACROPROCESSO.has(normalizar(bruto)) || SEM_MACROPROCESSO.has(normalizar(semNumeral))
  return semMacro ? MACROPROCESSO_A_DEFINIR : semNumeral
}

function etapaPelaUltimaConcluida(celula: Celula, avisar: Avisar): string {
  const concluidas = SEQUENCIA_DE_ETAPAS.map((etapa) => estaConcluida(celula(etapa.chave)))
  const ultima = concluidas.lastIndexOf(true)
  if (ultima < 0) return 'nao_iniciados'
  if (SEQUENCIA_DE_ETAPAS.slice(0, ultima).some((etapa) => celula(etapa.chave) === '')) {
    avisar(`"Concluído" em ${SEQUENCIA_DE_ETAPAS[ultima].coluna} depois de coluna vazia: a etapa vale pela última coluna Concluído.`)
  }
  return SEQUENCIA_DE_ETAPAS[ultima].codigo
}

// Em Não iniciados o piloto não foi feito: a data da planilha é ignorada, com aviso.
function avisarDataDoPilotoIgnorada(iso: string | null, ilegivel: boolean, avisar: Avisar): null {
  if (iso) avisar('Data da Modelagem Piloto em processo Não iniciado: ignorada.')
  else if (ilegivel) avisar('Data da Modelagem Piloto ilegível: ignorada.')
  return null
}

// Fora de Não iniciados o piloto foi feito: sem data utilizável, entra a de hoje, com aviso para a equipe corrigir depois
// (ajuste de 2026-11-06). A data no futuro continua ignorada, porque a data do piloto só existe como realização.
function dataDoPiloto(celula: Celula, etapa: string, hoje: Date, avisar: Avisar): string | null {
  const { iso, ilegivel } = lerData(celula('dataDoPiloto'))
  if (etapa === 'nao_iniciados') return avisarDataDoPilotoIgnorada(iso, ilegivel, avisar)
  if (iso && !ehFutura(iso, hoje)) return iso
  if (iso) {
    avisar('Data da Modelagem Piloto no futuro: ignorada.')
    return null
  }
  avisar(ilegivel ? 'Data da Modelagem Piloto ilegível: usada a data de hoje.' : 'Modelagem Piloto sem data: usada a data de hoje.')
  return isoDoDia(hoje)
}

// VII concluída sem data utilizável entra em Concluídos com a data de hoje, com aviso (ajuste de 2026-11-06).
function dataDaPublicacao(celula: Celula, etapa: string, hoje: Date, avisar: Avisar): string | null {
  const { iso, ilegivel } = lerData(celula('dataDaPublicacao'))
  if (etapa !== 'concluidos') {
    if (iso) avisar('Data da Publicação sem a VII - Publicação concluída: ignorada.')
    else if (ilegivel) avisar('Data da Publicação ilegível: ignorada.')
    return null
  }
  if (iso) return iso
  avisar(ilegivel ? 'Data da Publicação ilegível: usada a data de hoje.'
    : 'VII - Publicação concluída sem Data da Publicação: usada a data de hoje.')
  return isoDoDia(hoje)
}

// O banco só aceita letras, números e hífen na sigla; a planilha escreve "DAE/CTL" (às vezes "DAE / CTL").
function siglaDe(area: string): string {
  return area.toUpperCase().replace(/\s*\/\s*/g, '-')
}

function anotacoesDe(celula: Celula, avisar: Avisar): string | null {
  const texto = celula('observacoes')
  if (texto === '') return null
  if (texto.length <= LIMITE_DAS_ANOTACOES) return texto
  avisar(`Observações com ${String(texto.length)} caracteres: cortadas em ${String(LIMITE_DAS_ANOTACOES)}.`)
  return texto.slice(0, LIMITE_DAS_ANOTACOES)
}

function processoDaLinha(linha: number, celula: Celula, hoje: Date, avisar: Avisar): ProcessoLido {
  const etapa = etapaPelaUltimaConcluida(celula, avisar)
  const dataDoPilotoLida = dataDoPiloto(celula, etapa, hoje, avisar)
  return {
    linha, setor: siglaDe(celula('area')), macroprocesso: macroprocessoDe(celula('macros')), nome: celula('processo'),
    etapaCodigo: etapa, etapaNome: NOME_DA_ETAPA[etapa], dataDaPublicacao: dataDaPublicacao(celula, etapa, hoje, avisar),
    dataDaModelagemPiloto: dataDoPilotoLida, anotacoes: anotacoesDe(celula, avisar),
  }
}

function celulaDa(celulas: string[], posicoes: PosicoesDasColunas): Celula {
  return (chave) => (celulas[posicoes[chave]] ?? '').trim()
}

/**
 * Transforma o .csv da aba PRODUTO 33 na lista de processos a importar. Nunca grava nada; o que foge da regra vira aviso
 * e a leitura segue. Linha repetida (mesmo setor e nome) vale a primeira. Lança ColunasFaltando se o arquivo não for a aba.
 */
export function lerPlanilha(texto: string, hoje: Date): PlanilhaLida {
  const linhas = lerCsv(texto)
  const cabecalho = localizarCabecalho(linhas)
  if ('faltam' in cabecalho) throw new ColunasFaltando(cabecalho.faltam)
  const lida: PlanilhaLida = { processos: [], repetidos: [], avisos: [] }
  const vistos = new Set<string>()
  linhas.slice(cabecalho.indice + 1).forEach((celulas, i) => {
    if (celulas.every((c) => c.trim() === '')) return
    lerLinhaDeDados(lida, vistos, cabecalho.indice + 2 + i, celulaDa(celulas, cabecalho.posicoes), hoje)
  })
  return lida
}

function lerLinhaDeDados(lida: PlanilhaLida, vistos: Set<string>, numero: number, celula: Celula, hoje: Date): void {
  const setor = siglaDe(celula('area'))
  const avisar: Avisar = (texto) => lida.avisos.push({ linha: numero, nome: celula('processo') || '(sem nome)', texto })
  if (setor === '' || celula('processo') === '') return avisar('Linha sem Área ou sem nome de processo: ignorada.')
  const chave = chaveDoProcesso(setor, celula('processo'))
  if (vistos.has(chave)) {
    lida.repetidos.push({ linha: numero, setor, nome: celula('processo') })
    return
  }
  vistos.add(chave)
  lida.processos.push(processoDaLinha(numero, celula, hoje, avisar))
}
