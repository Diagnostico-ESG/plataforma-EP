import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import { EnvioAoDriveFalso, recusa } from '../testes/versoesSupabaseDeTeste'
import type { Database } from '../types/database'
import { criarAnexosSupabase } from './anexosSupabase'

const LINHA = {
  id: 'an1', nome: 'resposta.eml', formato: 'eml', tamanho: 2048, enviado_em: '2026-10-20T13:00:00+00:00',
  autor: { nome: 'Ana Teste' }, etapa: { nome: 'Modelagem piloto' },
}

function criar(cliente: ClienteSupabaseFalso, envio = new EnvioAoDriveFalso()) {
  return criarAnexosSupabase(cliente as unknown as SupabaseClient<Database>, envio.enviar)
}

function comSessao(cliente: ClienteSupabaseFalso) {
  cliente.respostasDaFuncao['funcao.iniciar_envio'] = { data: { upload_url: 'sessao', nome: 'x' }, error: null }
  cliente.respostasDaFuncao['funcao.registrar'] = { data: { anexo_id: 'an9' }, error: null }
}

const PEDIDO = { processoId: 'p1', arquivo: new File(['conteudo'], 'resposta.eml') }

describe('listarAnexos', () => {
  it('lista os anexos do processo, do mais recente ao mais antigo, com a etapa e o autor', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['anexos.select'] = { data: [LINHA], error: null }
    expect(await criar(cliente).listarAnexos('p1')).toEqual([{
      id: 'an1', papel: 'anexo', nome: 'resposta.eml', formato: 'eml', tamanho: 2048, enviadoEm: '2026-10-20T13:00:00+00:00',
      autor: 'Ana Teste', etapa: 'Modelagem piloto',
    }])
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'anexos', filtro: ['processo_id', 'p1'], ordem: [['enviado_em', false]] })
  })

  it('autor ou etapa que não podem ser lidos viram null', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['anexos.select'] = { data: [{ ...LINHA, autor: null, etapa: null }], error: null }
    expect(await criar(cliente).listarAnexos('p1')).toMatchObject([{ autor: null, etapa: null }])
  })

  it('falha na leitura vira erro com o motivo', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['anexos.select'] = { data: null, error: { message: 'sem conexão' } }
    await expect(criar(cliente).listarAnexos('p1')).rejects.toThrow('Falha ao ler os anexos do processo p1: sem conexão')
  })
})

describe('enviarAnexo', () => {
  it('abre a sessão com o papel anexo e sem número, envia os bytes e só então registra com o id do Drive', async () => {
    const cliente = new ClienteSupabaseFalso()
    comSessao(cliente)
    const envio = new EnvioAoDriveFalso()
    const progresso: string[] = []
    await criar(cliente, envio).enviarAnexo(PEDIDO, (enviados, total) => progresso.push(`${enviados}/${total}`))
    expect(cliente.chamadasDaFuncao).toEqual([
      { acao: 'iniciar_envio', processo_id: 'p1', papel: 'anexo', nome_original: 'resposta.eml', tamanho: 8 },
      { acao: 'registrar', processo_id: 'p1', arquivos: [{ papel: 'anexo', drive_id: 'id-sessao' }] },
    ])
    expect(envio.enderecos).toEqual(['sessao'])
    expect(progresso).toEqual(['1/1'])
  })

  it('se os bytes não chegam ao Drive, nada é registrado', async () => {
    const cliente = new ClienteSupabaseFalso()
    comSessao(cliente)
    const envio = new EnvioAoDriveFalso()
    envio.falharEm = 'sessao'
    await expect(criar(cliente, envio).enviarAnexo(PEDIDO, () => {})).rejects.toThrow('o arquivo resposta.eml não chegou ao Drive')
    expect(cliente.chamadasDaFuncao.map((chamada) => chamada.acao)).toEqual(['iniciar_envio'])
  })

  it('a recusa da função ao abrir a sessão chega com a frase pronta', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostasDaFuncao['funcao.iniciar_envio'] = recusa('processo_fora_de_andamento', '', 400)
    const erro = await criar(cliente).enviarAnexo(PEDIDO, () => {}).catch((falha: unknown) => falha)
    expect(erro).toBeInstanceOf(TravaDoBanco)
    expect((erro as Error).message).toBe('O processo não está em andamento; não é possível enviar anexo.')
  })

  it('a recusa do banco ao registrar chega com a frase pronta', async () => {
    const cliente = new ClienteSupabaseFalso()
    comSessao(cliente)
    cliente.respostasDaFuncao['funcao.registrar'] = recusa('sem_permissao', '', 403)
    const erro = await criar(cliente).enviarAnexo(PEDIDO, () => {}).catch((falha: unknown) => falha)
    expect((erro as Error).message).toBe('Seu perfil não permite enviar anexos.')
  })

  it('sem conexão com o servidor, a falha diz isso', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostasDaFuncao['funcao.iniciar_envio'] = { data: null, error: { message: 'Failed to fetch' } }
    await expect(criar(cliente).enviarAnexo(PEDIDO, () => {})).rejects.toThrow('não foi possível falar com o servidor')
  })
})
