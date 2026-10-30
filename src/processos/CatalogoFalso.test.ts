import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { umProcessoLido } from '../testes/processoDaLista'
import { ProcessosFalso } from './ProcessosFalso'
import { FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS } from './frasesDoCatalogo'
import type { EtapaNoCatalogo, ProcessoLido } from './tipos'

const NAO_INICIADOS: EtapaNoCatalogo = { id: 'e1', codigo: 'nao_iniciados', nome: 'Não iniciados', ordem: 1, fase: null, ativa: true }
const MODELAGEM: EtapaNoCatalogo = { id: 'e2', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 2, fase: 'IV', ativa: true }
const RELATORIO: EtapaNoCatalogo = {
  id: 'e3', codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', ordem: 3, fase: 'V', ativa: true,
}
const EXTRA: EtapaNoCatalogo = { id: 'e4', codigo: 'extra', nome: 'Extra', ordem: 4, fase: 'VI', ativa: true }
const CONCLUIDOS: EtapaNoCatalogo = { id: 'e5', codigo: 'concluidos', nome: 'Concluídos', ordem: 5, fase: null, ativa: true }

function processoNa(codigo: string, id: string): ProcessoLido {
  return umProcessoLido(`Processo ${id}`, { id, etapaAtual: { id: 'x', codigo, nome: codigo, ordem: 1, posicao: 1, total: 5 } })
}

function montar(): ProcessosFalso {
  const falso = new ProcessosFalso()
  falso.catalogo.etapas = [NAO_INICIADOS, MODELAGEM, RELATORIO, EXTRA, CONCLUIDOS]
  falso.etapasDoCatalogo = falso.catalogo.etapas.map(({ id, codigo, nome, ordem, ativa }) => ({ id, codigo, nome, ordem, ativa }))
  falso.processos = [processoNa('modelagem', 'dentro')]
  return falso
}

const codigos = (etapas: { codigo: string }[]) => etapas.map((etapa) => etapa.codigo)
const FIXAS = 'As etapas Não iniciados e Concluídos não mudam de nome nem de lugar e não saem do catálogo.'
async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

describe('acrescentar etapa', () => {
  test('antes de outra, abre espaço na ordem', async () => {
    const falso = montar()
    await falso.catalogo.acrescentarEtapa({ codigo: 'nova', nome: 'Nova', fase: 'VI', antesDe: 'e4' })
    expect((await falso.catalogo.listarCatalogo()).map(({ codigo, ordem }) => [codigo, ordem])).toEqual([
      ['nao_iniciados', 1], ['modelagem', 2], ['relatorio_modelagem_tecnica', 3], ['nova', 4], ['extra', 5], ['concluidos', 6],
    ])
  })

  test('sem posição, entra logo antes de Concluídos', async () => {
    const falso = montar()
    await falso.catalogo.acrescentarEtapa({ codigo: 'nova', nome: 'Nova', fase: 'VI', antesDe: null })
    expect(codigos(await falso.catalogo.listarCatalogo())).toEqual(
      ['nao_iniciados', 'modelagem', 'relatorio_modelagem_tecnica', 'extra', 'nova', 'concluidos'])
  })

  test('nunca antes de Não iniciados', async () => {
    const falso = montar()
    expect(await falhaDe(falso.catalogo.acrescentarEtapa({ codigo: 'nova', nome: 'Nova', fase: 'VI', antesDe: 'e1' }))).toEqual(new TravaDoBanco(FIXAS))
  })

  test('guarda a fase escolhida e vira coluna do Quadro, sem mexer em nenhum processo', async () => {
    const falso = montar()
    await falso.catalogo.acrescentarEtapa({ codigo: 'nova', nome: 'Nova', fase: 'VIII', antesDe: null })
    expect((await falso.catalogo.listarCatalogo()).find((etapa) => etapa.codigo === 'nova')?.fase).toBe('VIII')
    expect(codigos(falso.etapasDoCatalogo)).toContain('nova')
    expect(falso.processos[0].etapaAtual?.codigo).toBe('modelagem')
  })

  test('com nome repetido, sem diferenciar maiúsculas, é recusada', async () => {
    const erro = await falhaDe(montar().catalogo.acrescentarEtapa({ codigo: 'outra', nome: 'EXTRA', fase: 'VI', antesDe: null }))
    expect(erro).toEqual(new TravaDoBanco('Já existe uma etapa com o nome EXTRA.'))
  })

  test('com código repetido é recusada', async () => {
    const erro = await falhaDe(montar().catalogo.acrescentarEtapa({ codigo: 'extra', nome: 'Outra', fase: 'VI', antesDe: null }))
    expect(erro).toEqual(new TravaDoBanco('Já existe uma etapa com o código extra.'))
  })
})

