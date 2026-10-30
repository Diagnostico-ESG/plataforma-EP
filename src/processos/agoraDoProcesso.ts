import { CODIGO_DA_REVISAO_INTERNA } from './codigosDasEtapas'
import { diasDoProcessoNaEtapa, passouDoLimite, textoDosDias } from './diasNaEtapa'
import { ROTULO_DA_ETIQUETA } from './rotulos'
import { pessoaDaOpcao } from './pessoaDaOpcao'
import type { PessoaDaOpcao, ProcessoLido, UsuarioResponsavel } from './tipos'

/** O rótulo do cartão Agora: a posição da etapa atual entre as etapas ativas ("etapa 2 de 8"). */
export function rotuloDoAgora(posicao: number, total: number): string {
  return `Agora · etapa ${posicao} de ${total}`
}

export type OpcaoDeResponsavel = { valor: string; rotulo: string; desabilitada?: boolean; pessoa?: PessoaDaOpcao }

function opcaoDePessoa(usuario: UsuarioResponsavel, rotulo: string): OpcaoDeResponsavel {
  return { valor: usuario.id, rotulo, pessoa: pessoaDaOpcao(usuario) }
}

type DadosDoResponsavel = Pick<ProcessoLido, 'responsavel' | 'cartao'>

/** O nome que o Agora mostra, com "(Inativo)" para quem foi desativado; null sem responsável. */
export function nomeDoResponsavel({ responsavel, cartao }: DadosDoResponsavel): string | null {
  if (responsavel === null) return null
  return cartao?.responsavelAtivo === false ? `${responsavel.nome} (Inativo)` : responsavel.nome
}

// O responsável que já não está na lista (foi desativado) continua visível, marcado, e não se escolhe de novo.
function responsavelForaDaLista(processo: DadosDoResponsavel, usuarios: UsuarioResponsavel[]): OpcaoDeResponsavel[] {
  const { responsavel } = processo
  if (responsavel === null || usuarios.some((usuario) => usuario.id === responsavel.id)) return []
  const desabilitada = processo.cartao?.responsavelAtivo === false
  return [{ valor: responsavel.id, rotulo: nomeDoResponsavel(processo) ?? responsavel.nome, desabilitada, pessoa: pessoaDaOpcao(responsavel) }]
}

/**
 * A lista da troca do responsável: quem está na tela primeiro, com "(você)"; os demais; o responsável atual que já não
 * está na lista (desativado) e, por último, "Ninguém por enquanto" (valor "").
 */
export function opcoesDeResponsavel(processo: DadosDoResponsavel, usuarios: UsuarioResponsavel[], usuarioId: string): OpcaoDeResponsavel[] {
  const eu = usuarios.filter((usuario) => usuario.id === usuarioId).map((usuario) => opcaoDePessoa(usuario, `${usuario.nome} (você)`))
  const outros = usuarios.filter((usuario) => usuario.id !== usuarioId).map((usuario) => opcaoDePessoa(usuario, usuario.nome))
  return [...eu, ...outros, ...responsavelForaDaLista(processo, usuarios), { valor: '', rotulo: 'Ninguém por enquanto' }]
}

/** [Assumir] aparece sempre que quem está na tela não é o responsável do processo. */
export function podeAssumir({ responsavel }: Pick<ProcessoLido, 'responsavel'>, usuarioId: string): boolean {
  return responsavel?.id !== usuarioId
}

/**
 * O aviso amarelo do revisor (ADR 0023): na Revisão interna, o responsável é quem enviou a versão mais recente não
 * histórica. Não impede nada; some quando a condição deixa de valer.
 */
export function avisoDoRevisor({ etapaAtual, responsavel, ultimaVersao }: Pick<ProcessoLido, 'etapaAtual' | 'responsavel' | 'ultimaVersao'>): string | null {
  if (etapaAtual?.codigo !== CODIGO_DA_REVISAO_INTERNA || responsavel === null || ultimaVersao === null) return null
  if (ultimaVersao.autorId !== responsavel.id) return null
  return `${ultimaVersao.autorNome} enviou a V${ultimaVersao.numero}; a revisão interna deveria ser de outra pessoa.`
}

/** "Em {etapa} · {etiqueta}": o que a Consulta lê no Agora, acima da linha do responsável. */
export function ondeEstaOProcesso(processo: ProcessoLido): string {
  return `Em ${processo.etapaAtual?.nome ?? '—'} · ${ROTULO_DA_ETIQUETA[processo.etiqueta ?? 'a_fazer']}`
}

/**
 * A frase do processo suspenso ou cancelado: "Em {etapa} · {etiqueta} · com {nome} há {n} dias" (ou "sem responsável").
 * Depois do limite de 7 dias o selo vermelho diz os dias, então a frase não os repete.
 */
export function fraseDaSituacaoParada(processo: ProcessoLido, hoje: string): string {
  const { responsavel } = processo
  const onde = ondeEstaOProcesso(processo)
  if (responsavel === null) return `${onde} · sem responsável`
  const dias = diasDoProcessoNaEtapa(processo, hoje)
  const quando = dias === null || passouDoLimite(dias) ? '' : ` ${textoDosDias(dias)}`
  return `${onde} · com ${responsavel.nome}${quando}`
}
