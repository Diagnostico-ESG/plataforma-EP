import { describe, expect, it } from 'vitest'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { AnexosFalso } from './AnexosFalso'

const PROCESSOS = { p1: { sigla: 'TSA', nome: 'Emitir Ofício', etapa: 'Não iniciados' } }
const pedido = (nome = 'resposta.eml', tamanho = 3) => ({ processoId: 'p1', arquivo: new File(['x'.repeat(tamanho)], nome) })

function criar() {
  const eventos: EventoDoCadastro[] = []
  const falso = new AnexosFalso(PROCESSOS, (_processoId, evento) => eventos.push(evento))
  return { falso, eventos }
}

describe('AnexosFalso', () => {
  it('guarda o anexo com o nome original, a etapa atual do processo e o evento do histórico', async () => {
    const { falso, eventos } = criar()
    falso.etapaAtual = () => 'Modelagem piloto'
    const progresso: string[] = []
    await falso.enviarAnexo(pedido(), (enviados, total) => progresso.push(`${enviados}/${total}`))
    expect(await falso.listarAnexos('p1')).toMatchObject([
      { papel: 'anexo', nome: 'resposta.eml', formato: 'eml', tamanho: 3, etapa: 'Modelagem piloto', autor: 'Pessoa de Teste' },
    ])
    expect(progresso).toEqual(['1/1'])
    expect(eventos).toMatchObject([{
      acao: 'enviar', entidade: 'anexo', entidadeRef: 'p1', antes: null,
      depois: { nome: 'resposta.eml', formato: 'eml', etapa: 'Modelagem piloto', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA' },
    }])
    expect(falso.envios).toHaveLength(1)
  })

  it('a etapa do anexo não muda quando o processo anda: o seguinte guarda a etapa de então', async () => {
    const { falso } = criar()
    falso.etapaAtual = () => 'Não iniciados'
    await falso.enviarAnexo(pedido('um.pdf'), () => {})
    falso.etapaAtual = () => 'Validação com o setor'
    await falso.enviarAnexo(pedido('dois.pdf'), () => {})
    const etapas = Object.fromEntries((await falso.listarAnexos('p1')).map(({ nome, etapa }) => [nome, etapa]))
    expect(etapas).toEqual({ 'um.pdf': 'Não iniciados', 'dois.pdf': 'Validação com o setor' })
  })

  it('dois anexos de mesmo nome convivem, com ids diferentes, o mais recente primeiro', async () => {
    const { falso } = criar()
    await falso.enviarAnexo(pedido(), () => {})
    await falso.enviarAnexo(pedido(), () => {})
    const lista = await falso.listarAnexos('p1')
    expect(lista).toHaveLength(2)
    expect(new Set(lista.map(({ id }) => id)).size).toBe(2)
    expect(lista[0].id).not.toBe(lista[1].id)
  })

  it('processo sem anexo devolve a lista vazia', async () => {
    expect(await criar().falso.listarAnexos('p9')).toEqual([])
  })

  it('a falha programada no envio não guarda nada: texto vira erro comum, Error vai como está', async () => {
    const { falso } = criar()
    falso.falhaNoEnvio = 'Drive fora do ar'
    await expect(falso.enviarAnexo(pedido(), () => {})).rejects.toThrow('Drive fora do ar')
    const trava = new Error('frase pronta')
    falso.falhaNoEnvio = trava
    await expect(falso.enviarAnexo(pedido(), () => {})).rejects.toBe(trava)
    expect(await falso.listarAnexos('p1')).toEqual([])
  })

  it('a falha de leitura programada rejeita a lista', async () => {
    const { falso } = criar()
    falso.falharLeitura = true
    await expect(falso.listarAnexos('p1')).rejects.toThrow('falha de conexão simulada')
  })
})
