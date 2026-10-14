import { type ErroDoBanco, TravaDoBanco, porQueNadaMudou, recusaPorPerfil } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { RECUSAS_DOS_CADASTROS } from './cadastroInexistente'
import { criarHistoricoSupabase } from './historicoSupabase'
import { criarMacroprocessosSupabase } from './macroprocessosSupabase'
import { compararMacroprocessos } from './ordemDosMacroprocessos'
import { recusaDeProcessos } from './recusasDeProcessos'
import { criarSetoresEnvolvidosSupabase } from './setoresEnvolvidosSupabase'
import type {
  DadosDoSetor, MacroprocessoDoSetor, ModuloDeCadastros, SetorComMacroprocessos, SetorDaLista,
} from './tipos'

type AlteracaoDoSetor = Partial<DadosDoSetor> & { ativo?: boolean }


export function criarCadastrosSupabase(cliente: ClienteSupabase): ModuloDeCadastros {
  return {
    ...criarSetoresSupabase(cliente), ...criarMacroprocessosSupabase(cliente), ...criarSetoresEnvolvidosSupabase(cliente),
    ...criarHistoricoSupabase(cliente),
  }
}

type OperacoesDeSetor = Pick<ModuloDeCadastros, 'listarSetores' | 'criarSetor' | 'lerSetor' | 'editarSetor'
  | 'desativarSetor' | 'reativarSetor' | 'excluirSetor'>

function criarSetoresSupabase(cliente: ClienteSupabase): OperacoesDeSetor {
  return {
    listarSetores: () => listarSetores(cliente),
    criarSetor: (dados) => criarSetor(cliente, dados),
    lerSetor: (id) => lerSetor(cliente, id),
    editarSetor: (id, dados) => alterarSetor(cliente, id, dados),
    desativarSetor: (id) => alterarSetor(cliente, id, { ativo: false }),
    reativarSetor: (id) => alterarSetor(cliente, id, { ativo: true }),
    excluirSetor: (id) => excluirSetor(cliente, id),
  }
}

async function listarSetores(cliente: ClienteSupabase): Promise<SetorDaLista[]> {
  const { data, error } = await cliente.from('setores')
    .select('id, sigla, nome, observacoes, ativo, setores_envolvidos(count)').order('sigla')
  if (error) throw new Error(`Falha ao listar os setores: ${error.message}`)
  return data.map(({ setores_envolvidos: contagem, ...setor }) => ({
    ...setor, quantidadeDeMacroprocessos: contagem[0]?.count ?? 0,
  }))
}

type VinculoLido = {
  observacao: string | null
  macroprocessos: { id: string; codigo: string | null; nome: string } | null
}

async function lerSetor(cliente: ClienteSupabase, id: string): Promise<SetorComMacroprocessos | null> {
  const { data, error } = await cliente.from('setores')
    .select('id, sigla, nome, observacoes, ativo, setores_envolvidos(observacao, macroprocessos(id, codigo, nome))')
    .eq('id', id)
  if (error) throw new Error(`Falha ao ler o setor: ${error.message}`)
  if (!data[0]) return null
  const { setores_envolvidos: vinculos, ...setor } = data[0]
  return { ...setor, macroprocessos: macroprocessosDoSetor(vinculos) }
}

// Os macroprocessos saem na ordem da lista (código, sem código depois, nome); o banco não ordena o que vem embutido.
function macroprocessosDoSetor(vinculos: VinculoLido[]): MacroprocessoDoSetor[] {
  return vinculos
    .flatMap(({ observacao, macroprocessos }) => (macroprocessos ? [{ ...macroprocessos, observacao }] : []))
    .sort(compararMacroprocessos)
}

async function criarSetor(cliente: ClienteSupabase, dados: DadosDoSetor): Promise<void> {
  const { error } = await cliente.from('setores').insert(dados)
  if (error) throw falhaDoSetor(error, dados)
}

async function alterarSetor(cliente: ClienteSupabase, id: string, alteracao: AlteracaoDoSetor): Promise<void> {
  const { data, error } = await cliente.from('setores').update(alteracao).eq('id', id).select('id')
  if (error) throw falhaDoSetor(error, alteracao)
  if (!data.length) throw porQueNadaMudou(Boolean(await lerSetor(cliente, id)), RECUSAS_DOS_CADASTROS)
}

async function excluirSetor(cliente: ClienteSupabase, id: string): Promise<void> {
  const { data, error } = await cliente.from('setores').delete().eq('id', id).select('id')
  if (error) throw falhaDoSetor(error, {})
  if (!data.length) throw porQueNadaMudou(Boolean(await lerSetor(cliente, id)), RECUSAS_DOS_CADASTROS)
}

// O banco recusa pelo código do Postgres e pelo nome da restrição (migração de setores); a frase usa o que foi enviado.
function falhaDoSetor(erro: ErroDoBanco, dados: Partial<DadosDoSetor>): Error {
  const recusaPorProcessos = recusaDeProcessos(erro)
  if (recusaPorProcessos) return recusaPorProcessos
  const repetido = erro.code === '23505'
  if (repetido && erro.message.includes('setores_sigla_key')) {
    return new TravaDoBanco(`Já existe um setor com a sigla ${dados.sigla}.`)
  }
  if (repetido && erro.message.includes('setores_nome_unico')) {
    return new TravaDoBanco(`Já existe um setor com o nome ${dados.nome}.`)
  }
  return recusaPorPerfil(erro, RECUSAS_DOS_CADASTROS.semPermissao)
}
