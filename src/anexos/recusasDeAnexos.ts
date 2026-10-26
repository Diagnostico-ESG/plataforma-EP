import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { FRASE_DO_PROCESSO_ARQUIVADO } from '../processos/frasesDePublicacao'

// Códigos que chegam da função arquivos-no-drive no envio do anexo: os dela (decisao.ts, google.ts) e os do banco, que ela
// repassa como "motivo" de "motivo:valor" (migração anexos). Nenhuma frase traz o nome do arquivo.
const FRASE_DO_CODIGO: Record<string, string> = {
  sem_permissao: 'Seu perfil não permite enviar anexos.',
  usuario_inativo: 'Seu usuário está desativado; não é possível enviar anexos.',
  sem_login: 'Sua sessão terminou. Entre de novo para enviar o anexo.',
  processo_fora_de_andamento: 'O processo não está em andamento; não é possível enviar anexo.',
  processo_arquivado: FRASE_DO_PROCESSO_ARQUIVADO,
  extensao_nao_aceita: 'O anexo precisa ser .pdf, .docx, .xlsx, .png, .jpg, .jpeg ou .eml.',
  arquivo_grande: 'O anexo pode ter até 20 MB.',
  sem_espaco_no_drive: 'Não há espaço no Drive. Avise o administrador.',
  arquivo_nao_chegou: 'O anexo não chegou ao Drive. Envie de novo.',
  nao_encontrado_no_drive: 'O anexo não chegou ao Drive. Envie de novo.',
  arquivo_fora_da_pasta: 'O anexo não está na pasta do processo no Drive. Envie de novo.',
  drive_indisponivel: 'Não foi possível falar com o Drive. Tente de novo em instantes.',
  entrada_invalida: 'Os dados do envio não foram aceitos. Confira o arquivo e envie de novo.',
}

// Os códigos da retirada: os mesmos da função, com frases que dizem "retirar" (as do envio dizem "enviar").
const FRASE_DO_CODIGO_DA_RETIRADA: Record<string, string> = {
  sem_permissao: 'Seu perfil não permite retirar anexos.',
  usuario_inativo: 'Seu usuário está desativado; não é possível retirar anexos.',
  sem_login: 'Sua sessão terminou. Entre de novo para retirar o anexo.',
  processo_fora_de_andamento: 'O processo não está em andamento; não é possível retirar anexo.',
  processo_arquivado: FRASE_DO_PROCESSO_ARQUIVADO,
  anexo_ja_retirado: 'O anexo já foi retirado.',
  drive_indisponivel: 'Não foi possível falar com o Drive. Tente de novo em instantes.',
  nao_encontrado_no_drive: 'O arquivo do anexo não foi encontrado no Drive. Tente de novo.',
  entrada_invalida: 'Os dados da retirada não foram aceitos. Tente de novo.',
}

/** A recusa da função (ou do banco, por ela) com a frase pronta da tela; código desconhecido vira falha genérica. */
export function falhaDaFuncaoDoAnexo(codigo: string): Error {
  const frase = FRASE_DO_CODIGO[codigo]
  if (frase) return new TravaDoBanco(frase)
  return new Error(`erro inesperado do servidor (${codigo})`)
}

/** A recusa da retirada com a frase pronta da tela; código desconhecido vira falha genérica. */
export function falhaDaRetiradaDoAnexo(codigo: string): Error {
  const frase = FRASE_DO_CODIGO_DA_RETIRADA[codigo]
  if (frase) return new TravaDoBanco(frase)
  return new Error(`erro inesperado do servidor (${codigo})`)
}

/** O aviso em vermelho quando a retirada falha: a frase pronta da recusa, ou o motivo. */
export function textoDaFalhaDaRetirada(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `Não foi possível retirar o anexo: ${motivo}.`
}

/** O aviso em vermelho quando o envio falha: a frase pronta da recusa, ou o motivo. */
export function textoDaFalhaDoAnexo(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `Não foi possível enviar o anexo: ${motivo}.`
}
