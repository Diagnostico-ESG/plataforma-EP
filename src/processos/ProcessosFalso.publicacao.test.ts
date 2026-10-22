import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ProcessosFalso } from './ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido } from './tipos'

function doProcesso(ordem: number, codigo: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome: `Etapa ${codigo}`, ordem, obrigatoria: true, status: 'pendente',
    nota: null, iniciadaEm: null, resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false,
    ...mudancas,
  }
}

const EM_ANDAMENTO = { status: 'em_andamento', iniciadaEm: '2026-10-10' } as const
const RESOLVIDA = { status: 'concluida', iniciadaEm: '2026-10-01', resolvidaEm: '2026-10-02' } as const

/** A Validação resolvida, a Aprovação em andamento, a Publicação (opcional) pendente e, se pedida, uma etapa depois dela. */
function etapas(comEtapaDepois = false): EtapaDoProcesso[] {
  return [
    doProcesso(4, 'revisao_setor', RESOLVIDA), doProcesso(5, 'aprovacao_setor', EM_ANDAMENTO),
    doProcesso(6, 'publicacao', { obrigatoria: false }),
    ...(comEtapaDepois ? [doProcesso(7, 'teste_depois', { obrigatoria: false })] : []),
  ]
}

function falso(etapasDoProcesso: EtapaDoProcesso[], vaiParaPublicacao: boolean | null = null): ProcessosFalso {
  const processo: ProcessoLido = {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 'set1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', situacao: 'em_andamento', etapaAtual: { codigo: 'aprovacao_setor', nome: 'Aprovação', ordem: 5 },
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, processoPaiId: null, processoPai: null, subprocessos: [],
    motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao: null, etapasDoProcesso, vaiParaPublicacao,
  }
  const modulo = new ProcessosFalso()
  modulo.processos = [processo]
  modulo.usuariosPossiveis = [{ id: 'u1', nome: 'Ana Teste' }]
  return modulo
}

const lido = async (modulo: ProcessosFalso) => (await modulo.lerProcesso('p1')) as ProcessoLido
const statusDe = async (modulo: ProcessosFalso) => (await lido(modulo)).etapasDoProcesso.map((etapa) => etapa.status)

describe('a escolha de publicação ao resolver a Aprovação', () => {
  test('sem resposta, concluir e "realizada anteriormente" são recusados com a frase, sem mudar nada', async () => {
    const modulo = falso(etapas())
    await expect(modulo.concluirEtapa('a5', null)).rejects.toThrow(new TravaDoBanco('Responda se o processo vai para publicação.'))
    await expect(modulo.registrarRealizadaAnteriormente('a5', 'Antes', null, null))
      .rejects.toThrow(new TravaDoBanco('Responda se o processo vai para publicação.'))
    expect(await statusDe(modulo)).toEqual(['concluida', 'em_andamento', 'pendente'])
    expect(modulo.chamadas).toEqual([])
  })

  test('"sim" inicia a Publicação com o responsável; o processo segue em andamento nela', async () => {
    const modulo = falso(etapas())
    await modulo.concluirEtapa('a5', 'u1', true)
    const processo = await lido(modulo)
    expect(processo).toMatchObject({ situacao: 'em_andamento', vaiParaPublicacao: true, etapaAtual: { codigo: 'publicacao' } })
    expect(processo.etapasDoProcesso[2]).toMatchObject({ status: 'em_andamento', responsavelId: 'u1' })
    expect(modulo.chamadas).toEqual([{ acao: 'concluir', id: 'a5', usuarioId: 'u1', vai: true }])
  })

  test('"não" deixa a Publicação pendente e o processo concluído, sem etapa atual nem responsável', async () => {
    const modulo = falso(etapas())
    await modulo.registrarRealizadaAnteriormente('a5', 'Aprovada antes', null, false)
    expect(await lido(modulo)).toMatchObject({ situacao: 'concluido', vaiParaPublicacao: false, etapaAtual: null, responsavel: null })
    expect(await statusDe(modulo)).toEqual(['concluida', 'realizada_anteriormente', 'pendente'])
  })

  test('"não" inicia a etapa pendente depois da Publicação, quando há', async () => {
    const modulo = falso(etapas(true))
    await modulo.concluirEtapa('a5', null, false)
    expect(await statusDe(modulo)).toEqual(['concluida', 'concluida', 'pendente', 'em_andamento'])
    expect((await lido(modulo)).situacao).toBe('concluido')
  })

  test('sem a Publicação no processo (desativada), a Aprovação conclui sem escolha e o processo fica concluído', async () => {
    const modulo = falso(etapas().slice(0, 2))
    await modulo.concluirEtapa('a5', null)
    expect(await lido(modulo)).toMatchObject({ situacao: 'concluido', vaiParaPublicacao: null })
  })

  test('em outra etapa a escolha é ignorada', async () => {
    const modulo = falso([doProcesso(4, 'modelagem', EM_ANDAMENTO), ...etapas().slice(1).map((etapa) => ({ ...etapa, status: 'pendente' as const }))])
    await modulo.concluirEtapa('a4', null, false)
    expect((await lido(modulo)).vaiParaPublicacao).toBeNull()
  })
})

describe('o concluído e a volta', () => {
  test('com "sim" o processo só conclui quando a Publicação se resolve', async () => {
    const modulo = falso(etapas())
    await modulo.concluirEtapa('a5', null, true)
    await modulo.concluirEtapa('a6', null)
    expect((await lido(modulo)).situacao).toBe('concluido')
  })

  test('voltar até a Aprovação apaga a escolha; voltar à Publicação a mantém', async () => {
    const modulo = falso(etapas())
    await modulo.concluirEtapa('a5', null, true)
    await modulo.concluirEtapa('a6', null)
    await modulo.voltarParaEtapa('a6', 'Republicar', null)
    expect(await lido(modulo)).toMatchObject({ situacao: 'em_andamento', vaiParaPublicacao: true })
    await modulo.concluirEtapa('a6', null)
    await modulo.voltarParaEtapa('a5', 'Rever', null)
    expect(await lido(modulo)).toMatchObject({ situacao: 'em_andamento', vaiParaPublicacao: null, etapaAtual: { codigo: 'aprovacao_setor' } })
  })
})
