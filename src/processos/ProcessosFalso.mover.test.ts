import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { CATALOGO_DE_TESTE, umProcessoLido } from '../testes/processoDaLista'
import { ProcessosFalso } from './ProcessosFalso'
import { hojeLocal } from './textoDaModelagemPiloto'
import type { DadosDaChegada, DadosDoProcesso, ProcessoLido } from './tipos'

const ANA = { id: 'u1', nome: 'Ana Teste' }
const BIA = { id: 'u2', nome: 'Bia Teste' }

function falso(...processos: ProcessoLido[]): ProcessosFalso {
  const modulo = new ProcessosFalso()
  modulo.etapasDoCatalogo = CATALOGO_DE_TESTE
  modulo.processos = processos.length ? processos : [umProcessoLido('Emitir Ofício', { id: 'p1' })]
  modulo.usuariosPossiveis = [ANA, BIA]
  modulo.quemChama = BIA
  return modulo
}

const lido = async (modulo: ProcessosFalso, id = 'p1') => (await modulo.lerProcesso(id)) as ProcessoLido
const idDa = (codigo: string) => CATALOGO_DE_TESTE.find((etapa) => etapa.codigo === codigo)?.id as string
async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

const DADOS: DadosDoProcesso = {
  nome: 'Novo Processo', setorId: 's1', macroprocessoId: 'm1', tipo: 'processo', processoPaiId: null, origem: 'novo',
  contexto: null, observacoes: null,
}

describe('cadastro', () => {
  test('o processo novo entra em Não iniciados, com A fazer e sem responsável', async () => {
    const modulo = falso()
    const id = await modulo.criarProcesso(DADOS)
    expect(await lido(modulo, id)).toMatchObject({
      etapaAtual: { codigo: 'nao_iniciados', posicao: 1, total: 8 }, etiqueta: 'a_fazer', responsavel: null,
      entrouNaEtapaEm: hojeLocal(), situacao: 'em_andamento',
    })
  })
})

describe('mover', () => {
  test('para a frente: a etapa muda, a etiqueta volta a A fazer e quem moveu vira o responsável', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', etiqueta: 'concluido', responsavel: { ...ANA, fotoUrl: null } }))
    await modulo.moverProcesso('p1', idDa('aprovacao_setor'))
    expect(await lido(modulo)).toMatchObject({
      etapaAtual: { codigo: 'aprovacao_setor', posicao: 6, total: 8 }, etiqueta: 'a_fazer', responsavel: { id: 'u2', nome: 'Bia Teste' },
      entrouNaEtapaEm: hojeLocal(),
    })
  })

  test('para trás, sem motivo nem confirmação', async () => {
    const modulo = falso()
    await modulo.moverProcesso('p1', idDa('modelagem'))
    expect((await lido(modulo)).etapaAtual?.codigo).toBe('modelagem')
  })

  test('as passagens: a de origem fecha hoje e a de destino abre', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', entrouNaEtapaEm: '2026-10-10' }))
    await modulo.moverProcesso('p1', idDa('publicacao'))
    const etapas = (await lido(modulo)).etapasDoVerso
    expect(etapas).toHaveLength(8)
    expect(etapas.find((etapa) => etapa.codigo === 'revisao_interna')?.passagens).toEqual([{ entrouEm: '2026-10-10', saiuEm: hojeLocal() }])
    expect(etapas.find((etapa) => etapa.codigo === 'publicacao')?.passagens).toEqual([{ entrouEm: hojeLocal(), saiuEm: null }])
  })

  test('voltar a uma etapa já visitada guarda a passagem nova na frente da antiga', async () => {
    const modulo = falso()
    await modulo.moverProcesso('p1', idDa('modelagem'))
    await modulo.moverProcesso('p1', idDa('revisao_interna'))
    const revisao = (await lido(modulo)).etapasDoVerso.find((etapa) => etapa.codigo === 'revisao_interna')
    expect(revisao?.passagens).toHaveLength(2)
    expect(revisao?.passagens[0].saiuEm).toBeNull()
  })

  test('para a própria etapa não grava nada', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', etiqueta: 'em_andamento' }))
    await modulo.moverProcesso('p1', idDa('revisao_interna'))
    expect(modulo.chamadas).toEqual([])
    expect(await lido(modulo)).toMatchObject({ etiqueta: 'em_andamento', responsavel: { id: 'u1' } })
  })

  test('registra a chamada com o processo e a etapa', async () => {
    const modulo = falso()
    await modulo.moverProcesso('p1', idDa('modelagem'))
    expect(modulo.chamadas).toEqual([{ acao: 'mover', id: 'p1', etapaId: idDa('modelagem') }])
  })

  test('etapa inativa é recusada com a frase do banco', async () => {
    const modulo = falso()
    modulo.etapasDoCatalogo = CATALOGO_DE_TESTE.map((etapa) => (etapa.codigo === 'publicacao' ? { ...etapa, ativa: false } : etapa))
    const erro = await falhaDe(modulo.moverProcesso('p1', idDa('publicacao')))
    expect(erro).toBeInstanceOf(TravaDoBanco)
    expect(erro.message).toBe('A etapa Publicação está inativa.')
  })

  test('etapa que não existe é o aviso de cadastro inexistente', async () => {
    expect(await falhaDe(falso().moverProcesso('p1', 'nao-existe'))).toBeInstanceOf(CadastroInexistente)
    expect(await falhaDe(falso().moverProcesso('nao-existe', idDa('modelagem')))).toBeInstanceOf(CadastroInexistente)
  })

  test.each(['suspenso', 'cancelado'] as const)('o processo %s não se move', async (situacao) => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', situacao }))
    const erro = await falhaDe(modulo.moverProcesso('p1', idDa('modelagem')))
    expect(erro.message).toBe(`Este processo está ${situacao}; retome-o para mudar a etapa, a etiqueta ou o responsável.`)
    expect((await lido(modulo)).etapaAtual?.codigo).toBe('revisao_interna')
  })

  test('o concluído fora do Quadro se move como qualquer concluído', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', situacao: 'concluido', noQuadro: false }, 'concluidos'))
    await modulo.moverProcesso('p1', idDa('modelagem'))
    expect((await lido(modulo)).etapaAtual?.codigo).toBe('modelagem')
  })

  test('a falha programada chega como erro e o processo fica onde estava', async () => {
    const modulo = falso()
    modulo.falhaDeGravacao = 'falha de conexão simulada'
    expect((await falhaDe(modulo.moverProcesso('p1', idDa('modelagem')))).message).toBe('falha de conexão simulada')
    expect((await lido(modulo)).etapaAtual?.codigo).toBe('revisao_interna')
  })
})

