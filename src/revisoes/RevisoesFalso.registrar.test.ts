import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import type { EtapaDoVerso, ProcessoLido } from '../processos/tipos'
import { CATALOGO_DE_TESTE, umProcessoLido } from '../testes/processoDaLista'
import { RevisoesFalso } from './RevisoesFalso'

const EU = { id: 'u2', nome: 'Bia Teste' }
const passagensDe = (quantas: number) => Array.from({ length: quantas }, () => ({ entrouEm: '2026-10-10', saiuEm: null }))
const REVISAO_INTERNA = (passagens: number): EtapaDoVerso => ({
  id: 'e4', codigo: 'revisao_interna', nome: 'Revisão do fluxograma', ordem: 4, passagens: passagensDe(passagens),
})
const REVISAO_DO_RELATORIO = (passagens: number): EtapaDoVerso => ({
  id: 'e4r', codigo: 'revisao_relatorio', nome: 'Revisão do relatório', ordem: 4.5, passagens: passagensDe(passagens),
})
const NA_PASSAGEM = { numero: 8, autorId: 'u1', autorNome: 'Ana', papeis: [], anterior: { numero: 7, autorId: 'u3' }, enviadaNestaPassagem: true }
const R2 = { numero: 2, autorId: 'u4', autorNome: 'Dani', anterior: { numero: 1, autorId: 'u5' }, enviadoNestaPassagem: true }
const SEM_ALTERACAO = { resultado: 'sem_alteracao', comentario: null } as const

function montar(mudancas: Partial<ProcessoLido> = {}, etapa = 'revisao_interna') {
  const processos = new ProcessosFalso()
  processos.etapasDoCatalogo = CATALOGO_DE_TESTE
  processos.processos = [umProcessoLido('Emitir Ofício', { id: 'p1', etapasDoVerso: [REVISAO_INTERNA(1)], ultimaVersao: NA_PASSAGEM, ...mudancas }, etapa)]
  return { processos, revisoes: new RevisoesFalso(processos, EU) }
}

async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

test('registra "sem alteração" na versão mais recente, marca a passagem aberta e põe o evento no histórico', async () => {
  const { processos, revisoes } = montar()
  await revisoes.registrarRevisao('p1', { ...SEM_ALTERACAO, comentario: 'Ok' })
  expect(await revisoes.listarRevisoes('p1')).toEqual([expect.objectContaining({
    versaoRevisada: 8, versaoCorrigida: null, resultado: 'sem_alteracao', revisor: 'Bia Teste', daPassagemAberta: true,
  })])
  const [evento] = await processos.lerHistoricoDoProcesso('p1')
  expect(evento).toMatchObject({ acao: 'registrar', entidade: 'revisao_interna', antes: null })
})

test('"corrigida" liga a versão enviada na passagem à anterior, com o escopo deduzido', async () => {
  const { revisoes } = montar()
  await revisoes.registrarRevisao('p1', { resultado: 'corrigida', comentario: null })
  expect((await revisoes.listarRevisoes('p1'))[0]).toMatchObject({ versaoRevisada: 7, versaoCorrigida: 8, escopo: 'fluxograma', etapa: 'revisao_interna' })
})

test('"corrigida" sem nada enviado na passagem é recusada com a frase do banco', async () => {
  const { revisoes } = montar({ ultimaVersao: { ...NA_PASSAGEM, enviadaNestaPassagem: false } })
  const falha = await falhaDe(revisoes.registrarRevisao('p1', { resultado: 'corrigida', comentario: null }))
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe("Para 'corrigida', envie a versão ou o relatório corrigido com o processo nesta etapa.")
})

// Na Revisão do relatório (ADR 0046), o relatório mais recente é o que se revisa.
const noRelatorio = (mudancas: Partial<ProcessoLido> = {}) =>
  montar({ etapasDoVerso: [REVISAO_DO_RELATORIO(1)], ultimaVersao: { ...NA_PASSAGEM, enviadaNestaPassagem: false }, ultimoRelatorio: R2, ...mudancas },
    'revisao_relatorio')

test('na Revisão do relatório, "sem alteração" vale para o relatório mais recente e para a versão dele', async () => {
  const { revisoes } = noRelatorio()
  await revisoes.registrarRevisao('p1', SEM_ALTERACAO)
  expect((await revisoes.listarRevisoes('p1'))[0]).toMatchObject({
    etapa: 'revisao_relatorio', relatorioRevisado: 2, relatorioCorrigido: null, versaoRevisada: 8, escopo: null, daPassagemAberta: true,
  })
})

test('na Revisão do relatório, "corrigida" com só o relatório liga o Relatório V2 ao V1, com o escopo relatório', async () => {
  const { revisoes } = noRelatorio()
  await revisoes.registrarRevisao('p1', { resultado: 'corrigida', comentario: null })
  expect((await revisoes.listarRevisoes('p1'))[0]).toMatchObject({
    relatorioRevisado: 1, relatorioCorrigido: 2, versaoRevisada: 8, versaoCorrigida: null, escopo: 'relatorio',
  })
})

