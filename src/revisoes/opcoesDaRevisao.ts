import { diaDeBrasilia, formatarData } from '../lib/datas'
import type { UltimaVersao } from '../processos/tipos'
import { ROTULO_DO_ESCOPO } from './frasesDeRevisao'
import type { Aprovacao, ResultadoDaRevisao, RevisaoInterna } from './tipos'
import { versoesDaRevisao } from './versoesDaRevisao'

export const MOTIVO_SEM_VERSAO_NA_PASSAGEM = 'Nenhuma versão foi enviada desde que o processo entrou na Revisão interna.'
export const MOTIVO_SEM_VERSAO = 'O processo ainda não tem versão.'

export type OpcaoDoResultado = { resultado: ResultadoDaRevisao; rotulo: string; desabilitada: boolean; motivo: string | null }

/**
 * As duas opções da janela de revisão, com a versão de cada uma ("Sem alteração: vale para a V7"; "Corrigida: a V8 corrige
 * a V7"). "Corrigida" fica desabilitada, com o motivo, sem versão enviada nesta passagem (ou sem anterior a ela).
 */
export function opcoesDoResultado(ultima: UltimaVersao | null): OpcaoDoResultado[] {
  const sem = versoesDaRevisao(ultima, 'sem_alteracao')
  const corrigida = versoesDaRevisao(ultima, 'corrigida')
  const motivo = ultima === null ? MOTIVO_SEM_VERSAO : MOTIVO_SEM_VERSAO_NA_PASSAGEM
  return [
    {
      resultado: 'sem_alteracao', rotulo: sem ? `Sem alteração: vale para a V${sem.revisada}` : 'Sem alteração',
      desabilitada: sem === null, motivo: sem ? null : motivo,
    },
    {
      resultado: 'corrigida', rotulo: corrigida ? `Corrigida: a V${corrigida.corrigida} corrige a V${corrigida.revisada}` : 'Corrigida',
      desabilitada: corrigida === null, motivo: corrigida ? null : motivo,
    },
  ]
}

/**
 * O aviso amarelo da janela (não impede nada): quem está na tela enviou a versão que a opção escolhida revisa. Na "sem
 * alteração" é a mais recente; na "corrigida", a anterior à corrigida (a corrigida é de quem revisa).
 */
export function avisoDoAutorDaRevisao(ultima: UltimaVersao | null, resultado: ResultadoDaRevisao, usuarioId: string): string | null {
  const versoes = versoesDaRevisao(ultima, resultado)
  if (ultima === null || versoes === null) return null
  const autor = resultado === 'sem_alteracao' ? ultima.autorId : ultima.anterior?.autorId
  return autor === usuarioId ? `Você enviou a V${versoes.revisada}. A revisão interna deveria ser de outra pessoa.` : null
}

/** O aviso da janela de aprovação quando já há uma: a nova toma o lugar dela (a anterior fica no histórico). */
export function avisoDaAprovacaoSubstituida(anterior: Aprovacao | null): string | null {
  if (anterior === null) return null
  return `Esta aprovação toma o lugar da aprovação da V${anterior.versao}, registrada em ${formatarData(diaDeBrasilia(anterior.registradaEm))}.`
}

/** O resumo do registro da passagem no Agora: "Sem alteração · V7 · Ana" ou "Corrigida · V8 corrige a V7 · fluxograma". */
export function resumoDaRevisao(revisao: RevisaoInterna): string {
  if (revisao.resultado === 'sem_alteracao') {
    return ['Sem alteração', `V${revisao.versaoRevisada}`, revisao.revisor].filter(Boolean).join(' · ')
  }
  const escopo = revisao.escopo ? ROTULO_DO_ESCOPO[revisao.escopo].toLowerCase() : null
  return ['Corrigida', `V${revisao.versaoCorrigida} corrige a V${revisao.versaoRevisada}`, escopo].filter(Boolean).join(' · ')
}

/** O resumo da aprovação no Agora: "V8 aprovada · E-protocolo PROT-1" (sem número, só "V8 aprovada"). */
export function resumoDaAprovacao(aprovacao: Aprovacao): string {
  return aprovacao.numeroEprotocolo ? `V${aprovacao.versao} aprovada · E-protocolo ${aprovacao.numeroEprotocolo}` : `V${aprovacao.versao} aprovada`
}
