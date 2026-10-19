import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { hojeLocal } from './processos/textoDaReuniao'
import type { DadosDoCartao, EtapaDoCatalogo, ProcessoLido, StatusDaEtapa } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ETAPAS: EtapaDoCatalogo[] = [
  { id: 'e1', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 1, ativa: true },
  { id: 'e2', codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', ordem: 2, ativa: true },
  { id: 'e3', codigo: 'revisao_interna', nome: 'Revisão interna', ordem: 3, ativa: true },
  { id: 'e4', codigo: 'revisao_do_setor', nome: 'Revisão do setor', ordem: 4, ativa: true },
  { id: 'e5', codigo: 'aprovacao', nome: 'Aprovação', ordem: 5, ativa: true },
  { id: 'e6', codigo: 'eprotocolo', nome: 'E-protocolo', ordem: 6, ativa: true },
]

/** O dia de hoje deslocado em dias (AAAA-MM-DD), para os testes não dependerem da data em que rodam. */
function dia(deslocamento: number): string {
  const data = new Date()
  data.setDate(data.getDate() + deslocamento)
  return hojeLocal(data)
}

type Mudancas = {
  /** A posição (1 a 6) da etapa atual; as anteriores ficam concluídas e as seguintes pendentes. */
  posicao?: number
  anteriores?: StatusDaEtapa
  cartao?: Partial<DadosDoCartao>
  processo?: Partial<ProcessoLido>
}

let contador = 0

function processo(nome: string, { posicao = 3, anteriores = 'concluida', cartao = {}, processo: mudancas = {} }: Mudancas = {}): ProcessoLido {
  const atual = ETAPAS[posicao - 1]
  contador += 1
  return {
    id: `p${contador}`, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: atual.codigo, nome: atual.nome, ordem: atual.ordem },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: null },
    origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao: null,
    etapasDoProcesso: [],
    cartao: {
      etapaAtualStatus: 'em_andamento', etapaAtualIniciadaEm: dia(0), responsavelAtivo: true,
      caminho: ETAPAS.map((etapa, indice) => ({
        codigo: etapa.codigo, status: indice < posicao - 1 ? anteriores : indice === posicao - 1 ? 'em_andamento' : 'pendente',
      })),
      ultimaVersao: null, subprocessos: 0, ...cartao,
    },
    ...mudancas,
  }
}

function montar(processos: ProcessoLido[], perfil: Perfil = 'integrante_ep') {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = ETAPAS
  falso.processos = processos
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} />)
}

/** O cartão do processo pelo nome, depois que o Quadro carregou. */
async function cartaoDe(nome: string): Promise<HTMLElement> {
  const nomeNoCartao = await screen.findByText(nome, { selector: '.cartao-nome' })
  return nomeNoCartao.closest('a') as HTMLElement
}

const selos = (cartao: HTMLElement) => Array.from(cartao.querySelectorAll('.cartao-selos > *')).map((selo) => selo.textContent)

const SEM_RELATORIO = { ultimaVersao: { numero: 3, historica: false, temRelatorio: false } }

test('a barra tem um pedaço por etapa, com o nome acessível e dispensada e realizada anteriormente como resolvidas', async () => {
  const caminho = ETAPAS.map((etapa, indice) => ({
    codigo: etapa.codigo,
    status: (['concluida', 'dispensada', 'realizada_anteriormente', 'em_andamento'][indice] ?? 'pendente') as StatusDaEtapa,
  }))
  montar([processo('Emitir Ofício', { posicao: 4, cartao: { caminho } })])
  const cartao = await cartaoDe('Emitir Ofício')
  const barra = cartao.querySelector('[role="img"]')
  expect(barra?.getAttribute('aria-label')).toBe('Etapa 4 de 6: Revisão do setor')
  expect(Array.from(barra?.children ?? []).map((pedaco) => pedaco.className.replace('pedaco pedaco-', ''))).toEqual([
    'resolvida', 'resolvida', 'resolvida', 'atual', 'seguinte', 'seguinte',
  ])
})

