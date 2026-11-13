import { type ErroDoBanco, TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { type EnviarBytes, enviarComFetch } from '../versoes/funcaoDoDrive'
import { chaveDoProcesso } from './chaves'
import { criarImportacaoDaPastaSupabase } from './importacaoDaPastaSupabase'
import { criarRelatoriosComRSupabase } from './relatoriosComRSupabase'
import type { ExistentesNaPlataforma, ModuloDeImportacao, ProcessoParaImportar, ResultadoDaGravacao } from './tipos'

const FRASE_SEM_PERMISSAO = 'Só o Administrador pode importar os dados.'

export function criarImportacaoSupabase(cliente: ClienteSupabase, enviarBytes: EnviarBytes = enviarComFetch): ModuloDeImportacao {
  return {
    listarExistentes: () => listarExistentes(cliente),
    gravarProcesso: (processo) => gravarProcesso(cliente, processo),
    ...criarImportacaoDaPastaSupabase(cliente, enviarBytes),
    ...criarRelatoriosComRSupabase(cliente),
  }
}

// ponytail: a leitura devolve até 1000 linhas (limite do PostgREST); passando disso a prévia deixa de marcar alguns "já existia",
// mas a gravação confere de novo no banco e pula o processo. Paginar se o escritório chegar a esse volume.
async function listarExistentes(cliente: ClienteSupabase): Promise<ExistentesNaPlataforma> {
  const [setores, macroprocessos, processos] = await Promise.all([
    cliente.from('setores').select('sigla'),
    cliente.from('macroprocessos').select('nome'),
    cliente.from('processos_com_andamento').select('setor_sigla, nome'),
  ])
  const erro = setores.error ?? macroprocessos.error ?? processos.error
  if (erro) throw new Error(`Falha ao ler o que já existe na plataforma: ${erro.message}`)
  return {
    setores: (setores.data ?? []).map((s) => s.sigla.toUpperCase()),
    macroprocessos: (macroprocessos.data ?? []).map((m) => m.nome.toLowerCase()),
    processos: (processos.data ?? []).map((p) => chaveDoProcesso(p.setor_sigla ?? '', p.nome ?? '')),
  }
}

async function gravarProcesso(cliente: ClienteSupabase, processo: ProcessoParaImportar): Promise<ResultadoDaGravacao> {
  const { data, error } = await cliente.rpc('importar_processo', {
    p_setor: processo.setor, p_macroprocesso: processo.macroprocesso, p_nome: processo.nome, p_etapa: processo.etapaCodigo,
    p_data_da_publicacao: processo.dataDaPublicacao ?? undefined,
    p_data_da_modelagem_piloto: processo.dataDaModelagemPiloto ?? undefined,
    p_anotacoes: processo.anotacoes ?? undefined,
  })
  if (error) throw falhaDaImportacao(error, processo.nome)
  if (data === 'criado' || data === 'ja_existia') return data
  throw new Error(`O banco devolveu ${JSON.stringify(data)} ao importar ${processo.nome}; esperado "criado" ou "ja_existia".`)
}

// As recusas chegam como 42501 (perfil) ou "motivo:valor" em P0001 (etapa inválida, data do piloto no futuro).
function falhaDaImportacao(erro: ErroDoBanco, nome: string): Error {
  if (erro.code === '42501') return new TravaDoBanco(FRASE_SEM_PERMISSAO)
  if (erro.message.includes('modelagem_no_futuro')) {
    return new TravaDoBanco(`${nome}: a data da modelagem piloto está no futuro (${erro.message}).`)
  }
  return new Error(`o banco recusou ${nome} (${erro.message})`)
}
