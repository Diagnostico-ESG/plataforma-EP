import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import type { Database } from '../types/database'
import { criarAdministracaoSupabase } from './administracaoSupabase'

type RespostaDoBanco = { data: unknown; error: { message: string; code?: string } | null }
type Pedido = { tabela: string; operacao: string; valores?: unknown; filtro?: [string, string] }

/** Cliente Supabase falso: guarda cada pedido e responde por "tabela.operação". */
class ClienteDeAdministracaoFalso {
  respostas: Record<string, RespostaDoBanco> = {}
  pedidos: Pedido[] = []

  from(tabela: string) {
    const pedido: Pedido = { tabela, operacao: 'select' }
    this.pedidos.push(pedido)
    const resposta = () => this.respostas[`${tabela}.${pedido.operacao}`] ?? { data: [], error: null }
    const consulta = {
      select: () => consulta,
      order: () => consulta,
      insert: (valores: unknown) => Object.assign(pedido, { operacao: 'insert', valores }) && consulta,
      update: (valores: unknown) => Object.assign(pedido, { operacao: 'update', valores }) && consulta,
      delete: () => Object.assign(pedido, { operacao: 'delete' }) && consulta,
      eq: (coluna: string, valor: string) => Object.assign(pedido, { filtro: [coluna, valor] }) && consulta,
      then: (seCumprir: (r: RespostaDoBanco) => unknown, seFalhar?: (e: unknown) => unknown) =>
        Promise.resolve(resposta()).then(seCumprir, seFalhar),
    }
    return consulta
  }
}

function criar(cliente: ClienteDeAdministracaoFalso) {
  return criarAdministracaoSupabase(cliente as unknown as SupabaseClient<Database>)
}

describe('criarAdministracaoSupabase', () => {
  test('a lista traz as autorizações aguardando e depois os usuários, com e-mail e situação', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['autorizacoes.select'] = { data: [{ email: 'nova.teste@ccivil.pr.gov.br', perfil: 'consulta' }], error: null }
    cliente.respostas['usuarios.select'] = {
      data: [{ id: 'u1', nome: 'Ana Teste', foto_url: null, perfil: 'administrador', ativo: false,
        usuarios_emails: { email: 'ana.teste@ccivil.pr.gov.br' } }],
      error: null,
    }
    expect(await criar(cliente).listarUsuarios()).toEqual([
      { chave: 'nova.teste@ccivil.pr.gov.br', nome: null, email: 'nova.teste@ccivil.pr.gov.br', fotoUrl: null,
        perfil: 'consulta', situacao: 'aguardando' },
      { chave: 'u1', nome: 'Ana Teste', email: 'ana.teste@ccivil.pr.gov.br', fotoUrl: null,
        perfil: 'administrador', situacao: 'inativo' },
    ])
  })

  test('falha ao listar vira exceção com o texto do banco', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['usuarios.select'] = { data: null, error: { message: 'sem rede' } }
    await expect(criar(cliente).listarUsuarios()).rejects.toThrow(/usuários.*sem rede/)
  })

  test('autorizar inclui e-mail e perfil; a recusa do banco vira o motivo', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    await criar(cliente).autorizarEmail('nova.teste@ccivil.pr.gov.br', 'integrante_ep')
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'autorizacoes', operacao: 'insert',
      valores: { email: 'nova.teste@ccivil.pr.gov.br', perfil: 'integrante_ep' } })
    cliente.respostas['autorizacoes.insert'] = { data: null,
      error: { message: 'email_ja_autorizado:nova.teste@ccivil.pr.gov.br', code: 'P0001' } }
    await expect(criar(cliente).autorizarEmail('nova.teste@ccivil.pr.gov.br', 'consulta'))
      .rejects.toThrow('o e-mail nova.teste@ccivil.pr.gov.br já está autorizado')
  })

  test('mudar perfil filtra pelo e-mail e falha quando nenhuma linha muda', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['autorizacoes.update'] = { data: [{ email: 'x.teste@ccivil.pr.gov.br' }], error: null }
    await criar(cliente).mudarPerfilDaAutorizacao('x.teste@ccivil.pr.gov.br', 'administrador')
    expect(cliente.pedidos[0]).toMatchObject({ operacao: 'update', valores: { perfil: 'administrador' },
      filtro: ['email', 'x.teste@ccivil.pr.gov.br'] })
    cliente.respostas['autorizacoes.update'] = { data: [], error: null }
    await expect(criar(cliente).mudarPerfilDaAutorizacao('x.teste@ccivil.pr.gov.br', 'consulta'))
      .rejects.toThrow(/autorização de x\.teste@ccivil\.pr\.gov\.br não foi encontrada/)
  })

  test('excluir apaga a autorização do e-mail', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['autorizacoes.delete'] = { data: [{ email: 'x.teste@ccivil.pr.gov.br' }], error: null }
    await criar(cliente).excluirAutorizacao('x.teste@ccivil.pr.gov.br')
    expect(cliente.pedidos[0]).toMatchObject({ operacao: 'delete', filtro: ['email', 'x.teste@ccivil.pr.gov.br'] })
  })
})
