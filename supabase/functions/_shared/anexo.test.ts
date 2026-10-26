import { describe, expect, it } from 'vitest'
import { LIMITE_DE_TAMANHO, conferirChamador, conferirProcessoEmAndamento, lerAcao, type Perfil } from './decisao.ts'
import {
  LIMITE_DO_NOME, RECUSA_ANEXO_JA_RETIRADO, anexoEstaNaSubpasta, nomeDoAnexoNoDrive, validarEnvio, validarIniciarEnvioDoAnexo, validarRetirar,
} from './anexo.ts'

const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'

function envio(mudancas: Record<string, unknown> = {}): Record<string, unknown> {
  return { acao: 'iniciar_envio', processo_id: PROCESSO, papel: 'anexo', nome_original: 'resposta.eml', tamanho: 1024, ...mudancas }
}

function recusaDe(corpo: unknown) {
  const resultado = validarIniciarEnvioDoAnexo(corpo)
  return resultado.ok ? null : resultado.recusa
}

describe('validarIniciarEnvioDoAnexo', () => {
  it('aceita o pedido mínimo, sem número, histórica nem piloto', () => {
    const resultado = validarIniciarEnvioDoAnexo(envio())
    expect(resultado).toEqual({ ok: true, valor: { processoId: PROCESSO, nomeOriginal: 'resposta.eml', tamanho: 1024 } })
  })

  it('ignora o que o anexo não usa, mesmo se a tela mandar', () => {
    const resultado = validarIniciarEnvioDoAnexo(envio({ numero: 3, historica: true, piloto: true, numero_do_relatorio: 2 }))
    expect(resultado.ok).toBe(true)
  })

  it.each(['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'eml'])('aceita .%s, também em maiúsculas', (extensao) => {
    expect(recusaDe(envio({ nome_original: `arquivo.${extensao}` }))).toBeNull()
    expect(recusaDe(envio({ nome_original: `ARQUIVO.${extensao.toUpperCase()}` }))).toBeNull()
  })

  it('recusa extensão fora da lista, dizendo só a extensão recebida (o nome pode ter nome de pessoa)', () => {
    const recusa = recusaDe(envio({ nome_original: 'carta-da-maria-silva.exe' }))
    expect(recusa?.codigo).toBe('extensao_nao_aceita')
    expect(recusa?.mensagem).toContain('.exe')
    expect(recusa?.mensagem).not.toContain('maria')
  })

  it('recusa nome sem extensão', () => {
    expect(recusaDe(envio({ nome_original: 'LEIAME' }))?.codigo).toBe('extensao_nao_aceita')
  })

  it('aceita 20 MB e recusa 20 MB + 1 byte', () => {
    expect(recusaDe(envio({ tamanho: LIMITE_DE_TAMANHO }))).toBeNull()
    expect(recusaDe(envio({ tamanho: LIMITE_DE_TAMANHO + 1 }))?.codigo).toBe('arquivo_grande')
  })

  it.each([0, -1, 1.5, '10', null])('recusa tamanho %j', (tamanho) => {
    expect(recusaDe(envio({ tamanho }))?.codigo).toBe('entrada_invalida')
  })

  it('aceita o nome de 300 caracteres e recusa o de 301, sem repetir o nome na mensagem', () => {
    const base = 'a'.repeat(LIMITE_DO_NOME - 4)
    expect(recusaDe(envio({ nome_original: `${base}.pdf` }))).toBeNull()
    const recusa = recusaDe(envio({ nome_original: `${base}b.pdf` }))
    expect(recusa?.codigo).toBe('entrada_invalida')
    expect(recusa?.mensagem).toContain('300')
    expect(recusa?.mensagem).not.toContain(base)
  })

  it.each(['', '   ', 42, null])('recusa nome %j', (nome) => {
    expect(recusaDe(envio({ nome_original: nome }))?.codigo).toBe('entrada_invalida')
  })

  it('recusa processo que não é uuid e corpo que não é objeto', () => {
    expect(recusaDe(envio({ processo_id: 'x' }))?.codigo).toBe('entrada_invalida')
    expect(recusaDe(null)?.codigo).toBe('entrada_invalida')
    expect(recusaDe('texto')?.codigo).toBe('entrada_invalida')
  })
})

describe('nomeDoAnexoNoDrive', () => {
  it('mantém o nome original e a extensão', () => {
    expect(nomeDoAnexoNoDrive('Resposta do setor.eml')).toBe('Resposta do setor.eml')
  })

  it('troca os caracteres que o Drive não aceita e junta os espaços', () => {
    expect(nomeDoAnexoNoDrive('  a:b*c?  d.pdf ')).toBe('a-b-c- d.pdf')
  })

  it('devolve o mesmo nome para dois anexos de nome igual (o Drive aceita nomes repetidos)', () => {
    expect(nomeDoAnexoNoDrive('resposta.eml')).toBe(nomeDoAnexoNoDrive('resposta.eml'))
  })
})

