// Ação registrar (ticket 02): depois que todos os arquivos chegaram ao Drive, lê de cada um o que o Drive informa
// (nome, tamanho, MD5, pasta), confere pelo arquivo puro e grava a versão nova numa única chamada a registrar_versao,
// com o login de quem chamou (a RLS decide). Se algo falhar, nada é gravado; os arquivos que subiram ficam na pasta.
import { conferirProcessoEmAndamento, recusar } from '../_shared/decisao.ts'
import {
  conferirArquivosNoDrive,
  funcaoDoBancoPara,
  parametrosDoBanco,
  type ArquivoNoDrive,
  type ArquivoParaGravar,
  type EntradaRegistrar,
} from '../_shared/registro.ts'
import { conferirAlvoDoRegistro, conferirVersaoDoProcesso } from '../_shared/substituicao.ts'
import { lerAlvoDaSubstituicao, lerProcessoDaVersao } from './acoes.ts'
import { responderResultadoDoBanco } from './gravacao.ts'
import { lerNoDriveOuNulo } from './google.ts'
import { API_DE_ARQUIVOS, lerPastaRegistrada, type ContextoDoDrive } from './pastas.ts'
import { responderRecusa } from './respostas.ts'

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
function lerArquivoNoDrive(token: string, driveId: string): Promise<ArquivoNoDrive | null> {
  return lerNoDriveOuNulo<ArquivoNoDrive>(token, `${API_DE_ARQUIVOS}/${driveId}?fields=id,name,size,md5Checksum,parents`)
}

async function gravar(contexto: ContextoDoDrive, entrada: EntradaRegistrar, arquivos: ArquivoParaGravar[]): Promise<Response> {
  const funcao = funcaoDoBancoPara(entrada)
  const resultado = await contexto.cliente.rpc(funcao, parametrosDoBanco(entrada, arquivos))
  return responderResultadoDoBanco(funcao, resultado, entrada.versaoId === null && entrada.arquivoId === null ? 'versao_id' : 'arquivo_id')
}

// O arquivo que chegou ao Drive precisa ser o do alvo: senão o hash de outro arquivo da pasta entraria nele.
async function conferirSubstituicao(contexto: ContextoDoDrive, entrada: EntradaRegistrar, arquivoId: string): Promise<Response | null> {
  const alvo = await lerAlvoDaSubstituicao(contexto, arquivoId)
  const conferido = conferirAlvoDoRegistro(alvo, { processoId: entrada.processoId, driveId: entrada.arquivos[0].driveId })
  return conferido.ok ? null : responderRecusa(conferido.recusa)
}

// Arquivo depois (relatório, .png ou .bpmn): a versão tem de ser do processo do pedido, senão o arquivo da pasta de um processo entraria na de outro.
async function conferirRelatorioDepois(contexto: ContextoDoDrive, entrada: EntradaRegistrar, versaoId: string): Promise<Response | null> {
  const conferido = conferirVersaoDoProcesso(await lerProcessoDaVersao(contexto, versaoId), entrada.processoId)
  return conferido.ok ? null : responderRecusa(conferido.recusa)
}

// Na troca o nome fica; nos demais, o nome do Drive precisa ter o número (e o F ou o P) com que a versão será gravada.
function rotuloEsperado(entrada: EntradaRegistrar): string | null {
  if (entrada.arquivoId !== null) return null
  return `V${entrada.numero}${entrada.historica ? 'F' : entrada.piloto ? 'P' : ''}`
}

// As conferências do alvo que o pedido nomeia (arquivo a trocar ou versão a completar); null quando passa ou não há alvo.
async function conferirAlvoDoPedido(contexto: ContextoDoDrive, entrada: EntradaRegistrar): Promise<Response | null> {
  if (entrada.arquivoId !== null) return await conferirSubstituicao(contexto, entrada, entrada.arquivoId)
  if (entrada.versaoId !== null) return await conferirRelatorioDepois(contexto, entrada, entrada.versaoId)
  return null
}

export async function registrar(contexto: ContextoDoDrive, entrada: EntradaRegistrar): Promise<Response> {
  const situacao = await lerSituacao(contexto, entrada.processoId)
  if (situacao === null) return responderRecusa(recusar('entrada_invalida', 'processo não encontrado'))
  const foraDeAndamento = conferirProcessoEmAndamento(situacao)
  if (foraDeAndamento) return responderRecusa(foraDeAndamento)
  const recusaDoAlvo = await conferirAlvoDoPedido(contexto, entrada)
  if (recusaDoAlvo) return recusaDoAlvo
  const pastaId = await lerPastaRegistrada(contexto.cliente, { coluna: 'processo_id', id: entrada.processoId })
  if (!pastaId) return responderRecusa(recusar('arquivo_fora_da_pasta'))
  const lidos = await Promise.all(entrada.arquivos.map((arquivo) => lerArquivoNoDrive(contexto.token, arquivo.driveId)))
  const conferidos = conferirArquivosNoDrive(entrada.arquivos, lidos, pastaId, rotuloEsperado(entrada))
  if (!conferidos.ok) return responderRecusa(conferidos.recusa)
  return await gravar(contexto, entrada, conferidos.valor)
}
