import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { EMITIR, montar, opcoes, escrever, formulario, preencher, salvar, cadastrar, abrirEdicao } from './testes/cadastroDeProcesso'
import { escolherNoMenuDoProcesso, janelasPorCima } from './testes/versoDoCartao'

beforeEach(() => {
  window.location.hash = '#/processos/novo'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})
test('o cadastro oferece só setores e macroprocessos ativos, com "A classificar" marcado, e não pede Origem, Contexto nem Observações', async () => {
  montar()
  const form = await formulario()
  expect(opcoes(form.getByLabelText('Setor'))).toEqual(['Escolha o setor', 'TSA — Setor Teste A', 'TSB — Setor Teste B'])
  expect(opcoes(form.getByLabelText('Macroprocesso'))).toEqual(['Escolha o macroprocesso', 'Macro A', 'Macro B'])
  expect((form.getByLabelText('Tipo') as HTMLSelectElement).value).toBe('a_classificar')
  expect(opcoes(form.getByLabelText('Tipo'))).toEqual(['Processo', 'Subprocesso', 'A classificar'])
  for (const rotulo of ['Origem', 'Contexto', 'Observações']) expect(form.queryByLabelText(rotulo)).toBeNull()
  expect(form.getByLabelText('Anotações')).toBeTruthy()
})

test('cadastrar grava os dados e abre o verso do criado; ao fechar, o cartão aparece na coluna da etapa atual', async () => {
  const falso = montar()
  const form = await formulario()
  preencher(form, { nome: ' Emitir Ofício ', setor: 's1', macro: 'm1' })
  escrever(form.getByLabelText('Tipo'), 'processo')
  cadastrar(form)
  await waitFor(() => expect(window.location.hash).toBe(`#/processos/${falso.processos[0].id}`))
  expect(falso.processos[0]).toMatchObject({ nome: 'Emitir Ofício', setorId: 's1', macroprocessoId: 'm1', tipo: 'processo' })
  for (const chave of ['origem', 'contexto', 'observacoes']) expect(falso.processos[0]).not.toHaveProperty(chave)
  const verso = await screen.findByRole('dialog', { name: 'Processo Emitir Ofício' })
  expect((await within(verso).findByText('Processo cadastrado')).getAttribute('role')).toBe('status')
  fireEvent.keyDown(within(verso).getByRole('heading', { name: 'Emitir Ofício', level: 2 }), { key: 'Escape' })
  const coluna = within(await screen.findByRole('region', { name: 'Reunião de modelagem' }))
  expect(await coluna.findByRole('link', { name: /Emitir Ofício/ })).toBeTruthy()
})

const DATA = 'Data da modelagem piloto'

test('o Novo processo não tem o campo da Data da modelagem piloto, e o processo nasce sem a data', async () => {
  const falso = montar()
  const form = await formulario()
  expect(form.queryByLabelText(DATA)).toBeNull()
  preencher(form, { nome: 'Emitir Ofício', setor: 's1', macro: 'm1' })
  cadastrar(form)
  await waitFor(() => expect(falso.processos).toHaveLength(1))
  expect(falso.processos[0].dataDaModelagemPiloto).toBeNull()
})

test('o Editar não tem o campo da Data da modelagem piloto: ela se registra na linha da etapa', async () => {
  expect((await abrirEdicao()).form.queryByLabelText(DATA)).toBeNull()
})

test('o aviso "Processo cadastrado" só vale para o verso recém-aberto pelo cadastro', async () => {
  montar()
  const form = await formulario()
  preencher(form, { nome: 'Emitir Ofício', setor: 's1', macro: 'm1' })
  cadastrar(form)
  const verso = await screen.findByRole('dialog', { name: 'Processo Emitir Ofício' })
  expect((await within(verso).findByText('Processo cadastrado')).getAttribute('role')).toBe('status')
  fireEvent.keyDown(within(verso).getByRole('heading', { name: 'Emitir Ofício', level: 2 }), { key: 'Escape' })
  fireEvent.click(await screen.findByRole('link', { name: /Emitir Ofício/ }))
  const reaberto = await screen.findByRole('dialog', { name: 'Processo Emitir Ofício' })
  expect(within(reaberto).queryByText('Processo cadastrado')).toBeNull()
})

test('o Novo processo tem o cabeçalho "Novo processo" e os botões [Cadastrar] e [Cancelar]', async () => {
  montar()
  const janela = within(await screen.findByRole('dialog', { name: 'Novo processo' }))
  expect(janela.getByRole('heading', { name: 'Novo processo', level: 2 })).toBeTruthy()
  const form = await formulario()
  expect(form.getByRole('button', { name: 'Cadastrar' })).toBeTruthy()
  expect(form.getByRole('button', { name: 'Cancelar' })).toBeTruthy()
  expect(form.queryByRole('button', { name: 'Salvar' })).toBeNull()
})

