import { expect, test } from 'vitest'
import type { ClienteSupabase } from '../lib/supabase'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import { criarRelatoriosComRSupabase } from './relatoriosComRSupabase'

function moduloComCliente() {
  const cliente = new ClienteSupabaseFalso()
  return { cliente, modulo: criarRelatoriosComRSupabase(cliente as unknown as ClienteSupabase) }
}

test('lê os relatórios e separa os que têm V, os fora do padrão e os que já estão com R', async () => {
  const { cliente, modulo } = moduloComCliente()
  cliente.respostas['arquivos_da_versao.select'] = {
    data: [
      { id: 'a1', nome: 'XYZ_V2_Exemplo_Relatório V1.docx', numero_do_relatorio: 1 },
      { id: 'a2', nome: 'XYZ_V3_Exemplo_Relatório R2.docx', numero_do_relatorio: 2 },
      { id: 'a3', nome: 'XYZ_V4_Exemplo_Relatório V9.docx', numero_do_relatorio: 3 },
      { id: 'a4', nome: 'XYZ_V1F_Exemplo_Relatório.pdf', numero_do_relatorio: null },
    ],
    error: null,
  }
  expect(await modulo.listarRelatoriosComV()).toEqual({
    aRenomear: [{ arquivoId: 'a1', nome: 'XYZ_V2_Exemplo_Relatório V1.docx' }], foraDoPadrao: 1,
  })
  expect(cliente.pedidos[0]).toMatchObject({ colunas: 'id, nome, numero_do_relatorio', filtro: ['papel', 'relatorio'] })
})

test('a falha da leitura vira erro com a mensagem do banco', async () => {
  const { cliente, modulo } = moduloComCliente()
  cliente.respostas['arquivos_da_versao.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(modulo.listarRelatoriosComV()).rejects.toThrow('Falha ao ler os relatórios: sem conexão')
})

test('renomear chama a função do servidor com o id do arquivo', async () => {
  const { cliente, modulo } = moduloComCliente()
  cliente.respostasDaFuncao['funcao.renomear_relatorio'] = { data: { nome: 'XYZ_V2_Exemplo_Relatório R1.docx' }, error: null }
  await modulo.renomearRelatorio({ arquivoId: 'a1', nome: 'XYZ_V2_Exemplo_Relatório V1.docx' })
  expect(cliente.chamadasDaFuncao).toEqual([{ acao: 'renomear_relatorio', arquivo_id: 'a1' }])
})
