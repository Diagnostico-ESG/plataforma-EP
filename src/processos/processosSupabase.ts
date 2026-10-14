import {
  type ErroDoBanco, type RecusasDoModulo, TravaDoBanco, porQueNadaMudou, recusaPorPerfil,
} from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { ClienteSupabase } from '../lib/supabase'
import { lerEtapasDoSetor } from './etapasDoSetorSupabase'
import { criarGravacaoDeProcessoSupabase } from './gravarProcessoSupabase'
import { criarLeituraDeProcessoSupabase } from './lerProcessoSupabase'
import { criarListaDeProcessosSupabase } from './listaDeProcessosSupabase'
import { criarResponsaveisSupabase } from './responsaveisSupabase'
import type { ModuloDeProcessos, StatusDaEtapa } from './tipos'

// A etapa do setor só some junto com o setor, e o processo, quando outra pessoa o exclui: o aviso é o do item excluído.
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
    ...criarResponsaveisSupabase(cliente, RECUSAS_DOS_PROCESSOS),
    ...criarListaDeProcessosSupabase(cliente),
    ...criarLeituraDeProcessoSupabase(cliente),
    ...criarGravacaoDeProcessoSupabase(cliente, RECUSAS_DOS_PROCESSOS),
  }
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

// O banco recusa a sequência e a dispensa com "motivo:valor" (migrações etapas_do_setor e andamento_do_processo).
const PADRAO_DA_RECUSA = /\b(anterior_nao_resolvida|etapa_obrigatoria|setor_nao_resolveu|ja_ha_etapa_em_andamento):(.*)$/m

const FRASE_DA_RECUSA: Record<string, (valor: string) => string> = {
  anterior_nao_resolvida: (etapa) => `A etapa ${etapa} ainda não foi resolvida.`,
  etapa_obrigatoria: (etapa) => `A etapa ${etapa} é obrigatória e não pode ser dispensada.`,
  setor_nao_resolveu: (sigla) => `O setor ${sigla} ainda não resolveu as etapas do setor.`,
  ja_ha_etapa_em_andamento: (etapa) => `Já há uma etapa em andamento neste processo: ${etapa}.`,
}

function falhaDoAndamento(erro: ErroDoBanco): Error {
  const recusa = erro.message.match(PADRAO_DA_RECUSA)
  if (recusa) return new TravaDoBanco(FRASE_DA_RECUSA[recusa[1]](recusa[2].trim()))
  return recusaPorPerfil(erro, RECUSAS_DOS_PROCESSOS.semPermissao)
}
