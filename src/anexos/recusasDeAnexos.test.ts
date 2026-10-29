import { describe, expect, it } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { falhaDaFuncaoDoAnexo, textoDaFalhaDoAnexo } from './recusasDeAnexos'

describe('falhaDaFuncaoDoAnexo', () => {
  it.each([
    ['sem_permissao', 'Seu perfil não permite enviar anexos.'],
    ['usuario_inativo', 'Seu usuário está desativado; não é possível enviar anexos.'],
    ['sem_login', 'Sua sessão terminou. Entre de novo para enviar o anexo.'],
    ['processo_fora_de_andamento', 'O processo não está em andamento; não é possível enviar anexo.'],
    ['arquivo_nao_chegou', 'O anexo não chegou ao Drive. Envie de novo.'],
    ['arquivo_fora_da_pasta', 'O anexo não está na pasta do processo no Drive. Envie de novo.'],
    ['drive_indisponivel', 'Não foi possível falar com o Drive. Tente de novo em instantes.'],
    ['sem_espaco_no_drive', 'Não há espaço no Drive. Avise o administrador.'],
    ['entrada_invalida', 'Os dados do envio não foram aceitos. Confira o arquivo e envie de novo.'],
    ['extensao_nao_aceita', 'O anexo precisa ser .pdf, .docx, .xlsx, .png, .jpg, .jpeg ou .eml.'],
    ['arquivo_grande', 'O anexo pode ter até 20 MB.'],
  ])('%s vira a frase pronta, como TravaDoBanco', (codigo, frase) => {
    const erro = falhaDaFuncaoDoAnexo(codigo)
    expect(erro).toBeInstanceOf(TravaDoBanco)
    expect(erro.message).toBe(frase)
  })

  it('código desconhecido vira falha genérica, não frase', () => {
    const erro = falhaDaFuncaoDoAnexo('coisa_nova')
    expect(erro).not.toBeInstanceOf(TravaDoBanco)
    expect(erro.message).toBe('erro inesperado do servidor (coisa_nova)')
  })

  it('nenhuma frase fala em "versão"', () => {
    for (const codigo of ['sem_permissao', 'usuario_inativo', 'sem_login', 'processo_fora_de_andamento', 'entrada_invalida']) {
      expect(falhaDaFuncaoDoAnexo(codigo).message.toLowerCase()).not.toContain('versão')
    }
  })
})

describe('textoDaFalhaDoAnexo', () => {
  it('usa a frase pronta da recusa', () => {
    expect(textoDaFalhaDoAnexo(new TravaDoBanco('Seu perfil não permite enviar anexos.'))).toBe('Seu perfil não permite enviar anexos.')
  })

  it('nas outras falhas, diz que não foi possível enviar e o motivo', () => {
    expect(textoDaFalhaDoAnexo(new Error('sem conexão'))).toBe('Não foi possível enviar o anexo: sem conexão.')
    expect(textoDaFalhaDoAnexo('texto solto')).toBe('Não foi possível enviar o anexo: texto solto.')
  })
})
