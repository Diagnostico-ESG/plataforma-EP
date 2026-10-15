// Função arquivos-no-drive (documentos-versoes, ticket 01). Ordem fixa: configuração → quem chamou →
// perfil e situação (decisao.ts) → entrada → Drive. Nenhuma ação toca o Drive antes de conferir quem chamou.
import '@supabase/functions-js/edge-runtime.d.ts'
import {
  conferirChamador,
  lerAcao,
  recusar,
  validarBaixar,
  validarIniciarEnvio,
  type Acao,
} from '../_shared/decisao.ts'
import { cabecalhosDeOrigem } from '../_shared/drive.ts'
import { baixar, iniciarEnvio } from './acoes.ts'
import { identificarChamador, type ContextoDoChamador } from './chamador.ts'
import { lerConfiguracao, type Configuracao } from './configuracao.ts'
import { ErroDoDrive, obterToken } from './google.ts'
import { comCabecalhos, responderErroInterno, responderJson, responderRecusa } from './respostas.ts'

async function lerCorpo(req: Request): Promise<unknown> {
  return await req.json().catch(() => null)
}

async function executar(acao: Acao, corpo: unknown, chamador: ContextoDoChamador, config: Configuracao, origem: string | null): Promise<Response> {
  if (acao === 'baixar') {
    const entrada = validarBaixar(corpo)
    if (!entrada.ok) return responderRecusa(entrada.recusa)
    return await baixar({ cliente: chamador.cliente, token: await obterToken(config), config }, entrada.valor)
  }
  const entrada = validarIniciarEnvio(corpo)
  if (!entrada.ok) return responderRecusa(entrada.recusa)
  return await iniciarEnvio({ cliente: chamador.cliente, token: await obterToken(config), config }, entrada.valor, origem)
}

async function atender(req: Request, config: Configuracao): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 })
  if (req.method !== 'POST') return responderJson(405, { codigo: 'metodo_nao_aceito', mensagem: 'Use POST.' })
  const chamador = await identificarChamador(req)
  if (!chamador) return responderRecusa(recusar('sem_login'))
  const corpo = await lerCorpo(req)
  const acao = lerAcao(corpo)
  if (!acao) return responderRecusa(recusar('entrada_invalida', 'campo acao: esperado iniciar_envio ou baixar'))
  const recusa = conferirChamador(chamador.chamador, acao)
  if (recusa) return responderRecusa(recusa)
  return await executar(acao, corpo, chamador, config, req.headers.get('Origin'))
}

// O log leva só o tipo do erro: nunca e-mail, nome de processo, token ou corpo do Google.
function responderErro(erro: unknown): Response {
  if (erro instanceof ErroDoDrive) return responderJson(erro.status, { codigo: erro.codigo, mensagem: erro.message })
  console.error(JSON.stringify({ funcao: 'arquivos-no-drive', erro: erro instanceof Error ? erro.name : typeof erro }))
  return responderErroInterno()
}

Deno.serve(async (req: Request) => {
  let config: Configuracao
  try {
    config = lerConfiguracao()
  } catch (erro) {
    return responderErro(erro)
  }
  const cors = cabecalhosDeOrigem(req.headers.get('Origin'), config.origensAceitas)
  try {
    return comCabecalhos(await atender(req, config), cors)
  } catch (erro) {
    return comCabecalhos(responderErro(erro), cors)
  }
})
