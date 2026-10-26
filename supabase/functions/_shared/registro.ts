// Decisão da ação registrar da função arquivos-no-drive (documentos-versoes, ticket 02). Arquivo puro, testado no
// Vitest: qual entrada vale, o que o Drive informou de cada arquivo (chegou, tamanho, formato, pasta) e como a recusa
// do banco volta para a tela. Nada é gravado se algum arquivo não passar: a função não apaga o que subiu.
import {
  EXTENSOES_POR_PAPEL,
  FORMATO_ID_DO_DRIVE,
  FORMATO_UUID,
  LIMITE_DE_TAMANHO,
  campoInvalido,
  eCorpo,
  extensaoDoNome,
  falhar,
  lerBooleano,
  lerInteiroPositivo,
  lerNumeroDoRelatorio,
  lerPilotoDaVersao,
  lerPapel,
  lerTexto,
  lerUuidOpcional,
  recusar,
  tipoDe,
  type Corpo,
  type Falha,
  type Validacao,
} from './decisao.ts'
import type { PapelDoArquivo } from './nomePadrao.ts'

export interface ArquivoPedido {
  papel: PapelDoArquivo
  driveId: string
}
export interface EntradaRegistrar {
  processoId: string
  numero: number
  /** Versão da primeira etapa do trabalho (V5F): o número é o digitado, não o que o banco daria. */
  historica: boolean
  /** Versão piloto (V6P): o número também é o digitado. Com `versaoId`, diz que a versão que recebe o arquivo é piloto. */
  piloto: boolean
  /** Com a versão: acrescenta a ela um arquivo (o `arquivos` é só o relatório, o .png ou o .bpmn); sem: registra uma versão. */
  versaoId: string | null
  /** Com o arquivo: troca o conteúdo dele (o `arquivos` é só o arquivo novo, de qualquer papel); sem: registra. */
  arquivoId: string | null
  /**
   * O número do relatório novo de versão que não é histórica (Relatório V3), com que o arquivo foi nomeado: o relatório
   * sozinho (`numero` é então o da versão que ele acompanha) ou junto com a versão. Nulo nos outros pedidos.
   */
  numeroDoRelatorio: number | null
  arquivos: ArquivoPedido[]
}
/** O que o Drive devolve de um arquivo (`fields=id,name,size,md5Checksum,parents`). */
export interface ArquivoNoDrive {
  id: string
  name: string
  size?: string
  md5Checksum?: string
  parents?: string[]
}
/** Um item de `p_arquivos` da função do banco registrar_versao. */
export interface ArquivoParaGravar {
  papel: PapelDoArquivo
  nome: string
  formato: string
  tamanho: number
  hash_md5: string
  drive_id: string
}
/** Recusa do banco: o código é o motivo de "motivo:valor"; a mensagem, o valor. */
export interface RecusaDoBanco {
  codigo: string
  mensagem: string
}

const MAXIMO_DE_ARQUIVOS = 4
const PAPEIS_ACRESCENTADOS_DEPOIS: readonly PapelDoArquivo[] = ['png', 'bpmn']

// Quem não manda `historica` registra uma versão nova (o pedido do ticket 02).
function lerHistorica(corpo: Corpo): Validacao<boolean> {
  return corpo.historica === undefined ? { ok: true, valor: false } : lerBooleano(corpo, 'historica')
}

// O arquivo depois entra numa versão que já existe: um arquivo só, o .png ou o .bpmn (o banco confere o resto). O relatório
// tem o seu caminho (enviar_relatorio, ADR 0026).
function conferirArquivoDepois(versaoId: string | null, historica: boolean, arquivos: ArquivoPedido[]): Falha | null {
  if (versaoId === null) return null
  if (historica || arquivos.length !== 1 || !PAPEIS_ACRESCENTADOS_DEPOIS.includes(arquivos[0].papel)) {
    return falhar('entrada_invalida', 'campo versao_id: esperado um único arquivo, o png ou o bpmn, sem historica')
  }
  return null
}

// A substituição troca o conteúdo de um arquivo que já existe: um arquivo só, sem versão nem histórica (o banco confere o resto).
function conferirSubstituicao(entrada: Pick<EntradaRegistrar, 'arquivoId' | 'versaoId' | 'historica' | 'arquivos'>): Falha | null {
  if (entrada.arquivoId === null) return null
  if (entrada.versaoId !== null || entrada.historica || entrada.arquivos.length !== 1) {
    return falhar('entrada_invalida', 'campo arquivo_id: esperado um único arquivo, sem versao_id nem historica')
  }
  return null
}

