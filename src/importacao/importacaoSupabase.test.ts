import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import { criarImportacaoSupabase } from './importacaoSupabase'
import type { ProcessoParaImportar } from './tipos'

function moduloComCliente() {
  const cliente = new ClienteSupabaseFalso()
  return { cliente, modulo: criarImportacaoSupabase(cliente as unknown as ClienteSupabase) }
}

const PROCESSO: ProcessoParaImportar = {
  setor: 'XYZ', macroprocesso: 'Gestão de exemplos', nome: 'Exemplo Alfa', etapaCodigo: 'concluidos',
  dataDaPublicacao: '2026-10-16', dataDaModelagemPiloto: null, anotacoes: null,
}

describe('gravarProcesso', () => {
  test('chama importar_processo com os parâmetros e devolve o resultado', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['rpc.importar_processo'] = { data: 'criado', error: null }
    expect(await modulo.gravarProcesso(PROCESSO)).toBe('criado')
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'rpc', operacao: 'importar_processo', valores: {
      p_setor: 'XYZ', p_macroprocesso: 'Gestão de exemplos', p_nome: 'Exemplo Alfa', p_etapa: 'concluidos',
      p_data_da_publicacao: '2026-10-16',
    } })
  })

  test('o processo que já existe volta como ja_existia', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['rpc.importar_processo'] = { data: 'ja_existia', error: null }
    expect(await modulo.gravarProcesso(PROCESSO)).toBe('ja_existia')
  })

  test('perfil sem permissão vira TravaDoBanco com a frase pronta', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['rpc.importar_processo'] = { data: null, error: { message: 'sem permissão', code: '42501' } }
    await expect(modulo.gravarProcesso(PROCESSO)).rejects.toThrow(new TravaDoBanco('Só o Administrador pode importar os dados.'))
  })

  test('outra recusa traz o nome do processo e o motivo do banco', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['rpc.importar_processo'] = { data: null, error: { message: 'etapa_invalida:xyz', code: 'P0001' } }
    await expect(modulo.gravarProcesso(PROCESSO)).rejects.toThrow('o banco recusou Exemplo Alfa (etapa_invalida:xyz)')
  })

  test('resposta fora do combinado é erro com o valor recebido', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['rpc.importar_processo'] = { data: 'talvez', error: null }
    await expect(modulo.gravarProcesso(PROCESSO)).rejects.toThrow('O banco devolveu "talvez" ao importar Exemplo Alfa')
  })
})

describe('listarExistentes', () => {
  test('lê setores, macroprocessos e processos e os devolve na forma de comparar', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['setores.select'] = { data: [{ sigla: 'xyz' }], error: null }
    cliente.respostas['macroprocessos.select'] = { data: [{ nome: 'Gestão de Exemplos' }], error: null }
    cliente.respostas['processos_com_andamento.select'] = { data: [{ setor_sigla: 'XYZ', nome: ' Exemplo Alfa ' }], error: null }
    expect(await modulo.listarExistentes()).toEqual({
      setores: ['XYZ'], macroprocessos: ['gestão de exemplos'], processos: ['XYZ|exemplo alfa'],
    })
  })

  test('falha ao ler vira erro com o motivo do banco', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['setores.select'] = { data: null, error: { message: 'sem rede' } }
    await expect(modulo.listarExistentes()).rejects.toThrow('Falha ao ler o que já existe na plataforma: sem rede')
  })
})
