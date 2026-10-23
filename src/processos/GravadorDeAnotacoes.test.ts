import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { GravadorDeAnotacoes } from './GravadorDeAnotacoes'
import type { AnotacoesLidas, ResultadoDaGravacaoDasAnotacoes } from './tipos'

const SEM_ANOTACOES: AnotacoesLidas = { texto: null, alteradoPor: null, alteradoEm: null }
const gravado = (texto: string | null): ResultadoDaGravacaoDasAnotacoes =>
  ({ tipo: 'gravado', anotacoes: { texto, alteradoPor: 'Ana Teste', alteradoEm: '2026-10-13T17:30:00Z' } })

/** A saída do gravador nos testes: guarda cada gravação e responde com o que o teste programou, na ordem. */
class SaidaFalsa {
  gravacoes: { esperado: string | null; novo: string | null }[] = []
  respostas: (ResultadoDaGravacaoDasAnotacoes | Error)[] = []
  espera: Promise<void> | null = null
  lido: AnotacoesLidas | null = SEM_ANOTACOES
  falharALeitura = false
  sumiu = false

  async gravar(esperado: string | null, novo: string | null): Promise<ResultadoDaGravacaoDasAnotacoes> {
    this.gravacoes.push({ esperado, novo })
    if (this.espera) await this.espera
    const resposta = this.respostas.shift() ?? gravado(novo)
    if (resposta instanceof Error) throw resposta
    return resposta
  }

  async ler(): Promise<AnotacoesLidas | null> {
    if (this.falharALeitura) throw new Error('falha de conexão simulada')
    return this.lido
  }

  aoSumir(): void {
    this.sumiu = true
  }
}

let saida: SaidaFalsa
const criar = (inicial: AnotacoesLidas = SEM_ANOTACOES) => new GravadorDeAnotacoes(inicial, saida)
const passar = (ms: number) => vi.advanceTimersByTimeAsync(ms)

beforeEach(() => {
  vi.useFakeTimers()
  saida = new SaidaFalsa()
})
afterEach(() => {
  vi.useRealTimers()
})

test('grava 1 segundo depois da última tecla, uma vez', async () => {
  const gravador = criar()
  gravador.digitar('Oi')
  await passar(999)
  expect(saida.gravacoes).toHaveLength(0)
  await passar(1)
  expect(saida.gravacoes).toEqual([{ esperado: null, novo: 'Oi' }])
  expect(gravador.estado).toBe('salvo')
})

test('cada tecla reinicia a pausa', async () => {
  const gravador = criar()
  gravador.digitar('O')
  await passar(600)
  gravador.digitar('Oi')
  await passar(600)
  expect(saida.gravacoes).toHaveLength(0)
  await passar(400)
  expect(saida.gravacoes).toEqual([{ esperado: null, novo: 'Oi' }])
})

test('sair do campo grava na hora, sem esperar a pausa', async () => {
  const gravador = criar()
  gravador.digitar('Oi')
  await gravador.sairDoCampo()
  expect(saida.gravacoes).toEqual([{ esperado: null, novo: 'Oi' }])
  await passar(2000)
  expect(saida.gravacoes).toHaveLength(1)
})

test('texto igual ao gravado e só espaços sem anotação não gravam', async () => {
  const gravador = criar({ texto: 'A', alteradoPor: null, alteradoEm: null })
  gravador.digitar('A')
  await gravador.sairDoCampo()
  const vazio = criar()
  vazio.digitar('  \n ')
  await vazio.sairDoCampo()
  expect(saida.gravacoes).toHaveLength(0)
})

test('apagar tudo grava nulo, com o texto que a pessoa tinha', async () => {
  const gravador = criar({ texto: 'A', alteradoPor: null, alteradoEm: null })
  gravador.digitar('')
  await gravador.sairDoCampo()
  expect(saida.gravacoes).toEqual([{ esperado: 'A', novo: null }])
})

test('uma gravação por vez: o que se digita durante uma vai na seguinte, com o texto que a anterior gravou', async () => {
  let liberar!: () => void
  saida.espera = new Promise<void>((resolve) => { liberar = resolve })
  const gravador = criar()
  gravador.digitar('A')
  await passar(1000)
  gravador.digitar('AB')
  await passar(1000)
  expect(saida.gravacoes).toHaveLength(1)
  saida.espera = null
  liberar()
  await passar(0)
  expect(saida.gravacoes).toEqual([{ esperado: null, novo: 'A' }, { esperado: 'A', novo: 'AB' }])
  expect(gravador.estado).toBe('salvo')
})

