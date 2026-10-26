// Decisão da função arquivos-no-drive (quem pode, qual entrada vale). Arquivo puro, sem Deno nem npm:,
// testado no Vitest (regra "Edge Functions" de .claude/regras/banco.md). A entrada é dado de fora.
import { EXTENSOES_DO_ANEXO, type PapelDoArquivo } from './nomePadrao.ts'

export type Perfil = 'administrador' | 'integrante_ep' | 'consulta'
export type Acao = 'iniciar_envio' | 'baixar' | 'registrar' | 'conferir'
export interface Chamador {
  perfil: Perfil
  ativo: boolean
}
export type CodigoDeRecusa =
  | 'sem_login'
  | 'usuario_inativo'
  | 'sem_permissao'
  | 'entrada_invalida'
  | 'processo_fora_de_andamento'
  | 'extensao_nao_aceita'
  | 'arquivo_grande'
  | 'arquivo_nao_chegou'
  | 'arquivo_fora_da_pasta'
  | 'tipo_de_arquivo_diferente'
  | 'versao_historica_somente_leitura'
  | 'versao_aprovada'
export interface Recusa {
  codigo: CodigoDeRecusa
  mensagem: string
}
export interface EntradaIniciarEnvio {
  processoId: string
  papel: PapelDoArquivo
  nomeOriginal: string
  tamanho: number
  numero: number
  historica: boolean
  piloto: boolean
  /** Com o arquivo: troca o conteúdo dele (mesmo arquivo do Drive); sem: cria um arquivo novo. */
  arquivoId: string | null
  /** Só no relatório de versão que não é histórica (Relatório V3): o número próprio dele, com que o arquivo é nomeado. */
  numeroDoRelatorio: number | null
}
export interface EntradaBaixar {
  arquivoId: string
}
export type Falha = { ok: false; recusa: Recusa }
export type Validacao<T> = { ok: true; valor: T } | Falha
export type Corpo = Record<string, unknown>

export const LIMITE_DE_TAMANHO = 20 * 1024 * 1024

const PERFIS_POR_ACAO: Record<Acao, readonly Perfil[]> = {
  iniciar_envio: ['administrador', 'integrante_ep'],
  baixar: ['administrador', 'integrante_ep', 'consulta'],
  registrar: ['administrador', 'integrante_ep'],
  conferir: ['administrador', 'integrante_ep', 'consulta'],
}

export const EXTENSOES_POR_PAPEL: Record<PapelDoArquivo, readonly string[]> = {
  bpmn: ['bpmn'],
  png: ['png'],
  bpm: ['bpm'],
  relatorio: ['docx', 'pdf'],
  pdf_da_aprovacao: ['pdf'],
  anexo: EXTENSOES_DO_ANEXO,
}

const MENSAGENS: Record<CodigoDeRecusa, string> = {
  sem_login: 'É preciso entrar na plataforma.',
  usuario_inativo: 'Usuário desativado.',
  sem_permissao: 'Seu perfil não permite esta ação.',
  entrada_invalida: 'Pedido em formato inválido.',
  processo_fora_de_andamento: 'O processo não está em andamento.',
  extensao_nao_aceita: 'Tipo de arquivo não aceito para este papel.',
  arquivo_grande: 'O arquivo passa de 20 MB.',
  arquivo_nao_chegou: 'Um dos arquivos não chegou ao Drive. Envie de novo.',
  arquivo_fora_da_pasta: 'O arquivo não está na pasta do processo no Drive.',
  tipo_de_arquivo_diferente: 'O arquivo novo precisa ser do mesmo tipo do que sai.',
  versao_historica_somente_leitura: 'A versão histórica é somente leitura.',
  versao_aprovada: 'A versão está aprovada: seus arquivos não podem ser substituídos.',
}

export const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const FORMATO_ID_DO_DRIVE = /^[A-Za-z0-9_-]{1,200}$/

const STATUS_POR_CODIGO: Partial<Record<CodigoDeRecusa, number>> = {
  sem_login: 401,
  usuario_inativo: 403,
  sem_permissao: 403,
  tipo_de_arquivo_diferente: 409,
  versao_historica_somente_leitura: 409,
  versao_aprovada: 409,
}

export function recusar(codigo: CodigoDeRecusa, detalhe?: string): Recusa {
  return { codigo, mensagem: detalhe ? `${MENSAGENS[codigo]} (${detalhe})` : MENSAGENS[codigo] }
}

export function statusDaRecusa(recusa: Recusa): number {
  return STATUS_POR_CODIGO[recusa.codigo] ?? 400
}

export function lerAcao(corpo: unknown): Acao | null {
  const acao = eCorpo(corpo) ? corpo.acao : null
  return typeof acao === 'string' && Object.hasOwn(PERFIS_POR_ACAO, acao) ? (acao as Acao) : null
}

export function falhar(codigo: CodigoDeRecusa, detalhe?: string): Falha {
  return { ok: false, recusa: recusar(codigo, detalhe) }
}

