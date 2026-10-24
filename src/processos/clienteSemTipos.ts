import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClienteSupabase } from '../lib/supabase'

// Remendo do ticket 24 de processos-etapas (Andamento livre): a migração tirou do banco a tabela `andamentos` e as funções
// do modelo anterior, e com elas os tipos gerados. Os módulos que ainda as chamam usam o cliente sem tipos até o ticket 25
// (tela do Andamento livre) e os tickets 04 e 05 reescreverem as chamadas. Quem importa isto some junto com o modelo anterior.
export function semTipos(cliente: ClienteSupabase): SupabaseClient {
  return cliente as unknown as SupabaseClient
}
