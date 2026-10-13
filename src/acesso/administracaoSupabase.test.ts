import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarAdministracaoSupabase } from './administracaoSupabase'
import { TravaDoBanco } from './falhasDeGravacao'

function criar(cliente: ClienteSupabaseFalso) {
  return criarAdministracaoSupabase(cliente as unknown as SupabaseClient<Database>)
}

describe('criarAdministracaoSupabase', () => {
  test('a lista traz as autorizações aguardando e depois os usuários, com e-mail e situação', async () => {
    const cliente = new ClienteSupabaseFalso()
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
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['usuarios.select'] = { data: null, error: { message: 'sem rede' } }
    await expect(criar(cliente).listarUsuarios()).rejects.toThrow(/usuários.*sem rede/)
  })

  test('falha ao listar as autorizações vira exceção com o texto do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['autorizacoes.select'] = { data: null, error: { message: 'sem rede' } }
    await expect(criar(cliente).listarUsuarios()).rejects.toThrow('Falha ao listar as autorizações: sem rede')
  })

  test('usuário ativo aparece com a situação ativo', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['usuarios.select'] = {
      data: [{ id: 'u1', nome: 'Ana Teste', foto_url: null, perfil: 'consulta', ativo: true,
        usuarios_emails: { email: 'ana.teste@ccivil.pr.gov.br' } }],
      error: null,
    }
    expect((await criar(cliente).listarUsuarios())[0].situacao).toBe('ativo')
  })

  test('autorizar inclui e-mail e perfil; a recusa do banco vira o motivo', async () => {
    const cliente = new ClienteSupabaseFalso()
    await criar(cliente).autorizarEmail('nova.teste@ccivil.pr.gov.br', 'integrante_ep')
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'autorizacoes', operacao: 'insert',
      valores: { email: 'nova.teste@ccivil.pr.gov.br', perfil: 'integrante_ep' } })
    cliente.respostas['autorizacoes.insert'] = { data: null,
      error: { message: 'email_ja_autorizado:nova.teste@ccivil.pr.gov.br', code: 'P0001' } }
    await expect(criar(cliente).autorizarEmail('nova.teste@ccivil.pr.gov.br', 'consulta'))
      .rejects.toThrow('o e-mail nova.teste@ccivil.pr.gov.br já está autorizado')
  })

  test('mudar perfil filtra pelo e-mail e falha quando nenhuma linha muda', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['autorizacoes.update'] = { data: [{ email: 'x.teste@ccivil.pr.gov.br' }], error: null }
    await criar(cliente).mudarPerfilDaAutorizacao('x.teste@ccivil.pr.gov.br', 'administrador')
    expect(cliente.pedidos[0]).toMatchObject({ operacao: 'update', valores: { perfil: 'administrador' },
      filtro: ['email', 'x.teste@ccivil.pr.gov.br'] })
    cliente.respostas['autorizacoes.update'] = { data: [], error: null }
    await expect(criar(cliente).mudarPerfilDaAutorizacao('x.teste@ccivil.pr.gov.br', 'consulta'))
      .rejects.toThrow(/autorização de x\.teste@ccivil\.pr\.gov\.br não foi encontrada/)
  })

  test('excluir apaga a autorização do e-mail', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['autorizacoes.delete'] = { data: [{ email: 'x.teste@ccivil.pr.gov.br' }], error: null }
    await criar(cliente).excluirAutorizacao('x.teste@ccivil.pr.gov.br')
    expect(cliente.pedidos[0]).toMatchObject({ operacao: 'delete', filtro: ['email', 'x.teste@ccivil.pr.gov.br'] })
  })

  test('mudar perfil, desativar, reativar e corrigir nome alteram só a coluna, filtrando pelo id', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['usuarios.update'] = { data: [{ id: 'u1' }], error: null }
    const administracao = criar(cliente)
    await administracao.mudarPerfilDoUsuario('u1', 'consulta')
    await administracao.desativarUsuario('u1')
    await administracao.reativarUsuario('u1')
    await administracao.corrigirNome('u1', 'Ana Corrigida')
    expect(cliente.pedidos.map(({ tabela, operacao, valores, filtro }) => ({ tabela, operacao, valores, filtro })))
      .toEqual([
        { tabela: 'usuarios', operacao: 'update', valores: { perfil: 'consulta' }, filtro: ['id', 'u1'] },
        { tabela: 'usuarios', operacao: 'update', valores: { ativo: false }, filtro: ['id', 'u1'] },
        { tabela: 'usuarios', operacao: 'update', valores: { ativo: true }, filtro: ['id', 'u1'] },
        { tabela: 'usuarios', operacao: 'update', valores: { nome: 'Ana Corrigida' }, filtro: ['id', 'u1'] },
      ])
  })

  test('alteração de usuário que não muda nenhuma linha vira falha com o id', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['usuarios.update'] = { data: [], error: null }
    await expect(criar(cliente).desativarUsuario('u1')).rejects.toThrow(/usuário u1 não foi encontrado/)
  })

  test('a trava do banco chega como TravaDoBanco com a frase da tela', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['usuarios.update'] = { data: null,
      error: { message: 'ultimo_administrador:Ana Teste', code: 'P0001' } }
    const falha = await criar(cliente).desativarUsuario('u1').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('Não é possível: Ana Teste é o último administrador ativo.')
  })

  test('o histórico vem do mais recente ao mais antigo, com autor, ação e o alvo pelo nome', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['eventos.select'] = { data: [
      { id: 2, ocorrido_em: '2026-10-08T14:05:00Z', acao: 'desativar', entidade: 'usuario', entidade_ref: 'u1',
        detalhes: { antes: { ativo: true }, depois: { ativo: false } }, autor: { nome: 'Ana Teste' } },
      { id: 1, ocorrido_em: '2026-10-07T12:00:00Z', acao: 'autorizar', entidade: 'autorizacao',
        entidade_ref: 'nova.teste@ccivil.pr.gov.br', detalhes: { antes: null, depois: { perfil: 'consulta' } }, autor: null },
    ], error: null }
    cliente.respostas['usuarios.select'] = { data: [{ id: 'u1', nome: 'Beto Teste' }], error: null }
    expect(await criar(cliente).listarHistorico()).toEqual([
      { id: 2, ocorridoEm: '2026-10-08T14:05:00Z', autor: 'Ana Teste', acao: 'desativar', entidade: 'usuario',
        alvo: 'Beto Teste', antes: { ativo: true }, depois: { ativo: false } },
      { id: 1, ocorridoEm: '2026-10-07T12:00:00Z', autor: null, acao: 'autorizar', entidade: 'autorizacao',
        alvo: 'nova.teste@ccivil.pr.gov.br', antes: null, depois: { perfil: 'consulta' } },
    ])
    expect(cliente.pedidos.find((p) => p.tabela === 'eventos')?.ordem)
      .toEqual([['ocorrido_em', false], ['id', false]])
  })

  test('usuário que não está mais na lista aparece pelo id; falha ao ler o histórico vira exceção', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['eventos.select'] = { data: [{ id: 1, ocorrido_em: '2026-10-08T14:05:00Z', acao: 'reativar',
      entidade: 'usuario', entidade_ref: 'u9', detalhes: { antes: null, depois: null }, autor: null }], error: null }
    expect((await criar(cliente).listarHistorico())[0].alvo).toBe('u9')
    cliente.respostas['eventos.select'] = { data: null, error: { message: 'sem rede' } }
    await expect(criar(cliente).listarHistorico()).rejects.toThrow(/histórico.*sem rede/)
  })
})
