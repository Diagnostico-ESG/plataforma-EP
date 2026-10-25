// Cenário inventado dos testes das duas planilhas: oito processos, seis que entram (comum, subprocesso, a classificar,
// publicado, concluído sem publicação e arquivado) e dois que ficam de fora (suspenso e cancelado). O arquivado não
// tem campo próprio no pacote: ele chega em Concluídos, como o concluído. Só os testes importam este arquivo.
import { pacoteDe, processoNaTrilha, type PassoDaTrilha, type ProcessoComPassagens } from './planilhasExemplos.ts'
import type { PacoteDasPlanilhas, PassagemDoPacote, ProcessoDoPacote } from './planilhasPacote.ts'

const passo = (etapa: string, dia: string, extra: Partial<PassoDaTrilha> = {}): PassoDaTrilha => ({
  etapa,
  entrou: `${dia}T12:00:00Z`,
  ...extra,
})

const ATE_A_APROVACAO = [
  passo('nao_iniciados', '2026-02-01'),
  passo('modelagem', '2026-03-01'),
  passo('relatorio_modelagem_tecnica', '2026-04-01'),
  passo('revisao_interna', '2026-05-01'),
  passo('revisao_setor', '2026-05-10'),
  passo('aprovacao_setor', '2026-06-01', { etiqueta: 'concluido', concluidoEm: '2026-06-02T12:00:00Z' }),
]
// Da aprovação a Concluídos: IV conclui em 2026-04-01, V em 2026-05-01, VI em 2026-06-02.
const ATE_CONCLUIDOS = [...ATE_A_APROVACAO, passo('publicacao', '2026-06-20'), passo('concluidos', '2026-07-02')]

function itens(): ProcessoComPassagens[] {
  const campos = { nome: 'Comum', observacoes: 'Obs inventada', data_da_modelagem_piloto: '2026-02-20', ultima_versao: 3 }
  const emModelagem = [passo('nao_iniciados', '2026-02-01'), passo('modelagem', '2026-03-01', { etiqueta: 'em_andamento' })]
  return [
    processoNaTrilha(1, emModelagem, campos),
    processoNaTrilha(2, [passo('nao_iniciados', '2026-02-01')], { nome: 'Sub', tipo: 'subprocesso', setor_sigla: 'SE2' }),
    processoNaTrilha(3, [passo('nao_iniciados', '2026-02-01')], { nome: 'Classif', tipo: 'a_classificar', setor_sigla: 'SE2' }),
    processoNaTrilha(4, ATE_A_APROVACAO.slice(0, 3), { nome: 'Suspenso', situacao_guardada: 'suspenso', setor_sigla: 'SE3' }),
    processoNaTrilha(5, ATE_CONCLUIDOS, { nome: 'Publicado', setor_sigla: 'SE3', ultima_versao: 7, publicado_em: '2026-07-01' }),
    processoNaTrilha(6, ATE_CONCLUIDOS, { nome: 'Nao publicado' }),
    processoNaTrilha(7, emModelagem, { nome: 'Cancelado', situacao_guardada: 'cancelado', setor_sigla: 'SE9' }),
    processoNaTrilha(8, ATE_CONCLUIDOS, { nome: 'Arquivado', publicado_em: '2026-07-03' }),
  ]
}

// Um nome de pessoa no processo e na passagem não pode chegar às linhas (o tipo do pacote não tem esse campo).
function comPessoa({ processo, passagens }: ProcessoComPassagens): ProcessoComPassagens {
  return {
    processo: { ...processo, responsavel: 'Fulana Secreta' } as ProcessoDoPacote,
    passagens: passagens.map((passagem) => ({ ...passagem, movido_por: 'Fulana Secreta' }) as PassagemDoPacote),
  }
}

export function pacoteDoCenario(): PacoteDasPlanilhas {
  return pacoteDe(itens().map(comPessoa))
}
