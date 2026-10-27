import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import { criar, recusa } from '../testes/versoesSupabaseDeTeste'

test('pede à função a ação renumerar com a versão, o número visto e o número novo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.renumerar'] = { data: { numero: 5 }, error: null }
  await criar(cliente).editarNumero('v7', 7, 5)
  expect(cliente.chamadasDaFuncao).toEqual([{ acao: 'renumerar', versao_id: 'v7', numero_esperado: 7, numero_novo: 5 }])
})

test.each([
  ['numero_ja_usado', 'V5F', 'Este processo já tem a V5F.'],
  ['numero_da_versao_alterado', '7', 'O número desta versão mudou enquanto você editava. Feche e abra de novo.'],
  ['numero_invalido', '0', 'O número da versão precisa ser um inteiro maior que zero; recebido: 0.'],
  ['renomeacao_no_drive_falhou', 'V7', 'Os arquivos não puderam ser renomeados no Drive; a versão continua V7.'],
  ['renomeacao_incompleta', '', 'Alguns arquivos ficaram com o nome novo no Drive. Repita a edição para corrigir os nomes.'],
  ['processo_fora_de_andamento', '', 'O processo não está em andamento; não é possível enviar versão.'],
  ['sem_permissao', '', 'Seu perfil não permite enviar versões.'],
])('a recusa %s vira a frase pronta', async (codigo, valor, frase) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.renumerar'] = recusa(codigo, valor)
  const erro = await criar(cliente).editarNumero('v7', 7, 5).catch((falha: unknown) => falha)
  expect(erro).toBeInstanceOf(TravaDoBanco)
  expect((erro as Error).message).toBe(frase)
})

test('sem resposta da função (sem conexão), a falha diz o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.renumerar'] = { data: null, error: { message: 'Failed to fetch' } }
  await expect(criar(cliente).editarNumero('v7', 7, 5)).rejects.toThrow('não foi possível falar com o servidor')
})
