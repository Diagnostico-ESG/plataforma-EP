// Função planilhas-dos-dashboards (exportacao-e-manutencao, ticket 03; ADRs 0017 e 0018). Quem chama é o banco (pg_net),
// sem login, com a senha interna no cabeçalho `x-senha-interna`. Ordem fixa: configuração → senha interna → pacote →
// montagem → escrita → resultado ao banco (a decisão está em _shared/planilhasPedido.ts). Não lê o banco e não usa a
// chave secreta. Responde 202 na hora e termina o trabalho depois da resposta (o pg_net só espera poucos segundos).
import '@supabase/functions-js/edge-runtime.d.ts'
import { atenderPedido } from '../_shared/planilhasPedido.ts'
import { lerConfiguracao, type Configuracao } from './configuracao.ts'
import { portasReais } from './portas.ts'

function responder(status: number, codigo: string): Response {
  return new Response(JSON.stringify({ codigo }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

// O log leva só o tipo do erro: nunca nome de processo, observação, identificador de planilha ou token.
function registrarErroNoLog(erro: unknown): void {
  console.error(JSON.stringify({ funcao: 'planilhas-dos-dashboards', erro: erro instanceof Error ? erro.name : typeof erro }))
}

function lerConfiguracaoOuNulo(): Configuracao | null {
  try {
    return lerConfiguracao()
  } catch (erro) {
    // A mensagem cita o nome do segredo que falta (nunca um valor): ajuda quem publicou a função.
    console.error(JSON.stringify({ funcao: 'planilhas-dos-dashboards', configuracao: (erro as Error).message }))
    return null
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return responder(405, 'metodo_nao_aceito')
  const config = lerConfiguracaoOuNulo()
  if (!config) return responder(500, 'configuracao_incompleta')
  const corpo: unknown = await req.json().catch(() => null)
  const pedido = { senhaRecebida: req.headers.get('x-senha-interna'), corpo }
  const resposta = atenderPedido(pedido, config.senhaInterna, portasReais(config))
  if (resposta.depois) EdgeRuntime.waitUntil(resposta.depois().catch(registrarErroNoLog))
  return responder(resposta.status, resposta.codigo)
})
