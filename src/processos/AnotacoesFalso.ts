import { USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { SEM_ANOTACOES } from './anotacoes'
import { conferirNaoArquivado } from './arquivamentoFalso'
import type { AnotacoesLidas, ProcessoLido, ResultadoDaGravacaoDasAnotacoes } from './tipos'

/** Só o que a falsa das Anotações pede à falsa de processos (importá-la inteira fecharia um ciclo). */
type DonoDosProcessos = { processos: ProcessoLido[] }

// Hora fixa (14:30 em Brasília): os testes de tela não dependem do relógio.
const AGORA = '2026-10-13T17:30:00Z'

/** As Anotações na falsa de processos: como as funções do banco, com a falha, a espera e o "outra pessoa alterou" programáveis. */
export class AnotacoesFalso {
  /** O que o banco guardaria por processo; sem entrada, o processo nunca teve anotação. */
  porProcesso: Record<string, AnotacoesLidas> = {}
  /** As gravações recebidas, na ordem: o texto que a pessoa tinha e o novo. */
  gravacoes: { id: string; esperado: string | null; novo: string | null }[] = []
  /** Quantas das próximas gravações falham (conexão fora do ar). */
  falhasProgramadas = 0
  /** Segura a resposta da gravação até `liberar()`: dá tempo de ver "Salvando…". */
  segurar = false
  /** O nome que o banco poria em "Alterado por" para quem está na tela. */
  autor = USUARIO_DE_TESTE.nome
  private liberacao: (() => void) | null = null
  private readonly processos: DonoDosProcessos

  constructor(processos: DonoDosProcessos) {
    this.processos = processos
  }

  async ler(id: string): Promise<AnotacoesLidas | null> {
    if (!this.existe(id)) return null
    return { ...(this.porProcesso[id] ?? SEM_ANOTACOES) }
  }

  async gravar(id: string, esperado: string | null, novo: string | null): Promise<ResultadoDaGravacaoDasAnotacoes> {
    this.gravacoes.push({ id, esperado, novo })
    if (this.segurar) await new Promise<void>((liberar) => { this.liberacao = liberar })
    if (this.falhasProgramadas > 0) {
      this.falhasProgramadas -= 1
      throw new Error('falha de conexão simulada')
    }
    const processo = this.processos.processos.find((outro) => outro.id === id)
    if (!processo) throw new CadastroInexistente()
    conferirNaoArquivado(processo)
    const atual = this.porProcesso[id] ?? SEM_ANOTACOES
    if (atual.texto !== esperado) return { tipo: 'conflito' }
    if (novo === atual.texto) return { tipo: 'gravado', anotacoes: { ...atual } }
    this.porProcesso[id] = { texto: novo, alteradoPor: this.autor, alteradoEm: AGORA }
    return { tipo: 'gravado', anotacoes: { ...this.porProcesso[id] } }
  }

  liberar(): void {
    this.liberacao?.()
    this.liberacao = null
  }

  /** O gesto "outra pessoa altera agora": muda o texto por fora da tela, como outra sessão faria. */
  alterarComoOutraPessoa(id: string, texto: string | null, autor: string): void {
    this.porProcesso[id] = { texto, alteradoPor: autor, alteradoEm: '2026-10-13T18:05:00Z' }
  }

  private existe(id: string): boolean {
    return this.processos.processos.some((processo) => processo.id === id)
  }
}
