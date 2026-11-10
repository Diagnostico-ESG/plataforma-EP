import { chaveDoProcesso } from './chaves'
import { decodificarArquivo } from './csv'
import { type PlanilhaLida, type ProcessoLido, lerPlanilha } from './lerPlanilha'
import type { ExistentesNaPlataforma, ModuloDeImportacao } from './tipos'

/** O que vai entrar e o que já existe, calculado sobre a planilha lida; nada disso foi gravado. */
export type Previa = {
  lida: PlanilhaLida
  novos: ProcessoLido[]
  jaExistem: ProcessoLido[]
  setoresNovos: number
  macroprocessosNovos: number
}

/** O fim da gravação: `falha` traz a frase da primeira falha (a carga para ali) e `naoTentados` quantos ficaram para trás. */
export type ResumoDaImportacao = {
  criados: number
  pulados: number
  falha: string | null
  naoTentados: number
  lida: PlanilhaLida
}

export function montarPrevia(lida: PlanilhaLida, existentes: ExistentesNaPlataforma): Previa {
  const existem = new Set(existentes.processos)
  const jaExiste = (p: ProcessoLido) => existem.has(chaveDoProcesso(p.setor, p.nome))
  const novos = lida.processos.filter((p) => !jaExiste(p))
  const setores = new Set(novos.map((p) => p.setor).filter((s) => !existentes.setores.includes(s)))
  const macros = new Set(novos.map((p) => p.macroprocesso.toLowerCase()).filter((m) => !existentes.macroprocessos.includes(m)))
  return { lida, novos, jaExistem: lida.processos.filter(jaExiste), setoresNovos: setores.size, macroprocessosNovos: macros.size }
}

/** Lê o arquivo escolhido; lança ColunasFaltando se não for a aba PRODUTO 33. */
export async function lerArquivoDaPlanilha(arquivo: File, hoje: Date): Promise<PlanilhaLida> {
  return lerPlanilha(decodificarArquivo(await arquivo.arrayBuffer()), hoje)
}

export function mensagemDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro)
}

/**
 * Grava os processos novos um a um, na ordem da planilha. Cada um é inteiro ou nada; na primeira falha a carga para e o
 * resumo diz quantos entraram. Rodar de novo pula o que já entrou (o banco confere de novo e devolve "ja_existia").
 */
export async function gravarNovos(
  importacao: ModuloDeImportacao, previa: Previa, aoAndar: (feitos: number) => void,
): Promise<ResumoDaImportacao> {
  const resumo: ResumoDaImportacao = { criados: 0, pulados: previa.jaExistem.length, falha: null, naoTentados: 0, lida: previa.lida }
  for (const [i, processo] of previa.novos.entries()) {
    try {
      const resultado = await importacao.gravarProcesso(processo)
      if (resultado === 'criado') resumo.criados += 1
      else resumo.pulados += 1
      aoAndar(i + 1)
    } catch (erro) {
      resumo.falha = `${processo.nome} (linha ${String(processo.linha)}): ${mensagemDoErro(erro)}`
      resumo.naoTentados = previa.novos.length - i - 1
      return resumo
    }
  }
  return resumo
}