function lerArquivoPedido(item: unknown): Validacao<ArquivoPedido> {
  if (!eCorpo(item)) return falhar('entrada_invalida', `item de arquivos: esperado objeto, recebido ${tipoDe(item)}`)
  const papel = lerPapel(item)
  if (!papel.ok) return papel
  const driveId = lerTexto(item, 'drive_id', FORMATO_ID_DO_DRIVE, 'identificador do Drive')
  if (!driveId.ok) return driveId
  return { ok: true, valor: { papel: papel.valor, driveId: driveId.valor } }
}

function lerArquivosPedidos(corpo: Corpo): Validacao<ArquivoPedido[]> {
  const lista = corpo.arquivos
  if (!Array.isArray(lista) || lista.length === 0 || lista.length > MAXIMO_DE_ARQUIVOS) {
    return campoInvalido(corpo, 'arquivos', `lista de 1 a ${MAXIMO_DE_ARQUIVOS} arquivos`)
  }
  const arquivos: ArquivoPedido[] = []
  for (const item of lista) {
    const arquivo = lerArquivoPedido(item)
    if (!arquivo.ok) return arquivo
    arquivos.push(arquivo.valor)
  }
  const papeis = new Set(arquivos.map((arquivo) => arquivo.papel))
  if (papeis.size < arquivos.length) return falhar('entrada_invalida', 'campo arquivos: esperado um arquivo por papel')
  return { ok: true, valor: arquivos }
}

type ModoDoRegistro = Pick<EntradaRegistrar, 'historica' | 'piloto' | 'versaoId' | 'arquivoId' | 'numeroDoRelatorio' | 'arquivos'>

// O .pdf da aprovação entra sozinho (um arquivo), sem versão, histórica nem piloto: o banco o liga à aprovação do processo.
function conferirPdfDaAprovacao(modo: ModoDoRegistro): Falha | null {
  if (!modo.arquivos.some((arquivo) => arquivo.papel === 'pdf_da_aprovacao')) return null
  if (modo.arquivos.length === 1 && modo.versaoId === null && !modo.historica && !modo.piloto) return null
  return falhar('entrada_invalida', 'campo arquivos: pdf_da_aprovacao esperado sozinho, sem versao_id, historica nem piloto')
}

// O número do relatório vai com o relatório novo de versão que não é histórica (sozinho ou junto) e só com ele.
function conferirNumeroDoRelatorio(modo: ModoDoRegistro): Falha | null {
  const temRelatorio = modo.arquivos.some((arquivo) => arquivo.papel === 'relatorio')
  const esperado = temRelatorio && !modo.historica && modo.arquivoId === null
  if (esperado === (modo.numeroDoRelatorio !== null)) return null
  return falhar('entrada_invalida', esperado
    ? 'campo numero_do_relatorio: esperado número inteiro maior que zero no relatório novo, recebido ausente'
    : 'campo numero_do_relatorio: esperado ausente fora do relatório de versão que não é histórica')
}

type AlvoDoRegistro = Pick<EntradaRegistrar, 'versaoId' | 'arquivoId' | 'numeroDoRelatorio'>

// O que o pedido aponta: a versão que recebe o arquivo, o arquivo a trocar e o número do relatório novo (todos opcionais).
function lerAlvoDoRegistro(corpo: Corpo): Validacao<AlvoDoRegistro> {
  const versaoId = lerUuidOpcional(corpo, 'versao_id')
  if (!versaoId.ok) return versaoId
  const arquivoId = lerUuidOpcional(corpo, 'arquivo_id')
  if (!arquivoId.ok) return arquivoId
  const numeroDoRelatorio = lerNumeroDoRelatorio(corpo)
  if (!numeroDoRelatorio.ok) return numeroDoRelatorio
  return { ok: true, valor: { versaoId: versaoId.valor, arquivoId: arquivoId.valor, numeroDoRelatorio: numeroDoRelatorio.valor } }
}

// O que o registro faz: versão nova, piloto ou histórica (sem alvo), arquivo depois (versao_id) ou troca de arquivo (arquivo_id).
function lerModoDoRegistro(corpo: Corpo): Validacao<ModoDoRegistro> {
  const historica = lerHistorica(corpo)
  if (!historica.ok) return historica
  const piloto = lerPilotoDaVersao(corpo, historica.valor)
  if (!piloto.ok) return piloto
  const alvo = lerAlvoDoRegistro(corpo)
  if (!alvo.ok) return alvo
  const arquivos = lerArquivosPedidos(corpo)
  if (!arquivos.ok) return arquivos
  const modo = { historica: historica.valor, piloto: piloto.valor, ...alvo.valor, arquivos: arquivos.valor }
  const recusa = conferirArquivoDepois(modo.versaoId, modo.historica, modo.arquivos) ?? conferirSubstituicao(modo)
    ?? conferirNumeroDoRelatorio(modo) ?? conferirPdfDaAprovacao(modo)
  return recusa ?? { ok: true, valor: modo }
}

