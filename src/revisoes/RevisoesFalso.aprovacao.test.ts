import { describe, expect, test } from 'vitest'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { umProcessoLido } from '../testes/processoDaLista'
import { RevisoesFalso } from './RevisoesFalso'
import type { Aprovacao, DadosDaAprovacao } from './tipos'

const EU = { id: 'u2', nome: 'Bia Teste' }
const SEM_NADA: DadosDaAprovacao = { numeroEprotocolo: null, link: null, aprovadaEm: null }
const APROVACAO: Aprovacao = {
  id: 'ap1', versao: 8, numeroEprotocolo: null, link: null, aprovadaEm: null, registradaPor: 'Ana Teste', registradaEm: '2026-10-12T12:00:00Z',
}

function montar() {
  const processos = new ProcessosFalso()
  processos.processos = [umProcessoLido('Emitir Ofício', { id: 'p1' }, 'aprovacao_setor')]
  return { processos, revisoes: new RevisoesFalso(processos, EU) }
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

  test('devolve a aprovação registrada do processo', async () => {
    const { revisoes } = montar()
    revisoes.aprovacoes.p1 = APROVACAO
    expect(await revisoes.lerAprovacao('p1')).toEqual(APROVACAO)
  })
})

describe('editarAprovacao', () => {
  // A aprovação nasce direto na falsa (registrar sem trava chega no ticket 05 de revisoes-aprovacao).
  async function aprovada(dados: DadosDaAprovacao = SEM_NADA) {
    const montado = montar()
    montado.revisoes.aprovacoes.p1 = { ...APROVACAO, ...dados }
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

  test('aprovação que não existe (desfeita por uma volta) é cadastro inexistente', async () => {
    const { revisoes } = montar()
    expect(await falhaDe(revisoes.editarAprovacao(ID, SEM_NADA))).toBeInstanceOf(CadastroInexistente)
  })
})
