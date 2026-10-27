import { type RecusasDoModulo, TravaDoBanco, porQueNadaMudou } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { fraseDaEtiquetaInexistente } from './frasesDoMovimento'
import { falhaDoBanco } from './recusasDoBanco'
import type { DadosDaChegada, EtiquetaDaEtapa, ModuloDeProcessos, UsuarioResponsavel } from './tipos'

type OperacoesDoMovimento = 'moverProcesso' | 'mudarEtiqueta' | 'mudarResponsavel' | 'listarResponsaveisPossiveis'

// 22P02: o Postgres recusa um valor que não é do tipo enumerado (a etiqueta); a tela só oferece as três, então é raro.
const VALOR_FORA_DO_TIPO = '22P02'

// As recusas chegam de fora (as de processos) para este módulo não importar quem o monta.
export function criarMovimentoSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, OperacoesDoMovimento> {
  return {
    moverProcesso: (id, etapaId, chegada) => moverProcesso(cliente, { id, etapaId, chegada }, recusas),
    mudarEtiqueta: (id, etiqueta) => mudarEtiqueta(cliente, id, etiqueta, recusas),
    mudarResponsavel: (id, usuarioId) => mudarResponsavel(cliente, id, usuarioId, recusas),
    listarResponsaveisPossiveis: () => listarResponsaveisPossiveis(cliente),
  }
}

type PedidoDeMover = { id: string; etapaId: string; chegada?: DadosDaChegada }

// Os dados da chegada só vão quando existem: o supabase-js manda null como null e o tipo gerado não o admite nos parâmetros.
function parametrosDaChegada(chegada: DadosDaChegada | undefined) {
  if (!chegada) return {}
  return {
    ...(chegada.dataDaPublicacao !== null && { p_data_da_publicacao: chegada.dataDaPublicacao }),
    ...(chegada.linkDaPublicacao !== null && { p_link_da_publicacao: chegada.linkDaPublicacao }),
    ...(chegada.explicacao !== null && { p_explicacao_sem_publicacao: chegada.explicacao }),
  }
}

// A função do banco recusa o processo parado, a etapa inativa e a chegada sem os dados, e faz tudo numa transação só.
async function moverProcesso(cliente: ClienteSupabase, { id, etapaId, chegada }: PedidoDeMover, recusas: RecusasDoModulo): Promise<void> {
  const { error } = await cliente.rpc('mover_processo', { p_processo: id, p_etapa: etapaId, ...parametrosDaChegada(chegada) })
  if (error) throw falhaDoBanco(error, recusas)
}

// A etiqueta é da passagem aberta (a etapa atual). Sem linha afetada, a leitura decide entre perfil e processo que sumiu.
async function mudarEtiqueta(cliente: ClienteSupabase, id: string, etiqueta: EtiquetaDaEtapa, recusas: RecusasDoModulo): Promise<void> {
  const { data, error } = await cliente.from('passagens').update({ etiqueta }).eq('processo_id', id).is('saiu_em', null).select('id')
  if (error?.code === VALOR_FORA_DO_TIPO) throw new TravaDoBanco(fraseDaEtiquetaInexistente(etiqueta))
  if (error) throw falhaDoBanco(error, recusas)
  if (!data.length) throw porQueNadaMudou(await processoExiste(cliente, id), recusas)
}

async function mudarResponsavel(cliente: ClienteSupabase, id: string, usuarioId: string | null, recusas: RecusasDoModulo): Promise<void> {
  const { data, error } = await cliente.from('processos').update({ responsavel_id: usuarioId }).eq('id', id).select('id')
  if (error) throw falhaDoBanco(error, recusas)
  if (!data.length) throw porQueNadaMudou(await processoExiste(cliente, id), recusas)
}

async function processoExiste(cliente: ClienteSupabase, id: string): Promise<boolean> {
  const { data } = await cliente.from('processos').select('id').eq('id', id)
  return Boolean(data?.length)
}

async function listarResponsaveisPossiveis(cliente: ClienteSupabase): Promise<UsuarioResponsavel[]> {
  const { data, error } = await cliente.from('usuarios').select('id, nome, foto_url')
    .eq('ativo', true).in('perfil', ['administrador', 'integrante_ep']).order('nome')
  if (error) throw new Error(`Falha ao ler os usuários que podem ser responsáveis: ${error.message}`)
  return data.map(({ id, nome, foto_url }) => ({ id, nome, fotoUrl: foto_url }))
}
