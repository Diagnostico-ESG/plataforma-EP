// A ação renumerar (travas-em-avisos, ticket 03; ADR 0028): os arquivos da versão ganham no Drive o nome com o número novo e então
// o banco troca o número (editar_numero_da_versao), com o login de quem chamou. Quem pode e a entrada já foram conferidas
// (decisao.ts, renumerar.ts). Ordem: ler a versão, conferir o processo e o número, conferir a pasta de cada arquivo, renomear,
// gravar. Tudo ou nada: se um nome não troca ou o banco recusa, os nomes antigos voltam. Nada aqui loga nem devolve nome de arquivo.
import { recusar } from '../_shared/decisao.ts'
import { recusaDoBanco, statusDaRecusaDoBanco, type RecusaDoBanco } from '../_shared/registro.ts'
import {
  RECUSA_DE_RENOMEACAO_INCOMPLETA, arquivosParaRenomear, conferirNumeroDaVersao, recusaDeRenomeacaoNoDrive,
  type ArquivoParaRenomear, type EntradaRenumerar, type VersaoDoProcesso,
} from '../_shared/renumerar.ts'
import { lerProcesso, recusaDoProcesso } from './acoes.ts'
import { chamarDrive } from './google.ts'
import { API_DE_ARQUIVOS, conferidorDaRaiz, type ContextoDoDrive } from './pastas.ts'
import { responderJson, responderRecusa } from './respostas.ts'

interface VersaoLida extends VersaoDoProcesso {
  processo_id: string
}

interface ArquivoLido {
  drive_id: string
  nome: string
}

// As leituras são a RLS, com o login de quem chamou: o que ela não mostra não existe para a função.
async function lerVersao(contexto: ContextoDoDrive, id: string): Promise<VersaoLida | null> {
  const { data, error } = await contexto.cliente.from('versoes').select('processo_id, numero, historica, piloto').eq('id', id).maybeSingle()
  if (error) throw new Error(`leitura de versoes falhou (código ${error.code}); esperado: versão visível`)
  return data as VersaoLida | null
}

async function lerVersoesDoProcesso(contexto: ContextoDoDrive, processoId: string): Promise<VersaoDoProcesso[]> {
  const { data, error } = await contexto.cliente.from('versoes').select('numero, historica, piloto').eq('processo_id', processoId)
  if (error) throw new Error(`leitura de versoes falhou (código ${error.code}); esperado: versões do processo visíveis`)
  return data as VersaoDoProcesso[]
}

// Os fluxogramas e relatórios da versão e o .pdf atual da aprovação dela (o guardado de uma aprovação trocada não se renomeia).
async function lerArquivosDaVersao(contexto: ContextoDoDrive, versaoId: string): Promise<ArquivoLido[]> {
  const [arquivos, pdfs] = await Promise.all([
    contexto.cliente.from('arquivos_da_versao').select('drive_id, nome').eq('versao_id', versaoId),
    contexto.cliente.from('pdfs_da_aprovacao').select('drive_id, nome').eq('versao_id', versaoId).is('guardado_em', null),
  ])
  if (arquivos.error) throw new Error(`leitura de arquivos_da_versao falhou (código ${arquivos.error.code}); esperado: arquivos da versão visíveis`)
  if (pdfs.error) throw new Error(`leitura de pdfs_da_aprovacao falhou (código ${pdfs.error.code}); esperado: .pdf da versão visível`)
  return [...(arquivos.data as ArquivoLido[]), ...(pdfs.data as ArquivoLido[])]
}

async function renomearNoDrive(token: string, driveId: string, nome: string): Promise<void> {
  await chamarDrive(token, `${API_DE_ARQUIVOS}/${encodeURIComponent(driveId)}?fields=id`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ name: nome }),
  })
}

// Devolve os nomes antigos aos arquivos já renomeados, todos mesmo que um falhe; true quando todos voltaram.
async function devolverNomes(token: string, renomeados: ArquivoParaRenomear[]): Promise<boolean> {
  const voltas = await Promise.all(
    renomeados.map((arquivo) => renomearNoDrive(token, arquivo.driveId, arquivo.nomeAntigo).then(() => true, () => false)),
  )
  return voltas.every(Boolean)
}

