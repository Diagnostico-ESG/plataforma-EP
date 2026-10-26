// Pastas no Drive: <raiz do ambiente> / <SIGLA do setor> / <Nome do processo>. O identificador de cada pasta
// fica em pastas_no_drive (gravado com o login de quem chamou), para a pasta ser achada mesmo renomeada.
// A cada envio, a pasta acompanha a sigla e o nome atuais (renomeia ou move). A função nunca apaga pasta.
import type { SupabaseClient } from '@supabase/supabase-js'
import { consultaDePastaPorNome } from '../_shared/drive.ts'
import { NOME_DA_SUBPASTA_DOS_ANEXOS } from '../_shared/anexo.ts'
import { limparParaNomeDeArquivo } from '../_shared/nomePadrao.ts'
import { decidirAjusteDaPasta } from '../_shared/pasta.ts'
import { estaSobARaiz, type LerPais } from '../_shared/raiz.ts'
import type { Configuracao } from './configuracao.ts'
import { chamarDrive, lerJsonDoDrive, lerNoDriveOuNulo } from './google.ts'

export const API_DE_ARQUIVOS = 'https://www.googleapis.com/drive/v3/files'
const TIPO_PASTA = 'application/vnd.google-apps.folder'

export interface ContextoDoDrive {
  cliente: SupabaseClient
  token: string
  config: Configuracao
}

export interface Dono {
  coluna: 'setor_id' | 'processo_id'
  id: string
}

export interface ProcessoDaPasta {
  id: string
  nome: string
  setor_id: string
  setor_sigla: string
}

// Os pais de cada item, lidos uma vez por chamada (os arquivos de um processo dividem as mesmas pastas).
function lerPaisNoDrive(token: string): LerPais {
  const lidos = new Map<string, Promise<string[] | null>>()
  return (id) => {
    const endereco = `${API_DE_ARQUIVOS}/${encodeURIComponent(id)}?fields=parents`
    const lido = lidos.get(id) ?? lerNoDriveOuNulo<{ parents?: string[] }>(token, endereco).then((item) => item && (item.parents ?? []))
    lidos.set(id, lido)
    return lido
  }
}

// O drive_id guardado no banco é escrito por quem tem perfil de escrita; a raiz do ambiente é segredo da função. Antes de
// agir com a conta de serviço num item guardado, a função confere que ele está debaixo da raiz (_shared/raiz.ts).
export interface ConferidorDaRaiz {
  /** O item com esses pais está debaixo da raiz? (quando os pais já foram lidos) */
  paisSobARaiz: (pais: string[]) => Promise<boolean>
  /** O item com esse identificador está debaixo da raiz? (false se o Drive não o acha) */
  itemSobARaiz: (driveId: string) => Promise<boolean>
}

export function conferidorDaRaiz(contexto: ContextoDoDrive): ConferidorDaRaiz {
  const lerPais = lerPaisNoDrive(contexto.token)
  const raizId = contexto.config.raizId
  return {
    paisSobARaiz: (pais) => estaSobARaiz(pais, raizId, lerPais),
    itemSobARaiz: async (driveId) => {
      const pais = await lerPais(driveId)
      return pais !== null && (await estaSobARaiz(pais, raizId, lerPais))
    },
  }
}

function falhaDoBanco(operacao: string, codigo: string): Error {
  return new Error(`${operacao} em pastas_no_drive falhou (código ${codigo}); esperado: perfil que altera cadastros`)
}

export async function lerPastaRegistrada(cliente: SupabaseClient, dono: Dono): Promise<string | null> {
  const { data, error } = await cliente.from('pastas_no_drive').select('drive_id').eq(dono.coluna, dono.id).maybeSingle()
  if (error) throw falhaDoBanco('leitura', error.code)
  return data?.drive_id ?? null
}

// ponytail: dois primeiros envios simultâneos do mesmo processo podem criar duas pastas; o segundo registro
// é recusado pela restrição única e o envio falha (tenta-se de novo). Travar por processo se acontecer na prática.
async function registrarPasta(cliente: SupabaseClient, dono: Dono, driveId: string): Promise<void> {
  const { error } = await cliente.from('pastas_no_drive').insert({ [dono.coluna]: dono.id, drive_id: driveId })
  if (error) throw falhaDoBanco('inclusão', error.code)
}

async function procurarPasta(token: string, nome: string, paiId: string): Promise<string | null> {
  const url = new URL(API_DE_ARQUIVOS)
  url.search = new URLSearchParams({
    q: consultaDePastaPorNome(nome, paiId),
    fields: 'files(id)',
    pageSize: '1',
    corpora: 'allDrives',
    includeItemsFromAllDrives: 'true',
  }).toString()
  const resposta = await lerJsonDoDrive<{ files: { id: string }[] }>(token, url.toString())
  return resposta.files[0]?.id ?? null
}

