import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

export type ClienteSupabase = SupabaseClient<Database>
type VariaveisSupabase = Record<string, string | undefined>

// Único ponto de conexão com o banco: a interface usa só a chave publicável.
export function lerConfigSupabase(variaveis: VariaveisSupabase): { url: string; chave: string } {
  const url = variaveis.VITE_SUPABASE_URL
  const chave = variaveis.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url) {
    throw new Error(`VITE_SUPABASE_URL ausente (recebido: ${String(url)}); esperado o endereço https://<ref>.supabase.co no .env.local`)
  }
  if (!chave) {
    throw new Error(`VITE_SUPABASE_PUBLISHABLE_KEY ausente (recebido: ${String(chave)}); esperada a chave sb_publishable_... no .env.local`)
  }
  return { url, chave }
}

const config = lerConfigSupabase(import.meta.env)

export const supabase = createClient<Database>(config.url, config.chave)
