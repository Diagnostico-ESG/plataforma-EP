import { describe, expect, test } from 'vitest'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CATALOGO_DE_TESTE, umProcessoLido } from '../testes/processoDaLista'
import { ProcessosFalso } from './ProcessosFalso'
import type { ProcessoLido } from './tipos'

function falso(etapa: string, mudancas: Partial<ProcessoLido> = {}): ProcessosFalso {
  const modulo = new ProcessosFalso()
  modulo.etapasDoCatalogo = CATALOGO_DE_TESTE
  modulo.processos = [umProcessoLido('Emitir Ofício', { id: 'p1', ...mudancas }, etapa)]
  return modulo
}

const CONCLUIDO: Partial<ProcessoLido> = { situacao: 'concluido', etiqueta: 'concluido', noQuadro: true }
const lido = async (modulo: ProcessosFalso) => (await modulo.lerProcesso('p1')) as ProcessoLido
const falhaDe = async (pedido: Promise<void>) => (await pedido.catch((erro: unknown) => erro)) as Error

describe('tirar do Quadro', () => {
  test('o concluído sai do Quadro e a marca fica no processo', async () => {
    const modulo = falso('concluidos', CONCLUIDO)
    await modulo.tirarDoQuadro('p1')
    expect(await lido(modulo)).toMatchObject({ noQuadro: false, tiradoDoQuadroEm: expect.any(String) })
  })

  test('só o concluído que está no Quadro: o resto é recusado com a frase do banco', async () => {
    const andamento = falso('revisao_interna')
    expect((await falhaDe(andamento.tirarDoQuadro('p1'))).message).toBe('Só se tira do Quadro o processo concluído.')
    const fora = falso('concluidos', { ...CONCLUIDO, noQuadro: false })
    const erro = await falhaDe(fora.tirarDoQuadro('p1'))
    expect(erro).toBeInstanceOf(TravaDoBanco)
    expect(erro.message).toBe('Este processo já está fora do Quadro.')
  })

  test('processo que não existe é cadastro inexistente; a falha programada chega como erro', async () => {
    const modulo = falso('concluidos', CONCLUIDO)
    expect(await falhaDe(modulo.tirarDoQuadro('p9'))).toBeInstanceOf(CadastroInexistente)
    modulo.falhaDeGravacao = 'falha de conexão simulada'
    expect((await falhaDe(modulo.tirarDoQuadro('p1'))).message).toBe('falha de conexão simulada')
    expect((await lido(modulo)).noQuadro).toBe(true)
  })
})

describe('voltar ao Quadro (o Desfazer)', () => {
  test('devolve o concluído ao Quadro e zera a marca', async () => {
    const modulo = falso('concluidos', CONCLUIDO)
    await modulo.tirarDoQuadro('p1')
    await modulo.voltarAoQuadro('p1')
    expect(await lido(modulo)).toMatchObject({ noQuadro: true, tiradoDoQuadroEm: null })
  })

  test('só o concluído; no que já está no Quadro não muda nada', async () => {
    const andamento = falso('revisao_interna')
    expect((await falhaDe(andamento.voltarAoQuadro('p1'))).message).toBe('Só se volta ao Quadro o processo concluído.')
    const modulo = falso('concluidos', CONCLUIDO)
    await modulo.voltarAoQuadro('p1')
    expect((await lido(modulo)).noQuadro).toBe(true)
  })
})

test('sair de Concluídos e voltar devolve o cartão ao Quadro', async () => {
  const modulo = falso('concluidos', { ...CONCLUIDO, noQuadro: false })
  const etapas = CATALOGO_DE_TESTE
  await modulo.moverProcesso('p1', etapas.find((etapa) => etapa.codigo === 'publicacao')!.id)
  await modulo.moverProcesso('p1', etapas.find((etapa) => etapa.codigo === 'concluidos')!.id, { dataDaPublicacao: null, linkDaPublicacao: null, explicacao: 'Não será publicado' })
  expect((await lido(modulo)).noQuadro).toBe(true)
})
