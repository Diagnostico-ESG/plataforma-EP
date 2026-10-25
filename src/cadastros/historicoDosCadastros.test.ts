import { describe, expect, test } from 'vitest'
import {
  descreverEstadoDoCadastro, ehRegistroRetirado, eventosDoItem, itensDoFiltro, nomeDoItem, rotuloDoMotivo, textoDaAcaoDoCadastro,
  tituloDoEvento,
} from './historicoDosCadastros'
import type { EventoDoCadastro } from './tipos'

function evento(parcial: Partial<EventoDoCadastro> & { entidade: string; entidadeRef: string }): EventoDoCadastro {
  return {
    id: 1, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'criar', antes: null, depois: null, ...parcial,
  }
}

const SETOR = { sigla: 'CEE', nome: 'Escola Fictícia', observacoes: null, ativo: true }
const MACRO = { codigo: '01', nome: 'Planejamento Fictício', descricao: null, categoria: 'apoio', ativo: true }
const VINCULO = {
  setor_id: 's1', setor_sigla: 'CEE', macroprocesso_id: 'm1', macroprocesso_nome: 'Planejamento Fictício', observacao: 'Apoia',
}

describe('textoDaAcaoDoCadastro', () => {
  test.each([
    ['criar', 'Criou'], ['editar', 'Editou'], ['desativar', 'Desativou'], ['reativar', 'Reativou'], ['excluir', 'Excluiu'],
  ])('%s de setor e de macroprocesso', (acao, texto) => {
    expect(textoDaAcaoDoCadastro(acao, 'setor')).toBe(texto)
    expect(textoDaAcaoDoCadastro(acao, 'macroprocesso')).toBe(texto)
  })

  test('as três ações do setor envolvido têm texto próprio', () => {
    expect(textoDaAcaoDoCadastro('criar', 'setor_envolvido')).toBe('Pôs o setor no macroprocesso')
    expect(textoDaAcaoDoCadastro('excluir', 'setor_envolvido')).toBe('Tirou o setor do macroprocesso')
    expect(textoDaAcaoDoCadastro('editar', 'setor_envolvido')).toBe('Mudou a observação do setor no macroprocesso')
  })

  test('ação desconhecida aparece pelo código, em vez de sumir', () => {
    expect(textoDaAcaoDoCadastro('arquivar', 'setor')).toBe('arquivar')
  })
})

describe('nomeDoItem', () => {
  test('setor: sigla e nome; o excluído usa o antes', () => {
    expect(nomeDoItem(evento({ entidade: 'setor', entidadeRef: 's1', depois: SETOR }))).toBe('CEE — Escola Fictícia')
    expect(nomeDoItem(evento({ entidade: 'setor', entidadeRef: 's1', acao: 'excluir', antes: SETOR }))).toBe('CEE — Escola Fictícia')
  })

  test('macroprocesso: código e nome, ou só o nome quando não há código', () => {
    expect(nomeDoItem(evento({ entidade: 'macroprocesso', entidadeRef: 'm1', depois: MACRO }))).toBe('01 — Planejamento Fictício')
    expect(nomeDoItem(evento({ entidade: 'macroprocesso', entidadeRef: 'm1', depois: { ...MACRO, codigo: null } })))
      .toBe('Planejamento Fictício')
  })

  test('setor envolvido: sigla do setor e nome do macroprocesso', () => {
    expect(nomeDoItem(evento({ entidade: 'setor_envolvido', entidadeRef: 'm1:s1', depois: VINCULO })))
      .toBe('CEE em Planejamento Fictício')
  })

  test('evento sem estado legível cai na referência', () => {
    expect(nomeDoItem(evento({ entidade: 'setor', entidadeRef: 's9' }))).toBe('s9')
  })
})

