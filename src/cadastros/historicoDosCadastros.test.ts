import { describe, expect, test } from 'vitest'
import {
  descreverEstadoDoCadastro, ehRegistroRetirado, eventosDoItem, itensDoFiltro, nomeDoItem, rotuloDoMotivo, textoDaAcaoDoCadastro,
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


const ETAPA_PENDENTE = {
  setor_id: 's1', setor_sigla: 'TSA', etapa_codigo: 'sensibilizacao', etapa_nome: 'Reunião de sensibilização',
  status: 'pendente', iniciada_em: null, resolvida_em: null,
}
const ETAPA_DISPENSADA: EventoDoCadastro = {
  id: 20, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'dispensar', entidade: 'andamento',
  entidadeRef: 's1:a2', antes: ETAPA_PENDENTE,
  depois: { ...ETAPA_PENDENTE, status: 'dispensada', resolvida_em: '2026-10-13' }, motivo: 'Setor já conhecido',
}

describe('registros antigos de etapa do setor (recurso retirado da plataforma)', () => {
  test('texto de cada ação', () => {
    expect(['iniciar', 'concluir', 'dispensar', 'registrar_realizada'].map((acao) => textoDaAcaoDoCadastro(acao, 'andamento')))
      .toEqual(['Iniciou a etapa', 'Concluiu a etapa', 'Dispensou a etapa', 'Registrou a etapa como realizada anteriormente'])
  })

  test('o andamento sem processo é a linha simples; o do processo continua com o nome da etapa', () => {
    expect(nomeDoItem(ETAPA_DISPENSADA)).toBe('Registro de etapa do setor (recurso retirado da plataforma)')
    expect(ehRegistroRetirado(ETAPA_DISPENSADA)).toBe(true)
    const doProcesso = evento({ entidade: 'andamento', entidadeRef: 'p1:a4', depois: { processo_id: 'p1', etapa_nome: 'Modelagem piloto' } })
    expect(ehRegistroRetirado(doProcesso)).toBe(false)
  })

  test('o evento continua no filtro pelo setor', () => {
    expect(itensDoFiltro([ETAPA_DISPENSADA])).toEqual([{ id: 's1', nome: 'TSA' }])
    expect(eventosDoItem([ETAPA_DISPENSADA], 's1')).toEqual([ETAPA_DISPENSADA])
  })
})

describe('voltar, datas e responsável da etapa no histórico', () => {
  test('texto de cada ação', () => {
    expect(['voltar', 'corrigir_datas', 'mudar_responsavel'].map((acao) => textoDaAcaoDoCadastro(acao, 'andamento')))
      .toEqual(['Voltou à etapa', 'Corrigiu as datas da etapa', 'Mudou o responsável da etapa'])
  })

  test('antes e depois mostram o responsável pelo nome; sem responsável nos dois, o campo nem aparece', () => {
    expect(descreverEstadoDoCadastro({ ...ETAPA_PENDENTE, responsavel_nome: 'Ana Teste' }))
      .toBe('Setor: TSA; Situação da etapa: Pendente; Início: —; Conclusão: —; Responsável: Ana Teste')
    expect(descreverEstadoDoCadastro({ ...ETAPA_PENDENTE, responsavel_nome: null }))
      .toContain('Responsável: —')
    expect(descreverEstadoDoCadastro(ETAPA_PENDENTE)).not.toContain('Responsável')
  })

  test('o motivo da volta se chama Motivo; a nota das outras ações, Nota', () => {
    expect(rotuloDoMotivo('voltar')).toBe('Motivo')
    expect(rotuloDoMotivo('dispensar')).toBe('Nota')
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

  test('o evento de etapa de processo traz o processo no nome do item e nos campos, sem o id', () => {
    const depois = {
      processo_id: 'p1', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', etapa_codigo: 'modelagem',
      etapa_nome: 'Reunião de modelagem', status: 'em_andamento', iniciada_em: '2026-10-14', resolvida_em: null,
    }
    expect(nomeDoItem(evento({ entidade: 'andamento', entidadeRef: 'p1:a4', acao: 'iniciar', depois })))
      .toBe('Reunião de modelagem — Emitir Ofício')
    expect(descreverEstadoDoCadastro(depois)).toBe(
      'Processo: Emitir Ofício; Setor: TSA; Situação da etapa: Em andamento; Início: 14/10/2026; Conclusão: —')
  })

  test('os campos aparecem legíveis, com tipo, origem e situação pelo rótulo da tela', () => {
    expect(descreverEstadoDoCadastro(PROCESSO)).toBe(
      'Nome: Emitir Ofício; Setor: TSA; Macroprocesso: Macro A; Tipo: A classificar; Origem: Novo; Situação: Em andamento; Contexto: —; Observações: —')
    expect(textoDaAcaoDoCadastro('criar', 'processo')).toBe('Criou')
    expect(textoDaAcaoDoCadastro('excluir', 'processo')).toBe('Excluiu')
  })

  test('a exclusão lista as etapas do processo com o nome e o status', () => {
    const andamentos = [
      { etapa_codigo: 'modelagem', etapa_nome: 'Reunião de modelagem', status: 'concluida' },
      { etapa_codigo: 'revisao_interna', etapa_nome: 'Revisão interna', status: 'pendente' },
    ]
    expect(descreverEstadoDoCadastro({ nome: 'Emitir Ofício', andamentos }))
      .toBe('Nome: Emitir Ofício; Etapas: Reunião de modelagem (Concluída), Revisão interna (Pendente)')
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

describe('data da reunião no estado do processo', () => {
  test('aparece com o rótulo da tela e a data em DD/MM/AAAA', () => {
    expect(descreverEstadoDoCadastro({ data_da_reuniao: '2026-10-20' })).toBe('Reunião de modelagem piloto: 20/10/2026')
    expect(descreverEstadoDoCadastro({ data_da_reuniao: null })).toBe('Reunião de modelagem piloto: —')
  })
})
