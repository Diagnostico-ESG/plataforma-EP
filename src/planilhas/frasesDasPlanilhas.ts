import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { OrigemDaAtualizacao, ResultadoDaAtualizacao } from './tipos'

export const FRASE_EM_ANDAMENTO = 'Já há uma atualização em andamento.'
export const FRASE_NAO_CONFIGURADA = 'As planilhas ainda não foram configuradas neste ambiente.'
export const FRASE_SEM_PERMISSAO = 'Seu perfil não permite atualizar as planilhas.'
export const FRASE_DO_MOTIVO_DESCONHECIDO = 'A atualização falhou por um motivo não identificado.'

// Os códigos curtos vêm da função das planilhas (ticket 03); código fora desta tabela cai no motivo não identificado.
const MOTIVOS: Record<string, string> = {
  planilha_interna_recusada: 'O Google recusou a escrita na planilha interna.',
  planilha_publica_recusada: 'O Google recusou a escrita na planilha pública.',
  google_indisponivel: 'O Google não respondeu.',
  pacote_invalido: 'O pedido enviado à atualização estava incompleto.',
}

export function motivoDaFalha(codigo: string | null): string {
  return (codigo && MOTIVOS[codigo]) || FRASE_DO_MOTIVO_DESCONHECIDO
}

export function rotuloDaOrigem(origem: OrigemDaAtualizacao, pedidaPor: string | null): string {
  if (origem === 'automatica') return 'Automática'
  return pedidaPor ? `Pelo botão · ${pedidaPor}` : 'Pelo botão'
}

const ROTULOS_DO_RESULTADO: Record<ResultadoDaAtualizacao, string> = {
  em_andamento: 'Em andamento', sem_resposta: 'Sem resposta', concluida: 'Concluída', falhou: 'Falhou',
}

export function rotuloDoResultado(resultado: ResultadoDaAtualizacao): string {
  return ROTULOS_DO_RESULTADO[resultado]
}

/** A recusa do banco já traz a frase; outra falha cita o motivo recebido. */
export function frasePedidoRecusado(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `Não foi possível pedir a atualização (${motivo}). Tente de novo.`
}