describe('descreverEstadoDoCadastro', () => {
  test('sem estado, travessão', () => {
    expect(descreverEstadoDoCadastro(null)).toBe('—')
  })

  test('setor: rótulos em português, situação por extenso e vazio como travessão', () => {
    expect(descreverEstadoDoCadastro(SETOR)).toBe('Sigla: CEE; Nome: Escola Fictícia; Observações: —; Situação: Ativo')
    expect(descreverEstadoDoCadastro({ ...SETOR, ativo: false })).toContain('Situação: Inativo')
  })

  test('macroprocesso: categoria pelo rótulo', () => {
    expect(descreverEstadoDoCadastro(MACRO))
      .toBe('Código: 01; Nome: Planejamento Fictício; Descrição: —; Categoria: Apoio; Situação: Ativo')
  })

  test('exclusão de setor traz os macroprocessos que ele tinha, com a observação', () => {
    const lista = [
      { macroprocesso_id: 'm1', codigo: '01', nome: 'Planejamento Fictício', observacao: 'Apoia' },
      { macroprocesso_id: 'm2', codigo: null, nome: 'Compras Fictícias', observacao: null },
    ]
    expect(descreverEstadoDoCadastro({ ...SETOR, macroprocessos: lista })).toContain(
      'Macroprocessos: 01 — Planejamento Fictício (Apoia), Compras Fictícias')
    expect(descreverEstadoDoCadastro({ ...SETOR, macroprocessos: [] })).toContain('Macroprocessos: nenhum')
  })

  test('exclusão de macroprocesso traz os setores envolvidos', () => {
    const setores = [{ setor_id: 's1', sigla: 'CEE', nome: 'Escola Fictícia', observacao: 'Apoia' }]
    expect(descreverEstadoDoCadastro({ ...MACRO, setores })).toContain('Setores: CEE — Escola Fictícia (Apoia)')
    expect(descreverEstadoDoCadastro({ ...MACRO, setores: [] })).toContain('Setores: nenhum')
  })

  test('vínculo: setor, macroprocesso e observação, sem os ids', () => {
    expect(descreverEstadoDoCadastro(VINCULO)).toBe('Setor: CEE; Macroprocesso: Planejamento Fictício; Observação: Apoia')
  })
})

describe('itensDoFiltro', () => {
  const maisRecentePrimeiro: EventoDoCadastro[] = [
    evento({ id: 4, entidade: 'setor', entidadeRef: 's1', acao: 'editar', depois: { ...SETOR, nome: 'Escola Nova Fictícia' } }),
    evento({ id: 3, entidade: 'setor_envolvido', entidadeRef: 'm1:s2', depois: { ...VINCULO, setor_id: 's2', setor_sigla: 'ZZZ' } }),
    evento({ id: 2, entidade: 'macroprocesso', entidadeRef: 'm1', acao: 'excluir', antes: MACRO }),
    evento({ id: 1, entidade: 'setor', entidadeRef: 's1', depois: SETOR }),
  ]

  test('cada setor e macroprocesso aparece uma vez, com o nome do evento mais recente', () => {
    expect(itensDoFiltro(maisRecentePrimeiro).map(({ id }) => id)).toEqual(['m1', 's1', 's2'])
    expect(itensDoFiltro(maisRecentePrimeiro)).toContainEqual({ id: 's1', nome: 'CEE — Escola Nova Fictícia' })
  })

  test('o macroprocesso excluído continua na lista', () => {
    expect(itensDoFiltro(maisRecentePrimeiro)).toContainEqual({ id: 'm1', nome: '01 — Planejamento Fictício' })
  })

  test('setor só citado em evento de vínculo entra pela sigla', () => {
    expect(itensDoFiltro(maisRecentePrimeiro)).toContainEqual({ id: 's2', nome: 'ZZZ' })
  })

  test('ordem pelo nome, sem diferenciar acento', () => {
    const itens = itensDoFiltro([
      evento({ entidade: 'setor', entidadeRef: 'b', depois: { ...SETOR, sigla: 'ÉTA', nome: 'Beta' } }),
      evento({ entidade: 'setor', entidadeRef: 'a', depois: { ...SETOR, sigla: 'ZED', nome: 'Alfa' } }),
    ])
    expect(itens.map(({ id }) => id)).toEqual(['b', 'a'])
  })

  test('sem eventos, sem itens', () => {
    expect(itensDoFiltro([])).toEqual([])
  })
})

