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
  expect(processoDaLinha({ ...VAZIA, publicado_em: '2026-10-20' })).toMatchObject({ publicadoEm: '2026-10-20' })
  expect(processoDaLinha(VAZIA)).toMatchObject({ publicadoEm: null })
})

test('traduz a marca de arquivado', () => {
  expect(processoDaLinha({ ...VAZIA, arquivado_em: '2026-10-22T15:00:00+00:00' }))
    .toMatchObject({ arquivadoEm: '2026-10-22T15:00:00+00:00' })
  expect(processoDaLinha(VAZIA)).toMatchObject({ arquivadoEm: null })
})

// A view do Andamento livre não traz status por etapa nem caminho; o cartão fica com a entrada na etapa (só a data) até o
// ticket 25 refazê-lo.
test('traduz os campos do cartão: etapa atual, responsável, última versão, subprocessos e reunião', () => {
  const processo = processoDaLinha({
    ...VAZIA, etapa_atual_codigo: 'revisao_interna', etapa_atual_nome: 'Revisão interna', etapa_atual_ordem: 3,
    entrou_na_etapa_em: '2026-10-01T15:30:00+00:00', responsavel_id: 'u1',
    responsavel_nome: 'Ana Teste', responsavel_ativo: true, data_da_reuniao: '2026-10-25',
    ultima_versao_numero: 5, ultima_versao_historica: true, ultima_versao_tem_relatorio: false, subprocessos_quantidade: 2,
  })
  expect(processo.dataDaReuniao).toBe('2026-10-25')
  expect(processo.cartao).toEqual({
    etapaAtualStatus: null, etapaAtualIniciadaEm: '2026-10-01', responsavelAtivo: true, caminho: [],
    ultimaVersao: { numero: 5, historica: true, temRelatorio: false },
    subprocessos: 2,
  })
})

test('a linha vazia vira um cartão vazio: sem etapa atual, sem versão, sem responsável, zero subprocessos', () => {
  const processo = processoDaLinha(VAZIA)
  expect(processo.dataDaReuniao).toBeNull()
  expect(processo.cartao).toEqual({
    etapaAtualStatus: null, etapaAtualIniciadaEm: null, responsavelAtivo: null, caminho: [],
    ultimaVersao: null, subprocessos: 0,
  })
})

test('sem o número da versão não há última versão, mesmo com as outras colunas preenchidas', () => {
  const processo = processoDaLinha({ ...VAZIA, ultima_versao_historica: false, ultima_versao_tem_relatorio: true })
  expect(processo.cartao?.ultimaVersao).toBeNull()
})
