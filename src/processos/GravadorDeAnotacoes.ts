import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { PAUSA_DA_GRAVACAO_MS, precisaGravar, textoParaGravar } from './anotacoes'
import type { AnotacoesLidas, ResultadoDaGravacaoDasAnotacoes } from './tipos'

export type EstadoDaGravacao = 'ocioso' | 'salvando' | 'salvo' | 'falha' | 'conflito'

/** O que o gravador pede ao mundo, já ligado a um processo: gravar, ler de novo e avisar que o processo sumiu. */
export type SaidaDoGravador = {
  gravar(esperado: string | null, novo: string | null): Promise<ResultadoDaGravacaoDasAnotacoes>
  ler(): Promise<AnotacoesLidas | null>
  aoSumir(): void
}

/**
 * O salvamento automático das Anotações (spec, "Verso do cartão", Anotações): grava 1 segundo depois da última tecla e
 * ao sair do campo, uma gravação por vez, e para no conflito até "Ver o texto atual". Fica fora do React para a ordem
 * das gravações poder ser testada com o relógio simulado; o hook só o liga à tela.
 */
export class GravadorDeAnotacoes {
  estado: EstadoDaGravacao = 'ocioso'
  /** O que a pessoa vê e edita no campo. */
  digitado: string
  /** O último texto lido ou gravado, com quem o alterou e quando. */
  lidas: AnotacoesLidas
  private gravado: string | null
  private fila: Promise<void> = Promise.resolve()
  private pausa: ReturnType<typeof setTimeout> | undefined
  private readonly ouvintes = new Set<() => void>()
  private readonly saida: SaidaDoGravador

  constructor(inicial: AnotacoesLidas, saida: SaidaDoGravador) {
    this.lidas = inicial
    this.gravado = inicial.texto
    this.digitado = inicial.texto ?? ''
    this.saida = saida
  }

  digitar(texto: string): void {
    this.digitado = texto
    clearTimeout(this.pausa)
    if (this.estado === 'salvo') this.estado = 'ocioso'
    if (this.estado !== 'conflito') this.pausa = setTimeout(() => void this.salvar(), PAUSA_DA_GRAVACAO_MS)
    this.avisar()
  }

  sairDoCampo(): Promise<void> {
    clearTimeout(this.pausa)
    return this.salvar()
  }

  /** Há texto que o banco ainda não tem (inclusive o de uma gravação em andamento). */
  pendente(): boolean {
    return precisaGravar(this.digitado, this.gravado)
  }

  /** Grava na hora; true quando nada ficou para trás (falha e conflito deixam o texto pendente). */
  async gravarAgora(): Promise<boolean> {
    await this.sairDoCampo()
    return !this.pendente()
  }

  /** No conflito: lê o texto gravado, troca o campo por ele e volta a gravar. A leitura que falha mantém o conflito. */
  async verTextoAtual(): Promise<void> {
    try {
      const lidas = await this.saida.ler()
      if (!lidas) return this.saida.aoSumir()
      this.lidas = lidas
      this.gravado = lidas.texto
      this.digitado = lidas.texto ?? ''
      this.mudarEstado('ocioso')
    } catch {
      // continua em conflito, com o texto de quem escrevia no campo; o botão tenta de novo
    }
  }

  ouvir(ouvinte: () => void): () => void {
    this.ouvintes.add(ouvinte)
    return () => {
      this.ouvintes.delete(ouvinte)
    }
  }

  encerrar(): void {
    clearTimeout(this.pausa)
  }

  // Uma gravação por vez: cada pedido entra na fila e confere de novo, quando chega a sua vez, se ainda há o que gravar.
  private salvar(): Promise<void> {
    this.fila = this.fila.then(() => this.gravarUmaVez())
    return this.fila
  }

  private async gravarUmaVez(): Promise<void> {
    const enviado = this.digitado
    if (this.estado === 'conflito' || !precisaGravar(enviado, this.gravado)) return
    this.mudarEstado('salvando')
    try {
      const resultado = await this.saida.gravar(this.gravado, textoParaGravar(enviado))
      if (resultado.tipo === 'conflito') return this.mudarEstado('conflito')
      this.lidas = resultado.anotacoes
      this.gravado = resultado.anotacoes.texto
      this.mudarEstado(precisaGravar(this.digitado, this.gravado) ? 'ocioso' : 'salvo')
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return this.saida.aoSumir()
      this.mudarEstado('falha')
    }
  }

  private mudarEstado(estado: EstadoDaGravacao): void {
    this.estado = estado
    this.avisar()
  }

  private avisar(): void {
    this.ouvintes.forEach((ouvinte) => ouvinte())
  }
}
