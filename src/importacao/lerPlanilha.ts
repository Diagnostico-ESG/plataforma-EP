import {
  type ChaveDaColuna, type PosicoesDasColunas, NOME_DA_ETAPA, SEQUENCIA_DE_ETAPAS, estaConcluida, localizarCabecalho, normalizar,
} from './colunasDaPlanilha'
import { lerCsv } from './csv'
import { ehFutura, lerData } from './datasDaPlanilha'

export type ProcessoLido = {
  /** A posição da linha na planilha (a primeira linha de dados do arquivo conta como a seguinte ao cabeçalho). */
  linha: number
  setor: string
  macroprocesso: string
  nome: string
  etapaCodigo: string
  etapaNome: string
  /** aaaa-mm-dd; só em Concluídos. */
  dataDaPublicacao: string | null
  /** aaaa-mm-dd; só quando o piloto foi feito e a data já passou. */
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

function dataDoPiloto(celula: Celula, etapa: string, hoje: Date, avisar: Avisar): string | null {
  const { iso, ilegivel } = lerData(celula('dataDoPiloto'))
  if (ilegivel) avisar('Data da Modelagem Piloto ilegível: ignorada.')
  if (!iso) return null
  if (etapa === 'nao_iniciados') avisar('Data da Modelagem Piloto em processo Não iniciado: ignorada.')
  else if (ehFutura(iso, hoje)) avisar('Data da Modelagem Piloto no futuro: ignorada.')
  else return iso
  return null
}

// VII concluída sem data utilizável fica em Publicação (Finalizado) para o usuário decidir depois.
function publicacaoDaLinha(celula: Celula, etapa: string, avisar: Avisar): { etapa: string; data: string | null } {
  const { iso, ilegivel } = lerData(celula('dataDaPublicacao'))
  if (ilegivel) avisar('Data da Publicação ilegível: ignorada.')
  if (etapa !== 'concluidos') {
    if (iso) avisar('Data da Publicação sem a VII - Publicação concluída: ignorada.')
    return { etapa, data: null }
  }
  if (iso) return { etapa, data: iso }
  if (!ilegivel) avisar('VII - Publicação concluída sem Data da Publicação: o processo ficou em Publicação, Finalizado.')
  return { etapa: 'publicacao', data: null }
}

function anotacoesDe(celula: Celula, avisar: Avisar): string | null {
  const texto = celula('observacoes')
  if (texto === '') return null
  if (texto.length <= LIMITE_DAS_ANOTACOES) return texto
  avisar(`Observações com ${String(texto.length)} caracteres: cortadas em ${String(LIMITE_DAS_ANOTACOES)}.`)
  return texto.slice(0, LIMITE_DAS_ANOTACOES)
}

function processoDaLinha(linha: number, celula: Celula, hoje: Date, avisar: Avisar): ProcessoLido {
  const etapaDaColuna = etapaPelaUltimaConcluida(celula, avisar)
  const dataDoPilotoLida = dataDoPiloto(celula, etapaDaColuna, hoje, avisar)
  const publicacao = publicacaoDaLinha(celula, etapaDaColuna, avisar)
  return {
    linha, setor: celula('area').toUpperCase(), macroprocesso: macroprocessoDe(celula('macros')), nome: celula('processo'),
    etapaCodigo: publicacao.etapa, etapaNome: NOME_DA_ETAPA[publicacao.etapa], dataDaPublicacao: publicacao.data,
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
  const setor = celula('area').toUpperCase()
  const avisar: Avisar = (texto) => lida.avisos.push({ linha: numero, nome: celula('processo') || '(sem nome)', texto })
  if (setor === '' || celula('processo') === '') return avisar('Linha sem Área ou sem nome de processo: ignorada.')
  const chave = `${setor}|${celula('processo').toLowerCase()}`
  if (vistos.has(chave)) {
    lida.repetidos.push({ linha: numero, setor, nome: celula('processo').toLowerCase() })
    return
  }
  vistos.add(chave)
  lida.processos.push(processoDaLinha(numero, celula, hoje, avisar))
}
