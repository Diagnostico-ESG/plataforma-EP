// Ação registrar (ticket 02): depois que todos os arquivos chegaram ao Drive, lê de cada um o que o Drive informa
// (nome, tamanho, MD5, pasta), confere pelo arquivo puro e grava a versão nova numa única chamada a registrar_versao,
// com o login de quem chamou (a RLS decide). Se algo falhar, nada é gravado; os arquivos que subiram ficam na pasta.
import { conferirProcessoEmAndamento, recusar } from '../_shared/decisao.ts'
import {
  conferirArquivosNoDrive,
  funcaoDoBancoPara,
  recusaDoBanco,
  statusDaRecusaDoBanco,
  type ArquivoNoDrive,
  type EntradaRegistrar,
} from '../_shared/registro.ts'
import { ErroDoDrive, lerJsonDoDrive } from './google.ts'
import { API_DE_ARQUIVOS, lerPastaRegistrada, type ContextoDoDrive } from './pastas.ts'
import { responderJson, responderRecusa } from './respostas.ts'

async function lerSituacao(contexto: ContextoDoDrive, processoId: string): Promise<string | null> {
  const { data, error } = await contexto.cliente
    .from('processos_com_andamento')
    .select('situacao')
    .eq('id', processoId)
    .maybeSingle()
  if (error) throw new Error(`leitura de processos_com_andamento falhou (código ${error.code}); esperado: processo visível`)
  return (data as { situacao: string } | null)?.situacao ?? null
}

// O arquivo que o Drive não acha é "não chegou"; qualquer outra falha do Drive segue como erro do Drive.
async function lerArquivoNoDrive(token: string, driveId: string): Promise<ArquivoNoDrive | null> {
  try {
    return await lerJsonDoDrive<ArquivoNoDrive>(token, `${API_DE_ARQUIVOS}/${driveId}?fields=id,name,size,md5Checksum,parents`)
  } catch (erro) {
    if (erro instanceof ErroDoDrive && erro.codigo === 'nao_encontrado_no_drive') return null
    throw erro
  }
}

async function gravar(contexto: ContextoDoDrive, entrada: EntradaRegistrar, arquivos: unknown[]): Promise<Response> {
  const { data, error } = await contexto.cliente.rpc(funcaoDoBancoPara(entrada), {
    p_processo: entrada.processoId,
    p_numero: entrada.numero,
    p_observacao: entrada.observacao,
    p_arquivos: arquivos,
  })
  if (!error) return responderJson(200, { versao_id: data })
  const recusa = recusaDoBanco(error)
  if (!recusa) throw new Error(`${funcaoDoBancoPara(entrada)} falhou (código ${error.code}); esperado: gravação ou recusa do banco`)
  return responderJson(statusDaRecusaDoBanco(recusa), recusa)
}

export async function registrar(contexto: ContextoDoDrive, entrada: EntradaRegistrar): Promise<Response> {
  const situacao = await lerSituacao(contexto, entrada.processoId)
  if (situacao === null) return responderRecusa(recusar('entrada_invalida', 'processo não encontrado'))
  const foraDeAndamento = conferirProcessoEmAndamento(situacao)
  if (foraDeAndamento) return responderRecusa(foraDeAndamento)
  const pastaId = await lerPastaRegistrada(contexto.cliente, { coluna: 'processo_id', id: entrada.processoId })
  if (!pastaId) return responderRecusa(recusar('arquivo_fora_da_pasta'))
  const lidos = await Promise.all(entrada.arquivos.map((arquivo) => lerArquivoNoDrive(contexto.token, arquivo.driveId)))
  const conferidos = conferirArquivosNoDrive(entrada.arquivos, lidos, pastaId)
  if (!conferidos.ok) return responderRecusa(conferidos.recusa)
  return await gravar(contexto, entrada, conferidos.valor)
}
