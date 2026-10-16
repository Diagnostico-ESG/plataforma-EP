// As ações deste ticket: iniciar_envio (sessão de envio resumível; os bytes vão do navegador direto ao Google)
// e baixar (os bytes passam pela função). Tudo o que lê do banco usa o login de quem chamou.
import {
  conferirProcessoEmAndamento,
  extensaoDoNome,
  recusar,
  type EntradaBaixar,
  type EntradaIniciarEnvio,
} from '../_shared/decisao.ts'
import { tipoMimeDaExtensao } from '../_shared/drive.ts'
import { nomePadrao } from '../_shared/nomePadrao.ts'
import { conferirAlvoDoEnvio, type AlvoDaSubstituicao } from '../_shared/substituicao.ts'
import { chamarDrive } from './google.ts'
import {
  API_DE_ARQUIVOS, conferidorDaRaiz, garantirPastaDoProcesso, type ContextoDoDrive, type ProcessoDaPasta,
} from './pastas.ts'
import { responderJson, responderRecusa } from './respostas.ts'

const API_DE_ENVIO = 'https://www.googleapis.com/upload/drive/v3/files'

export interface ProcessoDoEnvio extends ProcessoDaPasta {
  situacao: string
}

export async function lerProcesso(contexto: ContextoDoDrive, id: string): Promise<ProcessoDoEnvio | null> {
  const { data, error } = await contexto.cliente
    .from('processos_com_andamento')
    .select('id, nome, setor_id, setor_sigla, situacao')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`leitura de processos_com_andamento falhou (código ${error.code}); esperado: processo visível`)
  return data as ProcessoDoEnvio | null
}

interface PedidoDaSessao {
  /** Criar um arquivo novo (POST, com nome e pasta) ou atualizar o conteúdo de um que existe (PATCH, sem mexer em nome nem pasta). */
  destino: { criar: { nome: string; pastaId: string } } | { atualizar: string }
  entrada: EntradaIniciarEnvio
  origem: string | null
}

const CAMPOS_DO_ENVIO = 'uploadType=resumable&fields=id,name,size,md5Checksum'

function requisicaoDaSessao({ destino }: PedidoDaSessao): { endereco: string; metodo: string; corpo: string } {
  if ('atualizar' in destino) return { endereco: `${API_DE_ENVIO}/${encodeURIComponent(destino.atualizar)}?${CAMPOS_DO_ENVIO}`, metodo: 'PATCH', corpo: '{}' }
  const { nome, pastaId } = destino.criar
  return { endereco: `${API_DE_ENVIO}?${CAMPOS_DO_ENVIO}`, metodo: 'POST', corpo: JSON.stringify({ name: nome, parents: [pastaId] }) }
}

// O Origin do navegador vai junto: sem ele, o Google recusa o PUT direto do navegador (CORS).
async function abrirSessaoDeEnvio(token: string, pedido: PedidoDaSessao): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Upload-Content-Length': String(pedido.entrada.tamanho),
    'X-Upload-Content-Type': tipoMimeDaExtensao(extensaoDoNome(pedido.entrada.nomeOriginal)),
  }
  if (pedido.origem) headers.Origin = pedido.origem
  const { endereco: destino, metodo, corpo } = requisicaoDaSessao(pedido)
  const resposta = await chamarDrive(token, destino, { method: metodo, headers, body: corpo })
  const endereco = resposta.headers.get('Location')
  if (!endereco) throw new Error('sessão de envio sem endereço (recebido: sem Location); esperado: cabeçalho Location do Drive')
  return endereco
}

function nomeDoArquivo(processo: ProcessoDoEnvio, entrada: EntradaIniciarEnvio): string {
  return nomePadrao({
    sigla: processo.setor_sigla,
    numero: entrada.numero,
    historica: entrada.historica,
    nomeDoProcesso: processo.nome,
    papel: entrada.papel,
    extensao: extensaoDoNome(entrada.nomeOriginal),
  })
}

export async function iniciarEnvio(
  contexto: ContextoDoDrive,
  entrada: EntradaIniciarEnvio,
  origem: string | null,
): Promise<Response> {
  const processo = await lerProcesso(contexto, entrada.processoId)
  if (!processo) return responderRecusa(recusar('entrada_invalida', 'processo não encontrado'))
  const foraDeAndamento = conferirProcessoEmAndamento(processo.situacao)
  if (foraDeAndamento) return responderRecusa(foraDeAndamento)
  if (entrada.arquivoId !== null) return await iniciarSubstituicao(contexto, entrada, entrada.arquivoId, origem)
  const pastaId = await garantirPastaDoProcesso(contexto, processo)
  const nome = nomeDoArquivo(processo, entrada)
  const destino = { criar: { nome, pastaId } }
  const uploadUrl = await abrirSessaoDeEnvio(contexto.token, { destino, entrada, origem })
  return responderJson(200, { upload_url: uploadUrl, nome })
}

