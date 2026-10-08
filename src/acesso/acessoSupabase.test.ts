import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import type { Database } from '../types/database'
import { criarAcessoSupabase } from './acessoSupabase'

type ErroDoSupabase = { message: string } | null
type RespostaDoBanco = { data: unknown; error: ErroDoSupabase }

/** Cliente Supabase falso: só as chamadas que o módulo de acesso usa, com respostas configuráveis. */
class ClienteSupabaseFalso {
  sessao: unknown = null
  linhaDoUsuario: RespostaDoBanco = { data: null, error: null }
  pedidoDeEntrada: unknown = null
  erroDaSessao: ErroDoSupabase = null
  erroDaEntrada: ErroDoSupabase = null
  erroAoSair: ErroDoSupabase = null
  auth = {
    getSession: async () => ({ data: { session: this.sessao }, error: this.erroDaSessao }),
    signInWithOAuth: async (pedido: unknown) => {
      this.pedidoDeEntrada = pedido
      return { data: {}, error: this.erroDaEntrada }
    },
    signOut: async () => ({ error: this.erroAoSair }),
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

  test('erro ao ler a sessão vira exceção com o texto do Supabase', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.erroDaSessao = { message: 'sem rede' }
    await expect(criar(cliente).sessaoAtual()).rejects.toThrow('Falha ao ler a sessão: sem rede')
  })

  test('erro ao abrir a entrada do Google vira exceção com o texto do Supabase', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.erroDaEntrada = { message: 'sem rede' }
    await expect(criar(cliente).entrarComGoogle()).rejects.toThrow('Falha ao abrir a entrada do Google: sem rede')
  })

  test('sair sem erro termina sem exceção', async () => {
    await expect(criar(new ClienteSupabaseFalso()).sair()).resolves.toBeUndefined()
  })

  test('erro ao sair vira exceção com o texto do Supabase', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.erroAoSair = { message: 'sem rede' }
    await expect(criar(cliente).sair()).rejects.toThrow('Falha ao sair: sem rede')
  })

  test('a recusa vem do endereço de chegada', () => {
    const url = 'http://localhost:5173/?error_description=sem_autorizacao%3Ax%40ccivil.pr.gov.br'
    expect(criar(new ClienteSupabaseFalso(), url).recusaNaChegada()).toEqual({ motivo: 'sem_autorizacao', email: 'x@ccivil.pr.gov.br' })
  })
})