test('nome, setor e macroprocesso são obrigatórios, conferidos antes de enviar', async () => {
  const falso = montar()
  const form = await formulario()
  cadastrar(form)
  expect((await form.findByRole('alert')).textContent).toBe('O nome do processo é obrigatório.')
  preencher(form, { nome: 'Emitir Ofício' })
  cadastrar(form)
  expect((await form.findByRole('alert')).textContent).toBe('Escolha o setor do processo.')
  preencher(form, { setor: 's1' })
  cadastrar(form)
  expect((await form.findByRole('alert')).textContent).toBe('Escolha o macroprocesso do processo.')
  expect(falso.processos).toEqual([])
})

test('a recusa aparece dentro do rodapé fixo, e os campos obrigatórios são marcados', async () => {
  montar()
  const form = await formulario()
  for (const campo of ['Nome', 'Setor', 'Macroprocesso']) expect(form.getByLabelText(campo).getAttribute('aria-required')).toBe('true')
  cadastrar(form)
  const alerta = await form.findByRole('alert')
  expect(alerta.closest('.formulario-do-processo-rodape')).not.toBeNull()
})

test('nome repetido no mesmo setor: a recusa em vermelho e os dados continuam no formulário', async () => {
  montar({ processos: [EMITIR] })
  const form = await formulario()
  preencher(form, { nome: 'emitir ofício', setor: 's1', macro: 'm1' })
  cadastrar(form)
  const alerta = await form.findByRole('alert')
  expect(alerta.textContent).toBe('Já existe um processo com o nome emitir ofício no setor TSA.')
  expect(alerta.classList.contains('cadastros-falha')).toBe(true)
  expect((form.getByLabelText('Nome') as HTMLInputElement).value).toBe('emitir ofício')
})

test('o mesmo nome em outro setor é aceito', async () => {
  const falso = montar({ processos: [EMITIR] })
  const form = await formulario()
  preencher(form, { nome: 'Emitir Ofício', setor: 's2', macro: 'm1' })
  cadastrar(form)
  await waitFor(() => expect(falso.processos).toHaveLength(2))
})

test('falha de gravação: a mensagem com o motivo e os dados continuam no formulário', async () => {
  const falso = montar()
  falso.falhaDeGravacao = 'sem conexão'
  const form = await formulario()
  preencher(form, { nome: 'Emitir Ofício', setor: 's1', macro: 'm1' })
  cadastrar(form)
  expect((await form.findByRole('alert')).textContent)
    .toBe('A alteração não foi salva: sem conexão. Seus dados continuam no formulário.')
  expect((form.getByLabelText('Nome') as HTMLInputElement).value).toBe('Emitir Ofício')
  expect(window.location.hash).toBe('#/processos/novo')
})

test('setor fora do macroprocesso: o aviso amarelo de que ele será incluído, que some quando já está nele', async () => {
  montar()
  const form = await formulario()
  preencher(form, { setor: 's2', macro: 'm1' })
  const aviso = await form.findByText('O setor TSB ainda não está no macroprocesso Macro A; ele será incluído ao salvar.')
  expect(aviso.classList.contains('processo-aviso')).toBe(true)
  preencher(form, { setor: 's1' })
  await waitFor(() => expect(form.queryByText(/ele será incluído ao salvar/)).toBeNull())
})

test('Esc fecha o painel de cadastro sem gravar', async () => {
  const falso = montar()
  const form = await formulario()
  preencher(form, { nome: 'Emitir Ofício' })
  fireEvent.keyDown(screen.getByRole('dialog', { name: 'Novo processo' }), { key: 'Escape' })
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect(falso.processos).toEqual([])
  expect(form).toBeTruthy()
})

test('a Consulta não tem o formulário de cadastro', async () => {
  montar({ perfil: 'consulta' })
  await screen.findByText('Nenhum processo cadastrado ainda.')
  expect(screen.queryByRole('form', { name: 'Cadastrar processo' })).toBeNull()
})

