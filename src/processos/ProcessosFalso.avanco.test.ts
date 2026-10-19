import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ProcessosFalso } from './ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido } from './tipos'

function doProcesso(ordem: number, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo: `c${ordem}`, nome: `Etapa ${ordem}`, ordem, obrigatoria: true, status: 'pendente',
    nota: null, iniciadaEm: null, resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false,
    ...mudancas,
  }
}

const EM_ANDAMENTO = { status: 'em_andamento', iniciadaEm: '2026-10-10' } as const

function falso(etapas: EtapaDoProcesso[], situacao: ProcessoLido['situacao'] = 'em_andamento'): ProcessosFalso {
  const processo: ProcessoLido = {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 'set1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', situacao, etapaAtual: { codigo: 'c4', nome: 'Etapa 4', ordem: 4 },
    responsavel: null, origem: 'novo', contexto: null, observacoes: null,
    processoPaiId: null, processoPai: null, subprocessos: [], motivoDaSituacao: null,
    dataDaReuniao: null, ultimaVersao: null, etapasDoProcesso: etapas,
  }
  const modulo = new ProcessosFalso()
  modulo.processos = [processo]
  modulo.usuariosPossiveis = [{ id: 'u1', nome: 'Ana Teste' }, { id: 'u2', nome: 'Bia Teste' }]
  return modulo
}

const lido = async (modulo: ProcessosFalso) => (await modulo.lerProcesso('p1')) as ProcessoLido
const etapaDe = (processo: ProcessoLido, id: string) => processo.etapasDoProcesso.find((etapa) => etapa.id === id) as EtapaDoProcesso
const statusDe = async (modulo: ProcessosFalso) => (await lido(modulo)).etapasDoProcesso.map((etapa) => etapa.status)
async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

describe('concluir leva o responsável à próxima etapa', () => {
  test('a atual fica concluída e a seguinte entra em andamento com o responsável', async () => {
    const modulo = falso([doProcesso(4, EM_ANDAMENTO), doProcesso(5)])
    await modulo.concluirEtapa('a4', 'u1')
    const processo = await lido(modulo)
    expect(etapaDe(processo, 'a4')).toMatchObject({ status: 'concluida', resolvidaEm: '2026-10-13' })
    expect(etapaDe(processo, 'a5')).toMatchObject({
      status: 'em_andamento', iniciadaEm: '2026-10-13', responsavelId: 'u1', responsavelNome: 'Ana Teste',
    })
    expect(processo.etapaAtual?.codigo).toBe('c5')
    expect(processo.responsavel).toEqual({ id: 'u1', nome: 'Ana Teste', fotoUrl: null })
    expect(modulo.chamadas).toEqual([{ acao: 'concluir', id: 'a4', usuarioId: 'u1' }])
  })

  test('sem responsável, a seguinte entra em andamento sem ninguém, mesmo que tivesse alguém', async () => {
    const modulo = falso([doProcesso(4, EM_ANDAMENTO), doProcesso(5, { responsavelId: 'u2', responsavelNome: 'Bia Teste' })])
    await modulo.concluirEtapa('a4', null)
    expect(etapaDe(await lido(modulo), 'a5')).toMatchObject({ status: 'em_andamento', responsavelId: null, responsavelNome: null })
  })

  test('pula a etapa já resolvida e inicia a primeira pendente depois dela', async () => {
    const modulo = falso([doProcesso(4, EM_ANDAMENTO), doProcesso(5, { status: 'concluida' }), doProcesso(6)])
    await modulo.concluirEtapa('a4', 'u2')
    const processo = await lido(modulo)
    expect(etapaDe(processo, 'a5').status).toBe('concluida')
    expect(etapaDe(processo, 'a6')).toMatchObject({ status: 'em_andamento', responsavelId: 'u2' })
  })

  test('sem pendente depois, nada é iniciado e o processo fica concluído', async () => {
    const modulo = falso([doProcesso(4, { status: 'concluida' }), doProcesso(5, EM_ANDAMENTO)])
    await modulo.concluirEtapa('a5', null)
    expect(await statusDe(modulo)).toEqual(['concluida', 'concluida'])
    expect((await lido(modulo)).situacao).toBe('concluido')
  })
})

