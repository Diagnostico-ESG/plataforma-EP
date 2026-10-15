import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ReunioesFalso } from './ReunioesFalso'
import type { DadosDaReuniao } from './tipos'

const DADOS: DadosDaReuniao = {
  tipo: 'modelagem', setorId: 's1', data: '2026-10-20', hora: null, local: 'Sala 1', anotacoes: null, processosIds: ['p1'],
  usuariosIds: [], responsaveisIds: [], outrosParticipantes: ['Ana'],
}

function falso(): ReunioesFalso {
  const reunioes = new ReunioesFalso()
  reunioes.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor A', ativo: true }]
  reunioes.processosDosSetores = { s1: [{ id: 'p1', nome: 'Emitir Ofício', cancelado: false }] }
  reunioes.usuarios = [
    { id: 'u2', nome: 'Caio Teste', ativo: false }, { id: 'u1', nome: 'Bia Teste', ativo: true },
  ]
  reunioes.responsaveisDosSetores = {
    s1: [{ id: 'x2', nome: 'Edu Teste' }, { id: 'x1', nome: 'Dani Teste' }], s2: [{ id: 'x3', nome: 'Olga Teste' }],
  }
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

describe('participantes', () => {
  test('a escolha de usuários traz só os ativos, e a de responsáveis, os do setor', async () => {
    const reunioes = falso()
    expect(await reunioes.listarUsuariosAtivos()).toEqual([{ id: 'u1', nome: 'Bia Teste', ativo: true }])
    expect((await reunioes.listarResponsaveisDoSetor('s1')).map((r) => r.nome)).toEqual(['Dani Teste', 'Edu Teste'])
    expect(await reunioes.listarResponsaveisDoSetor('s9')).toEqual([])
  })

  test('a leitura dos usuários e a dos responsáveis podem falhar ou ficar esperando, cada uma por si', async () => {
    const reunioes = falso()
    reunioes.falharUsuarios = true
    await expect(reunioes.listarUsuariosAtivos()).rejects.toThrow('falha de conexão simulada')
    expect(await reunioes.listarResponsaveisDoSetor('s1')).toHaveLength(2)
    reunioes.falharUsuarios = false
    reunioes.falharResponsaveis = true
    await expect(reunioes.listarResponsaveisDoSetor('s1')).rejects.toThrow('falha de conexão simulada')
    reunioes.falharResponsaveis = false
    reunioes.segurarResponsaveis = true
    expect(await Promise.race([reunioes.listarResponsaveisDoSetor('s1'), Promise.resolve('esperando')])).toBe('esperando')
    reunioes.segurarUsuarios = true
    expect(await Promise.race([reunioes.listarUsuariosAtivos(), Promise.resolve('esperando')])).toBe('esperando')
  })

  test('salvar guarda usuários (mesmo o inativo) e responsáveis por nome, e o evento os traz', async () => {
    const reunioes = falso()
    await reunioes.salvarReuniao(null, { ...DADOS, usuariosIds: ['u2', 'u1'], responsaveisIds: ['x2', 'x1'] })
    const salva = await reunioes.lerReuniao('r1')
    expect(salva?.usuarios).toEqual([{ id: 'u1', nome: 'Bia Teste', ativo: true }, { id: 'u2', nome: 'Caio Teste', ativo: false }])
    expect(salva?.responsaveis.map((r) => r.nome)).toEqual(['Dani Teste', 'Edu Teste'])
    expect(reunioes.historico[0].depois).toMatchObject({
      usuarios: [{ id: 'u1', nome: 'Bia Teste' }, { id: 'u2', nome: 'Caio Teste' }],
      responsaveis: [{ id: 'x1', nome: 'Dani Teste' }, { id: 'x2', nome: 'Edu Teste' }],
    })
  })

  test('responsável de outro setor e outro participante longo demais são recusados como o banco os recusa', async () => {
    const reunioes = falso()
    const fora = reunioes.salvarReuniao(null, { ...DADOS, responsaveisIds: ['x3'] })
    await expect(fora).rejects.toThrow('O responsável Olga Teste não é do setor da reunião.')
    const longo = reunioes.salvarReuniao(null, { ...DADOS, outrosParticipantes: ['x'.repeat(201)] })
    await expect(longo).rejects.toThrow('Cada outro participante pode ter no máximo 200 caracteres. Recebido: 201.')
    expect(reunioes.historico).toEqual([])
  })

  test('excluir o responsável o tira das reuniões e acrescenta o nome aos outros participantes, com um evento por reunião', async () => {
    const reunioes = falso()
    await reunioes.salvarReuniao(null, { ...DADOS, responsaveisIds: ['x1', 'x2'] })
    await reunioes.salvarReuniao(null, { ...DADOS, responsaveisIds: ['x1'], outrosParticipantes: ['Dani Teste'] })
    reunioes.excluirResponsavelDoSetor('x1')
    const [primeira, segunda] = await reunioes.listarReunioes()
    expect(primeira.responsaveis.map((r) => r.nome)).toEqual(['Edu Teste'])
    expect(primeira.outrosParticipantes).toEqual(['Ana', 'Dani Teste'])
    expect(segunda.responsaveis).toEqual([])
    expect(segunda.outrosParticipantes).toEqual(['Dani Teste'])
    expect((await reunioes.listarResponsaveisDoSetor('s1')).map((r) => r.nome)).toEqual(['Edu Teste'])
    expect(reunioes.historico.map((evento) => evento.acao)).toEqual(['criar', 'criar', 'editar', 'editar'])
    expect(reunioes.historico.slice(2).map((evento) => evento.entidadeRef)).toEqual(['r1', 'r2'])
  })

  test('excluir o responsável que não está em nenhuma reunião não acrescenta evento', async () => {
    const reunioes = falso()
    await reunioes.salvarReuniao(null, DADOS)
    reunioes.excluirResponsavelDoSetor('x1')
    expect(reunioes.historico.map((evento) => evento.acao)).toEqual(['criar'])
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