describe('eventosDoItem', () => {
  const setor = evento({ id: 1, entidade: 'setor', entidadeRef: 's1' })
  const macro = evento({ id: 2, entidade: 'macroprocesso', entidadeRef: 'm1' })
  const vinculo = evento({ id: 3, entidade: 'setor_envolvido', entidadeRef: 'm1:s1' })
  const outro = evento({ id: 4, entidade: 'setor', entidadeRef: 's2' })
  const todos = [setor, macro, vinculo, outro]

  test('sem item, todos', () => {
    expect(eventosDoItem(todos, null)).toEqual(todos)
  })

  test('setor: os eventos dele e os vínculos em que ele está', () => {
    expect(eventosDoItem(todos, 's1')).toEqual([setor, vinculo])
  })

  test('macroprocesso: os eventos dele e os vínculos em que ele está', () => {
    expect(eventosDoItem(todos, 'm1')).toEqual([macro, vinculo])
  })

  test('item sem eventos, lista vazia', () => {
    expect(eventosDoItem(todos, 'x')).toEqual([])
  })
})


const MOVIMENTO_ANTES = { processo_nome: 'Emitir Ofício', etapa_codigo: 'revisao_interna', etapa_nome: 'Revisão interna', responsavel_id: 'u1', responsavel_nome: 'Ana Teste' }
const MOVIMENTO_DEPOIS = { processo_nome: 'Emitir Ofício', etapa_codigo: 'publicacao', etapa_nome: 'Publicação', responsavel_id: 'u2', responsavel_nome: 'Bia Teste' }
const MOVEU = evento({ entidade: 'passagem', entidadeRef: 'p1', acao: 'mover', antes: MOVIMENTO_ANTES, depois: MOVIMENTO_DEPOIS })

describe('movimento, etiqueta e responsável no histórico (Andamento livre)', () => {
  test('o movimento diz de onde e para onde, e o item é o nome do processo', () => {
    expect(tituloDoEvento(MOVEU)).toBe('Moveu de Revisão interna para Publicação')
    expect(nomeDoItem(MOVEU)).toBe('Emitir Ofício')
  })

  test('o antes e o depois do movimento mostram o responsável e escondem a etapa (já está no título) e o id', () => {
    expect(descreverEstadoDoCadastro(MOVEU.antes)).toBe('Processo: Emitir Ofício; Responsável: Ana Teste')
    expect(descreverEstadoDoCadastro(MOVEU.depois)).toBe('Processo: Emitir Ofício; Responsável: Bia Teste')
  })

  test('a chegada a Concluídos mostra a data, o link e a explicação que chegaram', () => {
    const depois = { ...MOVIMENTO_DEPOIS, publicado_em: '2026-10-10', link_da_publicacao: 'https://exemplo.test/d', explicacao_sem_publicacao: 'Sem DO' }
    expect(descreverEstadoDoCadastro(depois)).toBe(
      'Processo: Emitir Ofício; Responsável: Bia Teste; Data da publicação: 10/10/2026; Link da publicação: https://exemplo.test/d; Explicação de concluir sem publicação: Sem DO')
  })

  test('mudar a etiqueta mostra a etiqueta pelo rótulo da tela', () => {
    const mudou = evento({
      entidade: 'passagem', entidadeRef: 'p1', acao: 'mudar_etiqueta', antes: { ...MOVIMENTO_ANTES, etiqueta: 'a_fazer' },
      depois: { ...MOVIMENTO_ANTES, etiqueta: 'concluido' },
    })
    expect(tituloDoEvento(mudou)).toBe('Mudou a etiqueta')
    expect(descreverEstadoDoCadastro(mudou.antes)).toBe('Processo: Emitir Ofício; Responsável: Ana Teste; Etiqueta: A fazer')
    expect(descreverEstadoDoCadastro(mudou.depois)).toBe('Processo: Emitir Ofício; Responsável: Ana Teste; Etiqueta: Concluído')
  })

  test('mudar o responsável é do processo e mostra de quem para quem', () => {
    const mudou = evento({
      entidade: 'processo', entidadeRef: 'p1', acao: 'mudar_responsavel',
      antes: { nome: 'Emitir Ofício', setor_sigla: 'TSA', responsavel_id: 'u1', responsavel_nome: 'Ana Teste' },
      depois: { nome: 'Emitir Ofício', setor_sigla: 'TSA', responsavel_id: null, responsavel_nome: null },
    })
    expect(tituloDoEvento(mudou)).toBe('Mudou o responsável')
    expect(descreverEstadoDoCadastro(mudou.antes)).toBe('Nome: Emitir Ofício; Setor: TSA; Responsável: Ana Teste')
    expect(descreverEstadoDoCadastro(mudou.depois)).toBe('Nome: Emitir Ofício; Setor: TSA; Responsável: —')
  })

  test('o movimento entra no filtro pelo processo', () => {
    expect(eventosDoItem([MOVEU], 'p1')).toEqual([MOVEU])
    expect(itensDoFiltro([MOVEU])).toEqual([{ id: 'p1', nome: 'Emitir Ofício' }])
  })

  test('o texto livre do movimento é nota', () => {
    expect(rotuloDoMotivo('mover')).toBe('Nota')
  })
})

