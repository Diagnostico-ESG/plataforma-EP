import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { CATALOGO_DE_TESTE, umProcessoLido } from '../testes/processoDaLista'
import { ProcessosFalso } from './ProcessosFalso'
import type { ProcessoLido, SituacaoDoProcesso } from './tipos'

function falso(situacao: SituacaoDoProcesso = 'em_andamento', etapa = 'revisao_interna'): ProcessosFalso {
  const modulo = new ProcessosFalso()
  modulo.etapasDoCatalogo = CATALOGO_DE_TESTE
  modulo.usuariosPossiveis = [{ id: 'u1', nome: 'Ana Teste' }]
  modulo.processos = [umProcessoLido('Emitir Ofício', {
    id: 'p1', situacao, motivoDaSituacao: situacao === 'suspenso' || situacao === 'cancelado' ? 'Motivo antigo' : null,
  }, etapa)]
  return modulo
}

const lido = async (modulo: ProcessosFalso) => (await modulo.lerProcesso('p1')) as ProcessoLido
async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

describe('suspender, cancelar e retomar', () => {
  test('suspender guarda a situação e o motivo, e a etapa e a etiqueta ficam', async () => {
    const modulo = falso()
    await modulo.suspenderProcesso('p1', 'Aguardando decisão')
    expect(await lido(modulo)).toMatchObject({
      situacao: 'suspenso', motivoDaSituacao: 'Aguardando decisão', etapaAtual: { codigo: 'revisao_interna' }, etiqueta: 'a_fazer',
    })
  })

  test('cancelar um processo suspenso é aceito, e retomar limpa o motivo e volta à mesma etapa', async () => {
    const modulo = falso('suspenso')
    await modulo.cancelarProcesso('p1', 'Desistiram')
    expect(await lido(modulo)).toMatchObject({ situacao: 'cancelado', motivoDaSituacao: 'Desistiram' })
    await modulo.retomarProcesso('p1', 'Voltou a valer')
    expect(await lido(modulo)).toMatchObject({ situacao: 'em_andamento', motivoDaSituacao: null, etapaAtual: { codigo: 'revisao_interna' } })
  })

  test('o concluído conta como em andamento: pode ser suspenso e, retomado, volta a ser concluído', async () => {
    const modulo = falso('concluido', 'concluidos')
    await modulo.suspenderProcesso('p1', 'Parou')
    expect((await lido(modulo)).situacao).toBe('suspenso')
    await modulo.retomarProcesso('p1', 'Segue')
    expect((await lido(modulo)).situacao).toBe('concluido')
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

describe('congelamento', () => {
  test.each(['suspenso', 'cancelado'] as const)('com o processo %s, mover, etiqueta e responsável não gravam', async (situacao) => {
    const modulo = falso(situacao)
    const frase = `Este processo está ${situacao}; retome-o para mudar a etapa, a etiqueta ou o responsável.`
    const tentativas = [
      () => modulo.moverProcesso('p1', 'e2'), () => modulo.mudarEtiqueta('p1', 'concluido'), () => modulo.mudarResponsavel('p1', 'u1'),
    ]
    for (const tentar of tentativas) expect((await falhaDe(tentar())).message).toBe(frase)
    expect(modulo.chamadas).toEqual([])
  })

  test('retomado, o processo volta a andar', async () => {
    const modulo = falso('suspenso')
    await modulo.retomarProcesso('p1', 'Segue')
    await modulo.mudarEtiqueta('p1', 'em_andamento')
    expect(modulo.chamadas).toEqual([{ acao: 'etiqueta', id: 'p1', etiqueta: 'em_andamento' }])
  })
})

describe('data da reunião de modelagem piloto', () => {
  test('marca, troca e remove, em qualquer situação', async () => {
    const modulo = falso('cancelado')
    await modulo.marcarDataDaModelagemPiloto('p1', '2026-10-20')
    expect((await lido(modulo)).dataDaModelagemPiloto).toBe('2026-10-20')
    await modulo.marcarDataDaModelagemPiloto('p1', null)
    expect((await lido(modulo)).dataDaModelagemPiloto).toBeNull()
    expect(modulo.chamadas).toEqual([{ acao: 'data_da_modelagem_piloto', id: 'p1', nota: '2026-10-20' }, { acao: 'data_da_modelagem_piloto', id: 'p1' }])
  })

  test('a falha programada e o processo que sumiu chegam como no módulo real', async () => {
    const modulo = falso()
    await expect(modulo.marcarDataDaModelagemPiloto('px', '2026-10-20')).rejects.toBeInstanceOf(CadastroInexistente)
    modulo.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar os processos.')
    expect((await falhaDe(modulo.marcarDataDaModelagemPiloto('p1', '2026-10-20'))).message).toBe('Seu perfil não permite alterar os processos.')
  })

  test('o processo novo nasce sem data', async () => {
    const modulo = new ProcessosFalso()
    await modulo.criarProcesso({
      nome: 'Novo', setorId: 's1', macroprocessoId: 'm1', tipo: 'processo', processoPaiId: null, origem: 'novo',
      contexto: null, observacoes: null,
    })
    expect(modulo.processos[0].dataDaModelagemPiloto).toBeNull()
  })
})