test('na Revisão do relatório, sem relatório numerado a revisão é recusada', async () => {
  const { revisoes } = noRelatorio({ ultimoRelatorio: null })
  expect((await falhaDe(revisoes.registrarRevisao('p1', SEM_ALTERACAO))).message).toBe('O processo ainda não tem relatório para revisar.')
})

test('recusa fora das duas revisões, sem versão e a segunda revisão da passagem', async () => {
  const fora = montar({}, 'aprovacao_setor')
  expect((await falhaDe(fora.revisoes.registrarRevisao('p1', SEM_ALTERACAO))).message)
    .toBe('Registre a revisão com o processo na Revisão do fluxograma ou na Revisão do relatório.')
  const semVersao = montar({ ultimaVersao: null })
  expect((await falhaDe(semVersao.revisoes.registrarRevisao('p1', SEM_ALTERACAO))).message).toBe('O processo ainda não tem versão.')
  const { revisoes } = montar()
  await revisoes.registrarRevisao('p1', SEM_ALTERACAO)
  expect((await falhaDe(revisoes.registrarRevisao('p1', SEM_ALTERACAO))).message)
    .toBe('Já há uma revisão registrada nesta passagem; edite-a.')
})

test('sair da Revisão do fluxograma e voltar abre a passagem para uma revisão nova, sem apagar a anterior', async () => {
  const { processos, revisoes } = montar()
  await revisoes.registrarRevisao('p1', SEM_ALTERACAO)
  processos.processos = processos.processos.map((p) => ({ ...p, etapasDoVerso: [REVISAO_INTERNA(2)] }))
  expect((await revisoes.listarRevisoes('p1'))[0].daPassagemAberta).toBe(false)
  await revisoes.registrarRevisao('p1', SEM_ALTERACAO)
  expect((await revisoes.listarRevisoes('p1')).map((r) => r.daPassagemAberta)).toEqual([true, false])
})

test('a edição troca o resultado e recalcula as versões', async () => {
  const { revisoes } = montar()
  await revisoes.registrarRevisao('p1', SEM_ALTERACAO)
  const [registrada] = await revisoes.listarRevisoes('p1')
  await revisoes.editarRevisao(registrada.id, { resultado: 'corrigida', comentario: null })
  expect((await revisoes.listarRevisoes('p1'))[0]).toMatchObject({ resultado: 'corrigida', versaoRevisada: 7, versaoCorrigida: 8, escopo: 'fluxograma' })
})

test('registrar a aprovação grava a versão mais recente; a segunda toma o lugar e vira o evento "substituir"', async () => {
  const { processos, revisoes } = montar({}, 'aprovacao_setor')
  await revisoes.registrarAprovacao('p1', { numeroEprotocolo: 'PROT-1', link: null, aprovadaEm: null })
  expect(await revisoes.lerAprovacao('p1')).toMatchObject({ versao: 8, numeroEprotocolo: 'PROT-1', registradaPor: 'Bia Teste' })
  processos.processos = processos.processos.map((p) => ({ ...p, ultimaVersao: { ...NA_PASSAGEM, numero: 9 } }))
  await revisoes.registrarAprovacao('p1', { numeroEprotocolo: 'PROT-2', link: 'https://e.example/a', aprovadaEm: null })
  expect(await revisoes.lerAprovacao('p1')).toMatchObject({ versao: 9, numeroEprotocolo: 'PROT-2' })
  const [substituiu, registrou] = await processos.lerHistoricoDoProcesso('p1')
  expect(registrou).toMatchObject({ acao: 'registrar', antes: null })
  expect(substituiu).toMatchObject({ acao: 'substituir', antes: { versao: 'V8', numero_eprotocolo: 'PROT-1' }, depois: { versao: 'V9' } })
})

test('a aprovação recusa fora da etapa, sem versão, link inválido e data no futuro', async () => {
  const dados = { numeroEprotocolo: null, link: null, aprovadaEm: null }
  const fora = montar()
  expect((await falhaDe(fora.revisoes.registrarAprovacao('p1', dados))).message).toBe('Registre a aprovação com o processo na Aprovação pelo setor.')
  const semVersao = montar({ ultimaVersao: null }, 'aprovacao_setor')
  expect((await falhaDe(semVersao.revisoes.registrarAprovacao('p1', dados))).message).toBe('O processo ainda não tem versão.')
  const { revisoes } = montar({}, 'aprovacao_setor')
  expect((await falhaDe(revisoes.registrarAprovacao('p1', { ...dados, link: 'ftp://x' }))).message)
    .toBe('O link do E-protocolo precisa começar com http:// ou https://.')
  expect((await falhaDe(revisoes.registrarAprovacao('p1', { ...dados, aprovadaEm: '2026-12-01' }))).message).toBe('A data 01/12/2026 está no futuro.')
})
