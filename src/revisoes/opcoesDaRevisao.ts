import { diaDeBrasilia, formatarData } from '../lib/datas'
import type { ProcessoLido } from '../processos/tipos'
import type { Aprovacao, EtapaDaRevisao, ResultadoDaRevisao, RevisaoInterna } from './tipos'
import { type ContextoDaRevisao, type LigacoesDaRevisao, ligacoesDaRevisao } from './versoesDaRevisao'

export type { ContextoDaRevisao } from './versoesDaRevisao'

export const MOTIVO_SEM_VERSAO_NA_PASSAGEM = 'Nada foi enviado desde que o processo entrou nesta etapa.'
export const MOTIVO_SEM_VERSAO = 'O processo ainda não tem versão.'
export const MOTIVO_SEM_RELATORIO = 'O processo ainda não tem relatório numerado.'

/** O contexto da janela a partir do processo lido: a etapa da revisão e o que o processo tem a revisar. */
export function contextoDoProcesso(processo: Pick<ProcessoLido, 'ultimaVersao' | 'ultimoRelatorio'>, etapa: EtapaDaRevisao): ContextoDaRevisao {
  return { etapa, ultimaVersao: processo.ultimaVersao, ultimoRelatorio: processo.ultimoRelatorio ?? null }
}

export type OpcaoDoResultado = { resultado: ResultadoDaRevisao; rotulo: string; desabilitada: boolean; motivo: string | null }

/** "a V8 corrige a V7; o Relatório V2 corrige o Relatório V1": o que a "corrigida" liga, versão e relatório. */
function frasesDaCorrecao({ versao, relatorio }: LigacoesDaRevisao): string {
  return [
    versao?.corrigida ? `a V${versao.corrigida} corrige a V${versao.revisada}` : null,
    relatorio?.corrigido ? `o Relatório V${relatorio.corrigido} corrige o Relatório V${relatorio.revisado}` : null,
  ].filter(Boolean).join('; ')
}

function alvoDaSemAlteracao({ versao, relatorio }: LigacoesDaRevisao): string {
  return relatorio ? `o Relatório V${relatorio.revisado}` : `a V${versao?.revisada}`
}

/**
 * As duas opções da janela de revisão (ADR 0046), com o que cada uma liga: "Sem alteração: vale para a V7" (fluxograma) ou
 * "… para o Relatório V1" (relatório); "Corrigida: a V8 corrige a V7", "… o Relatório V2 corrige o Relatório V1" ou as duas.
 * "Corrigida" fica desabilitada, com o motivo, quando nada foi enviado nesta passagem.
 */
export function opcoesDoResultado(contexto: ContextoDaRevisao): OpcaoDoResultado[] {
  const sem = ligacoesDaRevisao(contexto, 'sem_alteracao')
  const corrigida = ligacoesDaRevisao(contexto, 'corrigida')
  const motivoDaSem = contexto.etapa === 'revisao_relatorio' ? MOTIVO_SEM_RELATORIO : MOTIVO_SEM_VERSAO
  return [
    {
      resultado: 'sem_alteracao', rotulo: sem ? `Sem alteração: vale para ${alvoDaSemAlteracao(sem)}` : 'Sem alteração',
      desabilitada: sem === null, motivo: sem ? null : motivoDaSem,
    },
    {
      resultado: 'corrigida', rotulo: corrigida ? `Corrigida: ${frasesDaCorrecao(corrigida)}` : 'Corrigida',
      desabilitada: corrigida === null, motivo: corrigida ? null : MOTIVO_SEM_VERSAO_NA_PASSAGEM,
    },
  ]
}

/**
 * O aviso amarelo da janela (não impede nada): quem está na tela enviou o que a opção escolhida revisa. Na Revisão do
 * fluxograma, a versão revisada; na do relatório, o relatório revisado. Na "corrigida", é o anterior ao corrigido (o
 * corrigido é de quem revisa).
 */
