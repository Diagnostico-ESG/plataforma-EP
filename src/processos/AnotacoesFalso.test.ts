import { expect, test } from 'vitest'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ProcessosFalso } from './ProcessosFalso'
import { umProcessoLido } from '../testes/processoDaLista'
import type { ProcessoLido } from './tipos'

const processo = (mudancas: Partial<ProcessoLido> = {}) => umProcessoLido('Emitir Ofício', { id: 'p1', ...mudancas }, 'modelagem')

function criar(...processos: ProcessoLido[]): ProcessosFalso {
  const falso = new ProcessosFalso()
  falso.processos = processos
  return falso
}

test('lê o vazio de processo sem anotação e null de processo inexistente', async () => {
  const falso = criar(processo())
  expect(await falso.lerAnotacoes('p1')).toEqual({ texto: null, alteradoPor: null, alteradoEm: null })
  expect(await falso.lerAnotacoes('p9')).toBeNull()
})

test('grava com o texto esperado, com autor e hora fixos, e guarda a chamada', async () => {
  const falso = criar(processo())
  const resultado = await falso.gravarAnotacoes('p1', null, 'Texto')
  expect(resultado).toMatchObject({ tipo: 'gravado', anotacoes: { texto: 'Texto', alteradoEm: '2026-10-13T17:30:00Z' } })
  expect((await falso.lerAnotacoes('p1'))?.texto).toBe('Texto')
  expect(falso.anotacoes.gravacoes).toEqual([{ id: 'p1', esperado: null, novo: 'Texto' }])
})

test('com o texto esperado errado devolve conflito e não muda nada', async () => {
  const falso = criar(processo())
  await falso.gravarAnotacoes('p1', null, 'Primeiro')
  expect(await falso.gravarAnotacoes('p1', null, 'Segundo')).toEqual({ tipo: 'conflito' })
  expect((await falso.lerAnotacoes('p1'))?.texto).toBe('Primeiro')
})

test('gravar o mesmo texto não muda autor nem hora', async () => {
  const falso = criar(processo())
  await falso.gravarAnotacoes('p1', null, 'Texto')
  falso.anotacoes.autor = 'Outra Pessoa'
  const resultado = await falso.gravarAnotacoes('p1', 'Texto', 'Texto')
  expect(resultado).toMatchObject({ tipo: 'gravado', anotacoes: { alteradoPor: expect.not.stringMatching('Outra Pessoa') } })
})

test('processo inexistente é cadastro inexistente; o concluído fora do Quadro grava como qualquer concluído', async () => {
  const falso = criar(processo({ situacao: 'concluido', noQuadro: false }))
  expect((await falso.gravarAnotacoes('p1', null, 'a')).tipo).toBe('gravado')
  await expect(falso.gravarAnotacoes('p9', null, 'a')).rejects.toBeInstanceOf(CadastroInexistente)
})

test('a falha programada vale uma gravação por vez', async () => {
  const falso = criar(processo())
  falso.anotacoes.falhasProgramadas = 1
  await expect(falso.gravarAnotacoes('p1', null, 'a')).rejects.toThrow('falha de conexão simulada')
  expect((await falso.gravarAnotacoes('p1', null, 'a')).tipo).toBe('gravado')
})

test('segurar adia a resposta até liberar', async () => {
  const falso = criar(processo())
  falso.anotacoes.segurar = true
  let respondeu = false
  const pendente = falso.gravarAnotacoes('p1', null, 'a').then(() => { respondeu = true })
  await Promise.resolve()
  expect(respondeu).toBe(false)
  falso.anotacoes.liberar()
  await pendente
  expect(respondeu).toBe(true)
})

test('"outra pessoa altera agora" troca o texto e o autor por fora da gravação', async () => {
  const falso = criar(processo())
  falso.anotacoes.alterarComoOutraPessoa('p1', 'Do colega', 'Bia Teste')
  expect(await falso.lerAnotacoes('p1')).toMatchObject({ texto: 'Do colega', alteradoPor: 'Bia Teste' })
})

test('processo e subprocesso guardam textos separados', async () => {
  const filho = processo({ id: 'p2', tipo: 'subprocesso', processoPaiId: 'p1' })
  const falso = criar(processo(), filho)
  await falso.gravarAnotacoes('p1', null, 'Do pai')
  expect((await falso.lerAnotacoes('p2'))?.texto).toBeNull()
})
