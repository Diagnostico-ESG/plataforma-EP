import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { falhaDaFuncao, falhaDoDownload, textoDaFalhaDoDownload } from './recusasDeVersoes'

test.each([
  ['sem_permissao', '', 'Seu perfil não permite enviar versões.'],
  ['usuario_inativo', '', 'Seu usuário está desativado; não é possível enviar versões.'],
  ['sem_login', '', 'Sua sessão terminou. Entre de novo para enviar a versão.'],
  ['processo_fora_de_andamento', 'suspenso', 'O processo não está em andamento; não é possível enviar versão.'],
  ['versao_sem_bpm', '', 'A versão precisa do .bpm.'],
  ['numero_da_piloto_nao_maior', '6', 'O número da versão piloto precisa ser maior que 6.'],
  ['piloto_depois_de_versao_em_sequencia', '', 'O processo já tem versão em sequência; a versão piloto só pode ser enviada antes dela.'],
  ['piloto_fora_da_etapa', '', 'A versão piloto só pode ser enviada até a Modelagem piloto.'],
  ['versao_fora_da_etapa', '', 'A versão só pode ser enviada até a Revisão interna.'],
  ['historica_fora_de_nao_iniciados', '', 'A versão histórica só pode ser registrada em Não iniciados.'],
  ['arquivo_ja_existe', '', 'A versão já tem esse arquivo.'],
  ['papel_nao_acrescentavel', '', 'Só o .png e o .bpmn podem ser acrescentados depois.'],
  ['numero_da_versao_mudou', '4', 'Outra pessoa enviou uma versão enquanto você enviava; esta seria a V4. Envie de novo.'],
  ['extensao_nao_aceita', 'Tipo de arquivo não aceito.', 'Um dos arquivos tem um tipo que não é aceito no campo dele.'],
  ['arquivo_grande', 'O arquivo passa de 20 MB.', 'Um dos arquivos passa de 20 MB.'],
  ['sem_espaco_no_drive', '', 'Não há espaço no Drive. Avise o administrador.'],
  ['arquivo_nao_chegou', '', 'Um dos arquivos não chegou ao Drive. Envie de novo.'],
  ['nao_encontrado_no_drive', '', 'Um dos arquivos não chegou ao Drive. Envie de novo.'],
  ['arquivo_fora_da_pasta', '', 'Um dos arquivos não está na pasta do processo no Drive. Envie de novo.'],
  ['drive_indisponivel', '', 'Não foi possível falar com o Drive. Tente de novo em instantes.'],
  ['historica_depois_de_versao_nova', '', 'O processo já tem versão nova; versões históricas só podem ser registradas antes dela.'],
  ['numero_historico_repetido', '5', 'O processo já tem a versão histórica V5F. Use outro número.'],
  ['historica_sem_arquivo_de_fluxograma', '', 'A versão histórica precisa do arquivo .bpm, ou do .bpmn com o .png.'],
  ['numero_do_relatorio_mudou', '4', 'Outra pessoa enviou um relatório enquanto você enviava; este seria o Relatório V4. Envie de novo.'],
  ['relatorio_so_docx', '', 'O relatório precisa ser um arquivo .docx.'],
  ['relatorio_sem_versao', '', 'Não há versão para receber o relatório: envie a versão piloto ou uma versão primeiro.'],
  ['relatorio_fora_da_etapa', '', 'O relatório só pode ser enviado até a Revisão interna.'],
  ['relatorio_fora_da_versao_mais_recente', '', 'O relatório precisa acompanhar a versão mais recente.'],
  ['versao_historica_somente_leitura', '', 'A versão histórica é somente leitura: não recebe arquivos.'],
  ['versao_aprovada', '8', 'A versão V8 foi aprovada e seus arquivos não podem ser substituídos.'],
  ['versao_aprovada', 'A versão está aprovada: seus arquivos não podem ser substituídos. (8)', 'A versão V8 foi aprovada e seus arquivos não podem ser substituídos.'],
  ['tipo_de_arquivo_diferente', 'pdf', 'O arquivo novo precisa ser do mesmo tipo do que sai.'],
  ['entrada_invalida', 'campo numero: esperado inteiro', 'Os dados do envio não foram aceitos. Confira os campos e os arquivos e envie de novo.'],
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
