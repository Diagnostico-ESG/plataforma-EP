import { render, screen } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { hojeLocal } from '../processos/textoDaModelagemPiloto'
import type { DadosDoCartao, EtapaDoCatalogo, ProcessoLido, SetorDoQuadro, UsuarioResponsavel } from '../processos/tipos'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { ligarArquivosDoProcesso } from './arquivosDoProcesso'
import { RevisoesFalso } from '../revisoes/RevisoesFalso'
import { PlanilhasFalso } from '../planilhas/PlanilhasFalso'
import { CATALOGO_DE_TESTE, umProcessoLido } from './processoDaLista'

/** O catálogo do Quadro de teste: de Não iniciados a Concluídos, com seis etapas de trabalho entre elas. */
export const ETAPAS: EtapaDoCatalogo[] = [...CATALOGO_DE_TESTE]

/** O dia de hoje deslocado em dias (AAAA-MM-DD), para os testes não dependerem da data em que rodam. */
export function dia(deslocamento: number): string {
  const data = new Date()
  data.setDate(data.getDate() + deslocamento)
  return hojeLocal(data)
}

export type Mudancas = {
  /** O código da etapa atual (Revisão interna por padrão). */
  etapa?: string
  cartao?: Partial<DadosDoCartao>
  processo?: Partial<ProcessoLido>
}

let contador = 0

/**
 * Um processo do Quadro: em andamento na etapa pedida, com A fazer, a entrada de hoje e Ana Teste como responsável.
 * Cada chamada gera um id novo (`p1`, `p2`…).
 */
export function processo(nome: string, { etapa = 'revisao_interna', cartao = {}, processo: mudancas = {} }: Mudancas = {}): ProcessoLido {
  contador += 1
  return umProcessoLido(nome, {
    id: `p${contador}`, entrouNaEtapaEm: dia(0), responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: null },
    cartao: { responsavelAtivo: true, ultimaVersao: null, subprocessos: 0, ...cartao }, ...mudancas,
  }, etapa)
}

/** O Quadro no aplicativo inteiro, com os processos dados; devolve o módulo falso para o teste conferir as gravações. */
export function montar(
  processos: ProcessoLido[], perfil: Perfil = 'integrante_ep', usuarios: UsuarioResponsavel[] = [], versoes = new VersoesFalso(),
  setores: SetorDoQuadro[] = [],
): ProcessosFalso {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = ETAPAS
  falso.processos = processos
  falso.setores = setores
  falso.usuariosPossiveis = usuarios
  ligarArquivosDoProcesso(falso, versoes)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={versoes} revisoes={new RevisoesFalso(falso)} planilhas={new PlanilhasFalso()} />)
  return falso
}

/** O cartão do processo pelo nome, depois que o Quadro carregou. */
export async function cartaoDe(nome: string): Promise<HTMLElement> {
  const nomeNoCartao = await screen.findByText(nome, { selector: '.cartao-nome' })
  return nomeNoCartao.closest('a') as HTMLElement
}
