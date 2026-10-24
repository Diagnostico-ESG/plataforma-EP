import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { TravaDoBanco } from '../../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { Aprovacao, DadosDaAprovacao, DadosDaEdicaoDaRevisao, RevisaoInterna } from '../../revisoes/tipos'
import { JanelaDaAprovacao } from './JanelaDaAprovacao'
import { JanelaDaRevisao } from './JanelaDaRevisao'

afterEach(cleanup)

/** Módulo que só guarda o que a janela mandou gravar; `falha` e `espera` programam a recusa e a espera. */
class RevisoesQueGravam {
  edicoesDaRevisao: [string, DadosDaEdicaoDaRevisao][] = []
  edicoesDaAprovacao: [string, DadosDaAprovacao][] = []
  falha: Error | null = null
  espera = false

  async editarRevisao(id: string, dados: DadosDaEdicaoDaRevisao): Promise<void> {
    await this.gravar(() => this.edicoesDaRevisao.push([id, dados]))
  }

  async editarAprovacao(id: string, dados: DadosDaAprovacao): Promise<void> {
    await this.gravar(() => this.edicoesDaAprovacao.push([id, dados]))
  }

  private async gravar(guardar: () => void): Promise<void> {
    if (this.espera) await new Promise<never>(() => {})
    if (this.falha) throw this.falha
    guardar()
  }
}

const CORRIGIDA: RevisaoInterna = {
  id: 'r1', versaoRevisada: 7, versaoCorrigida: 8, resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei',
  revisor: 'Bia Teste', revisadaEm: '2026-10-13',
}
const SEM_ALTERACAO: RevisaoInterna = { ...CORRIGIDA, id: 'r2', versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null }
const APROVADA: Aprovacao = {
  id: 'ap1', versao: 8, numeroEprotocolo: null, link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-09',
  registradaPor: 'Bia Teste', registradaEm: '2026-10-12T15:00:00Z',
}

function abrirARevisao(revisao: RevisaoInterna, revisoes = new RevisoesQueGravam()) {
  const aoGravar = vi.fn()
  const aoFechar = vi.fn()
  render(<JanelaDaRevisao revisao={revisao} revisoes={revisoes} aoGravar={aoGravar} aoFechar={aoFechar} />)
  return { revisoes, aoGravar, aoFechar, janela: within(screen.getByRole('dialog', { name: 'Editar a revisão da V7' })) }
}

function abrirAAprovacao(revisoes = new RevisoesQueGravam()) {
  const aoGravar = vi.fn()
  const aoFechar = vi.fn()
  render(<JanelaDaAprovacao aprovacao={APROVADA} revisoes={revisoes} aoGravar={aoGravar} aoFechar={aoFechar} />)
  return { revisoes, aoGravar, aoFechar, janela: within(screen.getByRole('dialog', { name: 'Editar a aprovação da V8' })) }
}

const salvar = (janela: ReturnType<typeof within>) => fireEvent.click(janela.getByRole('button', { name: 'Salvar' }))

test('a revisão corrigida abre com o escopo e o comentário gravados; salvar manda o escopo novo e o comentário aparado', async () => {
  const { revisoes, aoGravar, aoFechar, janela } = abrirARevisao(CORRIGIDA)
  expect((janela.getByRole('radio', { name: 'Fluxograma e relatório' }) as HTMLInputElement).checked).toBe(true)
  expect((janela.getByLabelText('Comentário (opcional)') as HTMLTextAreaElement).value).toBe('Ajustei')
  fireEvent.click(janela.getByRole('radio', { name: 'Relatório' }))
  fireEvent.change(janela.getByLabelText('Comentário (opcional)'), { target: { value: '  Só o relatório  ' } })
  salvar(janela)
  await waitFor(() => expect(aoFechar).toHaveBeenCalled())
  expect(revisoes.edicoesDaRevisao).toEqual([['r1', { resultado: 'corrigida', escopo: 'relatorio', comentario: 'Só o relatório' }]])
  expect(aoGravar).toHaveBeenCalled()
})

test('a revisão sem alteração não tem escopo, e o comentário só com espaços vai como null', async () => {
  const { revisoes, aoFechar, janela } = abrirARevisao(SEM_ALTERACAO)
  expect(janela.queryByRole('radio')).toBeNull()
  fireEvent.change(janela.getByLabelText('Comentário (opcional)'), { target: { value: '   ' } })
  salvar(janela)
  await waitFor(() => expect(aoFechar).toHaveBeenCalled())
  expect(revisoes.edicoesDaRevisao).toEqual([['r2', { resultado: 'sem_alteracao', escopo: null, comentario: null }]])
})