export function avisoDoAutorDaRevisao(contexto: ContextoDaRevisao, resultado: ResultadoDaRevisao, usuarioId: string): string | null {
  const ligacoes = ligacoesDaRevisao(contexto, resultado)
  if (ligacoes === null) return null
  return contexto.etapa === 'revisao_relatorio'
    ? avisoDoRelatorio(contexto, ligacoes, usuarioId) : avisoDaVersao(contexto, ligacoes, usuarioId)
}

function avisoDaVersao({ ultimaVersao }: ContextoDaRevisao, { versao }: LigacoesDaRevisao, usuarioId: string): string | null {
  if (ultimaVersao === null) return null
  const autor = versao?.corrigida ? ultimaVersao.anterior?.autorId : ultimaVersao.autorId
  const numero = versao?.revisada ?? ultimaVersao.numero
  return autor === usuarioId ? `Você enviou a V${numero}. A revisão do fluxograma deveria ser de outra pessoa.` : null
}

function avisoDoRelatorio({ ultimoRelatorio }: ContextoDaRevisao, { relatorio }: LigacoesDaRevisao, usuarioId: string): string | null {
  if (!ultimoRelatorio || relatorio === null) return null
  const autor = relatorio.corrigido ? ultimoRelatorio.anterior?.autorId : ultimoRelatorio.autorId
  return autor === usuarioId ? `Você enviou o Relatório V${relatorio.revisado}. A revisão do relatório deveria ser de outra pessoa.` : null
}

/** O aviso da janela de aprovação quando já há uma: a nova toma o lugar dela (a anterior fica no histórico). */
export function avisoDaAprovacaoSubstituida(anterior: Aprovacao | null): string | null {
  if (anterior === null) return null
  return `Esta aprovação toma o lugar da aprovação da V${anterior.versao}, registrada em ${formatarData(diaDeBrasilia(anterior.registradaEm))}.`
}

/** O que a revisão revisou, como o Agora e a gaveta o dizem: "Relatório V1" na revisão do relatório, "V7" na do fluxograma. */
export function alvoDaRevisao(revisao: RevisaoInterna): string {
  return revisao.etapa === 'revisao_relatorio' && revisao.relatorioRevisado
    ? `Relatório V${revisao.relatorioRevisado}` : `V${revisao.versaoRevisada}`
}

/** "Editar a revisão da V7" ou "Editar a revisão do Relatório V1": o título da janela e o nome do botão na gaveta. */
export function tituloDaEdicao(revisao: RevisaoInterna): string {
  const alvo = alvoDaRevisao(revisao)
  return alvo.startsWith('Relatório') ? `Editar a revisão do ${alvo}` : `Editar a revisão da ${alvo}`
}

/**
 * O resumo do registro da passagem no Agora: "Sem alteração · V7 · Ana", "Sem alteração · Relatório V1 · Ana" ou "Corrigida ·
 * V8 corrige a V7; Relatório V2 corrige o Relatório V1" (o que foi corrigido já diz o escopo).
 */
export function resumoDaRevisao(revisao: RevisaoInterna): string {
  if (revisao.resultado === 'sem_alteracao') return ['Sem alteração', alvoDaRevisao(revisao), revisao.revisor].filter(Boolean).join(' · ')
  const frases = [
    revisao.versaoCorrigida ? `V${revisao.versaoCorrigida} corrige a V${revisao.versaoRevisada}` : null,
    revisao.relatorioCorrigido ? `Relatório V${revisao.relatorioCorrigido} corrige o Relatório V${revisao.relatorioRevisado}` : null,
  ].filter(Boolean).join('; ')
  return `Corrigida · ${frases}`
}

/** O resumo da aprovação no Agora: "V8 aprovada · E-protocolo PROT-1" (sem número, só "V8 aprovada"). */
export function resumoDaAprovacao(aprovacao: Aprovacao): string {
  return aprovacao.numeroEprotocolo ? `V${aprovacao.versao} aprovada · E-protocolo ${aprovacao.numeroEprotocolo}` : `V${aprovacao.versao} aprovada`
}
