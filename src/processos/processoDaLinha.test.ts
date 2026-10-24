import { expect, test } from 'vitest'
import { type LinhaDoProcesso, processoDaLinha } from './processoDaLinha'

const VAZIA: LinhaDoProcesso = {
  id: 'p1', nome: 'Emitir Ofício Fictício', tipo: 'processo', setor_id: 's1', setor_sigla: 'TSA', macroprocesso_id: 'm1',
  macroprocesso_nome: 'Macro Fictício', processo_pai_id: null, situacao: 'em_andamento', situacao_guardada: 'em_andamento',
  etapa_atual_id: null, etapa_atual_codigo: null, etapa_atual_nome: null, etapa_atual_ordem: null,
  responsavel_id: null, responsavel_nome: null, responsavel_foto_url: null, data_da_reuniao: null,
  contexto: null, criado_em: null, motivo_da_situacao: null, observacoes: null, origem: 'novo',
  responsavel_ativo: null, etiqueta: null, entrou_na_etapa_em: null, etapa_atual_posicao: null,
  ultima_versao_numero: null, ultima_versao_historica: null, ultima_versao_tem_relatorio: null, subprocessos_quantidade: 0,
  publicado_em: null, link_da_publicacao: null, sem_publicacao: null, arquivado_em: null,
}

test('traduz a data da publicação', () => {
  expect(processoDaLinha({ ...VAZIA, publicado_em: '2026-10-20' }, 8)).toMatchObject({ publicadoEm: '2026-10-20' })
  expect(processoDaLinha(VAZIA, 8)).toMatchObject({ publicadoEm: null })
})

test('traduz a marca de arquivado', () => {
  expect(processoDaLinha({ ...VAZIA, arquivado_em: '2026-10-22T15:00:00+00:00' }, 8))
    .toMatchObject({ arquivadoEm: '2026-10-22T15:00:00+00:00' })
  expect(processoDaLinha(VAZIA, 8)).toMatchObject({ arquivadoEm: null })
})

test('traduz a etapa atual com a posição e o total, a etiqueta e o responsável do processo', () => {
  const processo = processoDaLinha({
    ...VAZIA, etapa_atual_id: 'e4', etapa_atual_codigo: 'revisao_interna', etapa_atual_nome: 'Revisão interna', etapa_atual_ordem: 4,
    etapa_atual_posicao: 4, etiqueta: 'em_andamento', responsavel_id: 'u1', responsavel_nome: 'Ana Teste', responsavel_foto_url: 'https://f/a',
  }, 8)
  expect(processo).toMatchObject({
    etapaAtual: { id: 'e4', codigo: 'revisao_interna', nome: 'Revisão interna', ordem: 4, posicao: 4, total: 8 },
    etiqueta: 'em_andamento', responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: 'https://f/a' },
  })
})

test('a entrada na etapa vira o dia de Brasília: 02h UTC ainda é o dia anterior', () => {
  expect(processoDaLinha({ ...VAZIA, entrou_na_etapa_em: '2026-10-02T02:00:00+00:00' }, 8).entrouNaEtapaEm).toBe('2026-10-01')
  expect(processoDaLinha({ ...VAZIA, entrou_na_etapa_em: '2026-10-02T15:30:00+00:00' }, 8).entrouNaEtapaEm).toBe('2026-10-02')
  expect(processoDaLinha(VAZIA, 8).entrouNaEtapaEm).toBeNull()
})

test('sem etiqueta na linha, o processo fica em A fazer', () => {
  expect(processoDaLinha(VAZIA, 8).etiqueta).toBe('a_fazer')
})

test('traduz os campos do cartão: responsável ativo, última versão, subprocessos e reunião', () => {
  const processo = processoDaLinha({
    ...VAZIA, responsavel_id: 'u1', responsavel_nome: 'Ana Teste', responsavel_ativo: true, data_da_reuniao: '2026-10-25',
    ultima_versao_numero: 5, ultima_versao_historica: true, ultima_versao_tem_relatorio: false, subprocessos_quantidade: 2,
  }, 8)
  expect(processo.dataDaReuniao).toBe('2026-10-25')
  expect(processo.cartao).toEqual({
    responsavelAtivo: true, ultimaVersao: { numero: 5, historica: true, temRelatorio: false }, subprocessos: 2,
  })
})

test('a linha vazia vira um cartão vazio: sem etapa atual, sem versão, sem responsável, zero subprocessos', () => {
  const processo = processoDaLinha(VAZIA, 8)
  expect(processo.etapaAtual).toBeNull()
  expect(processo.dataDaReuniao).toBeNull()
  expect(processo.cartao).toEqual({ responsavelAtivo: null, ultimaVersao: null, subprocessos: 0 })
})

test('sem o número da versão não há última versão, mesmo com as outras colunas preenchidas', () => {
  const processo = processoDaLinha({ ...VAZIA, ultima_versao_historica: false, ultima_versao_tem_relatorio: true }, 8)
  expect(processo.cartao?.ultimaVersao).toBeNull()
})
