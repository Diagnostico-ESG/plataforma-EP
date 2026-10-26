import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CATALOGO_DE_TESTE, umProcessoLido } from '../testes/processoDaLista'
import { ProcessosFalso } from './ProcessosFalso'
import type { ArquivosDoProcesso, ProcessoLido } from './tipos'

const NADA: ArquivosDoProcesso = { versaoPiloto: false, versaoEmSequencia: false, relatorioNumerado: false }
const idDa = (codigo: string) => CATALOGO_DE_TESTE.find((etapa) => etapa.codigo === codigo)?.id as string

function falso(processo: ProcessoLido): ProcessosFalso {
  const modulo = new ProcessosFalso()
  modulo.etapasDoCatalogo = CATALOGO_DE_TESTE
  modulo.processos = [processo]
  return modulo
}

async function recusa(modulo: ProcessosFalso, codigo: string): Promise<Error> {
  return (await modulo.moverProcesso('p1', idDa(codigo)).then(() => null, (erro: unknown) => erro)) as Error
}

describe('mover com a trava de arquivos, como o banco', () => {
  test('recusa sair da Modelagem piloto sem versão piloto, com a frase do banco', async () => {
    const modulo = falso(umProcessoLido('P', { id: 'p1', arquivos: NADA }, 'modelagem'))
    const erro = await recusa(modulo, 'relatorio_modelagem_tecnica')
    expect(erro).toBeInstanceOf(TravaDoBanco)
    expect(erro.message).toBe('Para sair da Modelagem piloto, envie a versão piloto (.bpm).')
    expect(modulo.chamadas).toEqual([])
  })

  test('recusa sair da técnica dizendo só o que falta', async () => {
    const modulo = falso(umProcessoLido('P', { id: 'p1', arquivos: { ...NADA, versaoEmSequencia: true } }, 'relatorio_modelagem_tecnica'))
    expect((await recusa(modulo, 'revisao_interna')).message).toBe('Para sair da Relatório e modelagem técnica, envie o relatório.')
  })

  test('move quando tem o que a etapa pede, e voltar nunca trava', async () => {
    const modulo = falso(umProcessoLido('P', { id: 'p1', arquivos: { ...NADA, versaoPiloto: true } }, 'modelagem'))
    await modulo.moverProcesso('p1', idDa('relatorio_modelagem_tecnica'))
    await modulo.moverProcesso('p1', idDa('modelagem'))
    expect(modulo.chamadas).toHaveLength(2)
  })

  test('sem o que o processo tem, não trava (processo montado à mão)', async () => {
    const modulo = falso(umProcessoLido('P', { id: 'p1' }, 'modelagem'))
    await modulo.moverProcesso('p1', idDa('revisao_interna'))
    expect(modulo.chamadas).toHaveLength(1)
  })
})
