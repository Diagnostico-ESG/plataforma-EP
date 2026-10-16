// Ação sem_alteracao (ticket 05): na versão nova sem relatório, copia no Drive, sem passar pelo navegador, o relatório da
// versão imediatamente anterior para a pasta do processo, com o nome da versão nova, e grava a cópia no banco ligada ao
// original. Quem é a versão anterior e o que vale é do banco (origem_do_relatorio e registrar_sem_alteracao, com o login
// de quem chamou). Se o banco recusar depois da cópia, o arquivo copiado fica na pasta: a função não apaga nada.
import { conferirProcessoEmAndamento, recusar } from '../_shared/decisao.ts'
import { nomePadrao } from '../_shared/nomePadrao.ts'
import { conferirArquivosNoDrive, type ArquivoNoDrive } from '../_shared/registro.ts'
import type { EntradaSemAlteracao } from '../_shared/semAlteracao.ts'
import { lerProcesso, type ProcessoDoEnvio } from './acoes.ts'
import { responderResultadoDoBanco } from './gravacao.ts'
import { lerJsonDoDrive } from './google.ts'
import { API_DE_ARQUIVOS, conferidorDaRaiz, garantirPastaDoProcesso, type ContextoDoDrive } from './pastas.ts'
import { responderJson, responderRecusa } from './respostas.ts'

interface VersaoDaCopia {
  numero: number
  historica: boolean
}

interface OrigemDoRelatorio {
  arquivo_id: string
  formato: string
  drive_id: string
}

async function lerVersao(contexto: ContextoDoDrive, entrada: EntradaSemAlteracao): Promise<VersaoDaCopia | null> {
  const { data, error } = await contexto.cliente
    .from('versoes')
    .select('numero, historica')
    .eq('id', entrada.versaoId)
    .eq('processo_id', entrada.processoId)
    .maybeSingle()
  if (error) throw new Error(`leitura de versoes falhou (código ${error.code}); esperado: versão visível`)
  return data as VersaoDaCopia | null
}

async function lerOrigem(contexto: ContextoDoDrive, versaoId: string): Promise<OrigemDoRelatorio | null> {
  const { data, error } = await contexto.cliente.rpc('origem_do_relatorio', { p_versao: versaoId })
  if (error) throw new Error(`origem_do_relatorio falhou (código ${error.code}); esperado: o relatório da versão anterior ou nenhum`)
  return (data as OrigemDoRelatorio[])[0] ?? null
}

async function copiarNoDrive(token: string, origem: OrigemDoRelatorio, nome: string, pastaId: string): Promise<ArquivoNoDrive> {
  return await lerJsonDoDrive<ArquivoNoDrive>(
    token,
    `${API_DE_ARQUIVOS}/${encodeURIComponent(origem.drive_id)}/copy?fields=id,name,size,md5Checksum,parents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ name: nome, parents: [pastaId] }),
    },
  )
}

interface PedidoDaCopia {
  entrada: EntradaSemAlteracao
  processo: ProcessoDoEnvio
  versao: VersaoDaCopia
  origem: OrigemDoRelatorio
}

async function copiarEGravar(contexto: ContextoDoDrive, { entrada, processo, versao, origem }: PedidoDaCopia): Promise<Response> {
  if (!(await conferidorDaRaiz(contexto).itemSobARaiz(origem.drive_id))) return responderRecusa(recusar('sem_permissao'))
  const pastaId = await garantirPastaDoProcesso(contexto, processo)
  const nome = nomePadrao({
    sigla: processo.setor_sigla,
    numero: versao.numero,
    historica: false,
    nomeDoProcesso: processo.nome,
    papel: 'relatorio',
    extensao: origem.formato,
  })
  const copia = await copiarNoDrive(contexto.token, origem, nome, pastaId)
  const conferidos = conferirArquivosNoDrive([{ papel: 'relatorio', driveId: copia.id }], [copia], pastaId)
  if (!conferidos.ok) return responderRecusa(conferidos.recusa)
  const resultado = await contexto.cliente.rpc('registrar_sem_alteracao', {
    p_versao: entrada.versaoId,
    p_arquivo: conferidos.valor[0],
  })
  return responderResultadoDoBanco('registrar_sem_alteracao', resultado, 'arquivo_id')
}

export async function semAlteracao(contexto: ContextoDoDrive, entrada: EntradaSemAlteracao): Promise<Response> {
  const processo = await lerProcesso(contexto, entrada.processoId)
  if (!processo) return responderRecusa(recusar('entrada_invalida', 'processo não encontrado'))
  const foraDeAndamento = conferirProcessoEmAndamento(processo.situacao)
  if (foraDeAndamento) return responderRecusa(foraDeAndamento)
  const versao = await lerVersao(contexto, entrada)
  if (!versao) return responderRecusa(recusar('entrada_invalida', 'versão não encontrada neste processo'))
  // Antes de copiar: o banco recusaria depois, e a cópia ficaria sobrando na pasta.
  if (versao.historica) return responderJson(409, { codigo: 'versao_historica_somente_leitura', mensagem: '' })
  const origem = await lerOrigem(contexto, entrada.versaoId)
  if (!origem) return responderJson(409, { codigo: 'versao_anterior_sem_relatorio', mensagem: '' })
  return await copiarEGravar(contexto, { entrada, processo, versao, origem })
}
