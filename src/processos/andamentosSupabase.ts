import {
  type ErroDoBanco, type RecusasDoModulo, TravaDoBanco, porQueNadaMudou, recusaPorPerfil,
} from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { formatarData } from './caminhoDeEtapas'
import { FRASE_DO_PAI, fraseDeTipoInvalido, fraseDosSubprocessos } from './frasesDeReclassificacao'
import { fraseDeSituacaoInvalida, fraseDoProcessoParado } from './frasesDeSituacao'
import type { ModuloDeProcessos, UsuarioResponsavel } from './tipos'

type OperacoesDoAndamento = 'iniciarEtapa' | 'concluirEtapa' | 'dispensarEtapa' | 'registrarRealizadaAnteriormente'
  | 'voltarParaEtapa' | 'corrigirDatasDaEtapa' | 'mudarResponsavelDaEtapa' | 'listarResponsaveisPossiveis'
type MudancaDoAndamento = Database['public']['Tables']['andamentos']['Update']

// As recusas chegam de fora (as de processos) para este módulo não importar quem o monta.
export function criarAndamentosSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, OperacoesDoAndamento> {
  const mudar = (id: string, mudanca: MudancaDoAndamento) => mudarAndamento(cliente, id, mudanca, recusas)
  return {
    iniciarEtapa: (id) => mudar(id, { status: 'em_andamento' }),
    concluirEtapa: (id) => mudar(id, { status: 'concluida' }),
    dispensarEtapa: (id, nota) => mudar(id, { status: 'dispensada', nota }),
    registrarRealizadaAnteriormente: (id, nota) => mudar(id, { status: 'realizada_anteriormente', nota }),
    corrigirDatasDaEtapa: (id, datas) => mudar(id, { iniciada_em: datas.iniciadaEm, resolvida_em: datas.resolvidaEm }),
    mudarResponsavelDaEtapa: (id, usuarioId) => mudar(id, { responsavel_id: usuarioId }),
    voltarParaEtapa: (id, motivo) => voltarParaEtapa(cliente, id, motivo, recusas),
    listarResponsaveisPossiveis: () => listarResponsaveisPossiveis(cliente),
  }
}

async function mudarAndamento(
  cliente: ClienteSupabase, id: string, mudanca: MudancaDoAndamento, recusas: RecusasDoModulo,
): Promise<void> {
  const { data, error } = await cliente.from('andamentos').update(mudanca).eq('id', id).select('id')
  if (error) throw falhaDoAndamento(error, recusas)
  if (!data.length) throw porQueNadaMudou(await andamentoExiste(cliente, id), recusas)
}

async function andamentoExiste(cliente: ClienteSupabase, id: string): Promise<boolean> {
  const { data } = await cliente.from('andamentos').select('id').eq('id', id)
  return Boolean(data?.length)
}

async function voltarParaEtapa(
  cliente: ClienteSupabase, id: string, motivo: string, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.rpc('voltar_a_etapa', { p_andamento: id, p_motivo: motivo })
  if (error) throw falhaDoAndamento(error, recusas)
}

async function listarResponsaveisPossiveis(cliente: ClienteSupabase): Promise<UsuarioResponsavel[]> {
  const { data, error } = await cliente.from('usuarios').select('id, nome')
    .eq('ativo', true).in('perfil', ['administrador', 'integrante_ep']).order('nome')
  if (error) throw new Error(`Falha ao ler os usuários que podem ser responsáveis: ${error.message}`)
  return data
}

// O banco recusa com "motivo:valor" (migrações etapas_do_setor, andamento_do_processo, voltar_datas_responsavel,
// situacao_do_processo e subprocessos_e_reclassificacao).
// O motivo "motivo_obrigatorio" não tem valor; o valor vai até o fim da mensagem.
const PADRAO_DA_RECUSA = new RegExp(
  '\\b(anterior_nao_resolvida|etapa_obrigatoria|setor_nao_resolveu|ja_ha_etapa_em_andamento|etapa_nao_resolvida'
  + '|motivo_obrigatorio|data_no_futuro|resolvida_antes_do_inicio|responsavel_invalido|processo_parado'
  + '|situacao_invalida|processo_com_subprocessos|pai_nao_e_processo|tipo_invalido)(?::(.*))?$', 'm')

const FRASE_DA_RECUSA: Record<string, (valor: string) => string> = {
  anterior_nao_resolvida: (etapa) => `A etapa ${etapa} ainda não foi resolvida.`,
  etapa_nao_resolvida: (etapa) => `A etapa ${etapa} ainda não foi resolvida.`,
  etapa_obrigatoria: (etapa) => `A etapa ${etapa} é obrigatória e não pode ser dispensada.`,
  setor_nao_resolveu: (sigla) => `O setor ${sigla} ainda não resolveu as etapas do setor.`,
  ja_ha_etapa_em_andamento: (etapa) => `Já há uma etapa em andamento neste processo: ${etapa}.`,
  motivo_obrigatorio: () => 'O motivo é obrigatório.',
  data_no_futuro: (data) => `A data ${formatarData(data)} está no futuro.`,
  resolvida_antes_do_inicio: (datas) => {
    const [conclusao, inicio] = datas.split(':')
    return `A conclusão (${formatarData(conclusao)}) não pode ser antes do início (${formatarData(inicio)}).`
  },
  responsavel_invalido: (nome) =>
    `${nome} não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.`,
  processo_parado: fraseDoProcessoParado,
  situacao_invalida: (situacoes) => {
    const [de, para] = situacoes.split(':')
    return fraseDeSituacaoInvalida(de, para)
  },
  processo_com_subprocessos: fraseDosSubprocessos,
  pai_nao_e_processo: () => FRASE_DO_PAI,
  tipo_invalido: (tipos) => {
    const [de, para] = tipos.split(':')
    return fraseDeTipoInvalido(de, para)
  },
}

// Serve também à situação, à reclassificação e à gravação do processo: as recusas do banco têm o mesmo formato.
export function falhaDoAndamento(erro: ErroDoBanco, recusas: RecusasDoModulo): Error {
  const recusa = erro.message.match(PADRAO_DA_RECUSA)
  if (recusa) return new TravaDoBanco(FRASE_DA_RECUSA[recusa[1]]((recusa[2] ?? '').trim()))
  if (erro.message.includes('registro_inexistente')) return recusas.registroInexistente()
  return recusaPorPerfil(erro, recusas.semPermissao)
}