describe('situação do processo no histórico', () => {
  test('texto de suspender, cancelar e retomar; as ações de cadastro seguem iguais', () => {
    expect(['suspender', 'cancelar', 'retomar'].map((acao) => textoDaAcaoDoCadastro(acao, 'processo')))
      .toEqual(['Suspendeu', 'Cancelou', 'Retomou'])
    expect(['criar', 'editar', 'excluir'].map((acao) => textoDaAcaoDoCadastro(acao, 'processo')))
      .toEqual(['Criou', 'Editou', 'Excluiu'])
  })

  test('o texto livre da situação se chama Motivo', () => {
    expect(['suspender', 'cancelar', 'retomar'].map(rotuloDoMotivo)).toEqual(['Motivo', 'Motivo', 'Motivo'])
  })
})

describe('arquivamento no histórico', () => {
  test('textos de arquivar e desarquivar', () => {
    expect(['arquivar', 'desarquivar'].map((acao) => textoDaAcaoDoCadastro(acao, 'processo'))).toEqual([
      'Arquivou o processo', 'Desarquivou o processo',
    ])
  })

  test('a data da publicação sai em DD/MM/AAAA', () => {
    expect(descreverEstadoDoCadastro({ publicado_em: '2026-10-17' })).toBe('Data da publicação: 17/10/2026')
  })
})

