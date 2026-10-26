import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { nomePadrao } from '../../supabase/functions/_shared/nomePadrao.ts'
import type { ProcessoLido } from '../processos/tipos'
import { FRASE_DO_PDF_INVALIDO } from './frasesDaValidacao'

/** O tamanho máximo do .pdf da aprovação, o mesmo dos outros arquivos (a função do servidor confere de novo). */
export const LIMITE_DO_PDF = 20 * 1024 * 1024

/** A conferência no navegador, antes de qualquer envio: só .pdf, até 20 MB. Null sem arquivo ou quando o arquivo serve. */
export function recusaDoPdf(arquivo: File | null): string | null {
  if (arquivo === null) return null
  return extensaoDoNome(arquivo.name) === 'pdf' && arquivo.size <= LIMITE_DO_PDF ? null : FRASE_DO_PDF_INVALIDO
}

function motivoDaFalha(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro)
}

/** Na gaveta, ao enviar ou trocar o .pdf: a frase pronta do banco, ou o motivo (o arquivo escolhido continua no formulário). */
export function textoDaFalhaDoPdf(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `O .pdf não foi registrado: ${motivoDaFalha(erro)}. O arquivo escolhido continua no formulário.`
}

/** Na janela de registrar a aprovação, antes de a aprovação ser registrada: o .pdf não chegou, e nada foi registrado. */
export function textoDaFalhaDoEnvioDoPdf(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `O .pdf não foi enviado: ${motivoDaFalha(erro)}. Nada foi registrado.`
}

/** Na janela de registrar a aprovação, depois de a aprovação ser registrada: só o registro do .pdf falhou. */
export function textoDaFalhaDoPdfDepoisDaAprovacao(erro: unknown): string {
  const motivo = erro instanceof TravaDoBanco ? erro.message : `${motivoDaFalha(erro)}.`
  return `A aprovação foi registrada, mas o .pdf não foi guardado: ${motivo} Envie o .pdf pela gaveta da Aprovação pelo setor.`
}

/** O nome com que o .pdf será gravado no Drive: a versão aprovada no lugar do número da versão (CEE_V8_..._Aprovação.pdf). */
export function nomeDoPdf(processo: Pick<ProcessoLido, 'setorSigla' | 'nome'>, versaoAprovada: number): string {
  return nomePadrao({
    sigla: processo.setorSigla, numero: versaoAprovada, historica: false, nomeDoProcesso: processo.nome, papel: 'pdf_da_aprovacao', extensao: 'pdf',
  })
}