async function criarPasta(token: string, nome: string, paiId: string): Promise<string> {
  const corpo = JSON.stringify({ name: nome, mimeType: TIPO_PASTA, parents: [paiId] })
  const pasta = await lerJsonDoDrive<{ id: string }>(token, `${API_DE_ARQUIVOS}?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: corpo,
  })
  return pasta.id
}

// A pasta registrada é escrita por quem tem perfil de escrita: só se mexe (renomear, mover) em pasta debaixo da raiz.
async function lerPastaDoAmbiente(contexto: ContextoDoDrive, driveId: string): Promise<{ name: string; parents?: string[] }> {
  const atual = await lerJsonDoDrive<{ name: string; parents?: string[] }>(
    contexto.token,
    `${API_DE_ARQUIVOS}/${encodeURIComponent(driveId)}?fields=name,parents`,
  )
  if (await conferidorDaRaiz(contexto).paisSobARaiz(atual.parents ?? [])) return atual
  throw new Error(`pasta registrada (${driveId}) fora da raiz do ambiente; esperado: pasta debaixo da raiz`)
}

async function acertarPasta(contexto: ContextoDoDrive, driveId: string, nome: string, paiId: string): Promise<void> {
  const { token } = contexto
  const atual = await lerPastaDoAmbiente(contexto, driveId)
  const ajuste = decidirAjusteDaPasta({ nome: atual.name, pais: atual.parents ?? [] }, { nome, paiId })
  if (!ajuste.renomearPara && !ajuste.mover) return
  const url = new URL(`${API_DE_ARQUIVOS}/${encodeURIComponent(driveId)}`)
  if (ajuste.mover) {
    url.searchParams.set('addParents', ajuste.mover.paraPai)
    if (ajuste.mover.tirarDe.length > 0) url.searchParams.set('removeParents', ajuste.mover.tirarDe.join(','))
  }
  await chamarDrive(token, url.toString(), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(ajuste.renomearPara ? { name: ajuste.renomearPara } : {}),
  })
}

async function garantirPasta(contexto: ContextoDoDrive, dono: Dono, nome: string, paiId: string): Promise<string> {
  const registrada = await lerPastaRegistrada(contexto.cliente, dono)
  if (registrada) {
    await acertarPasta(contexto, registrada, nome, paiId)
    return registrada
  }
  const driveId = (await procurarPasta(contexto.token, nome, paiId)) ?? (await criarPasta(contexto.token, nome, paiId))
  await registrarPasta(contexto.cliente, dono, driveId)
  return driveId
}

// O subprocesso tem a pasta dentro da do setor dele, como o processo (não dentro da pasta do pai).
export async function garantirPastaDoProcesso(contexto: ContextoDoDrive, processo: ProcessoDaPasta): Promise<string> {
  const setor: Dono = { coluna: 'setor_id', id: processo.setor_id }
  const pastaDoSetor = await garantirPasta(contexto, setor, limparParaNomeDeArquivo(processo.setor_sigla), contexto.config.raizId)
  const dono: Dono = { coluna: 'processo_id', id: processo.id }
  return await garantirPasta(contexto, dono, limparParaNomeDeArquivo(processo.nome), pastaDoSetor)
}

// A subpasta "Anexos" (documentos-versoes, ticket 12) é filha da pasta do processo, então acompanha o nome e o lugar dela
// sem a função fazer nada. O identificador fica em processos.drive_pasta_dos_anexos, gravado com o login de quem chamou.
export async function lerPastaDosAnexos(cliente: SupabaseClient, processoId: string): Promise<string | null> {
  const { data, error } = await cliente.from('processos').select('drive_pasta_dos_anexos').eq('id', processoId).maybeSingle()
  if (error) throw new Error(`leitura de processos falhou (código ${error.code}); esperado: processo visível`)
  return (data as { drive_pasta_dos_anexos: string | null } | null)?.drive_pasta_dos_anexos ?? null
}

async function registrarPastaDosAnexos(cliente: SupabaseClient, processoId: string, driveId: string): Promise<void> {
  const { error } = await cliente.from('processos').update({ drive_pasta_dos_anexos: driveId }).eq('id', processoId)
  if (error) throw new Error(`gravação de drive_pasta_dos_anexos falhou (código ${error.code}); esperado: perfil que altera processos`)
}

// ponytail: dois primeiros anexos simultâneos do mesmo processo podem criar duas subpastas "Anexos"; a segunda gravação do
// identificador vence e os arquivos da primeira ficam na outra (a conferência os marca fora da pasta). Travar por processo se acontecer.
export async function garantirPastaDosAnexos(contexto: ContextoDoDrive, processo: ProcessoDaPasta): Promise<string> {
  const pastaDoProcesso = await garantirPastaDoProcesso(contexto, processo)
  const registrada = await lerPastaDosAnexos(contexto.cliente, processo.id)
  if (registrada) {
    // O identificador é escrito por quem tem perfil de escrita: só se grava arquivo em pasta debaixo da raiz do ambiente.
    if (await conferidorDaRaiz(contexto).itemSobARaiz(registrada)) return registrada
    throw new Error(`subpasta de anexos registrada (${registrada}) fora da raiz do ambiente; esperado: pasta debaixo da raiz`)
  }
  const driveId = (await procurarPasta(contexto.token, NOME_DA_SUBPASTA_DOS_ANEXOS, pastaDoProcesso))
    ?? (await criarPasta(contexto.token, NOME_DA_SUBPASTA_DOS_ANEXOS, pastaDoProcesso))
  await registrarPastaDosAnexos(contexto.cliente, processo.id, driveId)
  return driveId
}
