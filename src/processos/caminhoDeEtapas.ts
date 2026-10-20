import type { EtapaDoProcesso, EtapaDoCaminho, StatusDaEtapa, UltimaVersao, UsuarioResponsavel } from './tipos'

export type AcaoDaEtapa = 'iniciar' | 'concluir' | 'dispensar' | 'realizada' | 'voltar'

export const ROTULO_DO_STATUS: Record<StatusDaEtapa, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  realizada_anteriormente: 'Realizada anteriormente',
  dispensada: 'Dispensada',
}

const RESOLVIDOS = new Set<StatusDaEtapa>(['concluida', 'realizada_anteriormente', 'dispensada'])

/** A etapa lida do processo traz o responsável; a montada sem ele (só o caminho), não. */
export function ehEtapaDoProcesso(etapa: EtapaDoCaminho): etapa is EtapaDoProcesso {
  return 'responsavelId' in etapa
}

/** A etapa atual é a primeira não resolvida: a em andamento ou, sem ela, a pendente cuja anterior já se resolveu. */
export function indiceDaEtapaAtual(etapas: EtapaDoCaminho[]): number {
  return etapas.findIndex((etapa) => !RESOLVIDOS.has(etapa.status))
}

/**
 * Só a etapa atual anda (dispensar só a opcional); a resolvida anterior à atual pode ser voltada, e com todas
 * resolvidas (processo concluído) qualquer uma pode. O banco confere tudo de novo.
 */
export function acoesDaEtapa(etapas: EtapaDoCaminho[], indice: number): AcaoDaEtapa[] {
  const atual = indiceDaEtapaAtual(etapas)
  const etapa = etapas[indice]
  if (indice !== atual) return RESOLVIDOS.has(etapa.status) && (atual === -1 || indice < atual) ? ['voltar'] : []
  const avancar: AcaoDaEtapa = etapa.status === 'pendente' ? 'iniciar' : 'concluir'
  return etapa.obrigatoria ? [avancar, 'realizada'] : [avancar, 'dispensar', 'realizada']
}

/** A etapa que o avanço inicia: a primeira pendente depois da do índice, pulando as já resolvidas. O banco decide de novo. */
export function proximaPendente(etapas: EtapaDoCaminho[], indice: number): EtapaDoCaminho | null {
  return etapas.slice(indice + 1).find((etapa) => etapa.status === 'pendente') ?? null
}

/**
 * Quem a janela de avanço marca ao abrir: o responsável que a próxima já tem, se pode ser escolhido; senão quem
 * está na tela, se pode; senão ninguém (null).
 */
export function responsavelMarcado(proxima: EtapaDoCaminho, usuarioId: string, usuarios: UsuarioResponsavel[]): string | null {
  const pode = (id: string | null) => id !== null && usuarios.some((usuario) => usuario.id === id)
  const dela = ehEtapaDoProcesso(proxima) ? proxima.responsavelId : null
  if (pode(dela)) return dela
  return pode(usuarioId) ? usuarioId : null
}

