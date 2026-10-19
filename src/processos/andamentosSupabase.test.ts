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

function clienteQueRecusa(tabela: string, erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[tabela] = { data: null, error: erro }
  return cliente
}

async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

test('voltar chama a função do banco com o andamento, o motivo e o responsável (null: ninguém)', async () => {
  const cliente = new ClienteSupabaseFalso()
  const modulo = criar(cliente)
  await modulo.voltarParaEtapa('a4', 'Mudou o escopo', 'u1')
  await modulo.voltarParaEtapa('a4', 'Mudou o escopo', null)
  expect(cliente.pedidos).toEqual([
    { tabela: 'rpc', operacao: 'voltar_a_etapa', valores: { p_andamento: 'a4', p_motivo: 'Mudou o escopo', p_responsavel: 'u1' } },
    { tabela: 'rpc', operacao: 'voltar_a_etapa', valores: { p_andamento: 'a4', p_motivo: 'Mudou o escopo', p_responsavel: null } },
  ])
})

test('corrigir as datas grava início e conclusão no andamento escolhido', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [{ id: 'a4' }], error: null }
  await criar(cliente).corrigirDatasDaEtapa('a4', { iniciadaEm: '2026-10-10', resolvidaEm: null })
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'andamentos', operacao: 'update', valores: { iniciada_em: '2026-10-10', resolvida_em: null }, filtro: ['id', 'a4'],
  })
})

test('mudar o responsável grava o usuário, e null o tira', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [{ id: 'a4' }], error: null }
  const modulo = criar(cliente)
  await modulo.mudarResponsavelDaEtapa('a4', 'u1')
  await modulo.mudarResponsavelDaEtapa('a4', null)
  expect(cliente.pedidos.map((pedido) => pedido.valores)).toEqual([{ responsavel_id: 'u1' }, { responsavel_id: null }])
})

test('a data no futuro vira a frase com a data em DD/MM/AAAA', async () => {
  const cliente = clienteQueRecusa('andamentos.update', { message: 'data_no_futuro:2026-10-20', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).corrigirDatasDaEtapa('a4', { iniciadaEm: '2026-10-20', resolvidaEm: null }))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe('A data 20/10/2026 está no futuro.')
})

test('a conclusão antes do início vira a frase com as duas datas', async () => {
  const cliente = clienteQueRecusa('andamentos.update', { message: 'resolvida_antes_do_inicio:2026-10-01:2026-10-05', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).corrigirDatasDaEtapa('a4', { iniciadaEm: '2026-10-05', resolvidaEm: '2026-10-01' }))
  expect(falha.message).toBe('A conclusão (01/10/2026) não pode ser antes do início (05/10/2026).')
})

test('responsável inválido vira a frase com o nome do usuário', async () => {
  const cliente = clienteQueRecusa('andamentos.update', { message: 'responsavel_invalido:Maria Teste', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).mudarResponsavelDaEtapa('a4', 'u3'))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(
    'Maria Teste não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.')
})

test('voltar sem motivo e voltar a etapa não resolvida viram frases', async () => {
  const semMotivo = clienteQueRecusa('rpc.voltar_a_etapa', { message: 'motivo_obrigatorio', code: 'P0001' })
  expect((await falhaDe(criar(semMotivo).voltarParaEtapa('a4', ' ', null))).message).toBe('O motivo é obrigatório.')
  const pendente = clienteQueRecusa('rpc.voltar_a_etapa',
    { message: 'etapa_nao_resolvida:Reunião de modelagem', code: 'P0001' })
  expect((await falhaDe(criar(pendente).voltarParaEtapa('a4', 'Motivo', null))).message)
    .toBe('A etapa Reunião de modelagem ainda não foi resolvida.')
})

test('voltar recusado pela permissão (42501) vira "Seu perfil não permite alterar os processos."', async () => {
  const cliente = clienteQueRecusa('rpc.voltar_a_etapa', { message: 'sem permissão para voltar a etapa', code: '42501' })
  const falha = await falhaDe(criar(cliente).voltarParaEtapa('a4', 'Motivo', null))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe('Seu perfil não permite alterar os processos.')
})

