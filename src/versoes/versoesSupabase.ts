import { tipoMimeDaExtensao } from '../../supabase/functions/_shared/drive.ts'
import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDaFuncao, falhaDoDownload } from './recusasDeVersoes'
import type {
  ArquivoDaVersao, ArquivoEscolhido, ConferenciaDosArquivos, ModuloDeVersoes, PedidoDeAcrescimo, PedidoDeRelatorio,
  PedidoDeSubstituicao, PedidoDeVersao, Versao,
} from './tipos'
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
    acrescentarArquivo: (pedido, aoProgredir) => acrescentarArquivo(cliente, enviarBytes, pedido, aoProgredir),
    enviarRelatorio: (pedido, aoProgredir) => enviarRelatorio(cliente, enviarBytes, pedido, aoProgredir),
    substituirArquivo: (pedido, aoProgredir) => substituirArquivo(cliente, enviarBytes, pedido, aoProgredir),
    conferirArquivos: (processoId) => conferirArquivos(cliente, processoId),
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

// `extras` leva o que muda o pedido da sessão (a substituição manda o `arquivo_id` do arquivo a trocar).
async function enviarUmArquivo(cliente: ClienteSupabase, enviarBytes: EnviarBytes, pedido: PedidoDeVersao,
  { papel, arquivo }: ArquivoEscolhido, historica: boolean, extras: Record<string, unknown> = {}): Promise<string> {
  const { upload_url: endereco } = await chamarFuncao<{ upload_url: string }>(cliente, {
    acao: 'iniciar_envio', processo_id: pedido.processoId, papel, nome_original: arquivo.name, tamanho: arquivo.size,
    numero: pedido.numero, historica, piloto: pedido.piloto ?? false, ...extras,
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
  const doRelatorio = pedido.numeroDoRelatorio === undefined ? {} : { numero_do_relatorio: pedido.numeroDoRelatorio }
  for (const escolhido of pedido.arquivos) {
    const extras = escolhido.papel === 'relatorio' ? doRelatorio : {}
    ids.push(await enviarUmArquivo(cliente, enviarBytes, pedido, escolhido, historica, extras))
    aoProgredir(ids.length, pedido.arquivos.length)
  }
  await chamarFuncao(cliente, {
    acao: 'registrar', processo_id: pedido.processoId, numero: pedido.numero, historica, piloto: pedido.piloto ?? false,
    ...doRelatorio, arquivos: pedido.arquivos.map(({ papel }, posicao) => ({ papel, drive_id: ids[posicao] })),
  })
}

// O relatório sozinho: o mesmo caminho do envio, com um arquivo só; o banco o liga à versão mais recente que não é histórica
// e confere que os números da prévia (da versão e do relatório) ainda valem.
async function enviarRelatorio(cliente: ClienteSupabase, enviarBytes: EnviarBytes, pedido: PedidoDeRelatorio,
  aoProgredir: (enviados: number, total: number) => void): Promise<void> {
  const relatorio: ArquivoEscolhido = { papel: 'relatorio', arquivo: pedido.arquivo }
  const { processoId, numeroDaVersao: numero, piloto, numeroDoRelatorio } = pedido
  const envio = { processoId, numero, piloto, arquivos: [relatorio] }
  const id = await enviarUmArquivo(cliente, enviarBytes, envio, relatorio, false, { numero_do_relatorio: numeroDoRelatorio })
  aoProgredir(1, 1)
  await chamarFuncao(cliente, {
    acao: 'registrar', processo_id: processoId, numero, historica: false, piloto, numero_do_relatorio: numeroDoRelatorio,
    arquivos: [{ papel: 'relatorio', drive_id: id }],
  })
}

// O .png ou o .bpmn que entra depois, numa versão que já existe: com o P da versão piloto no nome do Drive.
async function acrescentarArquivo(cliente: ClienteSupabase, enviarBytes: EnviarBytes, pedido: PedidoDeAcrescimo,
  aoProgredir: (enviados: number, total: number) => void): Promise<void> {
  const escolhido: ArquivoEscolhido = { papel: pedido.papel, arquivo: pedido.arquivo }
  const envio = { processoId: pedido.processoId, numero: pedido.numero, piloto: pedido.piloto, arquivos: [escolhido] }
  const id = await enviarUmArquivo(cliente, enviarBytes, envio, escolhido, false)
  aoProgredir(1, 1)
  await chamarFuncao(cliente, {
    acao: 'registrar', processo_id: pedido.processoId, numero: pedido.numero, historica: false, piloto: pedido.piloto,
    versao_id: pedido.versaoId, arquivos: [{ papel: pedido.papel, drive_id: id }],
  })
}

// A troca: o arquivo novo vai ao mesmo arquivo do Drive (a sessão é de atualização) e só então o banco registra o hash novo.
async function substituirArquivo(cliente: ClienteSupabase, enviarBytes: EnviarBytes, pedido: PedidoDeSubstituicao,
  aoProgredir: (enviados: number, total: number) => void): Promise<void> {
  const { processoId, numero, arquivo, novo } = pedido
  const escolhido: ArquivoEscolhido = { papel: arquivo.papel, arquivo: novo }
  const envio = { processoId, numero, arquivos: [escolhido] }
  const id = await enviarUmArquivo(cliente, enviarBytes, envio, escolhido, false, { arquivo_id: arquivo.id })
  aoProgredir(1, 1)
  await chamarFuncao(cliente, {
    acao: 'registrar', processo_id: processoId, numero, historica: false, piloto: false, arquivo_id: arquivo.id,
    arquivos: [{ papel: arquivo.papel, drive_id: id }],
  })
}

// Só pergunta: a função compara com o Drive e devolve a situação de cada arquivo; nada é gravado.
async function conferirArquivos(cliente: ClienteSupabase, processoId: string): Promise<ConferenciaDosArquivos> {
  const { arquivos } = await chamarFuncao<{ arquivos: ConferenciaDosArquivos }>(cliente, { acao: 'conferir', processo_id: processoId })
  return arquivos
}

// A função devolve application/octet-stream (o supabase-js só entrega Blob para esse tipo); o tipo do formato é
// recolocado aqui para o navegador saber mostrar o .png e o .pdf.
async function baixarArquivo(cliente: ClienteSupabase, arquivo: ArquivoDaVersao): Promise<Blob> {
  const dados = await chamarFuncao<unknown>(cliente, { acao: 'baixar', arquivo_id: arquivo.id }, falhaDoDownload)
  if (!(dados instanceof Blob)) throw new Error(`a função devolveu ${typeof dados}; esperado: os bytes do arquivo (Blob)`)
  return new Blob([dados], { type: tipoMimeDaExtensao(arquivo.formato) })
}
