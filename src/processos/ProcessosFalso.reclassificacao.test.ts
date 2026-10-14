import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ProcessosFalso } from './ProcessosFalso'
import type { DadosDoProcesso, EtapaDoProcesso, ProcessoLido, TipoDeProcesso } from './tipos'

const CONCLUIDA: EtapaDoProcesso = {
  id: 'a4', codigo: 'c4', nome: 'Etapa 4', ordem: 4, obrigatoria: true, status: 'concluida', nota: null,
  iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11', responsavelId: null, responsavelNome: null, responsavelInativo: false,
}

type Montagem = { id: string; tipo: TipoDeProcesso; macro?: string; pai?: string | null }

function processo({ id, tipo, macro = 'm1', pai = null }: Montagem): ProcessoLido {
  return {
    id, nome: `Processo ${id}`, tipo, setorId: 's1', setorSigla: 'TSA', macroprocessoId: macro,
    macroprocessoNome: `Macro ${macro}`, processoPaiId: pai, situacao: 'em_andamento', etapaAtual: null,
    aguardandoOSetor: false, responsavel: null, origem: 'novo', contexto: null, observacoes: null,
    motivoDaSituacao: null, processoPai: null, subprocessos: [], etapasDoSetor: [], etapasDoProcesso: [CONCLUIDA],
  }
}

// p1 e p4 são processos (Macro m1 e m2), p2 é subprocesso de p1, p3 está "a classificar" em m2.
function falso(): ProcessosFalso {
  const modulo = new ProcessosFalso()
  modulo.processos = [
    processo({ id: 'p1', tipo: 'processo' }), processo({ id: 'p2', tipo: 'subprocesso', pai: 'p1' }),
    processo({ id: 'p3', tipo: 'a_classificar', macro: 'm2' }), processo({ id: 'p4', tipo: 'processo', macro: 'm2' }),
  ]
  modulo.nomesDosMacroprocessos = { m1: 'Macro m1', m2: 'Macro m2' }
  return modulo
}

const lido = async (modulo: ProcessosFalso, id: string) => (await modulo.lerProcesso(id)) as ProcessoLido
async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

const SUBPROCESSO: DadosDoProcesso = {
  nome: 'Filho Novo', setorId: 's1', macroprocessoId: 'm2', tipo: 'subprocesso', processoPaiId: 'p1', origem: 'novo',
  contexto: null, observacoes: null,
}

describe('estrutura', () => {
  test('o processo lido traz os subprocessos e o subprocesso, o pai', async () => {
    const modulo = falso()
    expect(await lido(modulo, 'p1')).toMatchObject({ processoPai: null, subprocessos: [{ id: 'p2', nome: 'Processo p2' }] })
    expect(await lido(modulo, 'p2')).toMatchObject({ processoPai: { id: 'p1', nome: 'Processo p1' }, subprocessos: [] })
  })

  test('o subprocesso cadastrado adota o macroprocesso do pai', async () => {
    const modulo = falso()
    await modulo.criarProcesso(SUBPROCESSO)
    expect(modulo.processos.at(-1)).toMatchObject({ tipo: 'subprocesso', processoPaiId: 'p1', macroprocessoId: 'm1', macroprocessoNome: 'Macro m1' })
  })

  test('pai que não é Processo é recusado no cadastro', async () => {
    const falha = await falhaDe(falso().criarProcesso({ ...SUBPROCESSO, processoPaiId: 'p3' }))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('O processo pai precisa ser do tipo Processo.')
  })

  test('mudar o macroprocesso do pai leva os filhos junto', async () => {
    const modulo = falso()
    await modulo.editarProcesso('p1', { ...SUBPROCESSO, nome: 'Processo p1', tipo: 'processo', processoPaiId: null, macroprocessoId: 'm2' })
    expect(modulo.processos.find((outro) => outro.id === 'p2')).toMatchObject({ macroprocessoId: 'm2', macroprocessoNome: 'Macro m2' })
  })

  test('excluir processo com subprocessos é recusado com a contagem', async () => {
    const modulo = falso()
    const falha = await falhaDe(modulo.excluirProcesso('p1'))
    expect(falha.message).toBe('Este processo tem 1 subprocessos; reclassifique-os ou exclua-os antes.')
    expect(modulo.processos).toHaveLength(4)
  })
})

describe('reclassificar', () => {
  test('"a classificar" vira subprocesso: o mesmo item, com as etapas, no macroprocesso do pai', async () => {
    const modulo = falso()
    await modulo.reclassificarProcesso('p3', { tipo: 'subprocesso', processoPaiId: 'p1' }, 'Faz parte do p1')
    expect(await lido(modulo, 'p3')).toMatchObject({
      id: 'p3', tipo: 'subprocesso', processoPaiId: 'p1', macroprocessoId: 'm1', etapasDoProcesso: [CONCLUIDA],
    })
  })

  test('subprocesso vira processo: sai o pai, fica o macroprocesso', async () => {
    const modulo = falso()
    await modulo.reclassificarProcesso('p2', { tipo: 'processo', processoPaiId: null }, 'Virou processo')
    expect(await lido(modulo, 'p2')).toMatchObject({ tipo: 'processo', processoPaiId: null, processoPai: null, macroprocessoId: 'm1' })
  })

  test.each([
    ['sem motivo', 'p4', { tipo: 'subprocesso', processoPaiId: 'p1' }, ' ', 'O motivo é obrigatório.'],
    ['com subprocessos', 'p1', { tipo: 'subprocesso', processoPaiId: 'p4' }, 'M',
      'Este processo tem 1 subprocessos; reclassifique-os ou exclua-os antes.'],
    ['com pai "a classificar"', 'p4', { tipo: 'subprocesso', processoPaiId: 'p3' }, 'M', 'O processo pai precisa ser do tipo Processo.'],
    ['de si mesmo', 'p4', { tipo: 'subprocesso', processoPaiId: 'p4' }, 'M', 'O processo pai precisa ser do tipo Processo.'],
    ['processo para processo', 'p4', { tipo: 'processo', processoPaiId: null }, 'M',
      'Um item do tipo Processo não pode ser reclassificado como Processo.'],
  ] as const)('recusa %s', async (_caso, id, reclassificacao, motivo, frase) => {
    const modulo = falso()
    const falha = await falhaDe(modulo.reclassificarProcesso(id, reclassificacao, motivo))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe(frase)
  })
})
