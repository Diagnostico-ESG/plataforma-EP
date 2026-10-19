import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ehAutorBarrado, formatarData, indiceDaEtapaAtual, proximaPendente } from './caminhoDeEtapas'
import { fraseDoBloqueioDaConclusao } from './frasesDaVersaoCompleta'
import type {
  DatasDaEtapa, EtapaDoProcesso, EtapaDoCaminho, ProcessoLido, ResponsavelDaEtapa, StatusDaEtapa, UltimaVersao, UsuarioResponsavel,
} from './tipos'

const RESOLVIDOS: StatusDaEtapa[] = ['concluida', 'realizada_anteriormente', 'dispensada']

type TrocaDeEtapas = <T extends EtapaDoCaminho>(etapas: T[]) => T[]

/** Recalcula, como a view, a etapa atual e o "concluído" a partir das etapas do processo. */
export function recalcularProcesso(processo: ProcessoLido, etapasDoProcesso: EtapaDoProcesso[]): ProcessoLido {
  const atual = etapasDoProcesso[indiceDaEtapaAtual(etapasDoProcesso)]
  const concluido = etapasDoProcesso.every((etapa) => !etapa.obrigatoria || RESOLVIDOS.includes(etapa.status))
  // "Concluído" é calculado: a situação guardada de quem está concluído é "em andamento".
  const guardada = processo.situacao === 'concluido' ? 'em_andamento' : processo.situacao
  return {
    ...processo, etapasDoProcesso,
    etapaAtual: atual ? { codigo: atual.codigo, nome: atual.nome, ordem: atual.ordem } : null,
    situacao: concluido && guardada === 'em_andamento' ? 'concluido' : guardada,
  }
}

/** Troca as etapas do processo que contém a etapa `id` e recalcula; processo sem a etapa fica como está. */
export function trocarEtapaDoProcesso(processo: ProcessoLido, id: string, trocar: TrocaDeEtapas): ProcessoLido {
  if (!processo.etapasDoProcesso.some((etapa) => etapa.id === id)) return processo
  return recalcularProcesso(processo, trocar(processo.etapasDoProcesso))
}

/** Aplica a mudança à etapa do processo e recalcula a etapa atual e o "concluído". */
export function mudarEtapaDoProcesso(processo: ProcessoLido, id: string, mudancas: Partial<EtapaDoProcesso>): ProcessoLido {
  return trocarEtapaDoProcesso(processo, id, (etapas) => etapas.map((etapa) => (etapa.id === id ? { ...etapa, ...mudancas } : etapa)))
}

/** O responsável do cartão é o da etapa atual: só muda quando a etapa trocada é ela. */
export function responsavelDoCartao(processo: ProcessoLido, id: string, responsavel: ResponsavelDaEtapa | null): ProcessoLido {
  const etapa = processo.etapasDoProcesso.find((candidata) => candidata.id === id)
  if (!etapa || processo.etapaAtual?.codigo !== etapa.codigo) return processo
  return { ...processo, responsavel }
}

/**
 * Como a função do banco: a escolhida volta a em andamento (mantém o início, ou recebe hoje se não tinha) e as
 * seguintes que não estão pendentes voltam a pendente, sem datas nem nota. Etapa fora da lista não muda nada.
 */
export function voltarEtapas<T extends EtapaDoCaminho>(etapas: T[], id: string, hoje: string): T[] {
  const escolhida = etapas.find((etapa) => etapa.id === id)
  if (!escolhida) return etapas
  return etapas.map((etapa) => {
    if (etapa.id === id) return { ...etapa, status: 'em_andamento', nota: null, resolvidaEm: null, iniciadaEm: etapa.iniciadaEm ?? hoje }
    if (etapa.ordem > escolhida.ordem && etapa.status !== 'pendente') {
      return { ...etapa, status: 'pendente', nota: null, iniciadaEm: null, resolvidaEm: null }
    }
    return etapa
  })
}

/** As recusas de datas do banco: nunca no futuro e a conclusão nunca antes do início, com o valor recebido. */
export function conferirDatasDaEtapa({ iniciadaEm, resolvidaEm }: DatasDaEtapa, hoje: string): void {
  for (const data of [iniciadaEm, resolvidaEm]) {
    if (data !== null && data > hoje) throw new TravaDoBanco(`A data ${formatarData(data)} está no futuro.`)
  }
  if (iniciadaEm !== null && resolvidaEm !== null && resolvidaEm < iniciadaEm) {
    throw new TravaDoBanco(
      `A conclusão (${formatarData(resolvidaEm)}) não pode ser antes do início (${formatarData(iniciadaEm)}).`)
  }
}

