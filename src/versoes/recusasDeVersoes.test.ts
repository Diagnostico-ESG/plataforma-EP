import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { falhaDaFuncao, falhaDoDownload, textoDaFalhaDoDownload } from './recusasDeVersoes'

test.each([
  ['sem_permissao', '', 'Seu perfil não permite enviar versões.'],
  ['usuario_inativo', '', 'Seu usuário está desativado; não é possível enviar versões.'],
  ['sem_login', '', 'Sua sessão terminou. Entre de novo para enviar a versão.'],
  ['processo_fora_de_andamento', 'suspenso', 'O processo não está em andamento; não é possível enviar versão.'],
  ['versao_sem_bpmn_e_png', '', 'A versão precisa do .bpmn e do .png.'],
  ['numero_da_versao_mudou', '4', 'Outra pessoa enviou uma versão enquanto você enviava; esta seria a V4. Envie de novo.'],
  ['extensao_nao_aceita', 'Tipo de arquivo não aceito.', 'Um dos arquivos tem um tipo que não é aceito no campo dele.'],
  ['arquivo_grande', 'O arquivo passa de 20 MB.', 'Um dos arquivos passa de 20 MB.'],
  ['sem_espaco_no_drive', '', 'Não há espaço no Drive. Avise o administrador.'],
  ['arquivo_nao_chegou', '', 'Um dos arquivos não chegou ao Drive. Envie de novo.'],
  ['nao_encontrado_no_drive', '', 'Um dos arquivos não chegou ao Drive. Envie de novo.'],
  ['arquivo_fora_da_pasta', '', 'Um dos arquivos não está na pasta do processo no Drive. Envie de novo.'],
  ['drive_indisponivel', '', 'Não foi possível falar com o Drive. Tente de novo em instantes.'],
])('o código %s vira a frase da tela', (codigo, mensagem, frase) => {
  const falha = falhaDaFuncao(codigo, mensagem)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(frase)
})

test('código desconhecido vira falha genérica com o código recebido', () => {
  const falha = falhaDaFuncao('erro_interno', 'Não foi possível concluir o pedido.')
  expect(falha).not.toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe('erro inesperado do servidor (erro_interno)')
})

test.each([
  ['sem_permissao', 'Você não pode baixar este arquivo.'],
  ['usuario_inativo', 'Seu usuário está desativado; não é possível baixar arquivos.'],
  ['sem_login', 'Sua sessão terminou. Entre de novo para baixar o arquivo.'],
  ['nao_encontrado_no_drive', 'O arquivo não foi encontrado no Drive. Avise o administrador.'],
  ['drive_indisponivel', 'Não foi possível falar com o Drive. Tente de novo em instantes.'],
])('no download, o código %s vira a frase da tela', (codigo, frase) => {
  const falha = falhaDoDownload(codigo)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe(frase)
})

test('no download, código desconhecido vira falha genérica com o código recebido', () => {
  const falha = falhaDoDownload('erro_interno')
  expect(falha).not.toBeInstanceOf(TravaDoBanco)
  expect(falha.message).toBe('erro inesperado do servidor (erro_interno)')
})

test('a falha do download com frase pronta aparece como veio; outra falha cita o arquivo e o motivo', () => {
  expect(textoDaFalhaDoDownload(new TravaDoBanco('Você não pode baixar este arquivo.'), 'a.png'))
    .toBe('Você não pode baixar este arquivo.')
  expect(textoDaFalhaDoDownload(new Error('não foi possível falar com o servidor (sem conexão?)'), 'a.png'))
    .toBe('Não foi possível baixar a.png: não foi possível falar com o servidor (sem conexão?).')
})
