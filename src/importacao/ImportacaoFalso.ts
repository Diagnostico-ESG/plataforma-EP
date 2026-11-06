import { chaveDoProcesso } from './chaves'
import type { ExistentesNaPlataforma, ModuloDeImportacao, ProcessoParaImportar, ResultadoDaGravacao } from './tipos'

/** Importação em memória para os testes de tela: o que já existe, o que foi gravado e uma falha programável. */
export class ImportacaoFalso implements ModuloDeImportacao {
  existentes: ExistentesNaPlataforma = { setores: [], macroprocessos: [], processos: [] }
  gravados: ProcessoParaImportar[] = []
  falharAoListar = false
  /** O nome do processo cuja gravação falha (para ver a falha no meio da carga). */
  falharNoProcesso: string | null = null
  /** Chamado a cada processo criado, para o teste levar o processo aos outros falsos (Lista, Quadro, Cadastros). */
  aoCriar: ((processo: ProcessoParaImportar) => void) | null = null

  async listarExistentes(): Promise<ExistentesNaPlataforma> {
    if (this.falharAoListar) throw new Error('falha de teste ao ler o que já existe')
    return {
      setores: [...this.existentes.setores], macroprocessos: [...this.existentes.macroprocessos],
      processos: [...this.existentes.processos],
    }
  }

  async gravarProcesso(processo: ProcessoParaImportar): Promise<ResultadoDaGravacao> {
    if (processo.nome === this.falharNoProcesso) throw new Error(`falha de teste ao gravar ${processo.nome}`)
    const chave = chaveDoProcesso(processo.setor, processo.nome)
    if (this.existentes.processos.includes(chave)) return 'ja_existia'
    this.existentes.processos.push(chave)
    this.existentes.setores.push(processo.setor.toUpperCase())
    this.existentes.macroprocessos.push(processo.macroprocesso.toLowerCase())
    this.gravados.push(processo)
    this.aoCriar?.(processo)
    return 'criado'
  }
}
