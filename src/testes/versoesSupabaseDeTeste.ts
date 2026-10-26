import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClienteSupabaseFalso } from './ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarVersoesSupabase, type EnviarBytes } from '../versoes/versoesSupabase'

// O que os testes do módulo real de versões repartem: a linha lida, o envio ao Drive simulado, o módulo e as respostas da função.
export const LINHA = {
  id: 'v3', numero: 3, historica: false, piloto: false, enviada_em: '2026-10-15T13:00:00+00:00',
  autor: { nome: 'Ana Teste' }, etapa: { nome: 'Reunião de modelagem' },
  arquivos_da_versao: [
    { id: 'a1', papel: 'bpmn', nome: 'TSA_V3_Emitir Ofício.bpmn', formato: 'bpmn', tamanho: 10 },
    { id: 'a2', papel: 'png', nome: 'TSA_V3_Emitir Ofício.png', formato: 'png', tamanho: 20 },
    { id: 'a3', papel: 'bpm', nome: 'TSA_V3_Emitir Ofício.bpm', formato: 'bpm', tamanho: 30 },
  ],
}

/** Envio ao Google simulado: guarda os endereços e devolve o id do arquivo, ou falha no endereço pedido. */
export class EnvioAoDriveFalso {
  enderecos: string[] = []
  falharEm: string | null = null
  enviar: EnviarBytes = (endereco) => {
    this.enderecos.push(endereco)
    if (endereco === this.falharEm) return Promise.resolve(new Response('erro', { status: 503 }))
    return Promise.resolve(new Response(JSON.stringify({ id: `id-${endereco}` }), { status: 200 }))
  }
}

export function criar(cliente: ClienteSupabaseFalso, envio = new EnvioAoDriveFalso()) {
  return criarVersoesSupabase(cliente as unknown as SupabaseClient<Database>, envio.enviar)
}

export function comSessoes(cliente: ClienteSupabaseFalso) {
  // Cada iniciar_envio devolve o mesmo endereço no falso; a ordem das chamadas mostra a sequência.
  cliente.respostasDaFuncao['funcao.iniciar_envio'] = { data: { upload_url: 'sessao', nome: 'x' }, error: null }
  cliente.respostasDaFuncao['funcao.registrar'] = { data: { versao_id: 'v3' }, error: null }
}

export function recusa(codigo: string, mensagem = '', status = 409) {
  return { data: null, error: { message: 'Edge Function returned a non-2xx status code', context: new Response(JSON.stringify({ codigo, mensagem }), { status }) } }
}
