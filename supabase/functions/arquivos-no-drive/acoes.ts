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
import { chamarDrive } from './google.ts'
import { API_DE_ARQUIVOS, garantirPastaDoProcesso, type ContextoDoDrive, type ProcessoDaPasta } from './pastas.ts'
import { responderJson, responderRecusa } from './respostas.ts'

const API_DE_ENVIO = 'https://www.googleapis.com/upload/drive/v3/files'

interface ProcessoDoEnvio extends ProcessoDaPasta {
  situacao: string
}

async function lerProcesso(contexto: ContextoDoDrive, id: string): Promise<ProcessoDoEnvio | null> {
  const { data, error } = await contexto.cliente
    .from('processos_com_andamento')
    .select('id, nome, setor_id, setor_sigla, situacao')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`leitura de processos_com_andamento falhou (código ${error.code}); esperado: processo visível`)
  return data as ProcessoDoEnvio | null
}

interface PedidoDaSessao {
  nome: string
  pastaId: string
  entrada: EntradaIniciarEnvio
  origem: string | null
}

// O Origin do navegador vai junto: sem ele, o Google recusa o PUT direto do navegador (CORS).
async function abrirSessaoDeEnvio(token: string, pedido: PedidoDaSessao): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Upload-Content-Length': String(pedido.entrada.tamanho),
    'X-Upload-Content-Type': tipoMimeDaExtensao(extensaoDoNome(pedido.entrada.nomeOriginal)),
  }
  if (pedido.origem) headers.Origin = pedido.origem
  const resposta = await chamarDrive(token, `${API_DE_ENVIO}?uploadType=resumable&fields=id,name,size,md5Checksum`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: pedido.nome, parents: [pedido.pastaId] }),
  })
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
  const pastaId = await garantirPastaDoProcesso(contexto, processo)
  const nome = nomeDoArquivo(processo, entrada)
  const uploadUrl = await abrirSessaoDeEnvio(contexto.token, { nome, pastaId, entrada, origem })
  return responderJson(200, { upload_url: uploadUrl, nome })
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
  if (!arquivo) return responderRecusa(recusar('sem_permissao'))
  const conteudo = await chamarDrive(contexto.token, `${API_DE_ARQUIVOS}/${arquivo.drive_id}?alt=media`)
  return new Response(conteudo.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(arquivo.nome)}`,
    },
  })
}
