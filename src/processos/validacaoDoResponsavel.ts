import type { DadosDoResponsavel } from './tipos'

// O banco confere de novo (migração responsaveis_do_setor, mesmo formato); aqui a pessoa vê o problema antes de enviar.
const FORMATO_DO_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** O que a pessoa digitou no formulário, ainda sem normalizar. */
export type CamposDoResponsavel = { nome: string; email: string; cargo: string }

export function fraseDoEmailMalFormado(recebido: string): string {
  return `O e-mail deve ter o formato nome@dominio. Recebido: "${recebido}".`
}

export function problemaNoResponsavel({ nome, email }: CamposDoResponsavel): string | null {
  if (nome.trim() === '') return 'O nome do responsável é obrigatório.'
  const recebido = email.trim()
  if (recebido === '' || FORMATO_DO_EMAIL.test(recebido)) return null
  return fraseDoEmailMalFormado(recebido)
}

// Mesma normalização do banco (private.preparar_responsavel_do_setor).
export function dadosDoResponsavel({ nome, email, cargo }: CamposDoResponsavel): DadosDoResponsavel {
  return { nome: nome.trim(), email: email.trim().toLowerCase() || null, cargo: cargo.trim() || null }
}
