// A importação dos arquivos da pasta (ticket 02): as leituras para a prévia e o envio pela função arquivos-no-drive, com a marca
// `importacao: true` (só o Administrador; a função e o banco conferem de novo). Os bytes vão do navegador direto ao Google.
import type { ClienteSupabase } from '../lib/supabase'
import { type EnviarBytes, chamarFuncao, enviarAoDrive } from '../versoes/funcaoDoDrive'
import { chaveDoProcesso } from './chaves'
import type { ModuloDeImportacao, PedidoDeImportacaoDeVersao, ProcessoDaPasta, ProcessosParaAPasta, ResultadoDaGravacao, ResultadoDaVersao } from './tipos'

type MetodosDaPasta = Pick<ModuloDeImportacao, 'listarProcessosDaPasta' | 'importarVersao' | 'importarAnexo' | 'anotarSubpasta'>

export function criarImportacaoDaPastaSupabase(cliente: ClienteSupabase, enviarBytes: EnviarBytes): MetodosDaPasta {
  return {
    listarProcessosDaPasta: () => listarProcessosDaPasta(cliente),
    importarVersao: (pedido, aoProgredir) => importarVersao(cliente, enviarBytes, pedido, aoProgredir),
    importarAnexo: (processoId, arquivo) => importarAnexo(cliente, enviarBytes, processoId, arquivo),
    anotarSubpasta: (processoId, subpasta) => anotarSubpasta(cliente, processoId, subpasta),
  }
}

type Leitura<T> = { data: T[] | null; error: { message: string } | null }

function linhasOuFalha<T>(leitura: Leitura<T>, oQue: string): T[] {
  if (leitura.error) throw new Error(`Falha ao ler ${oQue}: ${leitura.error.message}`)
  return leitura.data ?? []
}

type LinhaDoRelatorio = { numero_do_relatorio: number | null; versoes: { processo_id: string } | null }

// ponytail: cada leitura devolve até 1000 linhas (limite do PostgREST); a pasta real tem perto de 200 versões. Passando disso, a
// prévia deixa de marcar algumas como puladas, mas o banco confere de novo e devolve "ja_existia". Paginar se crescer.
async function listarProcessosDaPasta(cliente: ClienteSupabase): Promise<ProcessosParaAPasta> {
  const [processos, versoes, relatorios, importados] = await Promise.all([
    cliente.from('processos_com_andamento').select('id, setor_sigla, nome'),
    cliente.from('versoes').select('processo_id, numero'),
    cliente.from('arquivos_da_versao').select('numero_do_relatorio, versoes(processo_id)').eq('papel', 'relatorio'),
    cliente.from('eventos').select('id').eq('entidade', 'processo').eq('acao', 'importar').limit(1),
  ])
  const numeros = linhasOuFalha(versoes as Leitura<{ processo_id: string; numero: number }>, 'as versões que já existem')
  const doRelatorio = linhasOuFalha(relatorios as unknown as Leitura<LinhaDoRelatorio>, 'os relatórios que já existem')
  const lista = linhasOuFalha(processos as Leitura<{ id: string | null; setor_sigla: string | null; nome: string | null }>, 'os processos')
  return {
    haImportado: linhasOuFalha(importados as Leitura<{ id: number }>, 'o histórico da importação').length > 0,
    processos: lista.map((p) => processoDaPasta(p.id ?? '', p.setor_sigla ?? '', p.nome ?? '', numeros, doRelatorio)),
  }
}

function processoDaPasta(id: string, sigla: string, nome: string, numeros: { processo_id: string; numero: number }[],
  relatorios: LinhaDoRelatorio[]): ProcessoDaPasta {
  const doProcesso = relatorios.filter((r) => r.versoes?.processo_id === id).map((r) => r.numero_do_relatorio ?? 0)
  return {
    id, chave: chaveDoProcesso(sigla, nome), nome,
    versoes: numeros.filter((v) => v.processo_id === id).map((v) => v.numero), maiorRelatorio: Math.max(0, ...doProcesso),
  }
}

// Um arquivo por vez, para o andamento ser real; o registro só acontece depois que todos chegaram ao Drive.
async function importarVersao(cliente: ClienteSupabase, enviarBytes: EnviarBytes, pedido: PedidoDeImportacaoDeVersao,
  aoProgredir: (enviados: number, total: number) => void): Promise<ResultadoDaVersao> {
  const { processoId, numero, tipo, numeroDoRelatorio } = pedido
  const daVersao = { importacao: true, processo_id: processoId, numero, historica: tipo === 'historica', piloto: tipo === 'piloto' }
  const doRelatorio = numeroDoRelatorio === null ? {} : { numero_do_relatorio: numeroDoRelatorio }
  const ids: string[] = []
  for (const { papel, arquivo } of pedido.arquivos) {
    const extras = papel === 'relatorio' ? doRelatorio : {}
    const corpo = { ...daVersao, papel, nome_original: arquivo.name, tamanho: arquivo.size, ...extras }
    ids.push(await enviarAoDrive(cliente, enviarBytes, corpo, arquivo))
    aoProgredir(ids.length, pedido.arquivos.length)
  }
  const arquivos = pedido.arquivos.map(({ papel }, posicao) => ({ papel, drive_id: ids[posicao] }))
  const { resultado } = await chamarFuncao<{ resultado: ResultadoDaVersao }>(cliente, { acao: 'registrar', ...daVersao, ...doRelatorio, arquivos })
  return resultado
}

async function importarAnexo(cliente: ClienteSupabase, enviarBytes: EnviarBytes, processoId: string, arquivo: File): Promise<ResultadoDaGravacao> {
  const doAnexo = { importacao: true, processo_id: processoId }
  const id = await enviarAoDrive(cliente, enviarBytes, { ...doAnexo, papel: 'anexo', nome_original: arquivo.name, tamanho: arquivo.size }, arquivo)
  const { resultado } = await chamarFuncao<{ resultado: ResultadoDaGravacao }>(cliente, {
    acao: 'registrar', ...doAnexo, arquivos: [{ papel: 'anexo', drive_id: id }],
  })
  return resultado
}

async function anotarSubpasta(cliente: ClienteSupabase, processoId: string, subpasta: string): Promise<void> {
  const { error } = await cliente.rpc('anotar_subpasta_da_importacao', { p_processo: processoId, p_subpasta: subpasta })
  if (error) throw new Error(`o banco recusou a linha da subpasta ${subpasta} (${error.message})`)
}