describe('chegada a Concluídos', () => {
  const CHEGADA_VAZIA: DadosDaChegada = { dataDaPublicacao: null, linkDaPublicacao: null, explicacao: null }

  test('sem a data registrada e sem dados da chegada, o banco recusa', async () => {
    const modulo = falso()
    const erro = await falhaDe(modulo.moverProcesso('p1', idDa('concluidos')))
    expect(erro.message).toBe('Para ir a Concluídos, informe a data da publicação ou conclua sem publicação.')
    expect((await lido(modulo)).etapaAtual?.codigo).toBe('revisao_interna')
  })

  test('com a data da publicação o processo chega: situação concluído, etiqueta Concluído, data guardada', async () => {
    const modulo = falso()
    await modulo.moverProcesso('p1', idDa('concluidos'), { ...CHEGADA_VAZIA, dataDaPublicacao: '2026-10-10' })
    expect(await lido(modulo)).toMatchObject({
      situacao: 'concluido', etiqueta: 'concluido', publicadoEm: '2026-10-10', etapaAtual: { codigo: 'concluidos', posicao: 8 },
    })
  })

  test('com a explicação o processo chega sem data de publicação, com a explicação aparada guardada', async () => {
    const modulo = falso()
    await modulo.moverProcesso('p1', idDa('concluidos'), { ...CHEGADA_VAZIA, explicacao: '  Foi cancelada a publicação ' })
    expect(await lido(modulo)).toMatchObject({
      situacao: 'concluido', etiqueta: 'concluido', publicadoEm: null, explicacaoSemPublicacao: 'Foi cancelada a publicação',
    })
  })

  test('com a data e o link, os dois ficam no processo', async () => {
    const modulo = falso()
    await modulo.moverProcesso('p1', idDa('concluidos'), { ...CHEGADA_VAZIA, dataDaPublicacao: '2026-10-10', linkDaPublicacao: 'https://diario.exemplo/1' })
    expect(await lido(modulo)).toMatchObject({ publicadoEm: '2026-10-10', linkDaPublicacao: 'https://diario.exemplo/1', explicacaoSemPublicacao: null })
  })

  test('sair de Concluídos apaga a explicação', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', {
      id: 'p1', situacao: 'concluido', etiqueta: 'concluido', explicacaoSemPublicacao: 'Não será publicado',
    }, 'concluidos'))
    await modulo.moverProcesso('p1', idDa('publicacao'))
    expect(await lido(modulo)).toMatchObject({ situacao: 'em_andamento', explicacaoSemPublicacao: null })
  })

  test('a explicação vazia, a longa, a data no futuro e o link inválido são recusados', async () => {
    const modulo = falso()
    const tentar = (chegada: Partial<DadosDaChegada>) => falhaDe(modulo.moverProcesso('p1', idDa('concluidos'), { ...CHEGADA_VAZIA, ...chegada }))
    expect((await tentar({ explicacao: '   ' })).message).toBe('A explicação é obrigatória para concluir sem publicação.')
    expect((await tentar({ explicacao: 'x'.repeat(2001) })).message).toBe('A explicação tem 2001 caracteres; o máximo é 2.000.')
    expect(await tentar({ dataDaPublicacao: '2099-01-01' })).toBeInstanceOf(TravaDoBanco)
    expect(await tentar({ dataDaPublicacao: '2026-10-10', linkDaPublicacao: 'ftp://x' })).toBeInstanceOf(TravaDoBanco)
  })

  test('com a data da publicação já registrada, o processo vai direto', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', publicadoEm: '2026-10-05' }, 'publicacao'))
    await modulo.moverProcesso('p1', idDa('concluidos'))
    expect(await lido(modulo)).toMatchObject({ situacao: 'concluido', publicadoEm: '2026-10-05' })
  })

  test('sair de Concluídos volta a em andamento, com A fazer, e mantém a data da publicação', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', situacao: 'concluido', etiqueta: 'concluido', publicadoEm: '2026-10-05' }, 'concluidos'))
    await modulo.moverProcesso('p1', idDa('publicacao'))
    expect(await lido(modulo)).toMatchObject({ situacao: 'em_andamento', etiqueta: 'a_fazer', publicadoEm: '2026-10-05' })
  })
})