describe('dispensar e registrar como realizada anteriormente avançam igual', () => {
  test('dispensar guarda a nota e inicia a próxima', async () => {
    const modulo = falso([doProcesso(4, { status: 'concluida' }), doProcesso(5, { obrigatoria: false }), doProcesso(6)])
    await modulo.dispensarEtapa('a5', 'Não se aplica', 'u1')
    const processo = await lido(modulo)
    expect(etapaDe(processo, 'a5')).toMatchObject({ status: 'dispensada', nota: 'Não se aplica' })
    expect(etapaDe(processo, 'a6')).toMatchObject({ status: 'em_andamento', responsavelId: 'u1' })
    expect(modulo.chamadas).toEqual([{ acao: 'dispensar', id: 'a5', nota: 'Não se aplica', usuarioId: 'u1' }])
  })

  test('realizada anteriormente guarda a nota e inicia a próxima', async () => {
    const modulo = falso([doProcesso(4, EM_ANDAMENTO), doProcesso(5)])
    await modulo.registrarRealizadaAnteriormente('a4', 'Feita em 2025', 'u2')
    const processo = await lido(modulo)
    expect(etapaDe(processo, 'a4')).toMatchObject({ status: 'realizada_anteriormente', nota: 'Feita em 2025' })
    expect(etapaDe(processo, 'a5')).toMatchObject({ status: 'em_andamento', responsavelId: 'u2' })
  })
})

describe('recusas, sem mudar nenhuma etapa', () => {
  const FRASE_DO_RESPONSAVEL = 'u9 não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.'

  test.each([
    ['dispensar etapa obrigatória', (m: ProcessosFalso) => m.dispensarEtapa('a4', 'Nota', null),
      'A etapa Etapa 4 é obrigatória e não pode ser dispensada.'],
    ['nota vazia', (m: ProcessosFalso) => m.registrarRealizadaAnteriormente('a4', '  ', null), 'A nota é obrigatória.'],
    ['responsável fora da lista', (m: ProcessosFalso) => m.concluirEtapa('a4', 'u9'), FRASE_DO_RESPONSAVEL],
  ])('%s', async (_nome, tentar, frase) => {
    const modulo = falso([doProcesso(4, EM_ANDAMENTO), doProcesso(5)])
    const falha = await falhaDe(tentar(modulo))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe(frase)
    expect(await statusDe(modulo)).toEqual(['em_andamento', 'pendente'])
    expect(modulo.chamadas).toEqual([])
  })

  test('com o processo suspenso, o avanço não grava', async () => {
    const modulo = falso([doProcesso(4, EM_ANDAMENTO), doProcesso(5)], 'suspenso')
    expect((await falhaDe(modulo.concluirEtapa('a4', 'u1'))).message)
      .toBe('Este processo está suspenso; retome-o para registrar o andamento.')
    expect(modulo.chamadas).toEqual([])
  })

  test('a falha de gravação simulada desfaz tudo', async () => {
    const modulo = falso([doProcesso(4, EM_ANDAMENTO), doProcesso(5)])
    modulo.falhaDeGravacao = 'Sem conexão'
    expect((await falhaDe(modulo.concluirEtapa('a4', 'u1'))).message).toBe('Sem conexão')
    expect(await statusDe(modulo)).toEqual(['em_andamento', 'pendente'])
  })
})

describe('trava do autor da versão mais recente', () => {
  const REVISAO = { codigo: 'revisao_interna' }

  function comAutor(): ProcessosFalso {
    const modulo = falso([doProcesso(4, EM_ANDAMENTO), doProcesso(5, REVISAO)])
    modulo.processos[0] = { ...modulo.processos[0], ultimaVersao: { numero: 3, autorId: 'u1', autorNome: 'Ana Teste' } }
    return modulo
  }

  test('o avanço não põe o autor como responsável da Revisão interna e nada muda', async () => {
    const modulo = comAutor()
    const falha = await falhaDe(modulo.concluirEtapa('a4', 'u1'))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('Ana Teste enviou a versão V3 e não pode ser responsável pela Revisão interna.')
    expect(await statusDe(modulo)).toEqual(['em_andamento', 'pendente'])
    expect(modulo.chamadas).toEqual([])
  })

  test('outro usuário, ninguém, ou outra etapa seguinte passam', async () => {
    const outro = comAutor()
    await outro.concluirEtapa('a4', 'u2')
    expect(etapaDe(await lido(outro), 'a5')).toMatchObject({ status: 'em_andamento', responsavelId: 'u2' })
    const ninguem = comAutor()
    await ninguem.concluirEtapa('a4', null)
    expect(etapaDe(await lido(ninguem), 'a5').responsavelId).toBeNull()
  })
})