describe('publicação no histórico (ticket 04 de publicacao-e-arquivamento)', () => {
  const PROCESSO = { nome: 'Emitir Ofício', setor_sigla: 'TSA' }

  test('registrar e corrigir a publicação têm o verbo e mostram a data e o link', () => {
    expect(['registrar_publicacao', 'corrigir_publicacao'].map((acao) => textoDaAcaoDoCadastro(acao, 'processo')))
      .toEqual(['Registrou a publicação', 'Corrigiu a publicação'])
    const depois = { ...PROCESSO, publicado_em: '2026-10-10', link_da_publicacao: 'https://exemplo.test/d' }
    expect(descreverEstadoDoCadastro(depois)).toBe('Nome: Emitir Ofício; Setor: TSA; Data da publicação: 10/10/2026; Link da publicação: https://exemplo.test/d')
  })

  test('o movimento que chega com a explicação é "Concluiu sem publicação", com a explicação no depois', () => {
    const concluiu = evento({
      entidade: 'passagem', entidadeRef: 'p1', acao: 'mover', antes: MOVIMENTO_ANTES,
      depois: { ...MOVIMENTO_DEPOIS, etapa_nome: 'Concluídos', explicacao_sem_publicacao: 'Não será divulgado' },
    })
    expect(tituloDoEvento(concluiu)).toBe('Concluiu sem publicação')
    expect(descreverEstadoDoCadastro(concluiu.depois)).toContain('Explicação de concluir sem publicação: Não será divulgado')
  })

  test('sair de Concluídos mostra a explicação apagada no antes e continua "Moveu"', () => {
    const saiu = evento({
      entidade: 'passagem', entidadeRef: 'p1', acao: 'mover',
      antes: { ...MOVIMENTO_DEPOIS, etapa_nome: 'Concluídos', explicacao_sem_publicacao: 'Não será divulgado' },
      depois: MOVIMENTO_ANTES,
    })
    expect(tituloDoEvento(saiu)).toBe('Moveu de Concluídos para Revisão interna')
    expect(descreverEstadoDoCadastro(saiu.antes)).toContain('Explicação de concluir sem publicação: Não será divulgado')
  })
})

describe('reclassificação no histórico', () => {
  test('"Reclassificou", com o texto livre chamado Motivo', () => {
    expect(textoDaAcaoDoCadastro('reclassificar', 'processo')).toBe('Reclassificou')
    expect(rotuloDoMotivo('reclassificar')).toBe('Motivo')
  })

  test('o tipo sai pelo rótulo da tela e o pai, pelo nome', () => {
    expect(descreverEstadoDoCadastro({ tipo: 'subprocesso', processo_pai_nome: 'Emitir Ofício' }))
      .toBe('Tipo: Subprocesso; Processo pai: Emitir Ofício')
  })
})

describe('registros antigos de responsável do setor (recurso retirado da plataforma)', () => {
  const RESPONSAVEL = { setor_id: 's1', setor_sigla: 'CEE', nome: 'Pessoa Fictícia', email: 'pessoa@exemplo.com', cargo: null }
  const criado = evento({ entidade: 'responsavel_do_setor', entidadeRef: 's1:r1', depois: RESPONSAVEL })

  test('o item é a linha simples, e a ação usa o texto comum', () => {
    expect(nomeDoItem(criado)).toBe('Registro de responsável do setor (recurso retirado da plataforma)')
    expect(textoDaAcaoDoCadastro('criar', 'responsavel_do_setor')).toBe('Criou')
    expect(ehRegistroRetirado(criado)).toBe(true)
    expect(ehRegistroRetirado(evento({ entidade: 'setor', entidadeRef: 's1' }))).toBe(false)
  })

  test('fica fora da lista do filtro, mas aparece quando o setor é escolhido', () => {
    expect(itensDoFiltro([criado])).toEqual([])
    expect(eventosDoItem([criado], 's1')).toEqual([criado])
  })

  test('a exclusão antiga do setor ainda lista os responsáveis pelo nome', () => {
    expect(descreverEstadoDoCadastro({ sigla: 'CEE', responsaveis: [RESPONSAVEL, { nome: 'Outra Fictícia' }] }))
      .toBe('Sigla: CEE; Responsáveis: Pessoa Fictícia, Outra Fictícia')
    expect(descreverEstadoDoCadastro({ sigla: 'CEE', responsaveis: [] })).toBe('Sigla: CEE; Responsáveis: nenhum')
  })
})

