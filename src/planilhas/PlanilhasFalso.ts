import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { FRASE_EM_ANDAMENTO, FRASE_NAO_CONFIGURADA } from './frasesDasPlanilhas'
import type { AtualizacaoDasPlanilhas, LinksDasPlanilhas, ModuloDePlanilhas, ResultadoDaAtualizacao } from './tipos'

const LINKS_DE_TESTE: LinksDasPlanilhas = {
  interna: 'https://docs.google.com/spreadsheets/d/id-interna-teste/edit',
  publica: 'https://docs.google.com/spreadsheets/d/id-publica-teste/edit',
}

/** Planilhas em memória para os testes de tela: tentativas (mais recente primeiro), recusas do banco e falhas programáveis. */
export class PlanilhasFalso implements ModuloDePlanilhas {
  atualizacoes: AtualizacaoDasPlanilhas[] = []
  /** null: as planilhas ainda não foram configuradas no ambiente. */
  links: LinksDasPlanilhas | null = LINKS_DE_TESTE
  falharAoLer = false
  /** A leitura das tentativas nunca responde (para ver o "Carregando"). */
  segurarLeitura = false
  falharAoPedir: Error | null = null
  pedidos = 0
  private sequencia = 0
  private readonly nomeDoAdministrador: string

  constructor(nomeDoAdministrador = 'Ana Administradora') {
    this.nomeDoAdministrador = nomeDoAdministrador
  }

  async listarAtualizacoes(): Promise<AtualizacaoDasPlanilhas[]> {
    if (this.segurarLeitura) return new Promise(() => {})
    if (this.falharAoLer) throw new Error('falha de teste ao ler as atualizações')
    return this.atualizacoes.slice(0, 10).map((tentativa) => ({ ...tentativa }))
  }

  async lerLinks(): Promise<LinksDasPlanilhas | null> {
    if (this.falharAoLer) throw new Error('falha de teste ao ler os links')
    return this.links && { ...this.links }
  }

  async pedirAtualizacao(): Promise<void> {
    this.pedidos += 1
    if (this.falharAoPedir) throw this.falharAoPedir
    if (this.atualizacoes.some((tentativa) => tentativa.resultado === 'em_andamento')) {
      throw new TravaDoBanco(FRASE_EM_ANDAMENTO)
    }
    if (!this.links) throw new TravaDoBanco(FRASE_NAO_CONFIGURADA)
    this.sequencia += 1
    const nova: AtualizacaoDasPlanilhas = {
      id: `t${this.sequencia}`, iniciadaEm: new Date().toISOString(), origem: 'botao',
      pedidaPor: this.nomeDoAdministrador, resultado: 'em_andamento', motivo: null,
    }
    this.atualizacoes = [nova, ...this.atualizacoes].slice(0, 10)
  }

  /** Simula a resposta da função das planilhas (ou os 10 minutos sem resposta). */
  terminar(id: string, resultado: ResultadoDaAtualizacao, motivo: string | null = null): void {
    this.atualizacoes = this.atualizacoes.map((t) => (t.id === id ? { ...t, resultado, motivo } : t))
  }
}
