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
