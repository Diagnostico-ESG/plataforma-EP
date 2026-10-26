import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { EventoDoCadastro } from '../cadastros/tipos'
import type { ArquivoDaVersao, PedidoDeVersao } from './tipos'
import { VersoesFalso } from './VersoesFalso'

const PEDIDO: PedidoDeVersao = {
  processoId: 'p1', numero: 1,
  arquivos: [{ papel: 'bpm', arquivo: new File(['x'], 'a.bpm') }, { papel: 'png', arquivo: new File(['y'], 'a.png') }],
}

function falso(): VersoesFalso {
  const versoes = new VersoesFalso()
  versoes.processos.p1 = { sigla: 'TSA', nome: 'Emitir Ofício', etapa: 'Reunião de modelagem' }
  return versoes
}

test('o envio registra a versão com o número do banco, os nomes padrão, a etapa e o evento', async () => {
  const versoes = falso()
  const eventos: [string, EventoDoCadastro][] = []
  versoes.aoRegistrar = (processoId, evento) => eventos.push([processoId, evento])
  const progresso: string[] = []
  await versoes.enviarVersao(PEDIDO, (enviados, total) => progresso.push(`${enviados}/${total}`))
  const [versao] = await versoes.listarVersoes('p1')
  expect(versao).toMatchObject({ numero: 1, historica: false, piloto: false, etapa: 'Reunião de modelagem', autor: 'Pessoa de Teste' })
  expect(versao.arquivos.map((arquivo) => arquivo.nome)).toEqual(['TSA_V1_Emitir Ofício.bpm', 'TSA_V1_Emitir Ofício.png'])
  expect(progresso).toEqual(['1/2', '2/2'])
  expect(versoes.envios).toEqual([PEDIDO])
  expect(eventos[0][0]).toBe('p1')
  expect(eventos[0][1]).toMatchObject({ acao: 'enviar', entidade: 'versao', entidadeRef: 'p1', depois: { rotulo: 'V1' } })
})

const HISTORICA: PedidoDeVersao = {
  processoId: 'p1', numero: 5, arquivos: [{ papel: 'bpm', arquivo: new File(['z'], 'fonte.bpm') }],
}

test('a histórica guarda o número digitado, sem etapa, com o F nos nomes, e gera o evento próprio', async () => {
  const versoes = falso()
  const eventos: EventoDoCadastro[] = []
  versoes.aoRegistrar = (_processoId, evento) => eventos.push(evento)
  await versoes.registrarVersaoHistorica(HISTORICA, () => {})
  const [versao] = await versoes.listarVersoes('p1')
  expect(versao).toMatchObject({ numero: 5, historica: true, etapa: null })
  expect(versao.arquivos.map((arquivo) => arquivo.nome)).toEqual(['TSA_V5F_Emitir Ofício.bpm'])
  expect(eventos[0]).toMatchObject({ acao: 'registrar_historica', entidade: 'versao', depois: { rotulo: 'V5F', etapa: null } })
})

test('registra várias históricas, e a primeira versão nova continua a numeração (V5F → V6)', async () => {
  const versoes = falso()
  await versoes.registrarVersaoHistorica({ ...HISTORICA, numero: 3 }, () => {})
  await versoes.registrarVersaoHistorica(HISTORICA, () => {})
  await versoes.enviarVersao(PEDIDO, () => {})
  expect((await versoes.listarVersoes('p1')).map((versao) => versao.numero)).toEqual([6, 5, 3])
})

test('recusa o número de histórica repetido e a histórica depois da versão nova, com as frases do módulo real', async () => {
  const versoes = falso()
  await versoes.registrarVersaoHistorica(HISTORICA, () => {})
  await expect(versoes.registrarVersaoHistorica(HISTORICA, () => {}))
    .rejects.toThrow('O processo já tem a versão histórica V5F. Use outro número.')
  await versoes.enviarVersao(PEDIDO, () => {})
  const falha = await versoes.registrarVersaoHistorica({ ...HISTORICA, numero: 2 }, () => {}).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('O processo já tem versão nova; versões históricas só podem ser registradas antes dela.')
})

test('recusa a histórica sem .bpm nem o par .bpmn e .png', async () => {
  const versoes = falso()
  const soPng: PedidoDeVersao = { ...HISTORICA, arquivos: [{ papel: 'png', arquivo: new File(['y'], 'a.png') }] }
  await expect(versoes.registrarVersaoHistorica(soPng, () => {}))
    .rejects.toThrow('A versão histórica precisa do arquivo .bpm, ou do .bpmn com o .png.')
  expect(await versoes.listarVersoes('p1')).toEqual([])
})