/**
 * Como a função de avanço do banco: a escolhida recebe as mudanças e a primeira pendente depois dela entra em
 * andamento com hoje e o responsável (null: ninguém, mesmo que a etapa já tivesse um). Sem pendente depois, só resolve.
 */
export function avancarEtapas(
  etapas: EtapaDoProcesso[], id: string, resolvida: Partial<EtapaDoProcesso>, responsavel: UsuarioResponsavel | null, hoje: string,
): EtapaDoProcesso[] {
  const indice = etapas.findIndex((etapa) => etapa.id === id)
  const proxima = etapas.findIndex((etapa, posicao) => posicao > indice && etapa.status === 'pendente')
  return etapas.map((etapa, posicao) => {
    if (posicao === indice) return { ...etapa, ...resolvida }
    if (posicao !== proxima) return etapa
    return {
      ...etapa, status: 'em_andamento', iniciadaEm: hoje, responsavelId: responsavel?.id ?? null,
      responsavelNome: responsavel?.nome ?? null, responsavelInativo: false,
    }
  })
}

/** O avanço no processo: as etapas avançam, a etapa atual e o "concluído" são recalculados e o cartão mostra o responsável da nova atual. */
export function avancarProcesso(
  processo: ProcessoLido, id: string, resolvida: Partial<EtapaDoProcesso>, responsavel: UsuarioResponsavel | null, hoje: string,
): ProcessoLido {
  const recalculado = recalcularProcesso(processo, avancarEtapas(processo.etapasDoProcesso, id, resolvida, responsavel, hoje))
  const atual = recalculado.etapasDoProcesso[indiceDaEtapaAtual(recalculado.etapasDoProcesso)]
  const cartao = atual?.responsavelId ? { id: atual.responsavelId, nome: atual.responsavelNome ?? '', fotoUrl: null } : null
  return { ...recalculado, responsavel: cartao }
}

export type PedidoDeAvanco = { acao: 'concluir' | 'dispensar' | 'realizada'; nota: string | null; responsavelId: string | null }

/** As recusas do banco no avanço, na ordem dele: nota obrigatória, etapa obrigatória não se dispensa e responsável que pode ser escolhido. */
export function conferirAvanco(etapa: EtapaDoCaminho, { acao, nota, responsavelId }: PedidoDeAvanco, possiveis: UsuarioResponsavel[]): void {
  if (acao !== 'concluir' && (nota ?? '').trim() === '') throw new TravaDoBanco('A nota é obrigatória.')
  if (acao === 'dispensar' && etapa.obrigatoria) {
    throw new TravaDoBanco(`A etapa ${etapa.nome} é obrigatória e não pode ser dispensada.`)
  }
  conferirResponsavelEscolhido(responsavelId, possiveis)
}

/** O responsável escolhido precisa estar entre os que podem ser responsáveis; ninguém (null) sempre vale. */
export function conferirResponsavelEscolhido(responsavelId: string | null, possiveis: UsuarioResponsavel[]): void {
  if (responsavelId === null || possiveis.some((usuario) => usuario.id === responsavelId)) return
  throw new TravaDoBanco(`${responsavelId} não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.`)
}

/** Como o gatilho do banco: só confere quando o responsável da Revisão interna passa a ser alguém e muda. */
export function conferirAutorDaRevisao(ultimaVersao: UltimaVersao | null, etapa: EtapaDoProcesso, responsavelId: string | null): void {
  if (responsavelId === null || responsavelId === etapa.responsavelId) return
  if (ultimaVersao === null || !ehAutorBarrado(etapa, responsavelId, ultimaVersao)) return
  throw new TravaDoBanco(`${ultimaVersao.autorNome} enviou a versão V${ultimaVersao.numero} e não pode ser responsável pela Revisão interna.`)
}

/** Como o gatilho do banco: concluir a Revisão pelo setor exige a versão mais recente completa. */
export function conferirVersaoDaRevisaoDoSetor(etapa: EtapaDoCaminho, ultimaVersao: UltimaVersao | null): void {
  if (etapa.codigo !== 'revisao_setor') return
  const frase = fraseDoBloqueioDaConclusao(ultimaVersao)
  if (frase !== null) throw new TravaDoBanco(frase)
}

/** A trava do autor para a etapa que o avanço inicia: a primeira pendente depois da resolvida. */
export function conferirAutorDaProxima(processo: ProcessoLido, idDaResolvida: string, responsavelId: string | null): void {
  const etapas = processo.etapasDoProcesso
  const proxima = proximaPendente(etapas, etapas.findIndex((etapa) => etapa.id === idDaResolvida))
  if (proxima) conferirAutorDaRevisao(processo.ultimaVersao, proxima as EtapaDoProcesso, responsavelId)
}