export function conferirChamador(chamador: Chamador | null, acao: Acao): Recusa | null {
  if (!chamador) return recusar('sem_login')
  if (!chamador.ativo) return recusar('usuario_inativo')
  if (!PERFIS_POR_ACAO[acao].includes(chamador.perfil)) return recusar('sem_permissao')
  return null
}

export function conferirProcessoEmAndamento(situacao: string): Recusa | null {
  return situacao === 'em_andamento' ? null : recusar('processo_fora_de_andamento')
}

/** O .pdf da aprovação segue a regra do editar a aprovação: processo em andamento ou concluído, não arquivado. */
export function conferirProcessoDoPdf(situacao: string, arquivado: boolean): Recusa | null {
  const aceita = situacao === 'em_andamento' || situacao === 'concluido'
  return aceita && !arquivado ? null : recusar('processo_fora_de_andamento')
}

export function extensaoDoNome(nome: string): string {
  const ponto = nome.lastIndexOf('.')
  if (ponto < 0) return ''
  return nome.slice(ponto + 1).toLowerCase()
}

// Só o tipo recebido entra na mensagem: o valor pode trazer dado de fora (e pessoal).
export function tipoDe(valor: unknown): string {
  if (valor === null) return 'null'
  if (Array.isArray(valor)) return 'array'
  return typeof valor
}

export function eCorpo(valor: unknown): valor is Corpo {
  return tipoDe(valor) === 'object'
}

export function campoInvalido(corpo: Corpo, campo: string, esperado: string): Falha {
  return falhar('entrada_invalida', `campo ${campo}: esperado ${esperado}, recebido ${tipoDe(corpo[campo])}`)
}

export function lerTexto(corpo: Corpo, campo: string, formato: RegExp, esperado: string): Validacao<string> {
  const valor = corpo[campo]
  if (typeof valor !== 'string' || !formato.test(valor)) return campoInvalido(corpo, campo, esperado)
  return { ok: true, valor }
}

/** Um uuid que pode faltar: ausente ou nulo vale null; presente e fora do formato, recusa. */
export function lerUuidOpcional(corpo: Corpo, campo: string): Validacao<string | null> {
  const valor = corpo[campo]
  if (valor === undefined || valor === null) return { ok: true, valor: null }
  return lerTexto(corpo, campo, FORMATO_UUID, 'uuid')
}

export function lerInteiroPositivo(corpo: Corpo, campo: string): Validacao<number> {
  const valor = corpo[campo]
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0) {
    return campoInvalido(corpo, campo, 'número inteiro maior que zero')
  }
  return { ok: true, valor }
}

export function lerBooleano(corpo: Corpo, campo: string): Validacao<boolean> {
  const valor = corpo[campo]
  if (typeof valor !== 'boolean') return campoInvalido(corpo, campo, 'booleano')
  return { ok: true, valor }
}

/** Booleano que pode faltar: ausente vale falso; presente e de outro tipo, recusa. */
export function lerBooleanoOpcional(corpo: Corpo, campo: string): Validacao<boolean> {
  return corpo[campo] === undefined ? { ok: true, valor: false } : lerBooleano(corpo, campo)
}

export function lerPapel(corpo: Corpo): Validacao<PapelDoArquivo> {
  const valor = corpo.papel
  if (typeof valor !== 'string' || !(valor in EXTENSOES_POR_PAPEL)) {
    return campoInvalido(corpo, 'papel', 'bpmn, png, bpm, relatorio, pdf_da_aprovacao ou anexo')
  }
  return { ok: true, valor: valor as PapelDoArquivo }
}

/** O número do relatório (Relatório V3) é opcional: ausente ou nulo vale null; presente e fora do formato, recusa. */
export function lerNumeroDoRelatorio(corpo: Corpo): Validacao<number | null> {
  if (corpo.numero_do_relatorio === undefined || corpo.numero_do_relatorio === null) return { ok: true, valor: null }
  return lerInteiroPositivo(corpo, 'numero_do_relatorio')
}

/** A versão piloto (V6P) é opcional e nunca histórica: ausente vale falso; junto com a histórica, recusa. */
export function lerPilotoDaVersao(corpo: Corpo, historica: boolean): Validacao<boolean> {
  const piloto = lerBooleanoOpcional(corpo, 'piloto')
  if (!piloto.ok) return piloto
  if (historica && piloto.valor) return campoInvalido(corpo, 'piloto', 'falso quando a versão é histórica')
  return piloto
}

type DoArquivo = Pick<EntradaIniciarEnvio, 'processoId' | 'papel' | 'nomeOriginal'>
type DaVersao = Pick<EntradaIniciarEnvio, 'tamanho' | 'numero' | 'historica' | 'piloto' | 'arquivoId' | 'numeroDoRelatorio'>

function lerDoArquivo(corpo: Corpo): Validacao<DoArquivo> {
  const processoId = lerTexto(corpo, 'processo_id', FORMATO_UUID, 'uuid')
  if (!processoId.ok) return processoId
  const papel = lerPapel(corpo)
  if (!papel.ok) return papel
  const nomeOriginal = lerTexto(corpo, 'nome_original', /\S/, 'texto não vazio')
  if (!nomeOriginal.ok) return nomeOriginal
  return { ok: true, valor: { processoId: processoId.valor, papel: papel.valor, nomeOriginal: nomeOriginal.valor } }
}

