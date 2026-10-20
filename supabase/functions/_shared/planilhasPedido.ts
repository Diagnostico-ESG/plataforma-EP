// O pedido que o banco faz à função das planilhas, do começo ao resultado (exportacao-e-manutencao, ticket 03; spec,
// "Edge Function"). Ordem fixa: senha interna → pacote → montagem → escrita (a interna, depois a pública) → resultado
// ao banco. Nada toca o Google antes de a senha e o pacote valerem. A função responde 202 na hora (o pg_net só espera
// poucos segundos) e o trabalho segue em `depois`. As portas (Google e banco) entram de fora: aqui só há decisão,
// testada no Vitest com portas falsas. Respostas, avisos e resultados não levam nome de processo, observação,
// identificador de planilha nem token.
import { FORMATO_UUID, eCorpo, type Corpo } from './decisao.ts'
import { montarLote, type AbaExistente, type LoteDoSheets } from './planilhasLote.ts'
import { montarPlanilhaInterna } from './planilhasInterna.ts'
import { motivoDaFalha, type CodigoDoMotivo } from './planilhasMotivo.ts'
import { validarPacote, type AbaDeValores, type PacoteDasPlanilhas } from './planilhasPacote.ts'
import { montarPlanilhaPublica } from './planilhasPublica.ts'
import { senhaConfere } from './planilhasSenha.ts'

export type PlanilhaAlvo = 'interna' | 'publica'

export interface Portas {
  lerAbas(planilha: PlanilhaAlvo, idDaPlanilha: string): Promise<AbaExistente[]>
  aplicarLote(planilha: PlanilhaAlvo, idDaPlanilha: string, lote: LoteDoSheets): Promise<void>
  registrar(tentativa: string, ficha: string, deuCerto: boolean, motivo: CodigoDoMotivo | null): Promise<void>
  /** Aviso para o log: só um nome curto, nunca dado do pedido. */
  avisar(tipo: string): void
}

export interface PedidoRecebido {
  senhaRecebida: string | null
  corpo: unknown
}

export interface Resposta {
  status: number
  codigo: string
  /** O trabalho que segue depois da resposta; ausente quando o pedido foi recusado. */
  depois?: () => Promise<void>
}

interface Credenciais {
  tentativa: string
  ficha: string
}

const FORMATO_DA_FICHA = /^[0-9a-f]{64}$/

function lerCredenciais(corpo: Corpo): Credenciais | null {
  const { tentativa, ficha } = corpo
  if (typeof tentativa !== 'string' || !FORMATO_UUID.test(tentativa)) return null
  if (typeof ficha !== 'string' || !FORMATO_DA_FICHA.test(ficha)) return null
  return { tentativa, ficha }
}

async function escreverPlanilha(onde: PlanilhaAlvo, id: string, abas: AbaDeValores[], portas: Portas): Promise<void> {
  const existentes = await portas.lerAbas(onde, id)
  await portas.aplicarLote(onde, id, montarLote(abas, existentes))
}

// Monta as duas antes de escrever qualquer uma; depois, a interna primeiro. Se a pública falha, a interna já está nova.
async function escreverAsDuas(pacote: PacoteDasPlanilhas, portas: Portas): Promise<void> {
  const interna = montarPlanilhaInterna(pacote)
  const publica = montarPlanilhaPublica(pacote)
  await escreverPlanilha('interna', pacote.planilhas.interna, interna, portas)
  await escreverPlanilha('publica', pacote.planilhas.publica, publica, portas)
}

async function registrarResultado(
  credenciais: Credenciais,
  deuCerto: boolean,
  motivo: CodigoDoMotivo | null,
  portas: Portas,
): Promise<void> {
  try {
    await portas.registrar(credenciais.tentativa, credenciais.ficha, deuCerto, motivo)
  } catch {
    portas.avisar('registro_do_resultado_falhou')
  }
}

export async function executarAtualizacao(corpo: Corpo, portas: Portas): Promise<void> {
  const credenciais = lerCredenciais(corpo)
  if (!credenciais) return portas.avisar('pacote_invalido_sem_tentativa')
  const pacote = validarPacote(corpo)
  if (!pacote.ok) return await registrarResultado(credenciais, false, 'pacote_invalido', portas)
  try {
    await escreverAsDuas(pacote.valor, portas)
  } catch (erro) {
    return await registrarResultado(credenciais, false, motivoDaFalha(erro), portas)
  }
  await registrarResultado(credenciais, true, null, portas)
}

export function atenderPedido(pedido: PedidoRecebido, senhaEsperada: string, portas: Portas): Resposta {
  if (!senhaConfere(pedido.senhaRecebida, senhaEsperada)) return { status: 401, codigo: 'senha_invalida' }
  const { corpo } = pedido
  if (!eCorpo(corpo)) return { status: 400, codigo: 'corpo_invalido' }
  return { status: 202, codigo: 'aceito', depois: () => executarAtualizacao(corpo, portas) }
}
