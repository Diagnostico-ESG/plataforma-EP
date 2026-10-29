import {
  type ErroDoBanco, type RecusasDoModulo, TravaDoBanco, porQueNadaMudou,
} from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoBanco } from './recusasDoBanco'
import type { DadosDoProcesso, ModuloDeProcessos } from './tipos'

type OperacoesDeGravacao = Pick<ModuloDeProcessos, 'criarProcesso' | 'editarProcesso' | 'excluirProcesso' | 'marcarDataDaModelagemPiloto'>
type DadosDaFalha = Pick<DadosDoProcesso, 'nome' | 'setorId'>
type RespostaDaGravacao = { data: { id: string }[] | null; error: ErroDoBanco | null }

// As recusas chegam de fora (as de processos) para este módulo não importar quem o monta.
export function criarGravacaoDeProcessoSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): OperacoesDeGravacao {
  const tabela = () => cliente.from('processos')
  const conferir = (id: string, resposta: RespostaDaGravacao, dados?: DadosDaFalha) =>
    conferirGravacao(cliente, id, recusas, resposta, dados)
  return {
    criarProcesso: async (dados) => {
      const { data, error } = await tabela().insert(valoresDoCadastro(dados)).select('id')
      if (error) throw await falhaDoProcesso(cliente, error, recusas, dados)
      return idDoCriado(data)
    },
    editarProcesso: async (id, dados) =>
      conferir(id, await tabela().update(valoresDaEdicao(dados)).eq('id', id).select('id'), dados),
    excluirProcesso: async (id) => conferir(id, await tabela().delete().eq('id', id).select('id')),
    marcarDataDaModelagemPiloto: async (id, data) =>
      conferir(id, await tabela().update({ data_da_modelagem_piloto: data }).eq('id', id).select('id')),
  }
}

function idDoCriado(data: { id: string }[] | null): string {
  const id = data?.[0]?.id
  if (!id) throw new Error(`O banco não devolveu o id do processo criado: recebido ${JSON.stringify(data)}, esperado uma linha com id.`)
  return id
}

function valoresDaEdicao(dados: DadosDoProcesso) {
  return {
    setor_id: dados.setorId, macroprocesso_id: dados.macroprocessoId, nome: dados.nome, origem: dados.origem,
    contexto: dados.contexto, observacoes: dados.observacoes,
  }
}

// Tipo e pai só entram no cadastro: mudam depois pela reclassificação. A data da modelagem piloto não entra (o banco recusa
// citar a coluna na criação): ela se registra depois, na linha da etapa.
function valoresDoCadastro(dados: DadosDoProcesso) {
  return { ...valoresDaEdicao(dados), tipo: dados.tipo, processo_pai_id: dados.processoPaiId }
}

// A RLS não acusa erro ao filtrar: sem linha afetada, a leitura decide entre perfil e processo que sumiu.
async function conferirGravacao(
  cliente: ClienteSupabase, id: string, recusas: RecusasDoModulo, { data, error }: RespostaDaGravacao,
  dados?: DadosDaFalha,
): Promise<void> {
  if (error) throw await falhaDoProcesso(cliente, error, recusas, dados)
  if (data?.length) return
  const { data: lidos } = await cliente.from('processos').select('id').eq('id', id)
  throw porQueNadaMudou(Boolean(lidos?.length), recusas)
}

// O banco recusa pelo código do Postgres e pelo nome da restrição (migração processos); a frase usa o que foi enviado.
async function falhaDoProcesso(
  cliente: ClienteSupabase, erro: ErroDoBanco, recusas: RecusasDoModulo, dados?: DadosDaFalha,
): Promise<Error> {
  if (dados && erro.code === '23505' && erro.message.includes('processos_nome_unico')) {
    return new TravaDoBanco(`Já existe um processo com o nome ${dados.nome} no setor ${await siglaDoSetor(cliente, dados.setorId)}.`)
  }
  // O setor ou o macroprocesso escolhido foi excluído por outra pessoa enquanto o formulário estava aberto.
  if (erro.code === '23503') return recusas.registroInexistente()
  // As recusas com motivo (processo com subprocessos, pai que não é Processo) e a do perfil.
  return falhaDoBanco(erro, recusas)
}

async function siglaDoSetor(cliente: ClienteSupabase, setorId: string): Promise<string> {
  const { data } = await cliente.from('setores').select('sigla').eq('id', setorId)
  return data?.[0]?.sigla ?? setorId
}
