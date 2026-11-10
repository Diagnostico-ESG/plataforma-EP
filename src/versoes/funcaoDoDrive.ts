import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import { tipoMimeDaExtensao } from '../../supabase/functions/_shared/drive.ts'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDaFuncao } from './recusasDeVersoes'

// A conversa com a função arquivos-no-drive e o envio dos bytes ao Google, que os módulos de versões e de anexos repartem.

/** O PUT dos bytes ao endereço da sessão de envio do Drive; injetável para o teste simular o Google. */
export type EnviarBytes = (endereco: string, arquivo: File) => Promise<Response>

// Os bytes vão do navegador direto ao Google (não passam pela função), com o tipo declarado na sessão.
export const enviarComFetch: EnviarBytes = (endereco, arquivo) =>
  fetch(endereco, { method: 'PUT', body: arquivo, headers: { 'Content-Type': tipoMimeDaExtensao(extensaoDoNome(arquivo.name)) } })

type FalhaDaChamada = { message: string; context?: unknown }
export type TradutorDeFalha = (codigo: string, mensagem: string) => Error

// Na resposta fora de 2xx, o supabase-js põe a Response em `context`; sem ela, o pedido nem chegou à função.
async function falhaDaChamada(erro: FalhaDaChamada, traduzir: TradutorDeFalha): Promise<Error> {
  const resposta = erro.context instanceof Response ? erro.context : null
  const corpo: unknown = resposta ? await resposta.json().catch(() => null) : null
  const { codigo, mensagem } = (corpo ?? {}) as { codigo?: unknown; mensagem?: unknown }
  if (typeof codigo === 'string') return traduzir(codigo, typeof mensagem === 'string' ? mensagem : '')
  return new Error('não foi possível falar com o servidor (sem conexão?)')
}

export async function chamarFuncao<T>(cliente: ClienteSupabase, corpo: Record<string, unknown>,
  traduzir: TradutorDeFalha = falhaDaFuncao): Promise<T> {
  const { data, error } = await cliente.functions.invoke('arquivos-no-drive', { body: corpo })
  if (error) throw await falhaDaChamada(error as FalhaDaChamada, traduzir)
  return data as T
}

/**
 * Abre a sessão de envio na função (`corpo` é o pedido `iniciar_envio` sem a ação) e manda os bytes direto ao Google; devolve o
 * id do arquivo no Drive. Usado pela importação dos arquivos (ticket 02 da importação).
 */
export async function enviarAoDrive(cliente: ClienteSupabase, enviarBytes: EnviarBytes, corpo: Record<string, unknown>,
  arquivo: File): Promise<string> {
  const { upload_url: endereco } = await chamarFuncao<{ upload_url: string }>(cliente, { acao: 'iniciar_envio', ...corpo })
  const resposta = await enviarBytes(endereco, arquivo).catch(() => null)
  if (!resposta?.ok) throw new Error(`o arquivo ${arquivo.name} não chegou ao Drive`)
  const { id } = (await resposta.json()) as { id: string }
  return id
}