test('a falha mostra o estado e a próxima pausa tenta de novo', async () => {
  saida.respostas = [new Error('falha de conexão simulada')]
  const gravador = criar()
  gravador.digitar('A')
  await passar(1000)
  expect(gravador.estado).toBe('falha')
  expect(gravador.digitado).toBe('A')
  gravador.digitar('AB')
  await passar(1000)
  expect(gravador.estado).toBe('salvo')
  expect(saida.gravacoes).toEqual([{ esperado: null, novo: 'A' }, { esperado: null, novo: 'AB' }])
})

test('o conflito para as gravações até "Ver o texto atual", que troca o texto e o autor', async () => {
  saida.respostas = [{ tipo: 'conflito' }]
  const gravador = criar()
  gravador.digitar('Meu')
  await passar(1000)
  expect(gravador.estado).toBe('conflito')
  gravador.digitar('Meu texto')
  await passar(5000)
  await gravador.sairDoCampo()
  expect(saida.gravacoes).toHaveLength(1)
  expect(gravador.digitado).toBe('Meu texto')
  saida.lido = { texto: 'Do colega', alteradoPor: 'Bia Teste', alteradoEm: '2026-10-13T18:05:00Z' }
  await gravador.verTextoAtual()
  expect(gravador.estado).toBe('ocioso')
  expect(gravador.digitado).toBe('Do colega')
  expect(gravador.lidas.alteradoPor).toBe('Bia Teste')
  gravador.digitar('Do colega e eu')
  await passar(1000)
  expect(saida.gravacoes.at(-1)).toEqual({ esperado: 'Do colega', novo: 'Do colega e eu' })
})

test('se a leitura de "Ver o texto atual" falha, continua em conflito com o texto da pessoa', async () => {
  saida.respostas = [{ tipo: 'conflito' }]
  const gravador = criar()
  gravador.digitar('Meu')
  await passar(1000)
  saida.falharALeitura = true
  await gravador.verTextoAtual()
  expect(gravador.estado).toBe('conflito')
  expect(gravador.digitado).toBe('Meu')
})

test('processo excluído por outra pessoa avisa em vez de falhar', async () => {
  saida.respostas = [new CadastroInexistente()]
  const gravador = criar()
  gravador.digitar('A')
  await passar(1000)
  expect(saida.sumiu).toBe(true)
})

test('digitar depois de "Salvo" some com o "Salvo"', async () => {
  const gravador = criar()
  gravador.digitar('A')
  await passar(1000)
  expect(gravador.estado).toBe('salvo')
  gravador.digitar('AB')
  expect(gravador.estado).toBe('ocioso')
})

test('pendente e gravarAgora: grava na hora e diz se nada ficou para trás', async () => {
  const gravador = criar()
  expect(gravador.pendente()).toBe(false)
  gravador.digitar('A')
  expect(gravador.pendente()).toBe(true)
  expect(await gravador.gravarAgora()).toBe(true)
  expect(gravador.pendente()).toBe(false)
  expect(saida.gravacoes).toHaveLength(1)
})

test('gravarAgora diz que não gravou quando falha ou há conflito', async () => {
  saida.respostas = [new Error('falha de conexão simulada'), { tipo: 'conflito' }]
  const comFalha = criar()
  comFalha.digitar('A')
  expect(await comFalha.gravarAgora()).toBe(false)
  const comConflito = criar()
  comConflito.digitar('B')
  expect(await comConflito.gravarAgora()).toBe(false)
  expect(comConflito.pendente()).toBe(true)
})

test('os ouvintes são avisados a cada mudança e deixam de ser depois de ouvir()()', () => {
  const gravador = criar()
  const avisos: number[] = []
  const parar = gravador.ouvir(() => avisos.push(1))
  gravador.digitar('A')
  expect(avisos.length).toBeGreaterThan(0)
  parar()
  const antes = avisos.length
  gravador.digitar('AB')
  expect(avisos).toHaveLength(antes)
})

test('encerrar cancela a pausa que estava correndo', async () => {
  const gravador = criar()
  gravador.digitar('A')
  gravador.encerrar()
  await passar(2000)
  expect(saida.gravacoes).toHaveLength(0)
})
