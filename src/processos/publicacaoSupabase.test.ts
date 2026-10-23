import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

function clienteQueRecusa(funcao: string, erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[`rpc.${funcao}`] = { data: null, error: erro }
  return cliente
}

async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

test('desistir, registrar, arquivar e desarquivar chamam as funções do banco com o processo', async () => {
  const cliente = new ClienteSupabaseFalso()
  const modulo = criar(cliente)
  await modulo.naoVaiMaisParaPublicacao('p1', 'O setor desistiu')
  await modulo.registrarPublicacao('p1', '2026-10-01', 'Diário Oficial nº 1')
  await modulo.arquivar('p1')
  await modulo.desarquivar('p1')
  expect(cliente.pedidos).toEqual([
    { tabela: 'rpc', operacao: 'nao_vai_mais_para_publicacao', valores: { p_processo: 'p1', p_motivo: 'O setor desistiu' } },
    { tabela: 'rpc', operacao: 'registrar_publicacao', valores: { p_processo: 'p1', p_data: '2026-10-01', p_nota: 'Diário Oficial nº 1' } },
    { tabela: 'rpc', operacao: 'arquivar_processo', valores: { p_processo: 'p1' } },
    { tabela: 'rpc', operacao: 'desarquivar_processo', valores: { p_processo: 'p1' } },
  ])
})

test('a nota vazia ou só com espaços vai como null', async () => {
  const cliente = new ClienteSupabaseFalso()
  await criar(cliente).registrarPublicacao('p1', '2026-10-01', '   ')
  await criar(cliente).registrarPublicacao('p1', '2026-10-01', null)
  expect(cliente.pedidos.map((pedido) => pedido.valores)).toEqual([
    { p_processo: 'p1', p_data: '2026-10-01', p_nota: null }, { p_processo: 'p1', p_data: '2026-10-01', p_nota: null },
  ])
})

const RECUSAS: [string, string, string][] = [
  ['avancar_etapa', 'publicacao_nao_se_dispensa', 'A Publicação não se dispensa: use "Não vai mais para publicação".'],
  ['nao_vai_mais_para_publicacao', 'publicacao_fora_de_andamento', 'Só se desiste da publicação com a Publicação em andamento.'],
  ['registrar_publicacao', 'publicacao_so_no_concluido:em_andamento',
    'Só se registra a publicação de um processo concluído; este está em andamento.'],
  ['registrar_publicacao', 'publicacao_ja_registrada', 'A publicação deste processo já está registrada.'],
  ['registrar_publicacao', 'sem_publicacao_pendente', 'Este processo não tem a Publicação pendente para registrar.'],
  ['registrar_publicacao', 'data_da_publicacao_obrigatoria', 'Informe a data da publicação.'],
  ['registrar_publicacao', 'data_no_futuro:2026-12-01', 'A data 01/12/2026 está no futuro.'],
  ['registrar_publicacao', 'publicacao_antes_da_aprovacao:2026-09-01:2026-09-10',
    'A data da publicação (01/09/2026) não pode ser antes da aprovação (10/09/2026).'],
  ['arquivar_processo', 'arquivar_so_concluido:suspenso', 'Só um processo concluído pode ser arquivado; este está suspenso.'],
  ['arquivar_processo', 'ja_arquivado', 'Este processo já está arquivado.'],
  ['desarquivar_processo', 'nao_arquivado', 'Este processo não está arquivado.'],
  ['suspender_processo', 'processo_arquivado', 'Este processo está arquivado; desarquive-o para alterar.'],
  ['arquivar_processo', 'arquivamento_so_pela_funcao', 'O processo só se arquiva e se desarquiva pelos botões do verso.'],
]

test.each(RECUSAS)('%s recusado com %s vira a frase', async (funcao, mensagem, frase) => {
  const modulo = criar(clienteQueRecusa(funcao, { message: mensagem, code: 'P0001' }))
  const chamadas: Record<string, () => Promise<void>> = {
    avancar_etapa: () => modulo.dispensarEtapa('a1', 'Nota', null),
    nao_vai_mais_para_publicacao: () => modulo.naoVaiMaisParaPublicacao('p1', 'Motivo'),
    registrar_publicacao: () => modulo.registrarPublicacao('p1', '2026-10-01', null),
    arquivar_processo: () => modulo.arquivar('p1'),
    desarquivar_processo: () => modulo.desarquivar('p1'),
    suspender_processo: () => modulo.suspenderProcesso('p1', 'Motivo'),
  }
  const falha = await falhaDe(chamadas[funcao]())
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(frase)
})

test('a recusa pela permissão (42501) vira "Seu perfil não permite alterar os processos."', async () => {
  const cliente = clienteQueRecusa('arquivar_processo', { message: 'sem permissão para arquivar o processo', code: '42501' })
  expect((await falhaDe(criar(cliente).arquivar('p1'))).message).toBe('Seu perfil não permite alterar os processos.')
})

test('o processo que não existe mais vira o aviso de cadastro inexistente', async () => {
  const cliente = clienteQueRecusa('desarquivar_processo', { message: 'registro_inexistente', code: 'P0001' })
  expect(await falhaDe(criar(cliente).desarquivar('p1'))).toBeInstanceOf(CadastroInexistente)
})
