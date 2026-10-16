import { tipoMimeDaExtensao } from '../../supabase/functions/_shared/drive.ts'
import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDaFuncao, falhaDoDownload } from './recusasDeVersoes'
import type { ArquivoDaVersao, ArquivoEscolhido, ModuloDeVersoes, PedidoDeRelatorio, PedidoDeVersao, Versao } from './tipos'
import { COLUNAS_DA_VERSAO, type LinhaDaVersao, versaoDaLinha } from './versaoDaLinha'

/** O PUT dos bytes ao endereço da sessão de envio do Drive; injetável para o teste simular o Google. */
export type EnviarBytes = (endereco: string, arquivo: File) => Promise<Response>

// Os bytes vão do navegador direto ao Google (não passam pela função), com o tipo declarado na sessão.
export const enviarComFetch: EnviarBytes = (endereco, arquivo) =>
  fetch(endereco, { method: 'PUT', body: arquivo, headers: { 'Content-Type': tipoMimeDaExtensao(extensaoDoNome(arquivo.name)) } })

export function criarVersoesSupabase(cliente: ClienteSupabase, enviarBytes: EnviarBytes = enviarComFetch): ModuloDeVersoes {
  return {
    listarVersoes: (processoId) => listarVersoes(cliente, processoId),
    enviarVersao: (pedido, aoProgredir) => enviarVersao(cliente, enviarBytes, pedido, aoProgredir, false),
    registrarVersaoHistorica: (pedido, aoProgredir) => enviarVersao(cliente, enviarBytes, pedido, aoProgredir, true),
    acrescentarRelatorio: (pedido, aoProgredir) => acrescentarRelatorio(cliente, enviarBytes, pedido, aoProgredir),
    semAlteracaoDeConteudo: (processoId, versaoId) => semAlteracao(cliente, processoId, versaoId),
    baixarArquivo: (arquivo) => baixarArquivo(cliente, arquivo),
  }
}

async function listarVersoes(cliente: ClienteSupabase, processoId: string): Promise<Versao[]> {
  const { data, error } = await cliente.from('versoes').select(COLUNAS_DA_VERSAO)
    .eq('processo_id', processoId).order('numero', { ascending: false })
  if (error) throw new Error(`Falha ao ler as versões do processo ${processoId}: ${error.message}`)
  return (data as unknown as LinhaDaVersao[]).map(versaoDaLinha)
}

type FalhaDaChamada = { message: string; context?: unknown }
type TradutorDeFalha = (codigo: string, mensagem: string) => Error

// Na resposta fora de 2xx, o supabase-js põe a Response em `context`; sem ela, o pedido nem chegou à função.
async function falhaDaChamada(erro: FalhaDaChamada, traduzir: TradutorDeFalha): Promise<Error> {
  const resposta = erro.context instanceof Response ? erro.context : null
  const corpo: unknown = resposta ? await resposta.json().catch(() => null) : null
  const { codigo, mensagem } = (corpo ?? {}) as { codigo?: unknown; mensagem?: unknown }
  if (typeof codigo === 'string') return traduzir(codigo, typeof mensagem === 'string' ? mensagem : '')
  return new Error('não foi possível falar com o servidor (sem conexão?)')
}

async function chamarFuncao<T>(cliente: ClienteSupabase, corpo: Record<string, unknown>,
  traduzir: TradutorDeFalha = falhaDaFuncao): Promise<T> {
  const { data, error } = await cliente.functions.invoke('arquivos-no-drive', { body: corpo })
  if (error) throw await falhaDaChamada(error as FalhaDaChamada, traduzir)
  return data as T
}

async function enviarUmArquivo(cliente: ClienteSupabase, enviarBytes: EnviarBytes, pedido: PedidoDeVersao,
  { papel, arquivo }: ArquivoEscolhido, historica: boolean): Promise<string> {
  const { upload_url: endereco } = await chamarFuncao<{ upload_url: string }>(cliente, {
    acao: 'iniciar_envio', processo_id: pedido.processoId, papel, nome_original: arquivo.name, tamanho: arquivo.size,
    numero: pedido.numero, historica,
  })
  const resposta = await enviarBytes(endereco, arquivo).catch(() => null)
  if (!resposta?.ok) throw new Error(`o arquivo ${arquivo.name} não chegou ao Drive`)
  const { id } = (await resposta.json()) as { id: string }
  return id
}

// Um arquivo por vez, para o progresso ser real; o registro só acontece depois que todos chegaram ao Drive. A
// histórica segue o mesmo caminho: o banco (função registrar_versao_historica) é que aplica as regras dela.
async function enviarVersao(cliente: ClienteSupabase, enviarBytes: EnviarBytes, pedido: PedidoDeVersao,
  aoProgredir: (enviados: number, total: number) => void, historica: boolean): Promise<void> {
  const ids: string[] = []
  for (const escolhido of pedido.arquivos) {
    ids.push(await enviarUmArquivo(cliente, enviarBytes, pedido, escolhido, historica))
    aoProgredir(ids.length, pedido.arquivos.length)
  }
  await chamarFuncao(cliente, {
    acao: 'registrar', processo_id: pedido.processoId, numero: pedido.numero, observacao: pedido.observacao, historica,
    arquivos: pedido.arquivos.map(({ papel }, posicao) => ({ papel, drive_id: ids[posicao] })),
  })
}

// O relatório que ficou pendente: o mesmo caminho do envio, com um arquivo só, registrado na versão que já existe.
async function acrescentarRelatorio(cliente: ClienteSupabase, enviarBytes: EnviarBytes, pedido: PedidoDeRelatorio,
  aoProgredir: (enviados: number, total: number) => void): Promise<void> {
  const relatorio: ArquivoEscolhido = { papel: 'relatorio', arquivo: pedido.arquivo }
  const envio = { processoId: pedido.processoId, numero: pedido.numero, observacao: null, arquivos: [relatorio] }
  const id = await enviarUmArquivo(cliente, enviarBytes, envio, relatorio, false)
  aoProgredir(1, 1)
  await chamarFuncao(cliente, {
    acao: 'registrar', processo_id: pedido.processoId, numero: pedido.numero, observacao: null, historica: false,
    versao_id: pedido.versaoId, arquivos: [{ papel: 'relatorio', drive_id: id }],
  })
}

// A cópia é feita pela função, no Drive: aqui só se pede, e a recusa volta como frase da tela.
async function semAlteracao(cliente: ClienteSupabase, processoId: string, versaoId: string): Promise<void> {
  await chamarFuncao(cliente, { acao: 'sem_alteracao', processo_id: processoId, versao_id: versaoId })
}

// A função devolve application/octet-stream (o supabase-js só entrega Blob para esse tipo); o tipo do formato é
// recolocado aqui para o navegador saber mostrar o .png e o .pdf.
async function baixarArquivo(cliente: ClienteSupabase, arquivo: ArquivoDaVersao): Promise<Blob> {
  const dados = await chamarFuncao<unknown>(cliente, { acao: 'baixar', arquivo_id: arquivo.id }, falhaDoDownload)
  if (!(dados instanceof Blob)) throw new Error(`a função devolveu ${typeof dados}; esperado: os bytes do arquivo (Blob)`)
  return new Blob([dados], { type: tipoMimeDaExtensao(arquivo.formato) })
}
