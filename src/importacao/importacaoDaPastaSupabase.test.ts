import { describe, expect, test } from 'vitest'
import type { ClienteSupabase } from '../lib/supabase'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { EnviarBytes } from '../versoes/funcaoDoDrive'
import { criarImportacaoSupabase } from './importacaoSupabase'
import type { PedidoDeImportacaoDeVersao } from './tipos'

// O que o Google responde ao PUT dos bytes: o id do arquivo no Drive, um por arquivo, na ordem.
function googleFalso(): { enviarBytes: EnviarBytes; enviados: string[] } {
  const enviados: string[] = []
  const enviarBytes: EnviarBytes = (_endereco, arquivo) => {
    enviados.push(arquivo.name)
    return Promise.resolve(new Response(JSON.stringify({ id: `drive-${String(enviados.length)}` })))
  }
  return { enviarBytes, enviados }
}

function moduloComCliente() {
  const cliente = new ClienteSupabaseFalso()
  const google = googleFalso()
  cliente.respostasDaFuncao['funcao.iniciar_envio'] = { data: { upload_url: 'https://upload.inventado' }, error: null }
  cliente.respostasDaFuncao['funcao.registrar'] = { data: { resultado: 'criada' }, error: null }
  return { cliente, google, modulo: criarImportacaoSupabase(cliente as unknown as ClienteSupabase, google.enviarBytes) }
}

const BPM = new File(['b'], 'XYZ_V2_Exemplo Alfa.bpm')
const RELATORIO = new File(['r'], 'XYZ_V2_Exemplo Alfa_Relatório.docx')
const PEDIDO: PedidoDeImportacaoDeVersao = {
  processoId: 'p1', numero: 2, tipo: 'sequencia', numeroDoRelatorio: 3,
  arquivos: [{ papel: 'bpm', arquivo: BPM }, { papel: 'relatorio', arquivo: RELATORIO }],
}

describe('importarVersao', () => {
  test('cada arquivo vai ao Drive com a marca da importação, e o registro leva os ids', async () => {
    const { cliente, google, modulo } = moduloComCliente()
    const andamento: string[] = []
    expect(await modulo.importarVersao(PEDIDO, (feitos, total) => andamento.push(`${String(feitos)}/${String(total)}`))).toBe('criada')
    expect(google.enviados).toEqual([BPM.name, RELATORIO.name])
    expect(andamento).toEqual(['1/2', '2/2'])
    expect(cliente.chamadasDaFuncao[0]).toEqual({
      acao: 'iniciar_envio', importacao: true, processo_id: 'p1', papel: 'bpm', nome_original: BPM.name, tamanho: BPM.size,
      numero: 2, historica: false, piloto: false,
    })
    expect(cliente.chamadasDaFuncao[1]).toMatchObject({ papel: 'relatorio', numero_do_relatorio: 3, importacao: true })
    expect(cliente.chamadasDaFuncao[2]).toEqual({
      acao: 'registrar', importacao: true, processo_id: 'p1', numero: 2, historica: false, piloto: false, numero_do_relatorio: 3,
      arquivos: [{ papel: 'bpm', drive_id: 'drive-1' }, { papel: 'relatorio', drive_id: 'drive-2' }],
    })
  })

  test('a histórica vai com historica e sem número do relatório', async () => {
    const { cliente, modulo } = moduloComCliente()
    await modulo.importarVersao({ ...PEDIDO, tipo: 'historica', numeroDoRelatorio: null }, () => {})
    expect(cliente.chamadasDaFuncao.at(-1)).toMatchObject({ historica: true, piloto: false })
    expect(cliente.chamadasDaFuncao.at(-1)).not.toHaveProperty('numero_do_relatorio')
  })

  test('a versão que já existe volta como ja_existia', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostasDaFuncao['funcao.registrar'] = { data: { resultado: 'ja_existia' }, error: null }
    expect(await modulo.importarVersao(PEDIDO, () => {})).toBe('ja_existia')
  })

  test('o arquivo que não chega ao Drive interrompe a versão, sem registro', async () => {
    const { cliente } = moduloComCliente()
    const falhando: EnviarBytes = () => Promise.resolve(new Response('', { status: 500 }))
    const modulo = criarImportacaoSupabase(cliente as unknown as ClienteSupabase, falhando)
    await expect(modulo.importarVersao(PEDIDO, () => {})).rejects.toThrow(`o arquivo ${BPM.name} não chegou ao Drive`)
    expect(cliente.chamadasDaFuncao.map((c) => c.acao)).toEqual(['iniciar_envio'])
  })
})