export function validarRegistrar(corpo: unknown): Validacao<EntradaRegistrar> {
  if (!eCorpo(corpo)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(corpo)}`)
  const processoId = lerTexto(corpo, 'processo_id', FORMATO_UUID, 'uuid')
  if (!processoId.ok) return processoId
  const numero = lerInteiroPositivo(corpo, 'numero')
  if (!numero.ok) return numero
  const modo = lerModoDoRegistro(corpo)
  if (!modo.ok) return modo
  const valor = { processoId: processoId.valor, numero: numero.valor }
  return { ok: true, valor: { ...valor, ...modo.valor } }
}

export type FuncaoDeRegistro =
  | 'registrar_versao' | 'registrar_versao_historica' | 'enviar_relatorio' | 'acrescentar_arquivo' | 'substituir_arquivo'
  | 'registrar_pdf_da_aprovacao' | 'substituir_pdf_da_aprovacao'

function ehPdfDaAprovacao({ arquivos }: Pick<EntradaRegistrar, 'arquivos'>): boolean {
  return arquivos.some((arquivo) => arquivo.papel === 'pdf_da_aprovacao')
}

/** Só o relatório, sem versão que o acompanhe no pedido: o banco o liga à versão mais recente que não é histórica. */
function ehRelatorioSozinho({ historica, arquivos }: Pick<EntradaRegistrar, 'historica' | 'arquivos'>): boolean {
  return !historica && arquivos.length === 1 && arquivos[0].papel === 'relatorio'
}

/** A função do banco que grava: a troca do arquivo, o .png ou .bpmn depois, a histórica, o relatório sozinho ou a versão nova (e a piloto). */
export function funcaoDoBancoPara(
  entrada: Pick<EntradaRegistrar, 'historica' | 'versaoId' | 'arquivoId' | 'arquivos'>,
): FuncaoDeRegistro {
  if (ehPdfDaAprovacao(entrada)) return entrada.arquivoId !== null ? 'substituir_pdf_da_aprovacao' : 'registrar_pdf_da_aprovacao'
  if (entrada.arquivoId !== null) return 'substituir_arquivo'
  if (entrada.versaoId !== null) return 'acrescentar_arquivo'
  if (entrada.historica) return 'registrar_versao_historica'
  return ehRelatorioSozinho(entrada) ? 'enviar_relatorio' : 'registrar_versao'
}

/** Os parâmetros da função do banco escolhida (o arquivo depois e a troca levam o alvo e o único arquivo). */
export function parametrosDoBanco(entrada: EntradaRegistrar, arquivos: ArquivoParaGravar[]): Record<string, unknown> {
  if (ehPdfDaAprovacao(entrada)) {
    return entrada.arquivoId !== null ? { p_pdf: entrada.arquivoId, p_novo: arquivos[0] } : { p_processo: entrada.processoId, p_arquivo: arquivos[0] }
  }
  if (entrada.arquivoId !== null) return { p_arquivo: entrada.arquivoId, p_novo: arquivos[0] }
  if (entrada.versaoId !== null) return { p_versao: entrada.versaoId, p_arquivo: arquivos[0] }
  if (funcaoDoBancoPara(entrada) === 'enviar_relatorio') {
    return {
      p_processo: entrada.processoId, p_numero_da_versao: entrada.numero, p_numero_do_relatorio: entrada.numeroDoRelatorio,
      p_arquivo: arquivos[0],
    }
  }
  const versao = { p_processo: entrada.processoId, p_numero: entrada.numero, p_arquivos: arquivos }
  if (entrada.historica) return versao
  const nova = { ...versao, p_piloto: entrada.piloto }
  return entrada.numeroDoRelatorio === null ? nova : { ...nova, p_numero_do_relatorio: entrada.numeroDoRelatorio }
}

// O nome foi dado por iniciar_envio com o número e o F da tela: um pedido montado fora dela não grava um nome que mente.
function conferirRotuloNoNome(nome: string, rotulo: string | null): Validacao<null> {
  if (rotulo === null || nome.includes(`_${rotulo}_`)) return { ok: true, valor: null }
  return falhar('arquivo_nao_chegou', `nome ${nome}; esperado o rótulo ${rotulo}`)
}

// O relatório numerado traz o seu número no nome (_Relatório V3) e só vale em .docx.
function conferirNumeroNoNome(nome: string, numeroDoRelatorio: number): Validacao<null> {
  if (nome.includes(`_Relatório V${numeroDoRelatorio}.`)) return { ok: true, valor: null }
  return falhar('arquivo_nao_chegou', `nome ${nome}; esperado o relatório V${numeroDoRelatorio}`)
}

// O nome que a função deu ao arquivo no Drive: o rótulo da versão, o número do relatório novo (que só vale em .docx) e a
// extensão do papel; devolve o formato.
function conferirNomeDoArquivo(
  papel: PapelDoArquivo, nome: string, rotulo: string | null, numeroDoRelatorio: number | null,
): Validacao<string> {
  const rotuloConferido = conferirRotuloNoNome(nome, rotulo)
  if (!rotuloConferido.ok) return rotuloConferido
  const numerado = papel === 'relatorio' && numeroDoRelatorio !== null
  const numeroConferido = numerado ? conferirNumeroNoNome(nome, numeroDoRelatorio) : rotuloConferido
  if (!numeroConferido.ok) return numeroConferido
  const formato = extensaoDoNome(nome)
  const aceitas = numerado ? ['docx'] : EXTENSOES_POR_PAPEL[papel]
  if (!aceitas.includes(formato)) return falhar('extensao_nao_aceita', `recebido .${formato}; esperado .${aceitas.join(' ou .')}`)
  return { ok: true, valor: formato }
}

// O formato vem do nome que a função deu ao arquivo no Drive; o tamanho e o MD5, do próprio Drive.
function conferirUmArquivo(
  pedido: ArquivoPedido, lido: ArquivoNoDrive | null, pastaId: string, rotulo: string | null, numeroDoRelatorio: number | null,
): Validacao<ArquivoParaGravar> {
  if (!lido || lido.id !== pedido.driveId || !lido.md5Checksum) return falhar('arquivo_nao_chegou')
  if (!(lido.parents ?? []).includes(pastaId)) return falhar('arquivo_fora_da_pasta')
  const nomeConferido = conferirNomeDoArquivo(pedido.papel, lido.name, rotulo, numeroDoRelatorio)
  if (!nomeConferido.ok) return nomeConferido
  const formato = nomeConferido.valor
  const tamanho = Number(lido.size)
  if (tamanho < 1) return falhar('arquivo_nao_chegou', `recebido ${lido.size} bytes; esperado ao menos 1`)
  if (!(tamanho <= LIMITE_DE_TAMANHO)) return falhar('arquivo_grande', `recebido ${lido.size} bytes; esperado até ${LIMITE_DE_TAMANHO}`)
  const valor = { papel: pedido.papel, nome: lido.name, formato, tamanho }
  return { ok: true, valor: { ...valor, hash_md5: lido.md5Checksum, drive_id: lido.id } }
}

/**
 * `lidos[i]` é o que o Drive informou de `pedidos[i]` (null: o Drive não achou o arquivo). `rotulo` (V5, V5F): o que o nome
 * precisa ter; null na substituição, em que o nome fica. `numeroDoRelatorio`: o do relatório novo, que o nome também traz.
 */
export function conferirArquivosNoDrive(
  pedidos: ArquivoPedido[],
  lidos: (ArquivoNoDrive | null)[],
  pastaId: string,
  rotulo: string | null = null,
  numeroDoRelatorio: number | null = null,
): Validacao<ArquivoParaGravar[]> {
  const arquivos: ArquivoParaGravar[] = []
  for (const [indice, pedido] of pedidos.entries()) {
    const arquivo = conferirUmArquivo(pedido, lidos[indice] ?? null, pastaId, rotulo, numeroDoRelatorio)
    if (!arquivo.ok) return arquivo
    arquivos.push(arquivo.valor)
  }
  return { ok: true, valor: arquivos }
}

// As regras do banco recusam com P0001 "motivo:valor" (migração versoes); 42501 é a RLS ou o privilégio.
const PADRAO_DA_RECUSA = /^([a-z_]+)(?::(.*))?$/

/** A recusa do banco como a tela a lê; null quando o erro não é uma recusa (vira erro interno). */
export function recusaDoBanco(erro: { message: string; code?: string }): RecusaDoBanco | null {
  if (erro.code === '42501') return recusar('sem_permissao')
  const achado = erro.code === 'P0001' ? erro.message.match(PADRAO_DA_RECUSA) : null
  if (!achado) return null
  return { codigo: achado[1], mensagem: achado[2] ?? '' }
}

/** A falta de permissão é 403, como nas outras ações; as regras do banco, 409 (conflito com o estado). */
export function statusDaRecusaDoBanco(recusa: RecusaDoBanco): number {
  return recusa.codigo === 'sem_permissao' ? 403 : 409
}
