import {
  type ErroDoBanco, type RecusasDoModulo, TravaDoBanco, porQueNadaMudou, recusaPorPerfil,
} from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { ClienteSupabase } from '../lib/supabase'
import type { EtapaDoSetor, ModuloDeProcessos, StatusDaEtapa } from './tipos'

// A etapa do setor só some junto com o setor: o aviso é o do cadastro excluído.
export const RECUSAS_DOS_PROCESSOS: RecusasDoModulo = {
  semPermissao: 'Seu perfil não permite alterar os processos.',
  registroInexistente: () => new CadastroInexistente(),
}

type MudancaDoAndamento = { status: StatusDaEtapa; nota?: string }

export function criarProcessosSupabase(cliente: ClienteSupabase): ModuloDeProcessos {
  return {
    lerEtapasDoSetor: (setorId) => lerEtapasDoSetor(cliente, setorId),
    iniciarEtapa: (id) => mudarAndamento(cliente, id, { status: 'em_andamento' }),
    concluirEtapa: (id) => mudarAndamento(cliente, id, { status: 'concluida' }),
    dispensarEtapa: (id, nota) => mudarAndamento(cliente, id, { status: 'dispensada', nota }),
    registrarRealizadaAnteriormente: (id, nota) => mudarAndamento(cliente, id, { status: 'realizada_anteriormente', nota }),
  }
}

type AndamentoLido = {
  id: string
  status: StatusDaEtapa
  nota: string | null
  iniciada_em: string | null
  resolvida_em: string | null
  etapas: { codigo: string; nome: string; ordem: number; obrigatoria: boolean } | null
}

// O banco não ordena o que vem embutido: a ordem do catálogo é aplicada aqui.
async function lerEtapasDoSetor(cliente: ClienteSupabase, setorId: string): Promise<EtapaDoSetor[]> {
  const { data, error } = await cliente.from('andamentos')
    .select('id, status, nota, iniciada_em, resolvida_em, etapas(codigo, nome, ordem, obrigatoria)')
    .eq('setor_id', setorId)
  if (error) throw new Error(`Falha ao ler as etapas do setor: ${error.message}`)
  return (data as AndamentoLido[]).flatMap(etapaDoSetor).sort((a, b) => a.ordem - b.ordem)
}

function etapaDoSetor({ etapas, iniciada_em, resolvida_em, ...andamento }: AndamentoLido): EtapaDoSetor[] {
  if (!etapas) return []
  return [{ ...andamento, ...etapas, iniciadaEm: iniciada_em, resolvidaEm: resolvida_em }]
}

async function mudarAndamento(cliente: ClienteSupabase, id: string, mudanca: MudancaDoAndamento): Promise<void> {
  const { data, error } = await cliente.from('andamentos').update(mudanca).eq('id', id).select('id')
  if (error) throw falhaDoAndamento(error)
  if (!data.length) throw porQueNadaMudou(await andamentoExiste(cliente, id), RECUSAS_DOS_PROCESSOS)
}

async function andamentoExiste(cliente: ClienteSupabase, id: string): Promise<boolean> {
  const { data } = await cliente.from('andamentos').select('id').eq('id', id)
  return Boolean(data?.length)
}

// O banco recusa a sequência e a dispensa com "motivo:nome da etapa" (migração etapas_do_setor).
const PADRAO_DA_RECUSA = /\b(anterior_nao_resolvida|etapa_obrigatoria):(.*)$/m

const FRASE_DA_RECUSA: Record<string, (etapa: string) => string> = {
  anterior_nao_resolvida: (etapa) => `A etapa ${etapa} ainda não foi resolvida.`,
  etapa_obrigatoria: (etapa) => `A etapa ${etapa} é obrigatória e não pode ser dispensada.`,
}

function falhaDoAndamento(erro: ErroDoBanco): Error {
  const recusa = erro.message.match(PADRAO_DA_RECUSA)
  if (recusa) return new TravaDoBanco(FRASE_DA_RECUSA[recusa[1]](recusa[2].trim()))
  return recusaPorPerfil(erro, RECUSAS_DOS_PROCESSOS.semPermissao)
}
