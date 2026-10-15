// Pastas no Drive: <raiz do ambiente> / <SIGLA do setor> / <Nome do processo>. O identificador de cada pasta
// fica em pastas_no_drive (gravado com o login de quem chamou), para a pasta ser achada mesmo renomeada.
// A cada envio, a pasta acompanha a sigla e o nome atuais (renomeia ou move). A função nunca apaga pasta.
import type { SupabaseClient } from '@supabase/supabase-js'
import { consultaDePastaPorNome } from '../_shared/drive.ts'
import { limparParaNomeDeArquivo } from '../_shared/nomePadrao.ts'
import type { Configuracao } from './configuracao.ts'
import { chamarDrive, lerJsonDoDrive } from './google.ts'

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

async function acertarPasta(token: string, driveId: string, nome: string, paiId: string): Promise<void> {
  const atual = await lerJsonDoDrive<{ name: string; parents?: string[] }>(
    token,
    `${API_DE_ARQUIVOS}/${driveId}?fields=name,parents`,
  )
  const pais = atual.parents ?? []
  if (atual.name === nome && pais.includes(paiId)) return
  const url = new URL(`${API_DE_ARQUIVOS}/${driveId}`)
  const paisAntigos = pais.filter((pai) => pai !== paiId)
  if (!pais.includes(paiId)) url.searchParams.set('addParents', paiId)
  if (paisAntigos.length > 0) url.searchParams.set('removeParents', paisAntigos.join(','))
  await chamarDrive(token, url.toString(), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ name: nome }),
  })
}

async function garantirPasta(contexto: ContextoDoDrive, dono: Dono, nome: string, paiId: string): Promise<string> {
  const registrada = await lerPastaRegistrada(contexto.cliente, dono)
  if (registrada) {
    await acertarPasta(contexto.token, registrada, nome, paiId)
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
