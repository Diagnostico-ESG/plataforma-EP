import { TravaDoBanco } from '../acesso/falhasDeGravacao'

// Códigos que chegam da função arquivos-no-drive: os dela (decisao.ts, google.ts) e os do banco, que ela repassa
// como "motivo" de "motivo:valor" (migração versoes), com o valor na mensagem.
const ARQUIVO_NAO_CHEGOU = 'Um dos arquivos não chegou ao Drive. Envie de novo.'

const FRASE_DO_CODIGO: Record<string, (valor: string) => string> = {
  sem_permissao: () => 'Seu perfil não permite enviar versões.',
  usuario_inativo: () => 'Seu usuário está desativado; não é possível enviar versões.',
  sem_login: () => 'Sua sessão terminou. Entre de novo para enviar a versão.',
  processo_fora_de_andamento: () => 'O processo não está em andamento; não é possível enviar versão.',
  versao_sem_bpmn_e_png: () => 'A versão precisa do .bpmn e do .png.',
  numero_da_versao_mudou: (numero) =>
    `Outra pessoa enviou uma versão enquanto você enviava; esta seria a V${numero}. Envie de novo.`,
  extensao_nao_aceita: () => 'Um dos arquivos tem um tipo que não é aceito no campo dele.',
  arquivo_grande: () => 'Um dos arquivos passa de 20 MB.',
  sem_espaco_no_drive: () => 'Não há espaço no Drive. Avise o administrador.',
  arquivo_nao_chegou: () => ARQUIVO_NAO_CHEGOU,
  nao_encontrado_no_drive: () => ARQUIVO_NAO_CHEGOU,
  arquivo_fora_da_pasta: () => 'Um dos arquivos não está na pasta do processo no Drive. Envie de novo.',
  drive_indisponivel: () => 'Não foi possível falar com o Drive. Tente de novo em instantes.',
}

/** A recusa da função (ou do banco, por ela) com a frase pronta da tela; código desconhecido vira falha genérica. */
export function falhaDaFuncao(codigo: string, mensagem: string): Error {
  const frase = FRASE_DO_CODIGO[codigo]
  if (frase) return new TravaDoBanco(frase(mensagem))
  return new Error(`erro inesperado do servidor (${codigo})`)
}

const FRASE_DO_DOWNLOAD: Record<string, string> = {
  sem_permissao: 'Você não pode baixar este arquivo.',
  usuario_inativo: 'Seu usuário está desativado; não é possível baixar arquivos.',
  sem_login: 'Sua sessão terminou. Entre de novo para baixar o arquivo.',
  nao_encontrado_no_drive: 'O arquivo não foi encontrado no Drive. Avise o administrador.',
  drive_indisponivel: 'Não foi possível falar com o Drive. Tente de novo em instantes.',
}

/** A recusa da função ao baixar, com a frase pronta da tela; código desconhecido vira falha genérica. */
export function falhaDoDownload(codigo: string): Error {
  const frase = FRASE_DO_DOWNLOAD[codigo]
  if (frase) return new TravaDoBanco(frase)
  return new Error(`erro inesperado do servidor (${codigo})`)
}
