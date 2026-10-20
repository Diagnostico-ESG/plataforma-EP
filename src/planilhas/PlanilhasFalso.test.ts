import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { PlanilhasFalso } from './PlanilhasFalso'

describe('PlanilhasFalso', () => {
  test('pedir inclui no início a tentativa em andamento, pelo botão, com o nome do administrador', async () => {
    const planilhas = new PlanilhasFalso('Ana Teste')
    await planilhas.pedirAtualizacao()
    const [tentativa] = await planilhas.listarAtualizacoes()
    expect(tentativa).toMatchObject({ origem: 'botao', pedidaPor: 'Ana Teste', resultado: 'em_andamento', motivo: null })
    expect(planilhas.pedidos).toBe(1)
  })

  test('com uma tentativa em andamento, o segundo pedido é recusado com a frase do banco', async () => {
    const planilhas = new PlanilhasFalso()
    await planilhas.pedirAtualizacao()
    await expect(planilhas.pedirAtualizacao()).rejects.toThrow(new TravaDoBanco('Já há uma atualização em andamento.'))
    expect(await planilhas.listarAtualizacoes()).toHaveLength(1)
  })

  test('sem links configurados, o pedido é recusado', async () => {
    const planilhas = new PlanilhasFalso()
    planilhas.links = null
    await expect(planilhas.pedirAtualizacao())
      .rejects.toThrow(new TravaDoBanco('As planilhas ainda não foram configuradas neste ambiente.'))
  })

  test('guarda só as 10 tentativas mais recentes', async () => {
    const planilhas = new PlanilhasFalso()
    for (let vez = 0; vez < 11; vez++) {
      await planilhas.pedirAtualizacao()
      planilhas.terminar((await planilhas.listarAtualizacoes())[0].id, 'concluida')
    }
    const lista = await planilhas.listarAtualizacoes()
    expect(lista).toHaveLength(10)
    expect(lista.map((t) => t.id)).not.toContain('t1')
  })

  test('terminar troca o resultado e o motivo da tentativa', async () => {
    const planilhas = new PlanilhasFalso()
    await planilhas.pedirAtualizacao()
    const [tentativa] = await planilhas.listarAtualizacoes()
    planilhas.terminar(tentativa.id, 'falhou', 'google_indisponivel')
    expect((await planilhas.listarAtualizacoes())[0]).toMatchObject({ resultado: 'falhou', motivo: 'google_indisponivel' })
  })

  test('a lista devolvida é uma cópia: mudar a cópia não muda o falso', async () => {
    const planilhas = new PlanilhasFalso()
    await planilhas.pedirAtualizacao()
    ;(await planilhas.listarAtualizacoes())[0].resultado = 'falhou'
    expect((await planilhas.listarAtualizacoes())[0].resultado).toBe('em_andamento')
  })

  test('as falhas programadas ao ler e ao pedir chegam como erro', async () => {
    const planilhas = new PlanilhasFalso()
    planilhas.falharAoLer = true
    await expect(planilhas.listarAtualizacoes()).rejects.toThrow('falha de teste ao ler as atualizações')
    await expect(planilhas.lerLinks()).rejects.toThrow('falha de teste ao ler os links')
    planilhas.falharAoPedir = new Error('falha de teste ao pedir')
    await expect(planilhas.pedirAtualizacao()).rejects.toThrow('falha de teste ao pedir')
  })

  test('segurar a leitura deixa a lista sem responder', async () => {
    const planilhas = new PlanilhasFalso()
    planilhas.segurarLeitura = true
    const resposta = await Promise.race([planilhas.listarAtualizacoes(), Promise.resolve('sem resposta')])
    expect(resposta).toBe('sem resposta')
  })
})
