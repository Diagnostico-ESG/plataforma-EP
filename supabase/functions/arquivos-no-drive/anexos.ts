// O anexo na função (documentos-versoes, ticket 12; ADR 0027): enviar (abre a sessão de envio na subpasta "Anexos" do
// processo, com o nome original) e registrar (confere o que o Drive recebeu e grava com registrar_anexo). Quem pode e a
// entrada já foram conferidas (decisao.ts, anexo.ts, registroAnexo.ts). Nada aqui loga nem devolve o nome do anexo em erro.
import { nomeDoAnexoNoDrive, type EntradaIniciarEnvioDoAnexo } from '../_shared/anexo.ts'
import { recusar } from '../_shared/decisao.ts'
import { conferirArquivosNoDrive, type ArquivoNoDrive } from '../_shared/registro.ts'
import type { EntradaRegistrarAnexo } from '../_shared/registroAnexo.ts'
import { abrirSessaoDeEnvio, lerProcesso, recusaDoProcesso } from './acoes.ts'
import { responderResultadoDoBanco } from './gravacao.ts'
import { lerNoDriveOuNulo } from './google.ts'
import { API_DE_ARQUIVOS, conferidorDaRaiz, garantirPastaDosAnexos, lerPastaDosAnexos, type ContextoDoDrive } from './pastas.ts'
import { responderJson, responderRecusa } from './respostas.ts'

export async function iniciarEnvioDoAnexo(
  contexto: ContextoDoDrive,
  entrada: EntradaIniciarEnvioDoAnexo,
  origem: string | null,
): Promise<Response> {
  const processo = await lerProcesso(contexto, entrada.processoId)
  if (!processo) return responderRecusa(recusar('entrada_invalida', 'processo não encontrado'))
  const foraDeAndamento = recusaDoProcesso(processo, 'anexo')
  if (foraDeAndamento) return responderRecusa(foraDeAndamento)
  const pastaId = await garantirPastaDosAnexos(contexto, processo)
  const nome = nomeDoAnexoNoDrive(entrada.nomeOriginal)
  const uploadUrl = await abrirSessaoDeEnvio(contexto.token, { destino: { criar: { nome, pastaId } }, entrada, origem })
  return responderJson(200, { upload_url: uploadUrl, nome })
}

function lerArquivoNoDrive(token: string, driveId: string): Promise<ArquivoNoDrive | null> {
  return lerNoDriveOuNulo<ArquivoNoDrive>(token, `${API_DE_ARQUIVOS}/${encodeURIComponent(driveId)}?fields=id,name,size,md5Checksum,parents`)
}

// O arquivo que chegou ao Drive precisa estar na subpasta do processo e debaixo da raiz do ambiente; o nome, o tamanho e o
// formato vêm do Drive (conferirArquivosNoDrive, sem rótulo de versão). Se algo falhar, nada é gravado.
export async function registrarAnexo(contexto: ContextoDoDrive, entrada: EntradaRegistrarAnexo): Promise<Response> {
  const processo = await lerProcesso(contexto, entrada.processoId)
  if (!processo) return responderRecusa(recusar('entrada_invalida', 'processo não encontrado'))
  const foraDeAndamento = recusaDoProcesso(processo, 'anexo')
  if (foraDeAndamento) return responderRecusa(foraDeAndamento)
  const pastaId = await lerPastaDosAnexos(contexto.cliente, entrada.processoId)
  if (!pastaId) return responderRecusa(recusar('arquivo_fora_da_pasta'))
  const lido = await lerArquivoNoDrive(contexto.token, entrada.driveId)
  if (lido && !(await conferidorDaRaiz(contexto).paisSobARaiz(lido.parents ?? []))) {
    return responderRecusa(recusar('arquivo_fora_da_pasta'))
  }
  const conferidos = conferirArquivosNoDrive([{ papel: 'anexo', driveId: entrada.driveId }], [lido], pastaId)
  if (!conferidos.ok) return responderRecusa(conferidos.recusa)
  const resultado = await contexto.cliente.rpc('registrar_anexo', { p_processo: entrada.processoId, p_arquivo: conferidos.valor[0] })
  return responderResultadoDoBanco('registrar_anexo', resultado, 'anexo_id')
}
