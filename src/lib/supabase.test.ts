import { describe, expect, test, vi } from 'vitest'

vi.stubEnv('VITE_SUPABASE_URL', 'https://ficticio.supabase.co')
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_ficticia')

const { lerConfigSupabase, supabase } = await import('./supabase')

describe('lerConfigSupabase', () => {
  test('devolve a URL e a chave quando as duas existem', () => {
    const config = lerConfigSupabase({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })
    expect(config).toEqual({ url: 'https://x.supabase.co', chave: 'sb_publishable_x' })
  })

  test('sem URL, o erro nomeia a variável e o formato esperado', () => {
    expect(() => lerConfigSupabase({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toThrow(/VITE_SUPABASE_URL.*https:\/\//)
  })

  test('sem chave, o erro nomeia a variável e o formato esperado', () => {
    expect(() => lerConfigSupabase({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toThrow(/VITE_SUPABASE_PUBLISHABLE_KEY.*sb_publishable_/)
  })

  test('o cliente é criado com as variáveis do ambiente', () => {
    expect(supabase).toBeDefined()
  })
})
