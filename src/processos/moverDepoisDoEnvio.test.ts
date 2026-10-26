import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { moverDepoisDoEnvio } from './moverDepoisDoEnvio'

const quePassa = { moverProcesso: async () => undefined }
const queFalha = (erro: Error) => ({ moverProcesso: async () => { throw erro } })

test('move quando o movimento dá certo', async () => {
  await expect(moverDepoisDoEnvio(quePassa, 'p1', 'e3')).resolves.toBeUndefined()
})

test('a falha do movimento diz que os arquivos foram enviados', async () => {
  const erro = await moverDepoisDoEnvio(queFalha(new Error('conexão perdida')), 'p1', 'e3').catch((falha: unknown) => falha)
  expect(erro).toBeInstanceOf(TravaDoBanco)
  expect((erro as Error).message).toBe('Os arquivos foram enviados, mas o processo não foi movido.')
})

test('o processo que sumiu segue o caminho de sempre', async () => {
  await expect(moverDepoisDoEnvio(queFalha(new CadastroInexistente()), 'p1', 'e3')).rejects.toBeInstanceOf(CadastroInexistente)
})