interface LinhaDoAlvo {
  papel: AlvoDaSubstituicao['papel']
  formato: string
  nome: string
  drive_id: string
  versoes: { processo_id: string; historica: boolean } | null
}

// O arquivo a substituir, lido pela RLS com o login de quem chamou: o que ela não mostra não existe para a função.
export async function lerAlvoDaSubstituicao(contexto: ContextoDoDrive, arquivoId: string): Promise<AlvoDaSubstituicao | null> {
  const { data, error } = await contexto.cliente
    .from('arquivos_da_versao')
    .select('papel, formato, nome, drive_id, versoes(processo_id, historica)')
    .eq('id', arquivoId)
    .maybeSingle()
  if (error) throw new Error(`leitura de arquivos_da_versao falhou (código ${error.code}); esperado: arquivo visível`)
  const linha = data as unknown as LinhaDoAlvo | null
  if (!linha?.versoes) return null
  const { papel, formato, nome, drive_id: driveId, versoes } = linha
  return { papel, formato, nome, driveId, processoId: versoes.processo_id, historica: versoes.historica }
}

// O processo de uma versão, lido pela RLS com o login de quem chamou (null: a versão não existe ou não aparece).
export async function lerProcessoDaVersao(contexto: ContextoDoDrive, versaoId: string): Promise<string | null> {
  const { data, error } = await contexto.cliente.from('versoes').select('processo_id').eq('id', versaoId).maybeSingle()
  if (error) throw new Error(`leitura de versoes falhou (código ${error.code}); esperado: versão visível`)
  return (data as { processo_id: string } | null)?.processo_id ?? null
}

// Substituir (ADR 0007): a sessão atualiza o MESMO arquivo do Drive (nada novo na pasta, nada apagado); o nome fica
// o que já está guardado. Os bytes vão do navegador direto ao Google, como no envio.
async function iniciarSubstituicao(
  contexto: ContextoDoDrive, entrada: EntradaIniciarEnvio, arquivoId: string, origem: string | null,
): Promise<Response> {
  const conferido = conferirAlvoDoEnvio(await lerAlvoDaSubstituicao(contexto, arquivoId), entrada)
  if (!conferido.ok) return responderRecusa(conferido.recusa)
  if (!(await conferidorDaRaiz(contexto).itemSobARaiz(conferido.valor.driveId))) return responderRecusa(recusar('sem_permissao'))
  const uploadUrl = await abrirSessaoDeEnvio(contexto.token, { destino: { atualizar: conferido.valor.driveId }, entrada, origem })
  return responderJson(200, { upload_url: uploadUrl, nome: conferido.valor.nome })
}

interface ArquivoDaLinha {
  nome: string
  drive_id: string
}

// A conferência é a RLS de arquivos_da_versao, com o login de quem chamou: o que ela não mostra não sai.
// Sem linha visível, a recusa é a mesma de "sem permissão", para não revelar se o arquivo existe.
async function lerArquivoDaVersao(contexto: ContextoDoDrive, arquivoId: string): Promise<ArquivoDaLinha | null> {
  const { data, error } = await contexto.cliente
    .from('arquivos_da_versao')
    .select('nome, drive_id')
    .eq('id', arquivoId)
    .maybeSingle()
  if (error) throw new Error(`leitura de arquivos_da_versao falhou (código ${error.code}); esperado: arquivo visível`)
  return data as ArquivoDaLinha | null
}

// Sempre application/octet-stream: o supabase-js do navegador só devolve Blob para esse tipo (e PDF); qualquer
// outro vira texto e estraga os bytes. O navegador reconstrói o tipo pelo formato do arquivo.
export async function baixar(contexto: ContextoDoDrive, entrada: EntradaBaixar): Promise<Response> {
  const arquivo = await lerArquivoDaVersao(contexto, entrada.arquivoId)
  if (!arquivo || !(await conferidorDaRaiz(contexto).itemSobARaiz(arquivo.drive_id))) return responderRecusa(recusar('sem_permissao'))
  const conteudo = await chamarDrive(contexto.token, `${API_DE_ARQUIVOS}/${encodeURIComponent(arquivo.drive_id)}?alt=media`)
  return new Response(conteudo.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(arquivo.nome)}`,
    },
  })
}
