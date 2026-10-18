import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ProcessosFalso } from './ProcessosFalso'
import type { EtapaDoProcesso, EtapaDoSetor, EtapaNoCatalogo, ProcessoLido, SituacaoDoProcesso } from './tipos'

const IDENTIFICACAO: EtapaNoCatalogo = {
  id: 'e3', codigo: 'identificacao_processos', nome: 'Identificação dos processos', ordem: 3, nivel: 'setor',
  obrigatoria: true, ativa: true,
}
const MODELAGEM: EtapaNoCatalogo = {
  id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, nivel: 'processo', obrigatoria: true, ativa: true,
}
const PUBLICACAO: EtapaNoCatalogo = {
  id: 'e9', codigo: 'publicacao', nome: 'Publicação', ordem: 9, nivel: 'processo', obrigatoria: false, ativa: true,
}

function etapaDoProcesso(etapa: EtapaNoCatalogo, status: EtapaDoProcesso['status']): EtapaDoProcesso {
  return {
    id: `${etapa.id}-andamento`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, obrigatoria: etapa.obrigatoria,
    status, nota: null, iniciadaEm: null, resolvidaEm: null, responsavelId: null, responsavelNome: null,
    responsavelInativo: false,
  }
}

function processo(id: string, situacao: SituacaoDoProcesso, status: EtapaDoProcesso['status']): ProcessoLido {
  return {
    id, nome: `Processo ${id}`, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', processoPaiId: null, situacao, etapaAtual: null,
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null, processoPai: null,
    subprocessos: [], dataDaReuniao: null, etapasDoSetor: [], etapasDoProcesso: [etapaDoProcesso(MODELAGEM, status)],
  }
}

function etapaDoSetor(etapa: EtapaNoCatalogo, status: EtapaDoSetor['status']): EtapaDoSetor {
  return {
    id: `${etapa.id}-setor`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, obrigatoria: etapa.obrigatoria,
    status, nota: null, iniciadaEm: null, resolvidaEm: null,
  }
}

function montar(): ProcessosFalso {
  const falso = new ProcessosFalso()
  falso.catalogo.etapas = [IDENTIFICACAO, MODELAGEM, PUBLICACAO]
  falso.etapasDoSetor = { s1: [etapaDoSetor(IDENTIFICACAO, 'concluida')], s2: [] }
  falso.processos = [
    processo('andando', 'em_andamento', 'em_andamento'), processo('parado', 'suspenso', 'pendente'),
    processo('pronto', 'concluido', 'concluida'), processo('cancelado', 'cancelado', 'pendente'),
  ]
  return falso
}

const codigos = (etapas: { codigo: string }[]) => etapas.map((etapa) => etapa.codigo)
const etapasDe = (falso: ProcessosFalso, id: string) => falso.processos.find((outro) => outro.id === id)?.etapasDoProcesso ?? []

describe('acrescentar etapa', () => {
  test('antes de outra, abre espaço na ordem', async () => {
    const falso = montar()
    await falso.catalogo.acrescentarEtapa({ codigo: 'nova', nome: 'Nova', nivel: 'processo', obrigatoria: true, antesDe: 'e9' })
    expect((await falso.catalogo.listarCatalogo()).map(({ codigo, ordem }) => [codigo, ordem])).toEqual([
      ['identificacao_processos', 3], ['modelagem', 4], ['nova', 9], ['publicacao', 10],
    ])
  })

  test('no fim, fica depois da última', async () => {
    const falso = montar()
    await falso.catalogo.acrescentarEtapa({ codigo: 'nova', nome: 'Nova', nivel: 'processo', obrigatoria: false, antesDe: null })
    expect(codigos(await falso.catalogo.listarCatalogo())).toEqual(['identificacao_processos', 'modelagem', 'publicacao', 'nova'])
  })

  test('do processo: entra pendente nos processos em andamento e suspensos, não nos concluídos e cancelados', async () => {
    const falso = montar()
    await falso.catalogo.acrescentarEtapa({ codigo: 'nova', nome: 'Nova', nivel: 'processo', obrigatoria: true, antesDe: null })
    expect(etapasDe(falso, 'andando').find((etapa) => etapa.codigo === 'nova')?.status).toBe('pendente')
    expect(codigos(etapasDe(falso, 'parado'))).toContain('nova')
    expect(codigos(etapasDe(falso, 'pronto'))).not.toContain('nova')
    expect(codigos(etapasDe(falso, 'cancelado'))).not.toContain('nova')
  })

  test('do processo: vira coluna do Quadro', async () => {
    const falso = montar()
    await falso.catalogo.acrescentarEtapa({ codigo: 'nova', nome: 'Nova', nivel: 'processo', obrigatoria: true, antesDe: null })
    expect(codigos(falso.etapasDoCatalogo)).toEqual(['modelagem', 'publicacao', 'nova'])
  })

  test('do setor: entra nas etapas de todos os setores', async () => {
    const falso = montar()
    await falso.catalogo.acrescentarEtapa({ codigo: 'nova_setor', nome: 'Nova do setor', nivel: 'setor', obrigatoria: false, antesDe: 'e4' })
    expect(codigos(falso.etapasDoSetor.s1)).toEqual(['identificacao_processos', 'nova_setor'])
    expect(codigos(falso.etapasDoSetor.s2)).toEqual(['nova_setor'])
  })

  test('do setor depois de uma do processo é recusada', async () => {
    const falso = montar()
    await expect(falso.catalogo.acrescentarEtapa({ codigo: 'nova', nome: 'Nova', nivel: 'setor', obrigatoria: false, antesDe: null }))
      .rejects.toThrow(new TravaDoBanco('As etapas do setor precisam vir antes das etapas do processo.'))
  })

  test('com nome repetido, sem diferenciar maiúsculas, é recusada', async () => {
    const falso = montar()
    await expect(falso.catalogo.acrescentarEtapa({ codigo: 'outra', nome: 'PUBLICAÇÃO', nivel: 'processo', obrigatoria: false, antesDe: null }))
      .rejects.toThrow(new TravaDoBanco('Já existe uma etapa com o nome PUBLICAÇÃO.'))
  })

  test('com código repetido é recusada', async () => {
    const falso = montar()
    await expect(falso.catalogo.acrescentarEtapa({ codigo: 'publicacao', nome: 'Outra', nivel: 'processo', obrigatoria: false, antesDe: null }))
      .rejects.toThrow(new TravaDoBanco('Já existe uma etapa com o código publicacao.'))
  })
})

