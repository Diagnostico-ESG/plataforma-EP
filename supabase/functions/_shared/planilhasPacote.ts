// O pacote de dados que o banco envia à função das planilhas (exportacao-e-manutencao, ticket 03) e a validação dele.
// Arquivo puro, testado no Vitest. O pacote é dado de fora: antes de qualquer montagem ou chamada ao Google, cada
// campo é conferido. Campos de lista fechada citam o valor recebido na recusa; texto livre e identificadores citam só
// o tipo (nome de processo, observação e identificador de planilha nunca entram em mensagem nem em log).
import { FORMATO_UUID, eCorpo, falhar, tipoDe, type Validacao } from './decisao.ts'

export const FASES_DO_CATALOGO = ['IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const
export type FaseDoRegimento = (typeof FASES_DO_CATALOGO)[number]
export const STATUS_DA_ETAPA = ['pendente', 'em_andamento', 'concluida', 'realizada_anteriormente', 'dispensada'] as const
export type StatusDaEtapa = (typeof STATUS_DA_ETAPA)[number]
export const TIPOS_DE_PROCESSO = ['processo', 'subprocesso', 'a_classificar'] as const
export type TipoDeProcesso = (typeof TIPOS_DE_PROCESSO)[number]
export const SITUACOES_GUARDADAS = ['em_andamento', 'suspenso', 'cancelado'] as const
export type SituacaoGuardada = (typeof SITUACOES_GUARDADAS)[number]

export interface EtapaDoPacote {
  id: string
  codigo: string
  ordem: number
  fase: FaseDoRegimento
}

export interface ProcessoDoPacote {
  id: string
  nome: string
  tipo: TipoDeProcesso
  setor_sigla: string
  macroprocesso_nome: string
  situacao_guardada: SituacaoGuardada
  concluido: boolean
  observacoes: string | null
  data_da_reuniao: string | null
  /** Número da última versão não histórica; nulo sem versão. */
  ultima_versao: number | null
}

export interface AndamentoDoPacote {
  processo_id: string
  etapa_id: string
  status: StatusDaEtapa
  iniciada_em: string | null
  resolvida_em: string | null
}

export interface PacoteDasPlanilhas {
  tentativa: string
  ficha: string
  gerado_em: string
  planilhas: { interna: string; publica: string }
  etapas: EtapaDoPacote[]
  processos: ProcessoDoPacote[]
  andamentos: AndamentoDoPacote[]
}

/** Uma aba pronta para gravar: o título e as linhas (a primeira é o cabeçalho). */
export interface AbaDeValores {
  titulo: string
  linhas: (string | number)[][]
}

interface Regra {
  esperado: string
  vale: (valor: unknown) => boolean
  mostraValor?: boolean
}

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/
const FORMATO_FICHA = /^[0-9a-f]{64}$/
const FORMATO_ID_DA_PLANILHA = /^[A-Za-z0-9_-]{10,200}$/
const FORMATO_CODIGO = /^[a-z0-9_]{2,40}$/

const comFormato = (formato: RegExp, esperado: string): Regra => ({
  esperado,
  vale: (valor) => typeof valor === 'string' && formato.test(valor),
})
const textoNaoVazio: Regra = { esperado: 'texto não vazio', vale: (v) => typeof v === 'string' && v.trim() !== '' }
const textoOuNulo: Regra = { esperado: 'texto ou nulo', vale: (v) => v === null || typeof v === 'string' }
const dataOuNula: Regra = {
  esperado: 'AAAA-MM-DD ou nulo',
  vale: (v) => v === null || (typeof v === 'string' && FORMATO_DATA.test(v)),
}
const booleano: Regra = { esperado: 'booleano', vale: (v) => typeof v === 'boolean' }
const inteiroPositivo = (v: unknown): boolean => typeof v === 'number' && Number.isInteger(v) && v > 0
const numeroPositivo: Regra = { esperado: 'número inteiro maior que zero', vale: inteiroPositivo }
const numeroOuNulo: Regra = { esperado: 'número inteiro maior que zero ou nulo', vale: (v) => v === null || inteiroPositivo(v) }
const dataEHora: Regra = {
  esperado: 'data e hora ISO',
  vale: (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v)),
}
const daLista = (lista: readonly string[]): Regra => ({
  esperado: lista.length > 2 ? `${lista.slice(0, -1).join(', ')} ou ${lista[lista.length - 1]}` : lista.join(' ou '),
  vale: (valor) => typeof valor === 'string' && lista.includes(valor),
  mostraValor: true,
})

