import { describe, expect, it } from 'vitest'
import { ErroDoGoogle } from './planilhasMotivo.ts'
import type { AbaExistente, LoteDoSheets } from './planilhasLote.ts'
import { atenderPedido, type Portas } from './planilhasPedido.ts'
import { pacoteMinimo, uuid } from './planilhasExemplos.ts'

const SENHA = 'senha-interna-inventada'

type Onde = 'interna' | 'publica'
type Passo = `ler:${Onde}` | `aplicar:${Onde}`

// Portas inventadas: guardam o que foi chamado, na ordem, e falham onde o teste mandar.
class PortasFalsas implements Portas {
  eventos: string[] = []
  avisos: string[] = []
  lotes: Record<string, LoteDoSheets> = {}
  falhas: Partial<Record<Passo, unknown>> = {}
  registroFalha = false

  async lerAbas(planilha: Onde): Promise<AbaExistente[]> {
    this.eventos.push(`ler:${planilha}`)
    this.falharSePedido(`ler:${planilha}`)
    return [{ sheetId: 0, titulo: 'Planilha1' }]
  }

  async aplicarLote(planilha: Onde, id: string, lote: LoteDoSheets): Promise<void> {
    this.eventos.push(`aplicar:${planilha}`)
    this.lotes[planilha] = lote
    this.falharSePedido(`aplicar:${planilha}`)
    expect(id).toBe(planilha === 'interna' ? 'id-da-planilha-interna' : 'id-da-planilha-publica')
  }

  async registrar(tentativa: string, ficha: string, deuCerto: boolean, motivo: string | null): Promise<void> {
    this.eventos.push(`registrar:${deuCerto}:${motivo ?? ''}:${tentativa}:${ficha}`)
    if (this.registroFalha) throw new Error('banco fora do ar')
  }

  avisar(tipo: string): void {
    this.avisos.push(tipo)
  }

  private falharSePedido(passo: Passo): void {
    if (this.falhas[passo]) throw this.falhas[passo]
  }
}

function atender(portas: PortasFalsas, senha: string | null = SENHA, corpo: unknown = pacoteMinimo()) {
  return atenderPedido({ senhaRecebida: senha, corpo }, SENHA, portas)
}

async function rodar(portas: PortasFalsas, corpo: unknown = pacoteMinimo()): Promise<void> {
  const resposta = atender(portas, SENHA, corpo)
  expect(resposta.status).toBe(202)
  await resposta.depois?.()
}

const REGISTRO_OK = `registrar:true::${uuid(1)}:${'a'.repeat(64)}`

describe('atenderPedido: antes de qualquer trabalho', () => {
  it.each([['errada', 'senha-errada'], ['ausente', null], ['vazia', '']])(
    'senha %s: 401, sem trabalho depois e nenhuma chamada ao Google',
    (_nome, senha) => {
      const portas = new PortasFalsas()
      const resposta = atender(portas, senha)
      expect(resposta.status).toBe(401)
      expect(resposta.depois).toBeUndefined()
      expect(portas.eventos).toEqual([])
    },
  )

  it.each([['texto', 'texto'], ['nulo', null], ['lista', []]])('corpo que é %s: 400', (_nome, corpo) => {
    const portas = new PortasFalsas()
    const resposta = atender(portas, SENHA, corpo)
    expect(resposta.status).toBe(400)
    expect(resposta.depois).toBeUndefined()
    expect(portas.eventos).toEqual([])
  })

  it('senha certa: responde 202 na hora e só trabalha quando o trabalho de depois roda', () => {
    const portas = new PortasFalsas()
    const resposta = atender(portas)
    expect(resposta).toMatchObject({ status: 202, codigo: 'aceito' })
    expect(resposta.depois).toBeDefined()
    expect(portas.eventos).toEqual([])
  })
})