describe('mover e editar', () => {
  test('subir troca com a vizinha de cima e muda a ordem das colunas', async () => {
    const falso = montar()
    await falso.catalogo.moverEtapa('e4', 'subir')
    expect(codigos(falso.etapasDoCatalogo)).toEqual(['nao_iniciados', 'modelagem', 'extra', 'relatorio_modelagem_tecnica', 'concluidos'])
  })

  test('descer troca com a vizinha de baixo', async () => {
    const falso = montar()
    await falso.catalogo.moverEtapa('e2', 'descer')
    expect(codigos(await falso.catalogo.listarCatalogo())).toEqual(
      ['nao_iniciados', 'relatorio_modelagem_tecnica', 'modelagem', 'extra', 'concluidos'])
  })

  test('não atravessa as fixas', async () => {
    const falso = montar()
    expect(await falhaDe(falso.catalogo.moverEtapa('e2', 'subir'))).toEqual(new TravaDoBanco(FIXAS))
    expect(await falhaDe(falso.catalogo.moverEtapa('e4', 'descer'))).toEqual(new TravaDoBanco(FIXAS))
    expect(await falhaDe(falso.catalogo.moverEtapa('e1', 'descer'))).toEqual(new TravaDoBanco(FIXAS))
    expect(codigos(await falso.catalogo.listarCatalogo())[0]).toBe('nao_iniciados')
  })

  test('editar troca nome e fase e mantém as outras', async () => {
    const falso = montar()
    await falso.catalogo.editarEtapa('e4', { nome: 'Extra final', fase: 'IX' })
    expect((await falso.catalogo.listarCatalogo())[3]).toMatchObject({ nome: 'Extra final', fase: 'IX', codigo: 'extra' })
  })

  test('as fixas não se renomeiam', async () => {
    expect(await falhaDe(montar().catalogo.editarEtapa('e1', { nome: 'Outro nome', fase: 'IV' }))).toEqual(new TravaDoBanco(FIXAS))
  })
})

describe('desativar, reativar e excluir', () => {
  test('desativar a etapa vazia tira a coluna do Quadro, e reativar a devolve', async () => {
    const falso = montar()
    await falso.catalogo.desativarEtapa('e4')
    expect(falso.etapasDoCatalogo.find((etapa) => etapa.codigo === 'extra')?.ativa).toBe(false)
    await falso.catalogo.reativarEtapa('e4')
    expect(falso.etapasDoCatalogo.find((etapa) => etapa.codigo === 'extra')?.ativa).toBe(true)
  })

  test('etapa com processo dentro não se desativa nem se exclui: a frase traz a contagem', async () => {
    const falso = montar()
    falso.catalogo.etapas = falso.catalogo.etapas.map((etapa) => (etapa.id === 'e3' ? { ...etapa } : etapa))
    falso.processos = [processoNa('extra', 'a'), processoNa('extra', 'b')]
    expect((await falhaDe(falso.catalogo.desativarEtapa('e4'))).message).toBe('A etapa Extra tem 2 processos; mova-os antes de desativar.')
    expect((await falhaDe(falso.catalogo.excluirEtapa('e4'))).message).toBe('A etapa Extra tem 2 processos; mova-os antes de excluir.')
    falso.processos = [processoNa('extra', 'a')]
    expect((await falhaDe(falso.catalogo.desativarEtapa('e4'))).message).toBe('A etapa Extra tem 1 processo; mova-o antes de desativar.')
  })

  test('etapa por onde um processo passou não se exclui; desativar é aceito', async () => {
    const falso = montar()
    falso.processos = [umProcessoLido('Visitou', {
      id: 'v', etapaAtual: processoNa('modelagem', 'v').etapaAtual,
      etapasDoVerso: [{ id: 'e4', codigo: 'extra', nome: 'Extra', ordem: 4, passagens: [{ entrouEm: '2026-10-01', saiuEm: '2026-10-02' }] }],
    })]
    expect((await falhaDe(falso.catalogo.excluirEtapa('e4'))).message).toBe('A etapa Extra já recebeu processos; desative-a em vez de excluir.')
    await falso.catalogo.desativarEtapa('e4')
    expect(falso.etapasDoCatalogo.find((etapa) => etapa.codigo === 'extra')?.ativa).toBe(false)
  })

  test('excluir etapa nunca usada a tira do catálogo e do Quadro', async () => {
    const falso = montar()
    await falso.catalogo.excluirEtapa('e4')
    expect(codigos(await falso.catalogo.listarCatalogo())).not.toContain('extra')
    expect(codigos(falso.etapasDoCatalogo)).not.toContain('extra')
  })

  test('as fixas não se desativam nem se excluem', async () => {
    const falso = montar()
    expect(await falhaDe(falso.catalogo.desativarEtapa('e1'))).toEqual(new TravaDoBanco(FIXAS))
    expect(await falhaDe(falso.catalogo.excluirEtapa('e5'))).toEqual(new TravaDoBanco(FIXAS))
  })

  test('etapa que não existe é o aviso de cadastro inexistente', async () => {
    expect(await falhaDe(montar().catalogo.excluirEtapa('nao-existe'))).toBeInstanceOf(CadastroInexistente)
  })
})