// O banco guarda a data como AAAA-MM-DD; a tela mostra DD/MM/AAAA.
export function formatarData(data: string | null): string {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

const CODIGO_DA_REVISAO_INTERNA = 'revisao_interna'

/** Ninguém revisa o próprio trabalho: na Revisão interna, quem enviou a versão mais recente não histórica não é escolhido. O banco confere de novo. */
export function ehAutorBarrado(etapa: EtapaDoCaminho, usuarioId: string, ultimaVersao: UltimaVersao | null): boolean {
  return etapa.codigo === CODIGO_DA_REVISAO_INTERNA && ultimaVersao !== null && ultimaVersao.autorId === usuarioId
}

/** Quem a janela e a escolha oferecem como responsável da etapa: a lista sem o autor barrado. */
export function usuariosParaAEtapa(
  etapa: EtapaDoCaminho, usuarios: UsuarioResponsavel[], ultimaVersao: UltimaVersao | null,
): UsuarioResponsavel[] {
  return usuarios.filter((usuario) => !ehAutorBarrado(etapa, usuario.id, ultimaVersao))
}

/** [Assumir]: etapa do processo pendente ou em andamento, sem responsável, que quem está na tela pode assumir. */
export function podeAssumir(etapa: EtapaDoCaminho, usuarioId: string, ultimaVersao: UltimaVersao | null): boolean {
  if (!ehEtapaDoProcesso(etapa) || etapa.responsavelId !== null) return false
  if (etapa.status !== 'pendente' && etapa.status !== 'em_andamento') return false
  return !ehAutorBarrado(etapa, usuarioId, ultimaVersao)
}

/** "Concluído em": a data da última etapa obrigatória resolvida; null se nenhuma tem data. */
export function concluidoEm(etapas: EtapaDoCaminho[]): string | null {
  const datas = etapas.flatMap((etapa) => (etapa.obrigatoria && etapa.resolvidaEm ? [etapa.resolvidaEm] : []))
  return datas.sort().at(-1) ?? null
}

export type OpcaoDeResponsavel = { valor: string; rotulo: string; desabilitada?: boolean }

/**
 * O "Trocar": quem está na tela primeiro, com "(você)"; os demais; o responsável atual que já não está na lista
 * (desativado) e, por último, "Ninguém por enquanto" (valor ""). A lista chega sem o autor barrado da Revisão interna.
 */
export function opcoesDeResponsavel(etapa: EtapaDoProcesso, usuarios: UsuarioResponsavel[], usuarioId: string): OpcaoDeResponsavel[] {
  const eu = usuarios.filter((usuario) => usuario.id === usuarioId).map((usuario) => ({ valor: usuario.id, rotulo: `${usuario.nome} (você)` }))
  const outros = usuarios.filter((usuario) => usuario.id !== usuarioId).map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome }))
  return [...eu, ...outros, ...responsavelForaDaLista(etapa, usuarios), { valor: '', rotulo: 'Ninguém por enquanto' }]
}

function responsavelForaDaLista(etapa: EtapaDoProcesso, usuarios: UsuarioResponsavel[]): OpcaoDeResponsavel[] {
  const atual = etapa.responsavelId
  if (atual === null || usuarios.some((usuario) => usuario.id === atual)) return []
  const inativo = etapa.responsavelInativo
  return [{ valor: atual, rotulo: `${etapa.responsavelNome}${inativo ? ' (Inativo)' : ''}`, desabilitada: inativo }]
}

export type SinalDaEtapa = 'concluida' | 'atual' | 'pendente' | 'opcional' | 'dispensada' | 'anterior'

/** O nome acessível de cada sinal, ao lado do nome da etapa. */
export const ROTULO_DO_SINAL: Record<SinalDaEtapa, string> = {
  concluida: 'concluída', atual: 'atual', pendente: 'pendente', opcional: 'opcional, pendente', dispensada: 'dispensada',
  anterior: 'realizada anteriormente',
}

/** O sinal da linha da etapa (spec, "Etapas"): a atual vale mais que o status dela. */
export function sinalDaEtapa(etapas: EtapaDoCaminho[], indice: number): SinalDaEtapa {
  const etapa = etapas[indice]
  if (indice === indiceDaEtapaAtual(etapas)) return 'atual'
  if (etapa.status === 'concluida') return 'concluida'
  if (etapa.status === 'realizada_anteriormente') return 'anterior'
  if (etapa.status === 'dispensada') return 'dispensada'
  return etapa.obrigatoria ? 'pendente' : 'opcional'
}

/** O rótulo do cartão Agora: a posição da etapa atual no caminho ("etapa 2 de 6"). */
export function rotuloDoAgora(indice: number, total: number): string {
  return indice < 0 ? 'Agora' : `Agora · etapa ${indice + 1} de ${total}`
}

/** Muda quando uma conclusão ou uma volta mexe nas etapas: o que depende delas (a aprovação, os arquivos) lê de novo. */
export function assinaturaDasEtapas(etapas: { status: string }[]): string {
  return etapas.map((etapa) => etapa.status).join()
}