describe('mover e editar', () => {
  test('subir troca com a vizinha de cima', async () => {
    const falso = montar()
    await falso.catalogo.moverEtapa('e9', 'subir')
    expect(codigos(await falso.catalogo.listarCatalogo())).toEqual(['identificacao_processos', 'publicacao', 'modelagem'])
  })

  test('descer troca com a vizinha de baixo e muda a ordem das colunas', async () => {
    const falso = montar()
    await falso.catalogo.moverEtapa('e4', 'descer')
    expect(codigos(falso.etapasDoCatalogo)).toEqual(['publicacao', 'modelagem'])
  })

  test('subir uma etapa do processo acima de uma do setor é recusado', async () => {
    const falso = montar()
    await expect(falso.catalogo.moverEtapa('e4', 'subir'))
      .rejects.toThrow(new TravaDoBanco('As etapas do setor precisam vir antes das etapas do processo.'))
  })

  test('editar muda nome e obrigatória', async () => {
    const falso = montar()
    await falso.catalogo.editarEtapa('e9', { nome: 'Publicação final', obrigatoria: true })
    expect((await falso.catalogo.listarCatalogo())[2]).toMatchObject({ nome: 'Publicação final', obrigatoria: true })
  })
})

describe('desativar, reativar e excluir', () => {
  test('desativar tira os pendentes e mantém os resolvidos e o em andamento', async () => {
    const falso = montar()
    await falso.catalogo.desativarEtapa('e4')
    expect(codigos(etapasDe(falso, 'parado'))).not.toContain('modelagem')
    expect(codigos(etapasDe(falso, 'pronto'))).toContain('modelagem')
    expect(codigos(etapasDe(falso, 'andando'))).toContain('modelagem')
    expect(falso.etapasDoCatalogo.find((etapa) => etapa.codigo === 'modelagem')?.ativa).toBe(false)
  })

  test('reativar devolve os pendentes onde faltam', async () => {
    const falso = montar()
    await falso.catalogo.desativarEtapa('e4')
    await falso.catalogo.reativarEtapa('e4')
    expect(etapasDe(falso, 'parado').filter((etapa) => etapa.codigo === 'modelagem')).toHaveLength(1)
    expect(etapasDe(falso, 'pronto').filter((etapa) => etapa.codigo === 'modelagem')).toHaveLength(1)
  })

  test('excluir etapa usada é recusado', async () => {
    const falso = montar()
    await expect(falso.catalogo.excluirEtapa('e4'))
      .rejects.toThrow(new TravaDoBanco('A etapa Reunião de modelagem já foi usada; desative-a em vez de excluir.'))
  })

  test('excluir etapa nunca usada a tira do catálogo e dos caminhos', async () => {
    const falso = montar()
    await falso.catalogo.acrescentarEtapa({ codigo: 'nova', nome: 'Nova', nivel: 'processo', obrigatoria: true, antesDe: null })
    const nova = (await falso.catalogo.listarCatalogo()).find((etapa) => etapa.codigo === 'nova')
    await falso.catalogo.excluirEtapa(nova?.id ?? '')
    expect(codigos(await falso.catalogo.listarCatalogo())).not.toContain('nova')
    expect(codigos(etapasDe(falso, 'andando'))).not.toContain('nova')
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
    await expect(falso.catalogo.desativarEtapa('e9')).rejects.toThrow('sem conexão')
    expect((await falso.catalogo.listarCatalogo())[2].ativa).toBe(true)
  })
})