test('[Editar] troca os dados pelo formulário preenchido, sem o campo de tipo, e salvar atualiza o painel', async () => {
  const { form } = await abrirEdicao()
  expect(form.queryByLabelText('Tipo')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Editar Emitir Ofício', level: 2 })).toBeTruthy()
  expect(form.queryByRole('button', { name: 'Cadastrar' })).toBeNull()
  expect(screen.getByRole('dialog', { name: 'Processo Emitir Ofício' }).classList.contains('verso-estreita')).toBe(true)
  expect((form.getByLabelText('Nome') as HTMLInputElement).value).toBe('Emitir Ofício')
  expect((form.getByLabelText('Setor') as HTMLSelectElement).value).toBe('s1')
  for (const rotulo of ['Origem', 'Contexto', 'Observações']) expect(form.queryByLabelText(rotulo)).toBeNull()
  escrever(form.getByLabelText('Nome'), 'Emitir Ofício Novo')
  salvar(form)
  const painel = within(screen.getByRole('dialog', { name: /^Processo( |$)/ }))
  expect(await painel.findByRole('heading', { name: 'Emitir Ofício Novo' })).toBeTruthy()
  expect(screen.queryByRole('form', { name: 'Editar processo' })).toBeNull()
  expect(window.location.hash).toBe('#/processos/p1')
})

test('falha ao editar mostra o motivo e mantém os dados; Cancelar volta aos dados sem gravar', async () => {
  const { falso, painel, form } = await abrirEdicao()
  falso.falhaDeGravacao = 'sem conexão'
  escrever(form.getByLabelText('Nome'), 'Outro Nome')
  salvar(form)
  expect((await form.findByRole('alert')).textContent)
    .toBe('A alteração não foi salva: sem conexão. Seus dados continuam no formulário.')
  expect((form.getByLabelText('Nome') as HTMLInputElement).value).toBe('Outro Nome')
  fireEvent.click(form.getByRole('button', { name: 'Cancelar' }))
  expect(await painel.findByRole('heading', { name: 'Emitir Ofício' })).toBeTruthy()
  expect(falso.processos[0].nome).toBe('Emitir Ofício')
})

test('mover de macroprocesso: o aviso do setor que será incluído e o painel com o macroprocesso novo', async () => {
  const { form } = await abrirEdicao()
  preencher(form, { macro: 'm2' })
  expect(await form.findByText('O setor TSA ainda não está no macroprocesso Macro B; ele será incluído ao salvar.')).toBeTruthy()
  salvar(form)
  const sobre = within(await screen.findByRole('region', { name: 'Sobre' }))
  await waitFor(() => expect(sobre.getByText('Macro B')).toBeTruthy())
})

test('editar um processo que já foi excluído por outra pessoa mostra o aviso próprio', async () => {
  const { falso, painel, form } = await abrirEdicao()
  falso.processos = []
  salvar(form)
  expect((await painel.findByRole('alert')).textContent).toContain('Este processo não existe mais.')
})

test('[Excluir] abre a janela com o texto da spec e o foco no Cancelar; Cancelar não exclui', async () => {
  window.location.hash = '#/processos/p1'
  const falso = montar({ processos: [EMITIR] })
  await escolherNoMenuDoProcesso('Excluir')
  const janela = within(screen.getByRole('dialog', { name: 'Excluir o processo Emitir Ofício?' }))
  expect(janela.getByText('O histórico guarda o que ele tinha, inclusive as etapas, mas não é possível desfazer.')).toBeTruthy()
  expect(document.activeElement).toBe(janela.getByRole('button', { name: 'Cancelar' }))
  fireEvent.click(janela.getByRole('button', { name: 'Cancelar' }))
  expect(janelasPorCima()).toEqual([])
  expect(falso.processos).toHaveLength(1)
})

test('confirmar a exclusão apaga o processo, fecha o painel e o cartão some do Quadro', async () => {
  window.location.hash = '#/processos/p1'
  const falso = montar({ processos: [EMITIR] })
  await escolherNoMenuDoProcesso('Excluir')
  fireEvent.click(screen.getByRole('button', { name: 'Excluir processo' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect(await screen.findByText('Nenhum processo cadastrado ainda.')).toBeTruthy()
  expect(falso.processos).toEqual([])
})

test('falha ao excluir mostra o motivo em vermelho no painel, que continua aberto', async () => {
  window.location.hash = '#/processos/p1'
  const falso = montar({ processos: [EMITIR] })
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  await escolherNoMenuDoProcesso('Excluir')
  falso.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar os processos.')
  fireEvent.click(screen.getByRole('button', { name: 'Excluir processo' }))
  const alerta = await painel.findByRole('alert')
  expect(alerta.textContent).toBe('Seu perfil não permite alterar os processos.')
  expect(alerta.classList.contains('cadastros-falha')).toBe(true)
  expect(falso.processos).toHaveLength(1)
})

test('excluir um processo que já foi excluído por outra pessoa mostra o aviso próprio', async () => {
  window.location.hash = '#/processos/p1'
  const falso = montar({ processos: [EMITIR] })
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  await escolherNoMenuDoProcesso('Excluir')
  act(() => { falso.processos = [] })
  fireEvent.click(screen.getByRole('button', { name: 'Excluir processo' }))
  expect((await painel.findByRole('alert')).textContent).toContain('Este processo não existe mais.')
})