test('recusa a versão sem .bpm, como o banco, e aceita só com o .bpm (o .png e o .bpmn são opcionais)', async () => {
  const versoes = falso()
  const semBpm: PedidoDeVersao = { ...PEDIDO, arquivos: [
    { papel: 'bpmn', arquivo: new File(['x'], 'a.bpmn') }, { papel: 'png', arquivo: new File(['y'], 'a.png') },
  ] }
  const soBpm: PedidoDeVersao = { ...PEDIDO, arquivos: [{ papel: 'bpm', arquivo: new File(['x'], 'a.bpm') }] }
  await expect(versoes.enviarVersao(semBpm, () => {})).rejects.toThrow('A versão precisa do .bpm.')
  expect(await versoes.listarVersoes('p1')).toEqual([])
  await versoes.enviarVersao(soBpm, () => {})
  await versoes.enviarVersao(PEDIDO, () => {})
  expect(await versoes.listarVersoes('p1')).toHaveLength(2)
})

test('as falhas programadas valem também para a histórica', async () => {
  const versoes = falso()
  versoes.falharNoArquivo = 1
  await expect(versoes.registrarVersaoHistorica(HISTORICA, () => {})).rejects.toThrow('o arquivo fonte.bpm não chegou ao Drive')
  versoes.falharNoArquivo = null
  versoes.falhaNoRegistro = 'sem conexão'
  await expect(versoes.registrarVersaoHistorica(HISTORICA, () => {})).rejects.toThrow('sem conexão')
  expect(await versoes.listarVersoes('p1')).toEqual([])
})

test('a lista vem da mais recente para a mais antiga', async () => {
  const versoes = falso()
  await versoes.enviarVersao(PEDIDO, () => {})
  await versoes.enviarVersao({ ...PEDIDO, numero: 2 }, () => {})
  expect((await versoes.listarVersoes('p1')).map((versao) => versao.numero)).toEqual([2, 1])
})

test('falha no envio de um arquivo não registra nada', async () => {
  const versoes = falso()
  versoes.falharNoArquivo = 2
  await expect(versoes.enviarVersao(PEDIDO, () => {})).rejects.toThrow('o arquivo a.png não chegou ao Drive')
  expect(await versoes.listarVersoes('p1')).toEqual([])
})

test('a falha programada no registro chega como foi programada', async () => {
  const versoes = falso()
  versoes.falhaNoRegistro = new TravaDoBanco('A versão precisa do .bpm.')
  await expect(versoes.enviarVersao(PEDIDO, () => {})).rejects.toBeInstanceOf(TravaDoBanco)
  expect(await versoes.listarVersoes('p1')).toEqual([])
})

test('a leitura com falha programada é recusada', async () => {
  const versoes = falso()
  versoes.falharLeitura = true
  await expect(versoes.listarVersoes('p1')).rejects.toThrow('falha de conexão simulada')
})

const ARQUIVO = { id: 'a1', papel: 'png', nome: 'TSA_V1_Emitir Ofício.png', formato: 'png', tamanho: 3 } as const

test('o download devolve um arquivo com o tipo do formato e guarda o pedido', async () => {
  const versoes = falso()
  const arquivo = await versoes.baixarArquivo(ARQUIVO)
  expect(arquivo.type).toBe('image/png')
  expect(versoes.baixados).toEqual(['a1'])
})

test('a falha programada no download chega como foi programada', async () => {
  const versoes = falso()
  versoes.falharNoDownload = new TravaDoBanco('O arquivo não foi encontrado no Drive. Avise o administrador.')
  await expect(versoes.baixarArquivo(ARQUIVO)).rejects.toBeInstanceOf(TravaDoBanco)
  versoes.falharNoDownload = true
  await expect(versoes.baixarArquivo(ARQUIVO)).rejects.toThrow('falha de conexão simulada')
  expect(versoes.baixados).toEqual([])
})

const NOVO_PNG = new File(['png novo'], 'trocado.png')

async function comUmEnvio(): Promise<{ versoes: VersoesFalso; png: ArquivoDaVersao }> {
  const versoes = falso()
  await versoes.enviarVersao(PEDIDO, () => {})
  const png = (await versoes.listarVersoes('p1'))[0].arquivos.find((arquivo) => arquivo.papel === 'png')
  if (!png) throw new Error('esperado: .png na versão enviada')
  return { versoes, png }
}