const uuid = comFormato(FORMATO_UUID, 'uuid')
const idDaPlanilha = comFormato(FORMATO_ID_DA_PLANILHA, 'identificador de planilha do Google')

function recebido(valor: unknown, regra: Regra): string {
  return regra.mostraValor && typeof valor === 'string' ? `"${valor.slice(0, 30)}"` : tipoDe(valor)
}

// Devolve a frase da primeira recusa do objeto, ou null quando todos os campos valem.
function conferirObjeto(valor: unknown, regras: Record<string, Regra>, onde: string): string | null {
  if (!eCorpo(valor)) return `${onde || 'corpo'}: esperado objeto, recebido ${tipoDe(valor)}`
  for (const [campo, regra] of Object.entries(regras)) {
    if (regra.vale(valor[campo])) continue
    const caminho = onde ? `${onde}.${campo}` : campo
    return `campo ${caminho}: esperado ${regra.esperado}, recebido ${recebido(valor[campo], regra)}`
  }
  return null
}

function conferirLista(valor: unknown, regras: Record<string, Regra>, onde: string): string | null {
  if (!Array.isArray(valor)) return `campo ${onde}: esperado lista, recebido ${tipoDe(valor)}`
  for (const [posicao, item] of valor.entries()) {
    const erro = conferirObjeto(item, regras, `${onde}[${posicao}]`)
    if (erro) return erro
  }
  return null
}

const REGRAS_DA_ETAPA = { id: uuid, codigo: comFormato(FORMATO_CODIGO, 'código da etapa'), ordem: numeroPositivo, fase: daLista(FASES_DO_CATALOGO) }
const REGRAS_DO_PROCESSO: Record<string, Regra> = {
  id: uuid,
  nome: textoNaoVazio,
  tipo: daLista(TIPOS_DE_PROCESSO),
  setor_sigla: textoNaoVazio,
  macroprocesso_nome: textoNaoVazio,
  situacao_guardada: daLista(SITUACOES_GUARDADAS),
  concluido: booleano,
  observacoes: textoOuNulo,
  data_da_reuniao: dataOuNula,
  ultima_versao: numeroOuNulo,
}
const REGRAS_DO_ANDAMENTO = {
  processo_id: uuid,
  etapa_id: uuid,
  status: daLista(STATUS_DA_ETAPA),
  iniciada_em: dataOuNula,
  resolvida_em: dataOuNula,
}

function erroDoPacote(corpo: unknown): string | null {
  if (!eCorpo(corpo)) return `corpo: esperado objeto, recebido ${tipoDe(corpo)}`
  const cabecalho = { tentativa: uuid, ficha: comFormato(FORMATO_FICHA, '64 caracteres hexadecimais'), gerado_em: dataEHora }
  return (
    conferirObjeto(corpo, cabecalho, '') ??
    conferirObjeto(corpo.planilhas, { interna: idDaPlanilha, publica: idDaPlanilha }, 'planilhas') ??
    conferirLista(corpo.etapas, REGRAS_DA_ETAPA, 'etapas') ??
    conferirLista(corpo.processos, REGRAS_DO_PROCESSO, 'processos') ??
    conferirLista(corpo.andamentos, REGRAS_DO_ANDAMENTO, 'andamentos')
  )
}

export function validarPacote(corpo: unknown): Validacao<PacoteDasPlanilhas> {
  const erro = erroDoPacote(corpo)
  if (erro) return falhar('entrada_invalida', erro)
  return { ok: true, valor: corpo as PacoteDasPlanilhas }
}