test('voltar a uma etapa que já não existe avisa como cadastro inexistente', async () => {
  const cliente = clienteQueRecusa('rpc.voltar_a_etapa', { message: 'registro_inexistente', code: 'P0001' })
  expect(await falhaDe(criar(cliente).voltarParaEtapa('a4', 'Motivo', null))).toBeInstanceOf(CadastroInexistente)
})

test('corrigir datas sem linha afetada: perfil se a etapa ainda é legível, aviso se sumiu', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [], error: null }
  expect(await falhaDe(criar(cliente).corrigirDatasDaEtapa('a4', { iniciadaEm: null, resolvidaEm: null })))
    .toBeInstanceOf(CadastroInexistente)
  cliente.respostas['andamentos.select'] = { data: [{ id: 'a4' }], error: null }
  const falha = await falhaDe(criar(cliente).corrigirDatasDaEtapa('a4', { iniciadaEm: null, resolvidaEm: null }))
  expect(falha.message).toBe('Seu perfil não permite alterar os processos.')
})

test('lista só usuários ativos de perfil Administrador ou Integrante, por nome', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['usuarios.select'] = { data: [{ id: 'u1', nome: 'Ana Teste' }, { id: 'u2', nome: 'Bia Teste' }], error: null }
  expect(await criar(cliente).listarResponsaveisPossiveis()).toEqual([
    { id: 'u1', nome: 'Ana Teste' }, { id: 'u2', nome: 'Bia Teste' }])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'usuarios', filtro: ['ativo', true], dentro: ['perfil', ['administrador', 'integrante_ep']], ordem: [['nome', true]],
  })
})

test('falha ao listar os responsáveis possíveis vira erro com o motivo do banco', async () => {
  const cliente = clienteQueRecusa('usuarios.select', { message: 'sem conexão' })
  await expect(criar(cliente).listarResponsaveisPossiveis()).rejects
    .toThrow('Falha ao ler os usuários que podem ser responsáveis: sem conexão')
})

const FRASE_DO_AUTOR = 'Ana Teste enviou a versão V3 e não pode ser responsável pela Revisão interna.'

test.each([
  ['o seletor', 'andamentos.update', (modulo: ReturnType<typeof criar>) => modulo.mudarResponsavelDaEtapa('a4', 'u1')],
  ['o avanço', 'rpc.avancar_etapa', (modulo: ReturnType<typeof criar>) => modulo.concluirEtapa('a4', 'u1')],
  ['o voltar', 'rpc.voltar_a_etapa', (modulo: ReturnType<typeof criar>) => modulo.voltarParaEtapa('a4', 'Motivo', 'u1')],
])('o autor da versão mais recente recusado pelo banco vira a frase da trava (%s)', async (_via, resposta, agir) => {
  const cliente = clienteQueRecusa(resposta, { message: 'autor_da_versao:3:Ana Teste', code: 'P0001' })
  const falha = await falhaDe(agir(criar(cliente)))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(FRASE_DO_AUTOR)
})

test.each([
  ['sem versão', 'sem_versao', 'O processo ainda não tem versão enviada.'],
  ['sem relatório', 'versao_incompleta:8:relatorio', 'A V8 está sem relatório.'],
  ['sem .png e relatório', 'versao_incompleta:8:png,relatorio', 'A V8 está sem .png e relatório.'],
])('concluir a Revisão pelo setor com a versão incompleta vira a frase do que falta (%s)', async (_caso, mensagem, frase) => {
  const cliente = clienteQueRecusa('rpc.avancar_etapa', { message: mensagem, code: 'P0001' })
  const falha = await falhaDe(criar(cliente).concluirEtapa('a4', 'u1'))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(frase)
})

