// Quem chamou, conferido pela própria função (a verificação de login da plataforma está desligada em
// config.toml, como no modelo atual da CLI; quem confere o token é o createSupabaseContext, pelas chaves do projeto).
// O cliente devolvido fala com o banco com o login de quem chamou: a RLS vale para tudo o que a função lê e grava.
// O contexto também traz um supabaseAdmin (chave secreta); esta função não o usa (ADR 0008).
import { createSupabaseContext } from '@supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Chamador, Perfil } from '../_shared/decisao.ts'

export interface ContextoDoChamador {
  cliente: SupabaseClient
  chamador: Chamador | null
}

async function lerUsuario(cliente: SupabaseClient, id: string): Promise<Chamador | null> {
  const { data, error } = await cliente.from('usuarios').select('perfil, ativo').eq('id', id).maybeSingle()
  if (error) throw new Error(`leitura de usuarios falhou (código ${error.code}); esperado: a própria linha do chamador`)
  if (!data) return null
  return { perfil: data.perfil as Perfil, ativo: data.ativo === true }
}

// Devolve null quando não há login válido. Login sem linha em `usuarios` conta como sem login.
export async function identificarChamador(req: Request): Promise<ContextoDoChamador | null> {
  const { data: contexto, error } = await createSupabaseContext(req, { auth: 'user' })
  // userClaims traz id, email e papel tirados do JWT; o sub do JWT é o mesmo id, como segunda fonte.
  const id = contexto?.userClaims?.id ?? contexto?.jwtClaims?.sub
  if (error || !contexto || typeof id !== 'string') return null
  const cliente = contexto.supabase as SupabaseClient
  return { cliente, chamador: await lerUsuario(cliente, id) }
}