describe('atenderPedido: o trabalho', () => {
  it('escreve a interna antes da pública e registra o sucesso uma vez, com a tentativa e a ficha', async () => {
    const portas = new PortasFalsas()
    await rodar(portas)
    expect(portas.eventos).toEqual(['ler:interna', 'aplicar:interna', 'ler:publica', 'aplicar:publica', REGISTRO_OK])
  })

  it('grava as abas Processos e Fases na interna e Resumo e Fases na pública', async () => {
    const portas = new PortasFalsas()
    await rodar(portas)
    const titulos = (lote: LoteDoSheets) => lote.requests.flatMap((p) => (p.addSheet ? [(p.addSheet as { properties: { title: string } }).properties.title] : []))
    expect(titulos(portas.lotes.interna)).toEqual(['Processos', 'Fases'])
    expect(titulos(portas.lotes.publica)).toEqual(['Resumo', 'Fases'])
  })

  it('pacote inválido: nada vai ao Google e o resultado é "pacote_invalido"', async () => {
    const portas = new PortasFalsas()
    const estragado = { ...pacoteMinimo(), etapas: 'x' }
    await rodar(portas, estragado)
    expect(portas.eventos).toEqual([`registrar:false:pacote_invalido:${uuid(1)}:${'a'.repeat(64)}`])
  })

  it('pacote inválido sem tentativa legível: nada a registrar, só um aviso sem dados', async () => {
    const portas = new PortasFalsas()
    await rodar(portas, { ...pacoteMinimo(), tentativa: 'nao-e-uuid' })
    expect(portas.eventos).toEqual([])
    expect(portas.avisos).toEqual(['pacote_invalido_sem_tentativa'])
  })

  it.each(['ler:interna', 'aplicar:interna'] as const)('falha da interna (%s): a pública nem é tentada', async (passo) => {
    const portas = new PortasFalsas()
    portas.falhas[passo] = new ErroDoGoogle('interna', 403)
    await rodar(portas)
    expect(portas.eventos.some((evento) => evento.endsWith('publica'))).toBe(false)
    expect(portas.eventos.at(-1)).toBe(`registrar:false:planilha_interna_recusada:${uuid(1)}:${'a'.repeat(64)}`)
  })

  it('interna certa e pública com falha: "Falhou" com o motivo da pública, e a interna já está escrita', async () => {
    const portas = new PortasFalsas()
    portas.falhas['aplicar:publica'] = new ErroDoGoogle('publica', 403)
    await rodar(portas)
    expect(portas.eventos).toEqual([
      'ler:interna', 'aplicar:interna', 'ler:publica', 'aplicar:publica',
      `registrar:false:planilha_publica_recusada:${uuid(1)}:${'a'.repeat(64)}`,
    ])
  })

  it('o Google fora do ar vira "google_indisponivel"', async () => {
    const portas = new PortasFalsas()
    portas.falhas['ler:interna'] = new ErroDoGoogle('interna', 503)
    await rodar(portas)
    expect(portas.eventos.at(-1)).toContain('registrar:false:google_indisponivel:')
  })

  it('erro inesperado vira "erro_interno", sem repetir a mensagem dele', async () => {
    const portas = new PortasFalsas()
    portas.falhas['aplicar:interna'] = new TypeError('mensagem com Nome Secreto')
    await rodar(portas)
    expect(portas.eventos.at(-1)).toContain('registrar:false:erro_interno:')
    expect(JSON.stringify(portas.eventos)).not.toContain('Secreto')
  })

  it('falha ao registrar o resultado não derruba o trabalho: só um aviso sem dados', async () => {
    const portas = new PortasFalsas()
    portas.registroFalha = true
    await expect(rodar(portas)).resolves.toBeUndefined()
    expect(portas.avisos).toEqual(['registro_do_resultado_falhou'])
  })

  it('as respostas, os eventos e os avisos não repetem nome de processo nem identificador de planilha', async () => {
    const portas = new PortasFalsas()
    const resposta = atender(portas)
    await resposta.depois?.()
    const tudo = JSON.stringify([{ status: resposta.status, codigo: resposta.codigo }, portas.eventos, portas.avisos])
    expect(tudo).not.toContain('Processo 10')
    expect(tudo).not.toContain('id-da-planilha')
  })
})
