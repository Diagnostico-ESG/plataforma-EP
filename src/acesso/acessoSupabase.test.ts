import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import type { Database } from '../types/database'
import { criarAcessoSupabase } from './acessoSupabase'

type RespostaDoBanco = { data: unknown; error: { message: string } | null }

/** Cliente Supabase falso: só as chamadas que o módulo de acesso usa, com respostas configuráveis. */
class ClienteSupabaseFalso {
  sessao: unknown = null
  linhaDoUsuario: RespostaDoBanco = { data: null, error: null }
  pedidoDeEntrada: unknown = null
  auth = {
    getSession: async () => ({ data: { session: this.sessao }, error: null }),
    signInWithOAuth: async (pedido: unknown) => {
      this.pedidoDeEntrada = pedido
      return { data: {}, error: null }
    },
    signOut: async () => ({ error: null }),
  }
  from() {
    const consulta = { select: () => consulta, eq: () => consulta, maybeSingle: async () => this.linhaDoUsuario }
    return consulta
  }
}

function criar(cliente: ClienteSupabaseFalso, url = 'http://localhost:5173/') {
  return criarAcessoSupabase(cliente as unknown as SupabaseClient<Database>, url)
}

describe('criarAcessoSupabase', () => {
  test('sessão com usuário devolve o id e o e-mail; sem sessão, nada', async () => {
    const cliente = new ClienteSupabaseFalso()
    expect(await criar(cliente).sessaoAtual()).toBeNull()
    cliente.sessao = { user: { id: 'u1', email: 'pessoa.teste@ccivil.pr.gov.br' } }
    expect(await criar(cliente).sessaoAtual()).toEqual({ usuarioId: 'u1', email: 'pessoa.teste@ccivil.pr.gov.br' })
  })

  test('lê o próprio usuário com a foto', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.linhaDoUsuario = {
      data: { id: 'u1', nome: 'Pessoa de Teste', foto_url: '/foto.png', perfil: 'consulta', ativo: true },
      error: null,
    }
    expect(await criar(cliente).lerProprioUsuario('u1')).toEqual({
      id: 'u1', nome: 'Pessoa de Teste', fotoUrl: '/foto.png', perfil: 'consulta', ativo: true,
    })
  })

  test('erro do banco vira exceção com o id pedido', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.linhaDoUsuario = { data: null, error: { message: 'sem rede' } }
    await expect(criar(cliente).lerProprioUsuario('u1')).rejects.toThrow(/u1.*sem rede/)
  })

  test('a entrada pede o Google sugerindo o domínio institucional', async () => {
    const cliente = new ClienteSupabaseFalso()
    await criar(cliente).entrarComGoogle()
    expect(cliente.pedidoDeEntrada).toMatchObject({ provider: 'google', options: { queryParams: { hd: 'ccivil.pr.gov.br' } } })
  })

  test('a recusa vem do endereço de chegada', () => {
    const url = 'http://localhost:5173/?error_description=sem_autorizacao%3Ax%40ccivil.pr.gov.br'
    expect(criar(new ClienteSupabaseFalso(), url).recusaNaChegada()).toEqual({ motivo: 'sem_autorizacao', email: 'x@ccivil.pr.gov.br' })
  })
})