describe('processos', () => {
  const PROCESSO = {
    nome: 'Emitir Ofício', setor_id: 's1', setor_sigla: 'TSA', macroprocesso_id: 'm1', macroprocesso_nome: 'Macro A',
    tipo: 'a_classificar', origem: 'novo', situacao: 'em_andamento', contexto: null, observacoes: null,
  }
  const criado = evento({ entidade: 'processo', entidadeRef: 'p1', depois: PROCESSO })

  test('o item é a sigla do setor e o nome (e não o par setor e macroprocesso dos vínculos)', () => {
    expect(nomeDoItem(criado)).toBe('TSA — Emitir Ofício')
    expect(nomeDoItem(evento({ entidade: 'processo', entidadeRef: 'p1', acao: 'excluir', antes: PROCESSO }))).toBe('TSA — Emitir Ofício')
  })

  test('os campos aparecem legíveis, com tipo, origem e situação pelo rótulo da tela', () => {
    expect(descreverEstadoDoCadastro(PROCESSO)).toBe(
      'Nome: Emitir Ofício; Setor: TSA; Macroprocesso: Macro A; Tipo: A classificar; Origem: Novo; Situação: Em andamento; Contexto: —; Observações: —')
    expect(textoDaAcaoDoCadastro('criar', 'processo')).toBe('Criou')
    expect(textoDaAcaoDoCadastro('excluir', 'processo')).toBe('Excluiu')
  })

  test('a exclusão traz a etapa atual, a etiqueta e o responsável do processo', () => {
    expect(descreverEstadoDoCadastro({ nome: 'Emitir Ofício', etapa_codigo: 'publicacao', etapa_nome: 'Publicação', etiqueta: 'em_andamento', responsavel_nome: 'Ana Teste' }))
      .toBe('Nome: Emitir Ofício; Etiqueta: Em andamento; Responsável: Ana Teste')
  })

  test('o processo excluído continua no filtro pelo nome', () => {
    const excluido = evento({ entidade: 'processo', entidadeRef: 'p1', acao: 'excluir', antes: PROCESSO })
    expect(itensDoFiltro([excluido])).toEqual([{ id: 'p1', nome: 'TSA — Emitir Ofício' }])
    expect(eventosDoItem([excluido, criado], 'p1')).toHaveLength(2)
  })
})

describe('registros antigos de reunião (recurso retirado da plataforma)', () => {
  const REUNIAO_ANTIGA = { tipo: 'modelagem', data: '2026-10-14', setor_sigla: 'TSA', hora: null, local: 'Sala 1' }

  test('o item é a linha simples, com ou sem o estado de antes', () => {
    const criada = evento({ entidade: 'reuniao', entidadeRef: 'r1', depois: REUNIAO_ANTIGA })
    const excluida = evento({ entidade: 'reuniao', entidadeRef: 'r1', acao: 'excluir', antes: REUNIAO_ANTIGA })
    expect(nomeDoItem(criada)).toBe('Registro de reunião (recurso retirado da plataforma)')
    expect(nomeDoItem(excluida)).toBe('Registro de reunião (recurso retirado da plataforma)')
  })

  test('a ação usa o texto comum', () => {
    expect(textoDaAcaoDoCadastro('criar', 'reuniao')).toBe('Criou')
  })

  test('fica fora do filtro de itens, porque todas teriam o mesmo nome', () => {
    const reuniao = evento({ entidade: 'reuniao', entidadeRef: 'r1', depois: REUNIAO_ANTIGA })
    const setor = evento({ entidade: 'setor', entidadeRef: 's1', depois: SETOR })
    expect(itensDoFiltro([reuniao, setor])).toEqual([{ id: 's1', nome: 'CEE — Escola Fictícia' }])
  })
})

// Os eventos gravados antes da troca de nome guardam a chave antiga (data_da_reuniao) e não são reescritos.
describe.each(['data_da_modelagem_piloto', 'data_da_reuniao'])('Data da modelagem piloto no estado do processo (chave %s)', (chave) => {
  test('aparece com o rótulo da tela e a data em DD/MM/AAAA', () => {
    expect(descreverEstadoDoCadastro({ [chave]: '2026-10-20' })).toBe('Data da modelagem piloto: 20/10/2026')
    expect(descreverEstadoDoCadastro({ [chave]: null })).toBe('Data da modelagem piloto: —')
  })
})
