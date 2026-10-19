import { expect, test } from 'vitest'
import { type LinhaDoProcesso, processoDaLinha } from './processoDaLinha'

const VAZIA: LinhaDoProcesso = {
  id: 'p1', nome: 'Emitir Ofício Fictício', tipo: 'processo', setor_id: 's1', setor_sigla: 'TSA', macroprocesso_id: 'm1',
  macroprocesso_nome: 'Macro Fictício', processo_pai_id: null, situacao: 'em_andamento', situacao_guardada: 'em_andamento',
  etapa_atual_id: null, etapa_atual_codigo: null, etapa_atual_nome: null, etapa_atual_ordem: null,
  responsavel_id: null, responsavel_nome: null, responsavel_foto_url: null, data_da_reuniao: null,
  contexto: null, criado_em: null, motivo_da_situacao: null, observacoes: null, origem: 'novo',
  etapa_atual_status: null, etapa_atual_iniciada_em: null, responsavel_ativo: null, caminho: [],
  ultima_versao_numero: null, ultima_versao_historica: null, ultima_versao_tem_relatorio: null, subprocessos_quantidade: 0,
}

test('traduz os campos do cartão: etapa atual, responsável, caminho, última versão, subprocessos e reunião', () => {
  const processo = processoDaLinha({
    ...VAZIA, etapa_atual_codigo: 'revisao_interna', etapa_atual_nome: 'Revisão interna', etapa_atual_ordem: 3,
    etapa_atual_status: 'em_andamento', etapa_atual_iniciada_em: '2026-10-01', responsavel_id: 'u1',
    responsavel_nome: 'Ana Teste', responsavel_ativo: true, data_da_reuniao: '2026-10-25',
    caminho: [
      { etapa_id: 'e1', codigo: 'modelagem', status: 'concluida' },
      { etapa_id: 'e2', codigo: 'relatorio_modelagem_tecnica', status: 'dispensada' },
      { etapa_id: 'e3', codigo: 'revisao_interna', status: 'em_andamento' },
    ],
    ultima_versao_numero: 5, ultima_versao_historica: true, ultima_versao_tem_relatorio: false, subprocessos_quantidade: 2,
  })
  expect(processo.dataDaReuniao).toBe('2026-10-25')
  expect(processo.cartao).toEqual({
    etapaAtualStatus: 'em_andamento', etapaAtualIniciadaEm: '2026-10-01', responsavelAtivo: true,
    caminho: [
      { codigo: 'modelagem', status: 'concluida' },
      { codigo: 'relatorio_modelagem_tecnica', status: 'dispensada' },
      { codigo: 'revisao_interna', status: 'em_andamento' },
    ],
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

test('um caminho que não é uma lista (valor inesperado do banco) vira lista vazia, sem quebrar', () => {
  expect(processoDaLinha({ ...VAZIA, caminho: 'valor inesperado' }).cartao?.caminho).toEqual([])
  expect(processoDaLinha({ ...VAZIA, caminho: null }).cartao?.caminho).toEqual([])
})

test('sem o número da versão não há última versão, mesmo com as outras colunas preenchidas', () => {
  const processo = processoDaLinha({ ...VAZIA, ultima_versao_historica: false, ultima_versao_tem_relatorio: true })
  expect(processo.cartao?.ultimaVersao).toBeNull()
})