describe('falhas simuladas', () => {
  test('falharLeitura recusa a leitura', async () => {
    const falso = montar()
    falso.catalogo.falharLeitura = true
    await expect(falso.catalogo.listarCatalogo()).rejects.toThrow('falha de conexão simulada')
  })

  test('falhaDeGravacao recusa a gravação sem mudar nada', async () => {
    const falso = montar()
    falso.catalogo.falhaDeGravacao = 'sem conexão'
    await expect(falso.catalogo.desativarEtapa('e4')).rejects.toThrow('sem conexão')
    expect((await falso.catalogo.listarCatalogo())[3].ativa).toBe(true)
  })
})

describe('as seis etapas com campos próprios não se desativam nem se excluem', () => {
  const REVISAO: EtapaNoCatalogo = { id: 'e6', codigo: 'revisao_interna', nome: 'Revisão interna', ordem: 4, fase: 'VI', ativa: true }

  function comProtegida(): ProcessosFalso {
    const falso = montar()
    falso.catalogo.etapas = [NAO_INICIADOS, MODELAGEM, REVISAO, CONCLUIDOS]
    falso.processos = []
    return falso
  }

  test.each([
    ['desativar a Revisão interna', (f: ProcessosFalso) => f.catalogo.desativarEtapa('e6')],
    ['excluir a Revisão interna', (f: ProcessosFalso) => f.catalogo.excluirEtapa('e6')],
    ['desativar a Modelagem piloto', (f: ProcessosFalso) => f.catalogo.desativarEtapa('e2')],
  ])('%s é recusado e o catálogo não muda', async (_caso, tentar) => {
    const falso = comProtegida()
    const falha = await falhaDe(tentar(falso))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toMatch(/^A etapa .* tem campos próprios e não pode ser desativada nem excluída\.$/)
    expect((await falso.catalogo.listarCatalogo()).filter((etapa) => etapa.ativa)).toHaveLength(4)
  })

  test('renomear e mover continuam aceitos', async () => {
    const falso = comProtegida()
    await falso.catalogo.editarEtapa('e6', { nome: 'Revisão interna (EP)', fase: 'VI' })
    await falso.catalogo.moverEtapa('e6', 'subir')
    expect(codigos(await falso.catalogo.listarCatalogo())).toEqual(['nao_iniciados', 'revisao_interna', 'modelagem', 'concluidos'])
  })
})

describe('responsável inicial', () => {
  const ANA = { id: 'u1', nome: 'Ana Teste', fotoUrl: null }

  test('grava a escolha na etapa, inclusive em Não iniciados, e Ninguém a limpa', async () => {
    const falso = montar()
    falso.usuariosPossiveis = [ANA]
    await falso.catalogo.definirResponsavelInicial('e1', 'u1')
    await falso.catalogo.definirResponsavelInicial('e2', 'u1')
    const lida = await falso.catalogo.listarCatalogo()
    expect(lida.find((etapa) => etapa.id === 'e1')?.responsavelInicial).toEqual({ id: 'u1', nome: 'Ana Teste', fotoUrl: null, ativo: true, perfil: 'integrante_ep' })
    await falso.catalogo.definirResponsavelInicial('e2', null)
    expect((await falso.catalogo.listarCatalogo()).find((etapa) => etapa.id === 'e2')?.responsavelInicial).toBeNull()
  })

  test('recusa quem não pode ser responsável, com o nome recebido, e qualquer valor em Concluídos', async () => {
    const falso = montar()
    falso.usuariosPossiveis = [ANA]
    expect(await falhaDe(falso.catalogo.definirResponsavelInicial('e2', 'u9'))).toEqual(
      new TravaDoBanco('u9 não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.'))
    expect(await falhaDe(falso.catalogo.definirResponsavelInicial('e5', 'u1'))).toEqual(new TravaDoBanco(FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS))
  })

  test('trocar o responsável inicial não muda os processos que já estão na etapa', async () => {
    const falso = montar()
    falso.usuariosPossiveis = [ANA]
    const antes = falso.processos.map((processo) => processo.responsavel)
    await falso.catalogo.definirResponsavelInicial('e2', 'u1')
    expect(falso.processos.map((processo) => processo.responsavel)).toEqual(antes)
  })
})