function lerDaVersao(corpo: Corpo): Validacao<DaVersao> {
  const tamanho = lerInteiroPositivo(corpo, 'tamanho')
  if (!tamanho.ok) return tamanho
  const numero = lerInteiroPositivo(corpo, 'numero')
  if (!numero.ok) return numero
  const historica = lerBooleano(corpo, 'historica')
  if (!historica.ok) return historica
  const piloto = lerPilotoDaVersao(corpo, historica.valor)
  if (!piloto.ok) return piloto
  const arquivoId = lerUuidOpcional(corpo, 'arquivo_id')
  if (!arquivoId.ok) return arquivoId
  const numeroDoRelatorio = lerNumeroDoRelatorio(corpo)
  if (!numeroDoRelatorio.ok) return numeroDoRelatorio
  const valor = { tamanho: tamanho.valor, numero: numero.valor, historica: historica.valor, piloto: piloto.valor }
  return { ok: true, valor: { ...valor, arquivoId: arquivoId.valor, numeroDoRelatorio: numeroDoRelatorio.valor } }
}

function lerCamposDoEnvio(corpo: Corpo): Validacao<EntradaIniciarEnvio> {
  const doArquivo = lerDoArquivo(corpo)
  if (!doArquivo.ok) return doArquivo
  const daVersao = lerDaVersao(corpo)
  if (!daVersao.ok) return daVersao
  return { ok: true, valor: { ...doArquivo.valor, ...daVersao.valor } }
}

/** O relatório novo de uma versão que não é histórica (ADR 0026): é numerado e só vale em .docx. */
export function ehRelatorioNumerado({ papel, historica, arquivoId }: Pick<EntradaIniciarEnvio, 'papel' | 'historica' | 'arquivoId'>): boolean {
  return papel === 'relatorio' && !historica && arquivoId === null
}

/** As extensões que o arquivo aceita: o relatório numerado só .docx; a histórica e a troca mantêm .docx e .pdf. */
export function extensoesAceitas(entrada: Pick<EntradaIniciarEnvio, 'papel' | 'historica' | 'arquivoId'>): readonly string[] {
  return ehRelatorioNumerado(entrada) ? ['docx'] : EXTENSOES_POR_PAPEL[entrada.papel]
}

// O número do relatório vai com o relatório numerado e só com ele.
function conferirNumeroDoRelatorio(entrada: EntradaIniciarEnvio): Validacao<EntradaIniciarEnvio> {
  const esperado = ehRelatorioNumerado(entrada)
  if (esperado && entrada.numeroDoRelatorio === null) {
    return falhar('entrada_invalida', 'campo numero_do_relatorio: esperado número inteiro maior que zero, recebido ausente')
  }
  if (!esperado && entrada.numeroDoRelatorio !== null) {
    return falhar('entrada_invalida', 'campo numero_do_relatorio: esperado ausente fora do relatório de versão que não é histórica')
  }
  return { ok: true, valor: entrada }
}

function conferirArquivo(entrada: EntradaIniciarEnvio): Validacao<EntradaIniciarEnvio> {
  const extensao = extensaoDoNome(entrada.nomeOriginal)
  const aceitas = extensoesAceitas(entrada)
  if (!aceitas.includes(extensao)) {
    return falhar('extensao_nao_aceita', `recebido .${extensao}; esperado .${aceitas.join(' ou .')}`)
  }
  if (entrada.tamanho > LIMITE_DE_TAMANHO) {
    return falhar('arquivo_grande', `recebido ${entrada.tamanho} bytes; esperado até ${LIMITE_DE_TAMANHO}`)
  }
  return { ok: true, valor: entrada }
}

// O .pdf da aprovação não é de versão histórica nem piloto: o número no nome é o da versão aprovada.
function conferirPdfDaAprovacao(entrada: EntradaIniciarEnvio): Validacao<EntradaIniciarEnvio> {
  if (entrada.papel === 'pdf_da_aprovacao' && (entrada.historica || entrada.piloto)) {
    return falhar('entrada_invalida', 'campo papel: pdf_da_aprovacao esperado sem historica nem piloto')
  }
  return { ok: true, valor: entrada }
}

export function validarIniciarEnvio(entrada: unknown): Validacao<EntradaIniciarEnvio> {
  if (!eCorpo(entrada)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(entrada)}`)
  const campos = lerCamposDoEnvio(entrada)
  if (!campos.ok) return campos
  const pdf = conferirPdfDaAprovacao(campos.valor)
  if (!pdf.ok) return pdf
  const arquivo = conferirArquivo(pdf.valor)
  return arquivo.ok ? conferirNumeroDoRelatorio(arquivo.valor) : arquivo
}

export function validarBaixar(entrada: unknown): Validacao<EntradaBaixar> {
  if (!eCorpo(entrada)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(entrada)}`)
  const arquivoId = lerTexto(entrada, 'arquivo_id', FORMATO_UUID, 'uuid')
  if (!arquivoId.ok) return arquivoId
  return { ok: true, valor: { arquivoId: arquivoId.valor } }
}
