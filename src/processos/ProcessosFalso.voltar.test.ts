import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ProcessosFalso } from './ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido } from './tipos'

function doProcesso(ordem: number, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo: `c${ordem}`, nome: `Etapa ${ordem}`, ordem, obrigatoria: true, status: 'pendente',
    nota: null, iniciadaEm: null, resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false,
    ...mudancas,
  }
}

function falso(): ProcessosFalso {
  const processo: ProcessoLido = {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 'set1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', situacao: 'em_andamento', etapaAtual: { codigo: 'c6', nome: 'Etapa 6', ordem: 6 },
    processoPaiId: null, processoPai: null, subprocessos: [],
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null,
    dataDaReuniao: null,
    etapasDoProcesso: [
      doProcesso(4, { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11' }),
      doProcesso(5, { status: 'concluida', iniciadaEm: '2026-10-11', resolvidaEm: '2026-10-12' }),
      doProcesso(6, { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
    ],
  }
  const modulo = new ProcessosFalso()
  modulo.processos = [processo]
  modulo.usuariosPossiveis = [{ id: 'u1', nome: 'Ana Teste' }, { id: 'u2', nome: 'Bia Teste' }]
  return modulo
}

const doBanco = async (modulo: ProcessosFalso) => (await modulo.lerProcesso('p1')) as ProcessoLido

describe('voltar', () => {
  test('a escolhida volta a em andamento e as seguintes, inclusive a em andamento, a pendente', async () => {
    const modulo = falso()
    await modulo.voltarParaEtapa('a4', 'Mudou o escopo')
    const lido = await doBanco(modulo)
    expect(lido.etapasDoProcesso.map((etapa) => etapa.status)).toEqual(['em_andamento', 'pendente', 'pendente'])
    expect(lido.etapaAtual?.codigo).toBe('c4')
    expect(modulo.chamadas).toEqual([{ acao: 'voltar', id: 'a4', nota: 'Mudou o escopo' }])
  })

  test('sem motivo é recusado com a frase da tela', async () => {
    const falha = await falso().voltarParaEtapa('a4', '  ').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('O motivo é obrigatório.')
  })

  test('etapa que ainda não foi resolvida é recusada', async () => {
    await expect(falso().voltarParaEtapa('a6', 'Motivo')).rejects.toThrow('A etapa Etapa 6 ainda não foi resolvida.')
  })

  test('etapa que não existe avisa como cadastro inexistente', async () => {
    await expect(falso().voltarParaEtapa('x', 'Motivo')).rejects.toBeInstanceOf(CadastroInexistente)
  })

  test('falha de gravação programada aparece e nada muda', async () => {
    const modulo = falso()
    modulo.falhaDeGravacao = 'falha de conexão simulada'
    await expect(modulo.voltarParaEtapa('a4', 'Motivo')).rejects.toThrow('falha de conexão simulada')
    expect((await doBanco(modulo)).etapasDoProcesso[0].status).toBe('concluida')
  })
})

describe('datas', () => {
  test('grava início e conclusão da etapa', async () => {
    const modulo = falso()
    await modulo.corrigirDatasDaEtapa('a4', { iniciadaEm: '2026-10-08', resolvidaEm: '2026-10-09' })
    expect((await doBanco(modulo)).etapasDoProcesso[0]).toMatchObject({ iniciadaEm: '2026-10-08', resolvidaEm: '2026-10-09' })
    expect(modulo.chamadas[0]).toMatchObject({ acao: 'datas', id: 'a4' })
  })

  test('data no futuro e conclusão antes do início são recusadas com as frases do banco', async () => {
    const modulo = falso()
    const futuro = await modulo.corrigirDatasDaEtapa('a4', { iniciadaEm: '2026-10-20', resolvidaEm: null })
      .catch((erro: unknown) => erro)
    expect(futuro).toBeInstanceOf(TravaDoBanco)
    expect((futuro as Error).message).toBe('A data 20/10/2026 está no futuro.')
    await expect(modulo.corrigirDatasDaEtapa('a4', { iniciadaEm: '2026-10-05', resolvidaEm: '2026-10-01' })).rejects
      .toThrow('A conclusão (01/10/2026) não pode ser antes do início (05/10/2026).')
  })
})

describe('responsável', () => {
  test('grava o responsável da etapa e, sendo a atual, o do cartão', async () => {
    const modulo = falso()
    await modulo.mudarResponsavelDaEtapa('a6', 'u1')
    const lido = await doBanco(modulo)
    expect(lido.etapasDoProcesso[2]).toMatchObject({ responsavelId: 'u1', responsavelNome: 'Ana Teste', responsavelInativo: false })
    expect(lido.responsavel).toEqual({ id: 'u1', nome: 'Ana Teste', fotoUrl: null })
  })

  test('responsável de uma etapa que não é a atual não mexe no cartão; null tira o responsável', async () => {
    const modulo = falso()
    await modulo.mudarResponsavelDaEtapa('a4', 'u2')
    expect((await doBanco(modulo)).responsavel).toBeNull()
    await modulo.mudarResponsavelDaEtapa('a4', null)
    expect((await doBanco(modulo)).etapasDoProcesso[0]).toMatchObject({ responsavelId: null, responsavelNome: null })
  })

  test('lista os usuários que podem ser responsáveis', async () => {
    expect((await falso().listarResponsaveisPossiveis()).map((usuario) => usuario.nome)).toEqual(['Ana Teste', 'Bia Teste'])
  })
})
