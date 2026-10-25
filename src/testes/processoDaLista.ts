import type { EtapaDoCatalogo, ProcessoDaLista, ProcessoLido } from '../processos/tipos'

/** O catálogo de teste do Andamento livre: as duas fixas nas pontas e seis de trabalho entre elas. */
export const CATALOGO_DE_TESTE: EtapaDoCatalogo[] = [
  { id: 'e1', codigo: 'nao_iniciados', nome: 'Não iniciados', ordem: 1, ativa: true },
  { id: 'e2', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 2, ativa: true },
  { id: 'e3', codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', ordem: 3, ativa: true },
  { id: 'e4', codigo: 'revisao_interna', nome: 'Revisão interna', ordem: 4, ativa: true },
  { id: 'e5', codigo: 'revisao_setor', nome: 'Validação com o setor', ordem: 5, ativa: true },
  { id: 'e6', codigo: 'aprovacao_setor', nome: 'Aprovação pelo setor', ordem: 6, ativa: true },
  { id: 'e7', codigo: 'publicacao', nome: 'Publicação', ordem: 7, ativa: true },
  { id: 'e8', codigo: 'concluidos', nome: 'Concluídos', ordem: 8, ativa: true },
]

/** A etapa atual de um processo, com a posição e o total entre as etapas ativas do catálogo. */
export function etapaAtualDe(codigo: string, catalogo: EtapaDoCatalogo[] = CATALOGO_DE_TESTE): NonNullable<ProcessoDaLista['etapaAtual']> {
  const ativas = catalogo.filter((etapa) => etapa.ativa)
  const indice = ativas.findIndex((etapa) => etapa.codigo === codigo)
  const etapa = ativas[indice]
  return { id: etapa.id, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, posicao: indice + 1, total: ativas.length }
}

/** Um processo inventado para os testes de funções puras: em andamento, em Revisão interna, com Ana como responsável. */
export function umProcesso(nome = 'Emitir Ofício', mudancas: Partial<ProcessoDaLista> = {}, etapa = 'revisao_interna'): ProcessoDaLista {
  return {
    id: nome, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro de Teste',
    processoPaiId: null, situacao: 'em_andamento', etapaAtual: etapaAtualDe(etapa), etiqueta: 'a_fazer',
    entrouNaEtapaEm: '2026-10-19', responsavel: { id: 'u1', nome: 'Ana', fotoUrl: null }, ...mudancas,
  }
}

/** Um processo lido inventado (o verso): como `umProcesso`, mais o que só a leitura traz. */
export function umProcessoLido(nome = 'Emitir Ofício', mudancas: Partial<ProcessoLido> = {}, etapa = 'revisao_interna'): ProcessoLido {
  return {
    ...umProcesso(nome, {}, etapa), origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null, processoPai: null,
    subprocessos: [], etapasDoVerso: [], dataDaReuniao: null, ultimaVersao: null, ...mudancas,
  }
}
