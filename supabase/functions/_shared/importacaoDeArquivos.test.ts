import { describe, expect, it } from 'vitest'
import type { Chamador } from './decisao.ts'
import {
  conferirPedidoDaImportacao,
  conferirProcessoDaImportacao,
  lerImportacaoDoPedido,
  parametrosDaImportacao,
} from './importacaoDeArquivos.ts'
import type { ArquivoParaGravar, EntradaRegistrar } from './registro.ts'

// Importação dos dados atuais, ticket 02: os pedidos com `importacao: true` são só do Administrador ativo, aceitam o processo
// concluído e gravam pela função importar_versao do banco.
const ADMINISTRADOR: Chamador = { perfil: 'administrador', ativo: true }
const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'
const BPM: ArquivoParaGravar = {
  papel: 'bpm', nome: 'XYZ_V2_Exemplo Alfa.bpm', formato: 'bpm', tamanho: 10, hash_md5: '0123456789abcdef0123456789abcdef', drive_id: 'id-bpm',
}

function entrada(mudancas: Partial<EntradaRegistrar> = {}): EntradaRegistrar {
  return {
    processoId: PROCESSO, numero: 2, historica: false, piloto: false, versaoId: null, arquivoId: null, numeroDoRelatorio: null,
    arquivos: [{ papel: 'bpm', driveId: 'id-bpm' }], ...mudancas,
  }
}

describe('quem importa', () => {
  it('sem a marca, o pedido é o de sempre', () => {
    expect(lerImportacaoDoPedido({ acao: 'registrar' }, { perfil: 'integrante_ep', ativo: true }, 'registrar')).toEqual({ ok: true, valor: false })
  })

  it('com a marca, o Administrador ativo importa', () => {
    expect(lerImportacaoDoPedido({ importacao: true }, ADMINISTRADOR, 'iniciar_envio')).toEqual({ ok: true, valor: true })
  })

  it.each([
    ['integrante', { perfil: 'integrante_ep', ativo: true }],
    ['consulta', { perfil: 'consulta', ativo: true }],
  ] as const)('o %s é recusado sem permissão', (_nome, chamador) => {
    const lido = lerImportacaoDoPedido({ importacao: true }, chamador, 'registrar')
    expect(lido.ok ? null : lido.recusa.codigo).toBe('sem_permissao')
  })

  it('o Administrador desativado é recusado', () => {
    const lido = lerImportacaoDoPedido({ importacao: true }, { perfil: 'administrador', ativo: false }, 'registrar')
    expect(lido.ok ? null : lido.recusa.codigo).toBe('usuario_inativo')
  })

  it('a marca fora do formato é entrada inválida', () => {
    const lido = lerImportacaoDoPedido({ importacao: 'sim' }, ADMINISTRADOR, 'registrar')
    expect(lido.ok ? null : lido.recusa.mensagem).toContain('campo importacao: esperado booleano, recebido string')
  })

  it('a marca só vale no envio e no registro', () => {
    const lido = lerImportacaoDoPedido({ importacao: true }, ADMINISTRADOR, 'renumerar')
    expect(lido.ok ? null : lido.recusa.mensagem).toContain('campo importacao: esperado só em iniciar_envio ou registrar')
  })
})

describe('o processo que recebe', () => {
  it.each(['em_andamento', 'concluido'])('aceita o processo %s', (situacao) => {
    expect(conferirProcessoDaImportacao(situacao)).toBeNull()
  })

  it.each(['suspenso', 'cancelado'])('recusa o processo %s', (situacao) => {
    expect(conferirProcessoDaImportacao(situacao)?.codigo).toBe('processo_fora_de_andamento')
  })
})

describe('o pedido da importação', () => {
  it('a versão nova vale', () => {
    expect(conferirPedidoDaImportacao({ versaoId: null, arquivoId: null })).toBeNull()
  })

  it('trocar ou acrescentar arquivo não é importação', () => {
    expect(conferirPedidoDaImportacao({ versaoId: PROCESSO, arquivoId: null })?.codigo).toBe('entrada_invalida')
    expect(conferirPedidoDaImportacao({ versaoId: null, arquivoId: PROCESSO })?.codigo).toBe('entrada_invalida')
  })
})

describe('os parâmetros de importar_versao', () => {
  it('a em sequência leva o número do relatório', () => {
    expect(parametrosDaImportacao(entrada({ numeroDoRelatorio: 3 }), [BPM])).toEqual({
      p_processo: PROCESSO, p_numero: 2, p_tipo: 'sequencia', p_arquivos: [BPM], p_numero_do_relatorio: 3,
    })
  })

  it('a histórica e a piloto vão sem número do relatório', () => {
    expect(parametrosDaImportacao(entrada({ historica: true }), [BPM])).toMatchObject({ p_tipo: 'historica', p_numero_do_relatorio: null })
    expect(parametrosDaImportacao(entrada({ piloto: true }), [BPM])).toMatchObject({ p_tipo: 'piloto' })
  })
})