test.each([
  ['revisor_e_autor:7', 'Quem enviou a versão V7 não pode revisá-la.'],
  ['corrigida_sem_versao_do_revisor', 'Para marcar como corrigida, a versão mais recente precisa ser sua: envie a versão corrigida em Arquivos.'],
  ['corrigida_sem_versao_anterior', 'Não há versão anterior para corrigir.'],
  ['escopo_obrigatorio', 'Escolha o escopo da correção.'],
  ['escopo_so_na_corrigida', 'O escopo só vale na revisão corrigida.'],
  ['revisao_fora_da_etapa', 'A revisão só pode ser registrada com a Revisão interna em andamento.'],
  ['sem_revisao_da_versao:8', 'A V8 ainda não tem revisão registrada. Conclua a Revisão interna pela janela de concluir.'],
])('a recusa da Revisão interna (%s) vira a frase da tela', async (mensagem, frase) => {
  const cliente = clienteQueRecusa('rpc.avancar_etapa', { message: mensagem, code: 'P0001' })
  const falha = await falhaDe(criar(cliente).concluirEtapa('a4', 'u1'))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(frase)
})

test('processo com revisão não se exclui: a frase traz a contagem', async () => {
  const cliente = clienteQueRecusa('processos.delete', { message: 'processo_com_revisoes:2', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).excluirProcesso('p1'))
  expect(falha.message).toBe('Não é possível excluir: processo tem 2 revisões registradas. Cancele o processo em vez de excluí-lo.')
})

test('a etapa protegida do catálogo recusada pelo banco vira a frase da etapa obrigatória', async () => {
  const cliente = clienteQueRecusa('andamentos.update', { message: 'etapa_protegida:Revisão interna', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).mudarResponsavelDaEtapa('a4', 'u1'))
  expect(falha.message).toBe('A etapa Revisão interna é obrigatória no fluxo: não pode ser desativada nem excluída.')
})

test('o nome do autor pode ter dois-pontos: o número vem primeiro e o resto é o nome', async () => {
  const cliente = clienteQueRecusa('andamentos.update', { message: 'autor_da_versao:12:Ana: Teste', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).mudarResponsavelDaEtapa('a4', 'u1'))
  expect(falha.message).toBe('Ana: Teste enviou a versão V12 e não pode ser responsável pela Revisão interna.')
})

test.each([
  ['aprovacao_fora_da_etapa', 'A aprovação só pode ser registrada com a Aprovação pelo setor em andamento.'],
  ['processo_ja_aprovado', 'Este processo já tem aprovação registrada.'],
  ['link_invalido', 'O link do E-protocolo precisa começar com http:// ou https://.'],
  ['aprovacao_antes_da_revisao:2026-10-12:2026-10-13',
    'A data da aprovação (12/10/2026) não pode ser antes da última revisão interna (13/10/2026).'],
  ['sem_aprovacao:8', 'A V8 ainda não tem aprovação registrada. Conclua a Aprovação pelo setor pela janela de concluir.'],
  ['aprovacao_so_se_desfaz_na_volta', 'A aprovação só é desfeita ao voltar para a Aprovação pelo setor ou para antes dela.'],
  ['versao_aprovada:8', 'A versão V8 foi aprovada e seus arquivos não podem ser substituídos.'],
])('a recusa %s da aprovação, no avanço, vira a frase da tela', async (codigo, frase) => {
  const cliente = clienteQueRecusa('rpc.avancar_etapa', { message: codigo, code: 'P0001' })
  const falha = await falhaDe(criar(cliente).concluirEtapa('a5', 'u1'))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(frase)
})

test('processo com aprovação não se exclui', async () => {
  const cliente = clienteQueRecusa('processos.delete', { message: 'processo_com_aprovacao', code: 'P0001' })
  const falha = await falhaDe(criar(cliente).excluirProcesso('p1'))
  expect(falha.message).toBe('Não é possível excluir: processo tem aprovação registrada. Cancele o processo em vez de excluí-lo.')
})
