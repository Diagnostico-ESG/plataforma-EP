import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ReunioesFalso } from './ReunioesFalso'
import type { DadosDaReuniao } from './tipos'

const DADOS: DadosDaReuniao = {
  tipo: 'modelagem', setorId: 's1', data: '2026-10-20', hora: null, local: 'Sala 1', anotacoes: null, processosIds: ['p1'],
  outrosParticipantes: ['Ana'],
}

function falso(): ReunioesFalso {
  const reunioes = new ReunioesFalso()
  reunioes.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor A', ativo: true }]
  reunioes.processosDosSetores = { s1: [{ id: 'p1', nome: 'Emitir Ofício', cancelado: false }] }
  return reunioes
}

describe('eventos que o falso imita do banco', () => {
  test('criar, alterar e excluir acrescentam um evento cada, com o estado completo', async () => {
    const reunioes = falso()
    await reunioes.salvarReuniao(null, DADOS)
    await reunioes.salvarReuniao('r1', { ...DADOS, local: 'Sala 2' })
    await reunioes.excluirReuniao('r1')
    expect(reunioes.historico.map((evento) => evento.acao)).toEqual(['criar', 'editar', 'excluir'])
    const [criou, editou, excluiu] = reunioes.historico
    expect(criou.antes).toBeNull()
    expect(criou.depois).toMatchObject({ setor_sigla: 'TSA', local: 'Sala 1', processos: [{ id: 'p1', nome: 'Emitir Ofício' }] })
    expect(editou.antes).toMatchObject({ local: 'Sala 1' })
    expect(editou.depois).toMatchObject({ local: 'Sala 2' })
    expect(excluiu.antes).toMatchObject({ local: 'Sala 2' })
    expect(excluiu.depois).toBeNull()
    expect(excluiu.entidadeRef).toBe('r1')
  })

  test('salvar sem mudar nada não acrescenta evento', async () => {
    const reunioes = falso()
    await reunioes.salvarReuniao(null, DADOS)
    await reunioes.salvarReuniao('r1', DADOS)
    expect(reunioes.historico.map((evento) => evento.acao)).toEqual(['criar'])
  })

  test('gravação recusada não acrescenta evento', async () => {
    const reunioes = falso()
    await expect(reunioes.salvarReuniao(null, { ...DADOS, processosIds: [] })).rejects.toBeInstanceOf(TravaDoBanco)
    expect(reunioes.historico).toEqual([])
  })

  test('o histórico da reunião traz só os eventos dela, do mais recente para o mais antigo', async () => {
    const reunioes = falso()
    await reunioes.salvarReuniao(null, DADOS)
    await reunioes.salvarReuniao(null, { ...DADOS, data: '2026-11-01' })
    await reunioes.salvarReuniao('r1', { ...DADOS, local: 'Sala 2' })
    expect((await reunioes.lerHistoricoDaReuniao('r1')).map((evento) => evento.acao)).toEqual(['editar', 'criar'])
    expect((await reunioes.lerHistoricoDaReuniao('r2')).map((evento) => evento.acao)).toEqual(['criar'])
  })

  test('a leitura do histórico pode falhar ou ficar esperando', async () => {
    const reunioes = falso()
    reunioes.falharHistoricoDaReuniao = true
    await expect(reunioes.lerHistoricoDaReuniao('r1')).rejects.toThrow('falha de conexão simulada')
    reunioes.falharHistoricoDaReuniao = false
    reunioes.segurarHistoricoDaReuniao = true
    const resposta = await Promise.race([reunioes.lerHistoricoDaReuniao('r1'), Promise.resolve('esperando')])
    expect(resposta).toBe('esperando')
  })
})

describe('excluir e alterar o que não existe', () => {
  test('excluir tira a reunião da lista', async () => {
    const reunioes = falso()
    await reunioes.salvarReuniao(null, DADOS)
    await reunioes.excluirReuniao('r1')
    expect(await reunioes.listarReunioes()).toEqual([])
  })

  test('excluir ou alterar reunião que não existe mais é CadastroInexistente', async () => {
    const reunioes = falso()
    await expect(reunioes.excluirReuniao('r9')).rejects.toBeInstanceOf(CadastroInexistente)
    await expect(reunioes.salvarReuniao('r9', DADOS)).rejects.toBeInstanceOf(CadastroInexistente)
  })

  test('a falha de gravação configurada vale também para excluir', async () => {
    const reunioes = falso()
    await reunioes.salvarReuniao(null, DADOS)
    reunioes.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar as reuniões.')
    await expect(reunioes.excluirReuniao('r1')).rejects.toBeInstanceOf(TravaDoBanco)
    expect(await reunioes.listarReunioes()).toHaveLength(1)
  })

  test('os outros participantes seguem como estavam ao alterar', async () => {
    const reunioes = falso()
    await reunioes.salvarReuniao(null, DADOS)
    await reunioes.salvarReuniao('r1', { ...DADOS, local: 'Sala 2' })
    expect((await reunioes.lerReuniao('r1'))?.outrosParticipantes).toEqual(['Ana'])
  })
})
