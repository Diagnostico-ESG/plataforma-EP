// Ação conferir (ticket 07): para um processo, compara a existência e o MD5 de cada arquivo no Drive com o que o banco
// guarda e devolve a situação de cada um. Não grava nada, no banco nem no Drive. Os arquivos são lidos pela RLS, com o
// login de quem chamou; o que ela não mostra não é conferido.
import { situacaoDoArquivo, type EntradaConferir, type LidoNoDrive } from '../_shared/conferencia.ts'
import { lerNoDriveOuNulo } from './google.ts'
import { API_DE_ARQUIVOS, conferidorDaRaiz, type ConferidorDaRaiz, type ContextoDoDrive } from './pastas.ts'
import { responderJson } from './respostas.ts'

interface ArquivoGuardado {
  id: string
  drive_id: string
  hash_md5: string
}

async function lerArquivosDoProcesso(contexto: ContextoDoDrive, processoId: string): Promise<ArquivoGuardado[]> {
  const { data, error } = await contexto.cliente
    .from('arquivos_da_versao')
    .select('id, drive_id, hash_md5, versoes!inner(processo_id)')
    .eq('versoes.processo_id', processoId)
  if (error) throw new Error(`leitura de arquivos_da_versao falhou (código ${error.code}); esperado: arquivos do processo visíveis`)
  return data as unknown as ArquivoGuardado[]
}

// Os .pdfs das aprovações do processo (o atual e os guardados das aprovações trocadas), pelo mesmo caminho da RLS.
async function lerPdfsDoProcesso(contexto: ContextoDoDrive, processoId: string): Promise<ArquivoGuardado[]> {
  const { data, error } = await contexto.cliente
    .from('pdfs_da_aprovacao')
    .select('id, drive_id, hash_md5, aprovacoes!inner(processo_id)')
    .eq('aprovacoes.processo_id', processoId)
  if (error) throw new Error(`leitura de pdfs_da_aprovacao falhou (código ${error.code}); esperado: .pdfs do processo visíveis`)
  return data as unknown as ArquivoGuardado[]
}

// Arquivo fora da raiz do ambiente conta como não encontrado: a função não o lê com a conta de serviço.
async function situacaoNoDrive(contexto: ContextoDoDrive, raiz: ConferidorDaRaiz, arquivo: ArquivoGuardado): Promise<[string, string]> {
  const endereco = `${API_DE_ARQUIVOS}/${encodeURIComponent(arquivo.drive_id)}?fields=id,md5Checksum,trashed,parents`
  const lido = await lerNoDriveOuNulo<LidoNoDrive>(contexto.token, endereco)
  const dentro = lido !== null && (await raiz.paisSobARaiz(lido.parents ?? []))
  return [arquivo.id, situacaoDoArquivo(arquivo.hash_md5, dentro ? lido : null)]
}

// ponytail: uma leitura do Drive por arquivo, todas ao mesmo tempo; processo com centenas de arquivos pede lotes.
export async function conferir(contexto: ContextoDoDrive, entrada: EntradaConferir): Promise<Response> {
  const [dasVersoes, dasAprovacoes] = await Promise.all([
    lerArquivosDoProcesso(contexto, entrada.processoId), lerPdfsDoProcesso(contexto, entrada.processoId),
  ])
  const guardados = [...dasVersoes, ...dasAprovacoes]
  const raiz = conferidorDaRaiz(contexto)
  const situacoes = await Promise.all(guardados.map((arquivo) => situacaoNoDrive(contexto, raiz, arquivo)))
  return responderJson(200, { arquivos: Object.fromEntries(situacoes) })
}