test('o processo suspenso também tem barra, com a pílula Suspenso', async () => {
  montar([processo('Suspenso Teste', { processo: { situacao: 'suspenso' } })])
  const cartao = await cartaoDe('Suspenso Teste')
  expect(cartao.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Etapa 3 de 6: Revisão interna')
  expect(cartao.textContent).toContain('Suspenso')
})

test('dias na etapa: sem selo com 15 dias, "16 dias nesta etapa" com 16; nunca no suspenso nem na etapa pendente', async () => {
  montar([
    processo('Quinze Dias', { cartao: { etapaAtualIniciadaEm: dia(-15) } }),
    processo('Dezesseis Dias', { cartao: { etapaAtualIniciadaEm: dia(-16) } }),
    processo('Suspenso Antigo', { cartao: { etapaAtualIniciadaEm: dia(-40) }, processo: { situacao: 'suspenso' } }),
    processo('Pendente Antigo', { cartao: { etapaAtualStatus: 'pendente', etapaAtualIniciadaEm: dia(-40) } }),
  ])
  expect(selos(await cartaoDe('Quinze Dias'))).toEqual([])
  expect(selos(await cartaoDe('Dezesseis Dias'))).toEqual(['16 dias nesta etapa'])
  expect(selos(await cartaoDe('Suspenso Antigo'))).toEqual([])
  expect(selos(await cartaoDe('Pendente Antigo'))).toEqual([])
})

test('Relatório pendente: ausente na etapa do relatório, presente da Revisão interna em diante, ausente com relatório e na versão histórica', async () => {
  montar([
    processo('Antes da Revisão', { posicao: 2, cartao: SEM_RELATORIO }),
    processo('Na Revisão', { posicao: 3, cartao: SEM_RELATORIO }),
    processo('Com Relatório', { posicao: 3, cartao: { ultimaVersao: { numero: 3, historica: false, temRelatorio: true } } }),
    processo('Versão Histórica', { posicao: 3, cartao: { ultimaVersao: { numero: 5, historica: true, temRelatorio: false } } }),
  ])
  expect(selos(await cartaoDe('Antes da Revisão'))).toEqual(['V3'])
  expect(selos(await cartaoDe('Na Revisão'))).toEqual(['Relatório pendente', 'V3'])
  expect(selos(await cartaoDe('Com Relatório'))).toEqual(['V3'])
  expect(selos(await cartaoDe('Versão Histórica'))).toEqual(['V5F'])
})

test('Sem responsável aparece só sem responsável', async () => {
  montar([processo('Sem Dono', { processo: { responsavel: null } }), processo('Com Dono')])
  expect(selos(await cartaoDe('Sem Dono'))).toEqual(['Sem responsável'])
  expect(selos(await cartaoDe('Com Dono'))).toEqual([])
})

test('Reunião: hoje, futura com dia e mês, e nada depois que passou', async () => {
  const futura = dia(6)
  const [, mes, diaDoMes] = futura.split('-')
  montar([
    processo('Reunião Hoje', { processo: { dataDaReuniao: dia(0) } }),
    processo('Reunião Futura', { processo: { dataDaReuniao: futura } }),
    processo('Reunião Passada', { processo: { dataDaReuniao: dia(-1) } }),
  ])
  expect(selos(await cartaoDe('Reunião Hoje'))).toEqual(['Reunião hoje'])
  expect(selos(await cartaoDe('Reunião Futura'))).toEqual([`Reunião ${diaDoMes}/${mes}`])
  expect(selos(await cartaoDe('Reunião Passada'))).toEqual([])
})

test('versão: V3 e V5F em texto neutro, e nada sem versão', async () => {
  montar([
    processo('Versão Normal', { cartao: { ultimaVersao: { numero: 3, historica: false, temRelatorio: true } } }),
    processo('Versão Histórica', { cartao: { ultimaVersao: { numero: 5, historica: true, temRelatorio: false } } }),
    processo('Sem Versão'),
  ])
  expect(selos(await cartaoDe('Versão Normal'))).toEqual(['V3'])
  expect(selos(await cartaoDe('Versão Histórica'))).toEqual(['V5F'])
  expect(selos(await cartaoDe('Sem Versão'))).toEqual([])
})

test('subprocessos no singular e no plural, sem contar os cancelados (a view já os tira da contagem)', async () => {
  montar([processo('Pai Um', { cartao: { subprocessos: 1 } }), processo('Pai Três', { cartao: { subprocessos: 3 } }), processo('Pai Zero')])
  expect(selos(await cartaoDe('Pai Um'))).toEqual(['1 subprocesso'])
  expect(selos(await cartaoDe('Pai Três'))).toEqual(['3 subprocessos'])
  expect(selos(await cartaoDe('Pai Zero'))).toEqual([])
})

test('a ordem dos selos: dias, Relatório pendente, Sem responsável, Reunião, versão e subprocessos', async () => {
  montar([processo('Tudo Junto', {
    cartao: { etapaAtualIniciadaEm: dia(-20), ...SEM_RELATORIO, subprocessos: 2 },
    processo: { responsavel: null, dataDaReuniao: dia(0) },
  })])
  expect(selos(await cartaoDe('Tudo Junto'))).toEqual([
    '20 dias nesta etapa', 'Relatório pendente', 'Sem responsável', 'Reunião hoje', 'V3', '2 subprocessos',
  ])
})

test('o cartão normal fica limpo: sem selos', async () => {
  montar([processo('Cartão Normal')])
  const cartao = await cartaoDe('Cartão Normal')
  expect(cartao.querySelector('.cartao-selos')).toBeNull()
  expect(cartao.querySelector('[role="img"]')).not.toBeNull()
})

test('a Consulta vê a mesma barra e os mesmos selos', async () => {
  montar([processo('Para a Consulta', { cartao: { etapaAtualIniciadaEm: dia(-16), ...SEM_RELATORIO } })], 'consulta')
  const cartao = await cartaoDe('Para a Consulta')
  expect(cartao.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Etapa 3 de 6: Revisão interna')
  expect(selos(cartao)).toEqual(['16 dias nesta etapa', 'Relatório pendente', 'V3'])
})