test('a aprovação abre com o link e a data gravados e o número vazio; salvar acrescenta o número', async () => {
  const { revisoes, aoGravar, aoFechar, janela } = abrirAAprovacao()
  expect((janela.getByLabelText('Número do E-protocolo (opcional)') as HTMLInputElement).value).toBe('')
  expect((janela.getByLabelText('Link (opcional)') as HTMLInputElement).value).toBe('https://eprotocolo.example/a')
  expect((janela.getByLabelText('Data da aprovação (opcional)') as HTMLInputElement).value).toBe('2026-10-09')
  fireEvent.change(janela.getByLabelText('Número do E-protocolo (opcional)'), { target: { value: ' PROT-9 ' } })
  salvar(janela)
  await waitFor(() => expect(aoFechar).toHaveBeenCalled())
  expect(revisoes.edicoesDaAprovacao).toEqual([[
    'ap1', { numeroEprotocolo: 'PROT-9', link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-09' },
  ]])
  expect(aoGravar).toHaveBeenCalled()
})

test('a recusa aparece em vermelho, a janela fica aberta com o preenchido e nada é relido', async () => {
  const revisoes = new RevisoesQueGravam()
  revisoes.falha = new TravaDoBanco('O link do E-protocolo precisa começar com http:// ou https://.')
  const { aoGravar, aoFechar, janela } = abrirAAprovacao(revisoes)
  fireEvent.change(janela.getByLabelText('Link (opcional)'), { target: { value: 'ftp://x.example/a' } })
  salvar(janela)
  expect((await janela.findByRole('alert')).textContent).toBe('O link do E-protocolo precisa começar com http:// ou https://.')
  expect((janela.getByLabelText('Link (opcional)') as HTMLInputElement).value).toBe('ftp://x.example/a')
  expect(aoFechar).not.toHaveBeenCalled()
  expect(aoGravar).not.toHaveBeenCalled()
})

test('falha genérica da gravação vira a frase da alteração não salva', async () => {
  const revisoes = new RevisoesQueGravam()
  revisoes.falha = new Error('sem conexão')
  const { janela } = abrirARevisao(CORRIGIDA, revisoes)
  salvar(janela)
  expect((await janela.findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
})

test('enquanto grava, o botão mostra "Salvando…" e fica desabilitado', async () => {
  const revisoes = new RevisoesQueGravam()
  revisoes.espera = true
  const { janela } = abrirARevisao(CORRIGIDA, revisoes)
  salvar(janela)
  const botao = (await janela.findByRole('button', { name: 'Salvando…' })) as HTMLButtonElement
  expect(botao.disabled).toBe(true)
})

test('o registro que sumiu mostra a frase própria e a janela segue aberta', async () => {
  const revisoes = new RevisoesQueGravam()
  revisoes.falha = new CadastroInexistente()
  const { aoFechar, janela } = abrirAAprovacao(revisoes)
  salvar(janela)
  expect((await janela.findByRole('alert')).textContent).toBe('Este registro não existe mais. Feche a janela e confira a gaveta da etapa.')
  expect(aoFechar).not.toHaveBeenCalled()
})

test('Cancelar e Esc fecham sem gravar', () => {
  const { revisoes, aoFechar, janela } = abrirARevisao(CORRIGIDA)
  fireEvent.click(janela.getByRole('button', { name: 'Cancelar' }))
  expect(aoFechar).toHaveBeenCalledTimes(1)
  fireEvent(screen.getByRole('dialog'), new Event('close'))
  expect(aoFechar).toHaveBeenCalledTimes(2)
  expect(revisoes.edicoesDaRevisao).toEqual([])
})

test('na revisão da passagem aberta o resultado se troca; "corrigida" sem versão na passagem fica desabilitada', async () => {
  const revisoes = new RevisoesQueGravam()
  const ultima = { numero: 8, autorId: 'u1', autorNome: 'Ana', papeis: [], anterior: { numero: 7, autorId: 'u3' }, enviadaNestaPassagem: false }
  render(<JanelaDaRevisao revisao={{ ...SEM_ALTERACAO, daPassagemAberta: true }} ultimaVersao={ultima} revisoes={revisoes} aoGravar={vi.fn()} aoFechar={vi.fn()} />)
  const janela = within(screen.getByRole('dialog', { name: 'Editar a revisão da V7' }))
  expect((janela.getByRole('radio', { name: /^Corrigida/ }) as HTMLInputElement).disabled).toBe(true)
  expect((janela.getByRole('radio', { name: /^Sem alteração/ }) as HTMLInputElement).checked).toBe(true)
})

test('na revisão de uma passagem que passou o resultado não se troca', () => {
  abrirARevisao(CORRIGIDA)
  expect(screen.queryByRole('radio', { name: /^Sem alteração/ })).toBeNull()
})