describe('validarEnvio', () => {
  it('manda o papel anexo para a regra do anexo, que não pede número', () => {
    expect(validarEnvio(envio())).toMatchObject({ ok: true, valor: { tipo: 'anexo', entrada: { nomeOriginal: 'resposta.eml' } } })
  })

  it('deixa os outros papéis na regra de sempre, que pede o número', () => {
    const geral = { acao: 'iniciar_envio', processo_id: PROCESSO, papel: 'bpm', nome_original: 'fluxo.bpm', tamanho: 10 }
    expect(validarEnvio(geral).ok).toBe(false)
    expect(validarEnvio({ ...geral, numero: 2, historica: false })).toMatchObject({ ok: true, valor: { tipo: 'arquivo' } })
  })

  it('recusa corpo que não é objeto', () => {
    const resultado = validarEnvio(null)
    expect(resultado.ok).toBe(false)
  })
})

const ANEXO = '7e000000-0000-0000-0000-0000000000c1'

describe('validarRetirar', () => {
  it('aceita o pedido com o identificador do anexo e ignora o resto', () => {
    const resultado = validarRetirar({ acao: 'retirar', anexo_id: ANEXO, motivo: 'engano', nome: 'resposta.eml' })
    expect(resultado).toEqual({ ok: true, valor: { anexoId: ANEXO } })
  })

  it.each([null, 'texto', 7, [ANEXO]])('recusa corpo que não é objeto (%j)', (corpo) => {
    const resultado = validarRetirar(corpo)
    expect(resultado.ok ? null : resultado.recusa.codigo).toBe('entrada_invalida')
  })

  it.each([undefined, null, 5, 'não-é-uuid', '', ' '])('recusa anexo_id %j, sem repetir o valor recebido', (valor) => {
    const resultado = validarRetirar({ acao: 'retirar', anexo_id: valor })
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.recusa.mensagem).toContain('campo anexo_id: esperado uuid')
    if (!resultado.ok && typeof valor === 'string' && valor.trim() !== '') expect(resultado.recusa.mensagem).not.toContain(valor)
  })
})

describe('a ação retirar', () => {
  it('é reconhecida pela função', () => {
    expect(lerAcao({ acao: 'retirar' })).toBe('retirar')
  })

  it.each<[Perfil, string | null]>([['administrador', null], ['integrante_ep', null], ['consulta', 'sem_permissao']])(
    'perfil %s: %s',
    (perfil, esperado) => {
      expect(conferirChamador({ perfil, ativo: true }, 'retirar')?.codigo ?? null).toBe(esperado)
    },
  )

  it('recusa o usuário desativado, mesmo administrador, e quem não entrou', () => {
    expect(conferirChamador({ perfil: 'administrador', ativo: false }, 'retirar')?.codigo).toBe('usuario_inativo')
    expect(conferirChamador(null, 'retirar')?.codigo).toBe('sem_login')
  })

  it.each(['suspenso', 'cancelado', 'concluido'])('o processo %s não retira anexo; em andamento retira', (situacao) => {
    expect(conferirProcessoEmAndamento(situacao)?.codigo).toBe('processo_fora_de_andamento')
    expect(conferirProcessoEmAndamento('em_andamento')).toBeNull()
  })

  it('o anexo que já não existe tem recusa própria, com a frase e o código que a tela traduz', () => {
    expect(RECUSA_ANEXO_JA_RETIRADO).toEqual({ codigo: 'anexo_ja_retirado', mensagem: 'O anexo já foi retirado.' })
  })
})

// Regressão da revisão de segurança (2026-10-26): o drive_id do anexo é gravado por quem tem perfil de escrita, então a
// retirada e o download só agem num arquivo que está de fato dentro da subpasta "Anexos" do processo.
describe('anexoEstaNaSubpasta', () => {
  const SUBPASTA = { id: 'pastaAnexos1', nome: 'Anexos' }

  it('vale para o arquivo cujo pai é a subpasta registrada, chamada "Anexos"', () => {
    expect(anexoEstaNaSubpasta(SUBPASTA, ['pastaAnexos1'])).toBe(true)
  })

  it('recusa o arquivo de uma versão ou do .pdf da aprovação, que está em outra pasta', () => {
    expect(anexoEstaNaSubpasta(SUBPASTA, ['pastaDoProcesso1'])).toBe(false)
    expect(anexoEstaNaSubpasta(SUBPASTA, [])).toBe(false)
  })

  it('recusa a pasta registrada que não se chama "Anexos" (por exemplo, a pasta do processo apontada à mão)', () => {
    expect(anexoEstaNaSubpasta({ id: 'pastaDoProcesso1', nome: 'Processo de teste' }, ['pastaDoProcesso1'])).toBe(false)
  })

  it('recusa quando não há pasta registrada ou o Drive não a acha', () => {
    expect(anexoEstaNaSubpasta(null, ['pastaAnexos1'])).toBe(false)
  })
})