test('a substituição troca o conteúdo no mesmo arquivo, sem versão nova, e gera o evento com o nome e o hash do que saiu', async () => {
  const { versoes, png } = await comUmEnvio()
  const eventos: EventoDoCadastro[] = []
  versoes.aoRegistrar = (_processoId, evento) => eventos.push(evento)
  const progresso: string[] = []
  await versoes.substituirArquivo({ processoId: 'p1', numero: 1, arquivo: png, novo: NOVO_PNG }, (enviados, total) => progresso.push(`${enviados}/${total}`))
  const lidas = await versoes.listarVersoes('p1')
  expect(lidas).toHaveLength(1)
  expect(lidas[0].arquivos.find((arquivo) => arquivo.papel === 'png')).toEqual({ ...png, tamanho: NOVO_PNG.size })
  expect(progresso).toEqual(['1/1'])
  expect(eventos).toHaveLength(1)
  expect(eventos[0]).toMatchObject({
    acao: 'substituir', entidade: 'versao', entidadeRef: 'p1',
    antes: { nome: 'TSA_V1_Emitir Ofício.png' },
    depois: { rotulo: 'V1', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', nome: 'TSA_V1_Emitir Ofício.png' },
  })
  expect((eventos[0].antes as { hash_md5: string }).hash_md5).not.toBe((eventos[0].depois as { hash_md5: string }).hash_md5)
})

test('a substituição recusa outro tipo de arquivo e a versão histórica, com as frases do módulo real', async () => {
  const { versoes, png } = await comUmEnvio()
  await expect(versoes.substituirArquivo({ processoId: 'p1', numero: 1, arquivo: png, novo: new File(['x'], 'foto.jpg') }, () => {}))
    .rejects.toThrow('O arquivo novo precisa ser do mesmo tipo do que sai.')
  const historica = falso()
  await historica.registrarVersaoHistorica(HISTORICA, () => {})
  const bpm = (await historica.listarVersoes('p1'))[0].arquivos[0]
  await expect(historica.substituirArquivo({ processoId: 'p1', numero: 5, arquivo: bpm, novo: new File(['z'], 'outro.bpm') }, () => {}))
    .rejects.toThrow('A versão histórica é somente leitura: não recebe arquivos.')
})

test('as falhas programadas valem também para a substituição, e nada muda quando falha', async () => {
  const { versoes, png } = await comUmEnvio()
  const pedido = { processoId: 'p1', numero: 1, arquivo: png, novo: NOVO_PNG }
  versoes.falharNoArquivo = 1
  await expect(versoes.substituirArquivo(pedido, () => {})).rejects.toThrow('o arquivo trocado.png não chegou ao Drive')
  versoes.falharNoArquivo = null
  versoes.falhaNoRegistro = 'sem espaço'
  await expect(versoes.substituirArquivo(pedido, () => {})).rejects.toThrow('sem espaço')
  expect((await versoes.listarVersoes('p1'))[0].arquivos.find((arquivo) => arquivo.papel === 'png')).toEqual(png)
})

test('a conferência devolve ok para todo arquivo do processo e a situação programada, e registra o processo conferido', async () => {
  const { versoes, png } = await comUmEnvio()
  const [bpmn] = (await versoes.listarVersoes('p1'))[0].arquivos
  versoes.conferencia[png.id] = 'nao_encontrado'
  expect(await versoes.conferirArquivos('p1')).toEqual({ [bpmn.id]: 'ok', [png.id]: 'nao_encontrado' })
  expect(versoes.conferidos).toEqual(['p1'])
})

test('a conferência pode falhar por conexão', async () => {
  const { versoes } = await comUmEnvio()
  versoes.falharConferencia = true
  await expect(versoes.conferirArquivos('p1')).rejects.toThrow('falha de conexão simulada')
})

test('depois da substituição o arquivo volta a ficar ok (o banco passa a guardar o MD5 novo)', async () => {
  const { versoes, png } = await comUmEnvio()
  versoes.conferencia[png.id] = 'alterado'
  await versoes.substituirArquivo({ processoId: 'p1', numero: 1, arquivo: png, novo: NOVO_PNG }, () => {})
  expect((await versoes.conferirArquivos('p1'))[png.id]).toBe('ok')
})

test('a versão aprovada sai marcada na leitura e recusa a substituição, com a frase do módulo real', async () => {
  const { versoes, png } = await comUmEnvio()
  expect((await versoes.listarVersoes('p1'))[0].aprovada).toBeUndefined()
  versoes.aprovadas.p1 = 1
  expect((await versoes.listarVersoes('p1'))[0].aprovada).toBe(true)
  await expect(versoes.substituirArquivo({ processoId: 'p1', numero: 1, arquivo: png, novo: NOVO_PNG }, () => {}))
    .rejects.toThrow('A versão V1 foi aprovada e seus arquivos não podem ser substituídos.')
  delete versoes.aprovadas.p1
  await versoes.substituirArquivo({ processoId: 'p1', numero: 1, arquivo: png, novo: NOVO_PNG }, () => {})
})
