import { TravaDoBanco, type ErroDoBanco } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { FRASE_EM_ANDAMENTO, FRASE_NAO_CONFIGURADA, FRASE_SEM_PERMISSAO } from './frasesDasPlanilhas'
import type { AtualizacaoDasPlanilhas, LinksDasPlanilhas, ModuloDePlanilhas } from './tipos'

// A view traz o resultado já calculado (em andamento, sem resposta, concluída, falhou) e o nome de quem pediu.
const COLUNAS = 'id, iniciada_em, origem, pedida_por_nome, motivo, resultado'

type LinhaDaAtualizacao = {
  id: string
  iniciada_em: string
  origem: AtualizacaoDasPlanilhas['origem']
  pedida_por_nome: string | null
  motivo: string | null
  resultado: AtualizacaoDasPlanilhas['resultado']
}

type LinhaDosLinks = { planilha_interna: string | null; planilha_publica: string | null }

export function criarPlanilhasSupabase(cliente: ClienteSupabase): ModuloDePlanilhas {
  return {
    listarAtualizacoes: () => listarAtualizacoes(cliente),
    lerLinks: () => lerLinks(cliente),
    pedirAtualizacao: () => pedirAtualizacao(cliente),
  }
}

function atualizacaoDaLinha(linha: LinhaDaAtualizacao): AtualizacaoDasPlanilhas {
  return {
    id: linha.id, iniciadaEm: linha.iniciada_em, origem: linha.origem, pedidaPor: linha.pedida_por_nome,
    resultado: linha.resultado, motivo: linha.motivo,
  }
}

async function listarAtualizacoes(cliente: ClienteSupabase): Promise<AtualizacaoDasPlanilhas[]> {
  const { data, error } = await cliente.from('resultado_das_atualizacoes_das_planilhas').select(COLUNAS)
    .order('iniciada_em', { ascending: false }).limit(10)
  if (error) throw new Error(`Falha ao ler as atualizações das planilhas: ${error.message}`)
  return (data as unknown as LinhaDaAtualizacao[]).map(atualizacaoDaLinha)
}

// O banco devolve uma linha com os dois endereços nulos enquanto o cofre está incompleto.
async function lerLinks(cliente: ClienteSupabase): Promise<LinksDasPlanilhas | null> {
  const { data, error } = await cliente.rpc('links_das_planilhas')
  if (error) throw new Error(`Falha ao ler os links das planilhas: ${error.message}`)
  const linha = (data as LinhaDosLinks[])[0]
  if (!linha?.planilha_interna || !linha.planilha_publica) return null
  return { interna: linha.planilha_interna, publica: linha.planilha_publica }
}

async function pedirAtualizacao(cliente: ClienteSupabase): Promise<void> {
  const { error } = await cliente.rpc('pedir_atualizacao_das_planilhas')
  if (error) throw falhaDoPedido(error)
}

// As recusas chegam como texto simples em P0001 (private.iniciar_atualizacao_das_planilhas) ou como 42501 (perfil).
function falhaDoPedido(erro: ErroDoBanco): Error {
  if (erro.message.includes('atualizacao_em_andamento')) return new TravaDoBanco(FRASE_EM_ANDAMENTO)
  if (erro.message.includes('planilhas_nao_configuradas')) return new TravaDoBanco(FRASE_NAO_CONFIGURADA)
  if (erro.code === '42501') return new TravaDoBanco(FRASE_SEM_PERMISSAO)
  return new Error(`erro inesperado do banco (${erro.message})`)
}