// Renomeia um a um; na primeira falha para e diz quais já tinham mudado.
async function renomearTodos(token: string, plano: ArquivoParaRenomear[]): Promise<{ feitos: ArquivoParaRenomear[]; falhou: boolean }> {
  const feitos: ArquivoParaRenomear[] = []
  for (const arquivo of plano) {
    try {
      await renomearNoDrive(token, arquivo.driveId, arquivo.nomeNovo)
    } catch {
      return { feitos, falhou: true }
    }
    feitos.push(arquivo)
  }
  return { feitos, falhou: false }
}

function responderRecusaDoBanco(recusa: RecusaDoBanco): Response {
  return responderJson(statusDaRecusaDoBanco(recusa), recusa)
}

// Arquivo fora da raiz do ambiente impede a edição inteira, antes de qualquer renomeação (a mesma conferência do baixar).
async function todosSobARaiz(contexto: ContextoDoDrive, plano: ArquivoParaRenomear[]): Promise<boolean> {
  const raiz = conferidorDaRaiz(contexto)
  const dentro = await Promise.all(plano.map((arquivo) => raiz.itemSobARaiz(arquivo.driveId)))
  return dentro.every(Boolean)
}

async function gravarNoBanco(contexto: ContextoDoDrive, entrada: EntradaRenumerar): Promise<RecusaDoBanco | null> {
  const { error } = await contexto.cliente.rpc('editar_numero_da_versao', {
    p_versao: entrada.versaoId, p_numero_esperado: entrada.numeroEsperado, p_numero_novo: entrada.numeroNovo,
  })
  if (!error) return null
  const recusa = recusaDoBanco(error)
  if (!recusa) throw new Error(`editar_numero_da_versao falhou (código ${error.code}); esperado: gravação ou recusa do banco`)
  return recusa
}

// Falha do banco depois de renomear: os nomes antigos voltam, e a falha segue como erro interno.
async function gravarOuDevolver(contexto: ContextoDoDrive, entrada: EntradaRenumerar, feitos: ArquivoParaRenomear[]): Promise<RecusaDoBanco | null> {
  try {
    return await gravarNoBanco(contexto, entrada)
  } catch (erro) {
    await devolverNomes(contexto.token, feitos)
    throw erro
  }
}

interface Preparo {
  versao: VersaoLida
  plano: ArquivoParaRenomear[]
}

// Tudo o que se confere antes de tocar o Drive: a versão, o processo, o número e a pasta de cada arquivo. Devolve a recusa ou o plano.
async function prepararRenumeracao(contexto: ContextoDoDrive, entrada: EntradaRenumerar): Promise<Response | Preparo> {
  const versao = await lerVersao(contexto, entrada.versaoId)
  if (!versao) return responderRecusa(recusar('sem_permissao'))
  const processo = await lerProcesso(contexto, versao.processo_id)
  if (!processo) return responderRecusa(recusar('entrada_invalida', 'processo não encontrado'))
  const foraDeAndamento = recusaDoProcesso(processo, 'bpm')
  if (foraDeAndamento) return responderRecusa(foraDeAndamento)
  const recusaDoNumero = conferirNumeroDaVersao(versao, entrada, await lerVersoesDoProcesso(contexto, versao.processo_id))
  if (recusaDoNumero) return responderRecusaDoBanco(recusaDoNumero)
  const plano = arquivosParaRenomear(await lerArquivosDaVersao(contexto, entrada.versaoId), versao, entrada.numeroNovo)
  return (await todosSobARaiz(contexto, plano)) ? { versao, plano } : responderRecusa(recusar('sem_permissao'))
}

export async function renumerarVersao(contexto: ContextoDoDrive, entrada: EntradaRenumerar): Promise<Response> {
  const preparo = await prepararRenumeracao(contexto, entrada)
  if (preparo instanceof Response) return preparo
  const { feitos, falhou } = await renomearTodos(contexto.token, preparo.plano)
  if (falhou) {
    const voltou = await devolverNomes(contexto.token, feitos)
    return responderRecusaDoBanco(voltou ? recusaDeRenomeacaoNoDrive(preparo.versao.numero) : RECUSA_DE_RENOMEACAO_INCOMPLETA)
  }
  const recusaNaGravacao = await gravarOuDevolver(contexto, entrada, feitos)
  if (!recusaNaGravacao) return responderJson(200, { numero: entrada.numeroNovo })
  const voltou = await devolverNomes(contexto.token, feitos)
  return responderRecusaDoBanco(voltou ? recusaNaGravacao : RECUSA_DE_RENOMEACAO_INCOMPLETA)
}
