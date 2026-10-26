import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import { EnvioAoDriveFalso, recusa } from '../testes/versoesSupabaseDeTeste'
import type { Database } from '../types/database'
import { AnexosFalso } from './AnexosFalso'
import { criarAnexosSupabase } from './anexosSupabase'
import { falhaDaRetiradaDoAnexo, textoDaFalhaDaRetirada } from './recusasDeAnexos'

describe('falhaDaRetiradaDoAnexo', () => {
  it.each([
    ['sem_permissao', 'Seu perfil não permite retirar anexos.'],
    ['usuario_inativo', 'Seu usuário está desativado; não é possível retirar anexos.'],
    ['sem_login', 'Sua sessão terminou. Entre de novo para retirar o anexo.'],
    ['processo_fora_de_andamento', 'O processo não está em andamento; não é possível retirar anexo.'],
    ['anexo_ja_retirado', 'O anexo já foi retirado.'],
    ['drive_indisponivel', 'Não foi possível falar com o Drive. Tente de novo em instantes.'],
    ['nao_encontrado_no_drive', 'O arquivo do anexo não foi encontrado no Drive. Tente de novo.'],
    ['entrada_invalida', 'Os dados da retirada não foram aceitos. Tente de novo.'],
  ])('%s vira a frase pronta, como TravaDoBanco', (codigo, frase) => {
    const erro = falhaDaRetiradaDoAnexo(codigo)
    expect(erro).toBeInstanceOf(TravaDoBanco)
    expect(erro.message).toBe(frase)
  })

  it('o processo arquivado tem a frase do arquivamento', () => {
    expect(falhaDaRetiradaDoAnexo('processo_arquivado').message).toContain('arquivado')
  })

  it('código desconhecido vira falha genérica, não frase', () => {
    const erro = falhaDaRetiradaDoAnexo('coisa_nova')
    expect(erro).not.toBeInstanceOf(TravaDoBanco)
    expect(erro.message).toBe('erro inesperado do servidor (coisa_nova)')
  })

  it('nenhuma frase fala em enviar nem em versão', () => {
    for (const codigo of ['sem_permissao', 'usuario_inativo', 'sem_login', 'processo_fora_de_andamento', 'entrada_invalida']) {
      const frase = falhaDaRetiradaDoAnexo(codigo).message.toLowerCase()
      expect(frase).not.toContain('enviar')
      expect(frase).not.toContain('versão')
    }
  })
})

describe('textoDaFalhaDaRetirada', () => {
  it('usa a frase pronta da recusa', () => {
    expect(textoDaFalhaDaRetirada(new TravaDoBanco('O anexo já foi retirado.'))).toBe('O anexo já foi retirado.')
  })

  it('nas outras falhas, diz que não foi possível retirar e o motivo', () => {
    expect(textoDaFalhaDaRetirada(new Error('sem conexão'))).toBe('Não foi possível retirar o anexo: sem conexão.')
    expect(textoDaFalhaDaRetirada('texto solto')).toBe('Não foi possível retirar o anexo: texto solto.')
  })
})

function criar(cliente: ClienteSupabaseFalso) {
  return criarAnexosSupabase(cliente as unknown as SupabaseClient<Database>, new EnvioAoDriveFalso().enviar)
}

describe('retirarAnexo no módulo real', () => {
  it('chama a função com a ação retirar e só o identificador do anexo', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostasDaFuncao['funcao.retirar'] = { data: { retirado: true }, error: null }
    await criar(cliente).retirarAnexo('an1')
    expect(cliente.chamadasDaFuncao).toEqual([{ acao: 'retirar', anexo_id: 'an1' }])
  })

  it('a recusa da função chega com a frase pronta, sem o nome do arquivo', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostasDaFuncao['funcao.retirar'] = recusa('anexo_ja_retirado', '', 409)
    const erro = await criar(cliente).retirarAnexo('an1').catch((falha: unknown) => falha)
    expect(erro).toBeInstanceOf(TravaDoBanco)
    expect((erro as Error).message).toBe('O anexo já foi retirado.')
  })

  it('a recusa do banco por situação do processo chega com a frase da retirada', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostasDaFuncao['funcao.retirar'] = recusa('processo_fora_de_andamento', 'suspenso', 409)
    await expect(criar(cliente).retirarAnexo('an1')).rejects.toThrow('O processo não está em andamento; não é possível retirar anexo.')
  })

  it('sem conexão com o servidor, a falha diz isso', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostasDaFuncao['funcao.retirar'] = { data: null, error: { message: 'Failed to fetch' } }
    await expect(criar(cliente).retirarAnexo('an1')).rejects.toThrow('não foi possível falar com o servidor')
  })
})

const PROCESSOS = { p1: { sigla: 'TSA', nome: 'Emitir Ofício', etapa: 'Modelagem piloto' } }
const pedido = (nome: string) => ({ processoId: 'p1', arquivo: new File(['x'], nome) })

async function falsoComDoisAnexos() {
  const eventos: EventoDoCadastro[] = []
  const falso = new AnexosFalso(PROCESSOS, (_processoId, evento) => eventos.push(evento))
  await falso.enviarAnexo(pedido('um.eml'), () => {})
  await falso.enviarAnexo(pedido('dois.pdf'), () => {})
  eventos.length = 0
  return { falso, eventos }
}

describe('retirarAnexo na falsa', () => {
  it('tira só o anexo escolhido da lista, registra a retirada e entrega o evento ao histórico', async () => {
    const { falso, eventos } = await falsoComDoisAnexos()
    const [maisRecente, maisAntigo] = await falso.listarAnexos('p1')
    await falso.retirarAnexo(maisAntigo.id)
    expect((await falso.listarAnexos('p1')).map(({ id }) => id)).toEqual([maisRecente.id])
    expect(falso.retiradas).toEqual([maisAntigo.id])
    expect(eventos).toMatchObject([{
      acao: 'retirar', entidade: 'anexo', entidadeRef: 'p1', depois: null,
      antes: { nome: 'um.eml', formato: 'eml', etapa: 'Modelagem piloto', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA' },
    }])
  })

  it('retirar de novo o mesmo anexo recusa com a frase do anexo já retirado', async () => {
    const { falso } = await falsoComDoisAnexos()
    const [alvo] = await falso.listarAnexos('p1')
    await falso.retirarAnexo(alvo.id)
    await expect(falso.retirarAnexo(alvo.id)).rejects.toThrow('O anexo já foi retirado.')
  })

  it('a falha programada não tira nada: texto vira erro comum, Error vai como está', async () => {
    const { falso } = await falsoComDoisAnexos()
    const [alvo] = await falso.listarAnexos('p1')
    falso.falhaNaRetirada = 'Drive fora do ar'
    await expect(falso.retirarAnexo(alvo.id)).rejects.toThrow('Drive fora do ar')
    const trava = new TravaDoBanco('frase pronta')
    falso.falhaNaRetirada = trava
    await expect(falso.retirarAnexo(alvo.id)).rejects.toBe(trava)
    expect(await falso.listarAnexos('p1')).toHaveLength(2)
    expect(falso.retiradas).toEqual([])
  })
})
