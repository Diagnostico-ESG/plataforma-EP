import { expect, test } from 'vitest'
import { atualizarSetorDoProcesso, mudarEtapaDoProcesso } from './andamentoFalso'
import type { EtapaDoProcesso, EtapaDoSetor, ProcessoLido } from './tipos'

function etapa(ordem: number, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo: `c${ordem}`, nome: `Etapa ${ordem}`, ordem, obrigatoria: true, status: 'pendente',
    nota: null, iniciadaEm: null, resolvidaEm: null, responsavelNome: null, ...mudancas,
  }
}

const PROCESSO: ProcessoLido = {
  id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
  macroprocessoNome: 'Macro', situacao: 'em_andamento', etapaAtual: { codigo: 'c4', nome: 'Etapa 4', ordem: 4 },
  aguardandoOSetor: false, responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null,
  etapasDoSetor: [], etapasDoProcesso: [etapa(4), etapa(5), etapa(9, { obrigatoria: false })],
}

test('concluir a etapa atual passa a atual para a seguinte', () => {
  const depois = mudarEtapaDoProcesso(PROCESSO, 'a4', { status: 'concluida' })
  expect(depois.etapaAtual).toEqual({ codigo: 'c5', nome: 'Etapa 5', ordem: 5 })
  expect(depois.situacao).toBe('em_andamento')
})

test('com as obrigatórias resolvidas o processo é concluído, mesmo com a opcional pendente', () => {
  const quase = mudarEtapaDoProcesso(PROCESSO, 'a4', { status: 'concluida' })
  const depois = mudarEtapaDoProcesso(quase, 'a5', { status: 'realizada_anteriormente' })
  expect(depois.situacao).toBe('concluido')
  expect(depois.etapaAtual?.codigo).toBe('c9')
})

test('etapa de outro processo não muda nada', () => {
  expect(mudarEtapaDoProcesso(PROCESSO, 'x', { status: 'concluida' })).toBe(PROCESSO)
})

test('o processo aguarda o setor enquanto uma etapa do setor está pendente ou em andamento', () => {
  const doSetor = (status: EtapaDoSetor['status']): EtapaDoSetor[] => [{
    id: 's1', codigo: 'c1', nome: 'Etapa do setor', ordem: 1, obrigatoria: true, status, nota: null,
    iniciadaEm: null, resolvidaEm: null,
  }]
  expect(atualizarSetorDoProcesso(PROCESSO, doSetor('em_andamento')).aguardandoOSetor).toBe(true)
  expect(atualizarSetorDoProcesso(PROCESSO, doSetor('concluida')).aguardandoOSetor).toBe(false)
})