describe('importarAnexo e anotarSubpasta', () => {
  test('o .pdf vai como anexo, com a marca da importação', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostasDaFuncao['funcao.registrar'] = { data: { resultado: 'criado' }, error: null }
    const pdf = new File(['p'], 'XYZ_V2_Exemplo Alfa_Relatório.pdf')
    expect(await modulo.importarAnexo('p1', pdf)).toBe('criado')
    expect(cliente.chamadasDaFuncao[0]).toMatchObject({ acao: 'iniciar_envio', importacao: true, papel: 'anexo', nome_original: pdf.name })
    expect(cliente.chamadasDaFuncao[1]).toEqual({
      acao: 'registrar', importacao: true, processo_id: 'p1', arquivos: [{ papel: 'anexo', drive_id: 'drive-1' }],
    })
  })

  test('a linha da subpasta vai pela função do banco', async () => {
    const { cliente, modulo } = moduloComCliente()
    await modulo.anotarSubpasta('p1', 'Grupo de Processos')
    expect(cliente.pedidos.at(-1)).toMatchObject({
      tabela: 'rpc', operacao: 'anotar_subpasta_da_importacao', valores: { p_processo: 'p1', p_subpasta: 'Grupo de Processos' },
    })
  })
})

describe('listarProcessosDaPasta', () => {
  test('junta os processos, as versões, o maior relatório e os anexos, em cinco leituras', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['processos_com_andamento.select'] = {
      data: [{ id: 'p1', setor_sigla: 'XYZ', nome: 'Exemplo Alfa' }, { id: 'p2', setor_sigla: 'ABC', nome: 'Exemplo Beta' }], error: null,
    }
    cliente.respostas['versoes.select'] = { data: [{ processo_id: 'p1', numero: 1 }, { processo_id: 'p1', numero: 3 }], error: null }
    cliente.respostas['arquivos_da_versao.select'] = {
      data: [{ numero_do_relatorio: 2, versoes: { processo_id: 'p1' } }, { numero_do_relatorio: null, versoes: { processo_id: 'p1' } }],
      error: null,
    }
    cliente.respostas['anexos.select'] = { data: [{ processo_id: 'p1', nome: 'XYZ_V1_Exemplo Alfa_Relatório.PDF' }], error: null }
    cliente.respostas['eventos.select'] = { data: [{ id: 9 }], error: null }
    expect(await modulo.listarProcessosDaPasta()).toEqual({
      haImportado: true,
      processos: [
        { id: 'p1', chave: 'XYZ|exemplo alfa', nome: 'Exemplo Alfa', versoes: [1, 3], maiorRelatorio: 2,
          anexos: ['xyz_v1_exemplo alfa_relatório.pdf'] },
        { id: 'p2', chave: 'ABC|exemplo beta', nome: 'Exemplo Beta', versoes: [], maiorRelatorio: 0, anexos: [] },
      ],
    })
    expect(cliente.pedidos).toHaveLength(5)
  })

  test('sem evento de importação, a seção dos arquivos fica fechada', async () => {
    const { modulo } = moduloComCliente()
    expect((await modulo.listarProcessosDaPasta()).haImportado).toBe(false)
  })

  test('a falha de leitura traz o motivo', async () => {
    const { cliente, modulo } = moduloComCliente()
    cliente.respostas['versoes.select'] = { data: null, error: { message: 'sem rede' } }
    await expect(modulo.listarProcessosDaPasta()).rejects.toThrow('Falha ao ler as versões que já existem: sem rede')
  })
})