describe('etiqueta', () => {
  test('muda só a etiqueta: a etapa, o responsável e a entrada ficam', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', entrouNaEtapaEm: '2026-10-01' }))
    await modulo.mudarEtiqueta('p1', 'em_andamento')
    expect(await lido(modulo)).toMatchObject({
      etiqueta: 'em_andamento', etapaAtual: { codigo: 'revisao_interna' }, responsavel: { id: 'u1' }, entrouNaEtapaEm: '2026-10-01',
    })
    expect(modulo.chamadas).toEqual([{ acao: 'etiqueta', id: 'p1', etiqueta: 'em_andamento' }])
  })

  test('em Concluídos a etiqueta é fixa', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', situacao: 'concluido', etiqueta: 'concluido' }, 'concluidos'))
    expect((await falhaDe(modulo.mudarEtiqueta('p1', 'a_fazer'))).message).toBe('Em Concluídos a etiqueta é sempre Concluído e não muda.')
  })

  test('suspenso e cancelado congelam a etiqueta', async () => {
    const suspenso = falso(umProcessoLido('Emitir Ofício', { id: 'p1', situacao: 'suspenso' }))
    expect((await falhaDe(suspenso.mudarEtiqueta('p1', 'concluido'))).message).toContain('Este processo está suspenso')
  })

  test('a falha programada deixa a etiqueta como estava', async () => {
    const modulo = falso()
    modulo.falhaDeGravacao = 'falha de conexão simulada'
    await falhaDe(modulo.mudarEtiqueta('p1', 'concluido'))
    expect((await lido(modulo)).etiqueta).toBe('a_fazer')
  })
})

describe('responsável do processo', () => {
  test('troca o responsável sem mover o processo', async () => {
    const modulo = falso()
    await modulo.mudarResponsavel('p1', 'u2')
    expect(await lido(modulo)).toMatchObject({ responsavel: { id: 'u2', nome: 'Bia Teste' }, etapaAtual: { codigo: 'revisao_interna' }, etiqueta: 'a_fazer' })
    expect(modulo.chamadas).toEqual([{ acao: 'responsavel', id: 'p1', usuarioId: 'u2' }])
  })

  test('null deixa o processo sem responsável', async () => {
    const modulo = falso()
    await modulo.mudarResponsavel('p1', null)
    expect((await lido(modulo)).responsavel).toBeNull()
  })

  test('só usuário ativo Administrador ou Integrante pode ser responsável', async () => {
    const erro = await falhaDe(falso().mudarResponsavel('p1', 'u-consulta'))
    expect(erro).toBeInstanceOf(TravaDoBanco)
    expect(erro.message).toContain('só usuários ativos de perfil Administrador ou Integrante do EP')
  })

  test('suspenso e cancelado congelam o responsável', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', situacao: 'cancelado' }))
    expect((await falhaDe(modulo.mudarResponsavel('p1', 'u2'))).message).toContain('Este processo está cancelado')
  })
})

describe('situação', () => {
  test('retomar o processo suspenso em Concluídos volta a ser concluído', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', situacao: 'suspenso', motivoDaSituacao: 'Parou' }, 'concluidos'))
    await modulo.retomarProcesso('p1', 'Segue')
    expect((await lido(modulo)).situacao).toBe('concluido')
  })

  test('suspender o concluído guarda a etapa e a etiqueta', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', situacao: 'concluido', etiqueta: 'concluido' }, 'concluidos'))
    await modulo.suspenderProcesso('p1', 'Parou')
    expect(await lido(modulo)).toMatchObject({ situacao: 'suspenso', etapaAtual: { codigo: 'concluidos' }, etiqueta: 'concluido' })
  })
})
