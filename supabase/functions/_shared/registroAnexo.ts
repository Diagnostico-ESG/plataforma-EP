// Decisão da ação registrar para o anexo (documentos-versoes, ticket 12). Arquivo puro, testado no Vitest: qual pedido vale.
// O que o Drive informou do arquivo (chegou, tamanho, formato, subpasta) é conferido pelo `conferirArquivosNoDrive` de
// registro.ts, sem rótulo de versão no nome; a gravação é a função `registrar_anexo` do banco, com o login de quem chamou.
import {
  FORMATO_ID_DO_DRIVE,
  FORMATO_UUID,
  eCorpo,
  falhar,
  lerTexto,
  tipoDe,
  type Corpo,
  type Falha,
  type Validacao,
} from './decisao.ts'
import { validarRegistrar, type EntradaRegistrar } from './registro.ts'

export interface EntradaRegistrarAnexo {
  processoId: string
  driveId: string
}

// O anexo não tem número, versão, arquivo a trocar nem relatório. O `numero` que a tela mandar é ignorado; estes, não.
const CAMPOS_QUE_O_ANEXO_NAO_TEM = ['versao_id', 'arquivo_id', 'historica', 'piloto', 'numero_do_relatorio']

function campoDeFora(corpo: Corpo): Falha | null {
  const campo = CAMPOS_QUE_O_ANEXO_NAO_TEM.find((nome) => corpo[nome] !== undefined && corpo[nome] !== null && corpo[nome] !== false)
  return campo ? falhar('entrada_invalida', `campo ${campo}: esperado ausente quando o papel é anexo`) : null
}

function lerDriveIdDoAnexo(corpo: Corpo): Validacao<string> {
  const lista = corpo.arquivos
  if (!Array.isArray(lista) || lista.length !== 1) return falhar('entrada_invalida', 'campo arquivos: esperado um único arquivo, o anexo')
  const item: unknown = lista[0]
  if (!eCorpo(item) || item.papel !== 'anexo') {
    return falhar('entrada_invalida', `item de arquivos: esperado objeto com papel anexo, recebido ${tipoDe(item)}`)
  }
  return lerTexto(item, 'drive_id', FORMATO_ID_DO_DRIVE, 'identificador do Drive')
}

/** O pedido de registro do anexo: um arquivo só, do papel anexo, sozinho. */
export function validarRegistrarAnexo(corpo: unknown): Validacao<EntradaRegistrarAnexo> {
  if (!eCorpo(corpo)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(corpo)}`)
  const processoId = lerTexto(corpo, 'processo_id', FORMATO_UUID, 'uuid')
  if (!processoId.ok) return processoId
  const deFora = campoDeFora(corpo)
  if (deFora) return deFora
  const driveId = lerDriveIdDoAnexo(corpo)
  if (!driveId.ok) return driveId
  return { ok: true, valor: { processoId: processoId.valor, driveId: driveId.valor } }
}

export type RegistroValidado =
  | { tipo: 'anexo'; entrada: EntradaRegistrarAnexo }
  | { tipo: 'versao'; entrada: EntradaRegistrar }

function temArquivoAnexo(corpo: unknown): boolean {
  if (!eCorpo(corpo) || !Array.isArray(corpo.arquivos)) return false
  return corpo.arquivos.some((item: unknown) => eCorpo(item) && item.papel === 'anexo')
}

/** Quem lê o pedido de registro: qualquer pedido com o papel `anexo` segue a regra do anexo; os demais, a das versões. */
export function validarRegistro(corpo: unknown): Validacao<RegistroValidado> {
  if (temArquivoAnexo(corpo)) {
    const anexo = validarRegistrarAnexo(corpo)
    return anexo.ok ? { ok: true, valor: { tipo: 'anexo', entrada: anexo.valor } } : anexo
  }
  const versao = validarRegistrar(corpo)
  return versao.ok ? { ok: true, valor: { tipo: 'versao', entrada: versao.valor } } : versao
}
