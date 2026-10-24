import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { FRASE_DO_LINK_INVALIDO, fraseDaDataNoFuturo } from '../revisoes/frasesDeAprovacao'
import { CODIGO_CONCLUIDOS } from './codigosDasEtapas'
import {
  FRASE_DA_CHEGADA_OBRIGATORIA, FRASE_DA_EXPLICACAO_OBRIGATORIA, FRASE_DA_ETIQUETA_FIXA, fraseDaEtapaInativa, fraseDaExplicacaoLonga,
} from './frasesDoMovimento'
import type {
  DadosDaChegada, EtapaAtual, EtapaDoCatalogo, EtapaDoVerso, EtiquetaDaEtapa, PassagemDaEtapa, ProcessoLido,
} from './tipos'

// As regras de mover_processo, da etiqueta e do responsável do banco, para a implementação falsa.

/** A etapa atual de um processo, com a posição e o total entre as etapas ativas, como a view os calcula. */
export function etapaAtualNoCatalogo(etapa: EtapaDoCatalogo, catalogo: EtapaDoCatalogo[]): EtapaAtual {
  const ativas = catalogo.filter((outra) => outra.ativa).sort((a, b) => a.ordem - b.ordem)
  const posicao = ativas.findIndex((outra) => outra.id === etapa.id) + 1
  return { id: etapa.id, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, posicao, total: ativas.length }
}

/** A etapa de destino precisa estar ativa. */
export function conferirEtapaAtiva(etapa: EtapaDoCatalogo): void {
  if (!etapa.ativa) throw new TravaDoBanco(fraseDaEtapaInativa(etapa.nome))
}

const LINK_DA_PUBLICACAO = /^https?:\/\/.+/i

/** Como conferir_data_da_publicacao e o link do banco: a data não é futura e o link, quando há, é http ou https. */
export function publicacaoPelaData(data: string, link: string | null, hoje: string): Pick<ProcessoLido, 'publicadoEm' | 'linkDaPublicacao'> {
  if (data > hoje) throw new TravaDoBanco(fraseDaDataNoFuturo(data))
  const limpo = link?.trim() || null
  if (limpo && !LINK_DA_PUBLICACAO.test(limpo)) throw new TravaDoBanco(FRASE_DO_LINK_INVALIDO)
  return { publicadoEm: data, linkDaPublicacao: limpo }
}

// Devolve a explicação aparada.
function conferirExplicacao(explicacao: string | null): string {
  if (explicacao === null) throw new TravaDoBanco(FRASE_DA_CHEGADA_OBRIGATORIA)
  const texto = explicacao.trim()
  if (texto === '') throw new TravaDoBanco(FRASE_DA_EXPLICACAO_OBRIGATORIA)
  if (texto.length > 2000) throw new TravaDoBanco(fraseDaExplicacaoLonga(texto.length))
  return texto
}

/**
 * Como publicacao_da_chegada: com a data já registrada nada se pede; senão, a data (nunca no futuro, com o link http ou
 * https) ou a explicação (não vazia, até 2.000 caracteres). Devolve o que muda no processo.
 */
export function publicacaoDaChegada(processo: ProcessoLido, chegada: DadosDaChegada | undefined, hoje: string): Partial<ProcessoLido> {
  if (processo.publicadoEm) return {}
  if (chegada?.dataDaPublicacao) {
    return { ...publicacaoPelaData(chegada.dataDaPublicacao, chegada.linkDaPublicacao, hoje), explicacaoSemPublicacao: null }
  }
  return { publicadoEm: null, explicacaoSemPublicacao: conferirExplicacao(chegada?.explicacao ?? null) }
}

/** Ao sair de Concluídos, a explicação de concluir sem publicação se apaga; a data da publicação fica. */
export function publicacaoDaSaida(processo: ProcessoLido): Partial<ProcessoLido> {
  return processo.etapaAtual?.codigo === CODIGO_CONCLUIDOS ? { explicacaoSemPublicacao: null } : {}
}

/** Em Concluídos a etiqueta é Concluído e não muda. */
export function conferirEtiquetaMutavel(processo: ProcessoLido, etiqueta: EtiquetaDaEtapa): void {
  if (processo.etapaAtual?.codigo === CODIGO_CONCLUIDOS && etiqueta !== processo.etiqueta) throw new TravaDoBanco(FRASE_DA_ETIQUETA_FIXA)
}

/**
 * As etapas ativas com as passagens do processo por elas (a mais recente primeiro). O que o processo já guarda vale; sem
 * nada guardado para a etapa atual, a passagem aberta sai da entrada dela.
 */
export function etapasDoVersoDe(processo: ProcessoLido, catalogo: EtapaDoCatalogo[], hoje: string): EtapaDoVerso[] {
  const guardadas = new Map(processo.etapasDoVerso.map((etapa) => [etapa.codigo, etapa.passagens]))
  return catalogo.filter((etapa) => etapa.ativa).sort((a, b) => a.ordem - b.ordem).map((etapa) => {
    const passagens = guardadas.get(etapa.codigo) ?? []
    const aberta = processo.etapaAtual?.codigo === etapa.codigo && !passagens.some((passagem) => passagem.saiuEm === null)
    const todas: PassagemDaEtapa[] = aberta ? [{ entrouEm: processo.entrouNaEtapaEm ?? hoje, saiuEm: null }, ...passagens] : passagens
    return { id: etapa.id, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, passagens: todas }
  })
}

/** Fecha a passagem aberta da etapa de origem e abre outra na de destino. */
export function registrarPassagem(etapas: EtapaDoVerso[], de: string, para: string, hoje: string): EtapaDoVerso[] {
  return etapas.map((etapa) => {
    if (etapa.codigo === de) return { ...etapa, passagens: etapa.passagens.map((p) => (p.saiuEm === null ? { ...p, saiuEm: hoje } : p)) }
    if (etapa.codigo === para) return { ...etapa, passagens: [{ entrouEm: hoje, saiuEm: null }, ...etapa.passagens] }
    return etapa
  })
}
