import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { FRASE_DO_PROCESSO_ARQUIVADO } from '../processos/frasesDePublicacao'
import { fraseDoProcessoParado } from '../processos/frasesDeSituacao'
import { fraseDaVersaoAprovada } from '../revisoes/frasesDeAprovacao'
import {
  FRASE_DO_PDF_GUARDADO, FRASE_DO_PDF_JA_ENVIADO, FRASE_DO_PDF_SEM_A_VERSAO, FRASE_DO_PDF_SEM_APROVACAO,
} from '../revisoes/frasesDaValidacao'

// Códigos que chegam da função arquivos-no-drive: os dela (decisao.ts, google.ts) e os do banco, que ela repassa
// como "motivo" de "motivo:valor" (migração versoes), com o valor na mensagem.
const ARQUIVO_NAO_CHEGOU = 'Um dos arquivos não chegou ao Drive. Envie de novo.'

const FRASE_DO_CODIGO: Record<string, (valor: string) => string> = {
  sem_permissao: () => 'Seu perfil não permite enviar versões.',
  usuario_inativo: () => 'Seu usuário está desativado; não é possível enviar versões.',
  sem_login: () => 'Sua sessão terminou. Entre de novo para enviar a versão.',
  processo_fora_de_andamento: () => 'O processo não está em andamento; não é possível enviar versão.',
  versao_sem_bpm: () => 'A versão precisa do .bpm.',
  numero_da_piloto_nao_maior: (numero) => `O número da versão piloto precisa ser maior que ${numero}.`,
  piloto_depois_de_versao_em_sequencia: () =>
    'O processo já tem versão em sequência; a versão piloto só pode ser enviada antes dela.',
  piloto_fora_da_etapa: () => 'A versão piloto só pode ser enviada até a Modelagem piloto.',
  versao_fora_da_etapa: () => 'A versão só pode ser enviada até a Revisão interna.',
  historica_fora_de_nao_iniciados: () => 'A versão histórica só pode ser registrada em Não iniciados.',
  arquivo_ja_existe: () => 'A versão já tem esse arquivo.',
  papel_nao_acrescentavel: () => 'Só o .png e o .bpmn podem ser acrescentados depois.',
  numero_da_versao_mudou: (numero) =>
    `Outra pessoa enviou uma versão enquanto você enviava; esta seria a V${numero}. Envie de novo.`,
  extensao_nao_aceita: () => 'Um dos arquivos tem um tipo que não é aceito no campo dele.',
  arquivo_grande: () => 'Um dos arquivos passa de 20 MB.',
  sem_espaco_no_drive: () => 'Não há espaço no Drive. Avise o administrador.',
  arquivo_nao_chegou: () => ARQUIVO_NAO_CHEGOU,
  nao_encontrado_no_drive: () => ARQUIVO_NAO_CHEGOU,
  arquivo_fora_da_pasta: () => 'Um dos arquivos não está na pasta do processo no Drive. Envie de novo.',
  drive_indisponivel: () => 'Não foi possível falar com o Drive. Tente de novo em instantes.',
  historica_depois_de_versao_nova: () => 'O processo já tem versão nova; versões históricas só podem ser registradas antes dela.',
  numero_historico_repetido: (numero) => `O processo já tem a versão histórica V${numero}F. Use outro número.`,
  historica_sem_arquivo_de_fluxograma: () => 'A versão histórica precisa do arquivo .bpm, ou do .bpmn com o .png.',
  numero_do_relatorio_mudou: (numero) =>
    `Outra pessoa enviou um relatório enquanto você enviava; este seria o Relatório V${numero}. Envie de novo.`,
  relatorio_so_docx: () => 'O relatório precisa ser um arquivo .docx.',
  relatorio_sem_versao: () => 'Não há versão para receber o relatório: envie a versão piloto ou uma versão primeiro.',
  relatorio_fora_da_etapa: () => 'O relatório só pode ser enviado até a Revisão interna.',
  relatorio_fora_da_versao_mais_recente: () => 'O relatório precisa acompanhar a versão mais recente.',
  versao_historica_somente_leitura: () => 'A versão histórica é somente leitura: não recebe arquivos.',
  versao_aprovada: fraseDaVersaoAprovada,
  tipo_de_arquivo_diferente: () => 'O arquivo novo precisa ser do mesmo tipo do que sai.',
  sem_aprovacao_para_o_pdf: () => FRASE_DO_PDF_SEM_APROVACAO,
  pdf_ja_enviado: () => FRASE_DO_PDF_JA_ENVIADO,
  pdf_nome_sem_versao: () => FRASE_DO_PDF_SEM_A_VERSAO,
  pdf_guardado_nao_se_altera: () => FRASE_DO_PDF_GUARDADO,
  processo_arquivado: () => FRASE_DO_PROCESSO_ARQUIVADO,
  processo_parado: fraseDoProcessoParado,
  entrada_invalida: () => 'Os dados do envio não foram aceitos. Confira os campos e os arquivos e envie de novo.',
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

/** O aviso em vermelho quando o download falha: a frase pronta da recusa, ou o arquivo e o motivo. */
export function textoDaFalhaDoDownload(erro: unknown, nomeDoArquivo: string): string {
  if (erro instanceof TravaDoBanco) return erro.message
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `Não foi possível baixar ${nomeDoArquivo}: ${motivo}.`
}
