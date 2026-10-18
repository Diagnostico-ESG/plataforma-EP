import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ProcessosFalso } from './ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido, SituacaoDoProcesso } from './tipos'

function doProcesso(ordem: number, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo: `c${ordem}`, nome: `Etapa ${ordem}`, ordem, obrigatoria: true, status: 'pendente',
    nota: null, iniciadaEm: null, resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false,
    ...mudancas,
  }
}

function falso(situacao: SituacaoDoProcesso = 'em_andamento', etapas: EtapaDoProcesso[] = [
  doProcesso(4, { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11' }), doProcesso(5)]): ProcessosFalso {
  const processo: ProcessoLido = {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 'set1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', situacao, etapaAtual: { codigo: 'c5', nome: 'Etapa 5', ordem: 5 },
    responsavel: null, origem: 'novo', contexto: null, observacoes: null,
    processoPaiId: null, processoPai: null, subprocessos: [],
    motivoDaSituacao: situacao === 'suspenso' || situacao === 'cancelado' ? 'Motivo antigo' : null,
    dataDaReuniao: null, etapasDoProcesso: etapas,
  }
  const modulo = new ProcessosFalso()
  modulo.processos = [processo]
  return modulo
}

const lido = async (modulo: ProcessosFalso) => (await modulo.lerProcesso('p1')) as ProcessoLido
async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

describe('suspender, cancelar e retomar', () => {
  test('suspender guarda a situação e o motivo', async () => {
    const modulo = falso()
    await modulo.suspenderProcesso('p1', 'Aguardando decisão')
    expect(await lido(modulo)).toMatchObject({ situacao: 'suspenso', motivoDaSituacao: 'Aguardando decisão' })
  })

  test('cancelar um processo suspenso é aceito, e retomar limpa o motivo', async () => {
    const modulo = falso('suspenso')
    await modulo.cancelarProcesso('p1', 'Desistiram')
    expect(await lido(modulo)).toMatchObject({ situacao: 'cancelado', motivoDaSituacao: 'Desistiram' })
    await modulo.retomarProcesso('p1', 'Voltou a valer')
    expect(await lido(modulo)).toMatchObject({ situacao: 'em_andamento', motivoDaSituacao: null })
  })

  test('retomar um processo com as obrigatórias resolvidas volta a ser concluído', async () => {
    const modulo = falso('suspenso', [doProcesso(4, { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11' })])
    await modulo.retomarProcesso('p1', 'Segue')
    expect((await lido(modulo)).situacao).toBe('concluido')
  })

  test('o concluído conta como em andamento: pode ser suspenso', async () => {
    const modulo = falso('concluido')
    await modulo.suspenderProcesso('p1', 'Parou')
    expect((await lido(modulo)).situacao).toBe('suspenso')
  })

  test('a lista mostra a situação nova', async () => {
    const modulo = falso()
    await modulo.suspenderProcesso('p1', 'Parou')
    expect((await modulo.listarProcessos()).processos[0].situacao).toBe('suspenso')
  })
})

describe('recusas', () => {
  test('motivo vazio', async () => {
    const falha = await falhaDe(falso().suspenderProcesso('p1', '  '))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('O motivo é obrigatório.')
  })

  test('transições que a spec não prevê', async () => {
    expect((await falhaDe(falso('suspenso').suspenderProcesso('p1', 'M'))).message).toBe('Este processo já está suspenso.')
    expect((await falhaDe(falso('cancelado').suspenderProcesso('p1', 'M'))).message)
      .toBe('Um processo cancelado não pode passar a suspenso.')
    expect((await falhaDe(falso().retomarProcesso('p1', 'M'))).message).toBe('Este processo já está em andamento.')
  })

  test('processo que não existe', async () => {
    expect(await falhaDe(falso().suspenderProcesso('x', 'M'))).toBeInstanceOf(CadastroInexistente)
  })

  test('a falha de gravação simulada vale também para a situação', async () => {
    const modulo = falso()
    modulo.falhaDeGravacao = 'falha de conexão simulada'
    expect((await falhaDe(modulo.suspenderProcesso('p1', 'M'))).message).toBe('falha de conexão simulada')
  })
})

describe('congelamento das etapas', () => {
  test.each(['suspenso', 'cancelado'] as const)('com o processo %s, nenhuma ação de etapa grava', async (situacao) => {
    const modulo = falso(situacao)
    const frase = `Este processo está ${situacao}; retome-o para registrar o andamento.`
    const tentativas = [
      () => modulo.iniciarEtapa('a5'), () => modulo.concluirEtapa('a5'), () => modulo.dispensarEtapa('a5', 'n'),
      () => modulo.registrarRealizadaAnteriormente('a5', 'n'), () => modulo.voltarParaEtapa('a4', 'M'),
      () => modulo.corrigirDatasDaEtapa('a4', { iniciadaEm: '2026-10-09', resolvidaEm: null }),
      () => modulo.mudarResponsavelDaEtapa('a4', null),
    ]
    for (const tentar of tentativas) expect((await falhaDe(tentar())).message).toBe(frase)
    expect(modulo.chamadas).toEqual([])
  })

  test('retomado, a etapa volta a andar', async () => {
    const modulo = falso('suspenso')
    await modulo.retomarProcesso('p1', 'Segue')
    await modulo.iniciarEtapa('a5')
    expect(modulo.chamadas).toEqual([{ acao: 'iniciar', id: 'a5' }])
  })
})

describe('data da reunião de modelagem piloto', () => {
  test('marca, troca e remove, em qualquer situação', async () => {
    const modulo = falso('cancelado')
    await modulo.marcarReuniao('p1', '2026-10-20')
    expect((await lido(modulo)).dataDaReuniao).toBe('2026-10-20')
    await modulo.marcarReuniao('p1', null)
    expect((await lido(modulo)).dataDaReuniao).toBeNull()
    expect(modulo.chamadas).toEqual([{ acao: 'reuniao', id: 'p1', nota: '2026-10-20' }, { acao: 'reuniao', id: 'p1' }])
  })

  test('a falha programada e o processo que sumiu chegam como no módulo real', async () => {
    const modulo = falso()
    await expect(modulo.marcarReuniao('px', '2026-10-20')).rejects.toBeInstanceOf(CadastroInexistente)
    modulo.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar os processos.')
    expect((await falhaDe(modulo.marcarReuniao('p1', '2026-10-20'))).message).toBe('Seu perfil não permite alterar os processos.')
  })

  test('o processo novo nasce sem data', async () => {
    const modulo = new ProcessosFalso()
    await modulo.criarProcesso({
      nome: 'Novo', setorId: 's1', macroprocessoId: 'm1', tipo: 'processo', processoPaiId: null, origem: 'novo',
      contexto: null, observacoes: null,
    })
    expect(modulo.processos[0].dataDaReuniao).toBeNull()
  })
})
