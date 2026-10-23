// Cenário inventado dos testes das duas planilhas: sete processos que entram (comum, subprocesso, a classificar,
// suspenso, publicado, não publicado, arquivado) e um cancelado que fica de fora. O arquivado não tem campo próprio no
// pacote: ele chega como concluído (a view não muda a situação ao arquivar). Só os testes importam este arquivo.
import { andamentosDe, pacoteDe, processoDe, type Marca } from './planilhasExemplos.ts'
import type { AndamentoDoPacote, PacoteDasPlanilhas, ProcessoDoPacote, StatusDaEtapa } from './planilhasPacote.ts'

type Marcas = Record<string, StatusDaEtapa | Marca>

const CONCLUIDAS_ATE_A_VI: Marcas = {
  modelagem: { status: 'concluida', resolvida_em: '2026-03-01' },
  relatorio_modelagem_tecnica: { status: 'concluida', resolvida_em: '2026-04-01' },
  revisao_interna: { status: 'concluida', resolvida_em: '2026-05-01' },
  revisao_setor: { status: 'concluida', resolvida_em: '2026-05-10' },
  aprovacao_setor: { status: 'concluida', resolvida_em: '2026-06-01' },
}

interface Item {
  processo: ProcessoDoPacote
  marcas: Marcas
}

// O responsável não existe no tipo do pacote: se um dia vazar para o pacote, o teste pega.
function processoComum(): ProcessoDoPacote {
  const campos = { nome: 'Comum', observacoes: 'Obs inventada', data_da_reuniao: '2026-02-20', ultima_versao: 3 }
  return { ...processoDe(1, campos), responsavel: 'Fulana Secreta' } as ProcessoDoPacote
}

// Os três concluídos: publicado, não publicado (escolha "não") e arquivado (concluído e publicado).
function itensConcluidos(): Item[] {
  return [
    {
      processo: processoDe(5, { nome: 'Publicado', concluido: true, setor_sigla: 'SE3', ultima_versao: 7, vai_para_publicacao: true }),
      marcas: { ...CONCLUIDAS_ATE_A_VI, publicacao: { status: 'concluida', resolvida_em: '2026-07-01' } },
    },
    {
      processo: processoDe(6, { nome: 'Nao publicado', concluido: true, vai_para_publicacao: false }),
      marcas: CONCLUIDAS_ATE_A_VI,
    },
    {
      processo: processoDe(8, { nome: 'Arquivado', concluido: true, vai_para_publicacao: true }),
      marcas: { ...CONCLUIDAS_ATE_A_VI, publicacao: { status: 'concluida', resolvida_em: '2026-07-03' } },
    },
  ]
}

function itens(): Item[] {
  return [
    { processo: processoComum(), marcas: { modelagem: 'em_andamento' } },
    { processo: processoDe(2, { nome: 'Sub', tipo: 'subprocesso', setor_sigla: 'SE2' }), marcas: {} },
    { processo: processoDe(3, { nome: 'Classif', tipo: 'a_classificar', setor_sigla: 'SE2' }), marcas: {} },
    {
      processo: processoDe(4, { nome: 'Suspenso', situacao_guardada: 'suspenso', setor_sigla: 'SE3' }),
      marcas: { modelagem: { status: 'concluida', resolvida_em: '2026-03-05' } },
    },
    ...itensConcluidos(),
    { processo: processoDe(7, { nome: 'Cancelado', situacao_guardada: 'cancelado', setor_sigla: 'SE9' }), marcas: { modelagem: 'em_andamento' } },
  ]
}

export function pacoteDoCenario(): PacoteDasPlanilhas {
  const lista = itens()
  const andamentos: AndamentoDoPacote[] = lista.flatMap(({ processo, marcas }) => andamentosDe(processo, marcas))
  // Um nome de pessoa no andamento também não pode chegar às linhas (o tipo do pacote não tem esse campo).
  const comNome = andamentos.map((andamento) => ({ ...andamento, responsavel_nome: 'Fulana Secreta' }))
  return pacoteDe(lista.map((item) => item.processo), comNome)
}
