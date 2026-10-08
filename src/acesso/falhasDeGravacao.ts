type ErroDoBanco = { message: string; code?: string }
type RecusaDoEmail = 'email_fora_do_dominio' | 'email_ja_autorizado' | 'email_ja_e_usuario'

// O banco recusa com "motivo:email" (private.preparar_autorizacao); o PostgREST pode acrescentar texto em volta.
const PADRAO_DA_RECUSA = /\b(email_fora_do_dominio|email_ja_autorizado|email_ja_e_usuario):(\S*)/

const MOTIVO_DA_RECUSA: Record<RecusaDoEmail, (email: string) => string> = {
  email_fora_do_dominio: (email) => `o e-mail ${email} não é institucional (formato esperado: nome@ccivil.pr.gov.br)`,
  email_ja_autorizado: (email) => `o e-mail ${email} já está autorizado`,
  email_ja_e_usuario: (email) => `o e-mail ${email} já pertence a um usuário`,
}

export function motivoDaFalhaDeGravacao(erro: ErroDoBanco): string {
  const achado = erro.message.match(PADRAO_DA_RECUSA)
  if (achado) return MOTIVO_DA_RECUSA[achado[1] as RecusaDoEmail](achado[2])
  if (erro.code === '42501') return 'seu perfil não permite esta alteração'
  return `erro inesperado do banco (${erro.message})`
}

type RecusaPorTrava = 'nao_desativa_a_si_mesmo' | 'nao_muda_o_proprio_perfil' | 'ultimo_administrador'

// Travas de private.conferir_alteracao_do_usuario. O nome do último administrador pode ter espaços:
// o valor vai até o fim da mensagem.
const PADRAO_DA_TRAVA = /\b(nao_desativa_a_si_mesmo|nao_muda_o_proprio_perfil|ultimo_administrador):(.*)$/m

const FRASE_DA_TRAVA: Record<RecusaPorTrava, (valor: string) => string> = {
  nao_desativa_a_si_mesmo: () => 'Você não pode desativar a si mesmo.',
  nao_muda_o_proprio_perfil: () => 'Você não pode mudar o seu próprio perfil.',
  ultimo_administrador: (nome) => `Não é possível: ${nome} é o último administrador ativo.`,
}

/** Recusa por uma trava de usuários: a mensagem já é a frase completa da tela. */
export class TravaDoBanco extends Error {
  name = 'TravaDoBanco'
}

export function falhaDeGravacao(erro: ErroDoBanco): Error {
  const trava = erro.message.match(PADRAO_DA_TRAVA)
  if (trava) return new TravaDoBanco(FRASE_DA_TRAVA[trava[1] as RecusaPorTrava](trava[2].trim()))
  return new Error(motivoDaFalhaDeGravacao(erro))
}

export function textoDaFalha(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `A alteração não foi salva: ${mensagemDoErro(erro)}.`
}

export function textoDaFalhaNoFormulario(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `A alteração não foi salva: ${mensagemDoErro(erro)}. Seus dados continuam no formulário.`
}

function mensagemDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro)
}
