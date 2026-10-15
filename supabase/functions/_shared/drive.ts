// Auxiliares puros da conversa com o Drive e com o navegador, testados no Vitest.

const TIPO_PASTA = 'application/vnd.google-apps.folder'
// Conta de serviço não tem cota própria: no Drive compartilhado, estes são os motivos de "sem espaço".
const MOTIVOS_DE_COTA = ['storageQuotaExceeded', 'teamDriveFileLimitExceeded']

// Na linguagem de busca do Drive, aspas simples e barras invertidas do valor precisam de escape.
function escaparNaBusca(texto: string): string {
  return texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

export function consultaDePastaPorNome(nome: string, paiId: string): string {
  return `name = '${escaparNaBusca(nome)}' and '${escaparNaBusca(paiId)}' in parents and mimeType = '${TIPO_PASTA}' and trashed = false`
}

function motivosDoErro(corpo: unknown): unknown[] {
  if (typeof corpo !== 'object' || corpo === null) return []
  const erro = (corpo as { error?: { errors?: unknown } }).error
  return Array.isArray(erro?.errors) ? erro.errors : []
}

export function eErroDeCota(corpo: unknown): boolean {
  return motivosDoErro(corpo).some((item) => {
    const motivo = (item as { reason?: unknown } | null)?.reason
    return typeof motivo === 'string' && MOTIVOS_DE_COTA.includes(motivo)
  })
}

const TIPOS_MIME: Record<string, string> = {
  png: 'image/png',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  bpmn: 'application/xml',
}

// O .bpm do Bizagi não tem tipo registrado; vai como binário genérico.
export function tipoMimeDaExtensao(extensao: string): string {
  return TIPOS_MIME[extensao] ?? 'application/octet-stream'
}

export interface ContaDeServico {
  email: string
  chave: string
}

const ERRO_DA_CONTA =
  'segredo EP_DRIVE_CONTA_JSON_BASE64 inválido (recebido: conteúdo omitido); esperado: o JSON da chave da conta de serviço do Google, em base64'

function decodificarBase64(texto: string): string {
  const binario = atob(texto)
  return new TextDecoder().decode(Uint8Array.from(binario, (letra) => letra.charCodeAt(0)))
}

// O conteúdo nunca entra na mensagem de erro: é a chave privada.
export function lerContaDeServico(base64: string): ContaDeServico {
  let conta: { client_email?: unknown; private_key?: unknown }
  try {
    conta = JSON.parse(decodificarBase64(base64.trim()))
  } catch {
    throw new Error(ERRO_DA_CONTA)
  }
  if (typeof conta?.client_email !== 'string' || typeof conta?.private_key !== 'string') {
    throw new Error(ERRO_DA_CONTA)
  }
  return { email: conta.client_email, chave: conta.private_key }
}

export function origemAceita(origem: string | null, aceitas: string): boolean {
  if (!origem) return false
  return aceitas.split(',').map((item) => item.trim()).filter(Boolean).includes(origem)
}

export function cabecalhosDeOrigem(origem: string | null, aceitas: string): Record<string, string> {
  const comuns: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
  if (!origem || !origemAceita(origem, aceitas)) return comuns
  return { ...comuns, 'Access-Control-Allow-Origin': origem }
}
