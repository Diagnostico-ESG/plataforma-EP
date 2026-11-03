import { type ErroDoBanco, TravaDoBanco, porQueNadaMudou, recusaPorPerfil } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { RECUSAS_DOS_CADASTROS } from './cadastroInexistente'
import { recusaDeProcessos } from './recusasDeProcessos'
import type {
  DadosDoMacroprocesso, MacroprocessoComSetores, MacroprocessoDaLista, ModuloDeCadastros, SetorEnvolvido,
} from './tipos'

type AlteracaoDoMacroprocesso = Partial<DadosDoMacroprocesso> & { ativo?: boolean }
type OperacoesDeMacroprocesso = Pick<ModuloDeCadastros, 'listarMacroprocessos' | 'criarMacroprocesso'
  | 'lerMacroprocesso' | 'editarMacroprocesso' | 'desativarMacroprocesso' | 'reativarMacroprocesso'
  | 'excluirMacroprocesso'>


export function criarMacroprocessosSupabase(cliente: ClienteSupabase): OperacoesDeMacroprocesso {
  return {
    listarMacroprocessos: () => listar(cliente),
    criarMacroprocesso: (dados) => criar(cliente, dados),
    lerMacroprocesso: (id) => ler(cliente, id),
    editarMacroprocesso: (id, dados) => alterar(cliente, id, dados),
    desativarMacroprocesso: (id) => alterar(cliente, id, { ativo: false }),
    reativarMacroprocesso: (id) => alterar(cliente, id, { ativo: true }),
    excluirMacroprocesso: (id) => excluir(cliente, id),
  }
}

async function listar(cliente: ClienteSupabase): Promise<MacroprocessoDaLista[]> {
  const { data, error } = await cliente.from('macroprocessos')
    .select('id, codigo, nome, descricao, categoria, ativo, setores_envolvidos(count)')
    .order('codigo', { nullsFirst: false }).order('nome')
  if (error) throw new Error(`Falha ao listar os macroprocessos: ${error.message}`)
  return data.map(({ setores_envolvidos: contagem, ...macroprocesso }) => ({
    ...macroprocesso, quantidadeDeSetores: contagem[0]?.count ?? 0,
  }))
}

type VinculoLido = {
  observacao: string | null
  setores: { id: string; sigla: string; nome: string; ativo: boolean; cor: number } | null
}

async function ler(cliente: ClienteSupabase, id: string): Promise<MacroprocessoComSetores | null> {
  const { data, error } = await cliente.from('macroprocessos')
    .select('id, codigo, nome, descricao, categoria, ativo, setores_envolvidos(observacao, setores(id, sigla, nome, ativo, cor))')
    .eq('id', id)
  if (error) throw new Error(`Falha ao ler o macroprocesso: ${error.message}`)
  if (!data[0]) return null
  const { setores_envolvidos: vinculos, ...macroprocesso } = data[0]
  return { ...macroprocesso, setoresEnvolvidos: setoresEnvolvidos(vinculos) }
}

// Os setores saem na ordem da sigla; o banco não ordena o que vem embutido.
function setoresEnvolvidos(vinculos: VinculoLido[]): SetorEnvolvido[] {
  return vinculos
    .flatMap(({ observacao, setores }) => (setores
      ? [{ setorId: setores.id, sigla: setores.sigla, nome: setores.nome, ativo: setores.ativo, cor: setores.cor, observacao }]
      : []))
    .sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR'))
}

async function criar(cliente: ClienteSupabase, dados: DadosDoMacroprocesso): Promise<void> {
  const { error } = await cliente.from('macroprocessos').insert(dados)
  if (error) throw falhaDoMacroprocesso(error, dados)
}

async function alterar(cliente: ClienteSupabase, id: string, alteracao: AlteracaoDoMacroprocesso): Promise<void> {
  const { data, error } = await cliente.from('macroprocessos').update(alteracao).eq('id', id).select('id')
  if (error) throw falhaDoMacroprocesso(error, alteracao)
  if (!data.length) throw porQueNadaMudou(Boolean(await ler(cliente, id)), RECUSAS_DOS_CADASTROS)
}

async function excluir(cliente: ClienteSupabase, id: string): Promise<void> {
  const { data, error } = await cliente.from('macroprocessos').delete().eq('id', id).select('id')
  if (error) throw falhaDoMacroprocesso(error, {})
  if (!data.length) throw porQueNadaMudou(Boolean(await ler(cliente, id)), RECUSAS_DOS_CADASTROS)
}

// O banco recusa pelo código do Postgres e pelo nome da restrição (migração de macroprocessos); a frase usa o que foi enviado.
function falhaDoMacroprocesso(erro: ErroDoBanco, dados: AlteracaoDoMacroprocesso): Error {
  const recusaPorProcessos = recusaDeProcessos(erro)
  if (recusaPorProcessos) return recusaPorProcessos
  const repetido = erro.code === '23505'
  if (repetido && erro.message.includes('macroprocessos_nome_unico')) {
    return new TravaDoBanco(`Já existe um macroprocesso com o nome ${dados.nome}.`)
  }
  if (repetido && erro.message.includes('macroprocessos_codigo_key')) {
    return new TravaDoBanco(`Já existe um macroprocesso com o código ${dados.codigo}.`)
  }
  return recusaPorPerfil(erro, RECUSAS_DOS_CADASTROS.semPermissao)
}
