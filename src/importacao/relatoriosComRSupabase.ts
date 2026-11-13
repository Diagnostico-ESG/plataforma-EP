// Os relatórios com R (documentos-versoes, mudança de 2026-11-13; ADR 0047): a leitura dos relatórios numerados para a seção 3
// da aba Importação e a renomeação de um por vez pela função arquivos-no-drive (só o Administrador; a função e o banco
// conferem de novo). A regra do nome é a mesma da função e do banco (_shared/relatorioComR.ts).
import { situacaoDoNomeDoRelatorio } from '../../supabase/functions/_shared/relatorioComR.ts'
import type { ClienteSupabase } from '../lib/supabase'
import { chamarFuncao } from '../versoes/funcaoDoDrive'
import type { ModuloDeImportacao, RelatorioComV, RelatoriosComV } from './tipos'

type MetodosDosRelatorios = Pick<ModuloDeImportacao, 'listarRelatoriosComV' | 'renomearRelatorio'>

export function criarRelatoriosComRSupabase(cliente: ClienteSupabase): MetodosDosRelatorios {
  return {
    listarRelatoriosComV: () => listarRelatoriosComV(cliente),
    renomearRelatorio: (relatorio) => renomearRelatorio(cliente, relatorio),
  }
}

type LinhaDoRelatorio = { id: string; nome: string; numero_do_relatorio: number | null }

// Só os numerados contam: o relatório sem número (o .pdf antigo e o da histórica) fica de fora e não entra nem como fora do padrão.
function classificar(linhas: LinhaDoRelatorio[]): RelatoriosComV {
  const resultado: RelatoriosComV = { aRenomear: [], foraDoPadrao: 0 }
  for (const linha of linhas.filter((l) => l.numero_do_relatorio !== null)) {
    const situacao = situacaoDoNomeDoRelatorio(linha.nome, linha.numero_do_relatorio)
    if (situacao.tipo === 'a_renomear') resultado.aRenomear.push({ arquivoId: linha.id, nome: linha.nome })
    if (situacao.tipo === 'fora_do_padrao') resultado.foraDoPadrao += 1
  }
  return resultado
}

// ponytail: a leitura devolve até 1000 linhas (limite do PostgREST); a produção tem algumas centenas de relatórios. Passando
// disso, a contagem fica curta, mas clicar de novo lê e renomeia os que faltam. Paginar se crescer.
async function listarRelatoriosComV(cliente: ClienteSupabase): Promise<RelatoriosComV> {
  const { data, error } = await cliente.from('arquivos_da_versao').select('id, nome, numero_do_relatorio').eq('papel', 'relatorio')
  if (error) throw new Error(`Falha ao ler os relatórios: ${error.message}`)
  return classificar((data ?? []) as LinhaDoRelatorio[])
}

async function renomearRelatorio(cliente: ClienteSupabase, relatorio: RelatorioComV): Promise<void> {
  await chamarFuncao(cliente, { acao: 'renomear_relatorio', arquivo_id: relatorio.arquivoId })
}
