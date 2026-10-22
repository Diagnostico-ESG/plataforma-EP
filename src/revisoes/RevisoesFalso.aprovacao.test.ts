import { describe, expect, test } from 'vitest'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido, UltimaVersao } from '../processos/tipos'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { RevisoesFalso } from './RevisoesFalso'
import type { DadosDaAprovacao } from './tipos'

const EU = { id: 'u2', nome: 'Bia Teste' }
const COMPLETA: UltimaVersao = { numero: 8, autorId: 'u1', autorNome: 'Ana Teste', papeis: ['bpm', 'png', 'relatorio'] }
const SEM_NADA: DadosDaAprovacao = { numeroEprotocolo: null, link: null, aprovadaEm: null }

function etapa(ordem: number, codigo: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome: `Etapa ${ordem}`, ordem, obrigatoria: true, status: 'pendente', nota: null,
    iniciadaEm: null, resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

// Validação com o setor (4) resolvida, Aprovação (5) em andamento e Publicação (6) pendente.
function montar(ultimaVersao: UltimaVersao | null = COMPLETA) {
  const processo: ProcessoLido = {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', situacao: 'em_andamento', etapaAtual: { codigo: 'aprovacao_setor', nome: 'Etapa 5', ordem: 5 },
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, processoPaiId: null, processoPai: null,
    subprocessos: [], motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao,
    etapasDoProcesso: [
      etapa(4, 'revisao_setor', { status: 'concluida', resolvidaEm: '2026-10-12' }),
      etapa(5, 'aprovacao_setor', { status: 'em_andamento', iniciadaEm: '2026-10-12' }),
      etapa(6, 'publicacao'),
    ],
  }
  const processos = new ProcessosFalso()
  processos.processos = [processo]
  processos.usuariosPossiveis = [EU]
  const versoes = new VersoesFalso()
  return { processos, versoes, revisoes: new RevisoesFalso(processos, EU, versoes) }
}

async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

describe('lerAprovacao', () => {
  test('sem aprovação devolve null, e falha ou segura conforme o teste pede', async () => {
    const { revisoes } = montar()
    expect(await revisoes.lerAprovacao('p1')).toBeNull()
    revisoes.falharLeitura = true
    await expect(revisoes.lerAprovacao('p1')).rejects.toThrow('falha de conexão simulada')
  })
})

describe('concluirAprovacao', () => {
  test('grava a aprovação da versão mais recente, conclui a etapa, inicia a próxima, marca a versão e registra o evento', async () => {
    const { processos, versoes, revisoes } = montar()
    await revisoes.concluirAprovacao('a5', { numeroEprotocolo: 'PROT-1', link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-12' }, EU.id, true)
    expect(await revisoes.lerAprovacao('p1')).toEqual({
      id: 'ap1', versao: 8, numeroEprotocolo: 'PROT-1', link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-12',
      registradaPor: 'Bia Teste', registradaEm: '2026-10-13T12:00:00Z',
    })
    const lido = (await processos.lerProcesso('p1')) as ProcessoLido
    expect(lido.etapasDoProcesso.map((e) => e.status)).toEqual(['concluida', 'concluida', 'em_andamento'])
    expect(versoes.aprovadas.p1).toBe(8)
    expect(revisoes.aprovacoesConcluidas).toHaveLength(1)
    expect((await processos.lerHistoricoDoProcesso('p1'))[0]).toMatchObject({
      acao: 'registrar', entidade: 'aprovacao', antes: null, depois: { versao: 'V8', registrada_por_nome: 'Bia Teste' },
    })
  })

  test('sem os três campos também conclui', async () => {
    const { revisoes } = montar()
    await revisoes.concluirAprovacao('a5', SEM_NADA, null, true)
    expect((await revisoes.lerAprovacao('p1'))?.numeroEprotocolo).toBeNull()
  })

  test.each([
    ['versão incompleta', { ...COMPLETA, papeis: ['bpm', 'png'] as UltimaVersao['papeis'] }, SEM_NADA, 'A V8 está sem relatório.'],
    ['sem versão', null, SEM_NADA, 'O processo ainda não tem versão enviada.'],
    ['link fora do formato', COMPLETA, { ...SEM_NADA, link: 'ftp://x.example/a' }, 'O link do E-protocolo precisa começar com http:// ou https://.'],
    ['data no futuro', COMPLETA, { ...SEM_NADA, aprovadaEm: '2026-10-14' }, 'A data 14/10/2026 está no futuro.'],
  ])('recusa %s e não deixa nada', async (_caso, ultima, dados, frase) => {
    const { processos, revisoes } = montar(ultima)
    const falha = await falhaDe(revisoes.concluirAprovacao('a5', dados, null, true))
    expect(falha.message).toBe(frase)
    expect(await revisoes.lerAprovacao('p1')).toBeNull()
    expect(((await processos.lerProcesso('p1')) as ProcessoLido).etapasDoProcesso[1].status).toBe('em_andamento')
  })

  test('recusa a data anterior à última revisão interna do processo', async () => {
    const { revisoes } = montar()
    revisoes.revisoes.p1 = [{
      id: 'r1', versaoRevisada: 8, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null,
      revisor: 'Bia Teste', revisadaEm: '2026-10-13',
    }]
    const falha = await falhaDe(revisoes.concluirAprovacao('a5', { ...SEM_NADA, aprovadaEm: '2026-10-12' }, null, true))
    expect(falha.message).toBe('A data da aprovação (12/10/2026) não pode ser antes da última revisão interna (13/10/2026).')
  })

  test('recusa a segunda aprovação e a falha programada, antes de gravar', async () => {
    const { revisoes } = montar()
    revisoes.falhaNaGravacao = 'falha de conexão simulada'
    expect((await falhaDe(revisoes.concluirAprovacao('a5', SEM_NADA, null, true))).message).toBe('falha de conexão simulada')
    revisoes.falhaNaGravacao = null
    await revisoes.concluirAprovacao('a5', SEM_NADA, null, true)
    expect((await falhaDe(revisoes.concluirAprovacao('a5', SEM_NADA, null, true))).message).toBe('Este processo já tem aprovação registrada.')
  })
})

describe('voltar desfaz a aprovação', () => {
  async function aprovado() {
    const montagem = montar()
    await montagem.revisoes.concluirAprovacao('a5', SEM_NADA, null, true)
    return montagem
  }

  test('voltar à Validação com o setor apaga a aprovação, tira a marca e registra o evento "desfazer" com o antes', async () => {
    const { processos, versoes, revisoes } = await aprovado()
    await processos.voltarParaEtapa('a4', 'Ajustar', null)
    expect(await revisoes.lerAprovacao('p1')).toBeNull()
    expect(versoes.aprovadas.p1).toBeUndefined()
    expect((await processos.lerHistoricoDoProcesso('p1'))[0]).toMatchObject({
      acao: 'desfazer', entidade: 'aprovacao', depois: null, antes: { versao: 'V8' },
    })
  })

  test('voltar à própria Aprovação também desfaz; voltar à Publicação não', async () => {
    const { processos, revisoes } = await aprovado()
    await processos.concluirEtapa('a6', null)
    await processos.voltarParaEtapa('a6', 'Rever', null)
    expect(await revisoes.lerAprovacao('p1')).not.toBeNull()
    await processos.voltarParaEtapa('a5', 'Rever', null)
    expect(await revisoes.lerAprovacao('p1')).toBeNull()
  })
})

describe('editarAprovacao', () => {
  async function aprovada(dados: DadosDaAprovacao = SEM_NADA) {
    const montado = montar()
    await montado.revisoes.concluirAprovacao('a5', dados, EU.id, true)
    return montado
  }
  const ID = 'ap1'

  test('acrescenta o número a uma aprovação sem ele, põe o evento "editar" com o antes vazio e o depois', async () => {
    const { processos, revisoes } = await aprovada()
    await revisoes.editarAprovacao(ID, { numeroEprotocolo: 'PROT-9', link: null, aprovadaEm: null })
    expect(await revisoes.lerAprovacao('p1')).toMatchObject({ numeroEprotocolo: 'PROT-9' })
    const [evento] = await processos.lerHistoricoDoProcesso('p1')
    expect(evento).toMatchObject({ acao: 'editar', entidade: 'aprovacao', entidadeRef: 'p1' })
    expect(evento.antes).toMatchObject({ numero_eprotocolo: null, versao: 'V8' })
    expect(evento.depois).toMatchObject({ numero_eprotocolo: 'PROT-9' })
  })

  test('salvar sem mudar nada não põe evento no histórico', async () => {
    const { processos, revisoes } = await aprovada({ numeroEprotocolo: 'PROT-1', link: null, aprovadaEm: null })
    const antes = (await processos.lerHistoricoDoProcesso('p1')).length
    await revisoes.editarAprovacao(ID, { numeroEprotocolo: 'PROT-1', link: null, aprovadaEm: null })
    expect((await processos.lerHistoricoDoProcesso('p1')).length).toBe(antes)
  })

  test.each([
    [{ numeroEprotocolo: null, link: 'ftp://x.example/a', aprovadaEm: null }, 'O link do E-protocolo precisa começar com http:// ou https://.'],
    [{ numeroEprotocolo: null, link: null, aprovadaEm: '2026-10-14' }, 'A data 14/10/2026 está no futuro.'],
  ])('recusa %o com a frase do banco', async (dados, frase) => {
    const { revisoes } = await aprovada()
    const falha = await falhaDe(revisoes.editarAprovacao(ID, dados))
    expect(falha.message).toBe(frase)
  })

  test('recusa a data antes da última revisão interna', async () => {
    const { revisoes } = await aprovada()
    revisoes.revisoes.p1 = [{
      id: 'r1', versaoRevisada: 8, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null,
      revisor: 'Ana Teste', revisadaEm: '2026-10-13',
    }]
    const falha = await falhaDe(revisoes.editarAprovacao(ID, { numeroEprotocolo: null, link: null, aprovadaEm: '2026-10-12' }))
    expect(falha.message).toBe('A data da aprovação (12/10/2026) não pode ser antes da última revisão interna (13/10/2026).')
  })

  test('aprovação que não existe (desfeita por uma volta) é cadastro inexistente', async () => {
    const { revisoes } = montar()
    expect(await falhaDe(revisoes.editarAprovacao(ID, SEM_NADA))).toBeInstanceOf(CadastroInexistente)
  })
})
