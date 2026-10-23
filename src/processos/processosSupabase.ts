import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { ClienteSupabase } from '../lib/supabase'
import { criarAndamentosSupabase } from './andamentosSupabase'
import { criarAnotacoesSupabase } from './anotacoesSupabase'
import { criarCatalogoSupabase } from './catalogoSupabase'
import { criarGravacaoDeProcessoSupabase } from './gravarProcessoSupabase'
import { criarLeituraDeProcessoSupabase } from './lerProcessoSupabase'
import { criarListaDeProcessosSupabase } from './listaDeProcessosSupabase'
import { criarPublicacaoSupabase } from './publicacaoSupabase'
import { criarReclassificacaoSupabase } from './reclassificacaoSupabase'
import { criarSituacaoSupabase } from './situacaoSupabase'
import type { ModuloDeProcessos } from './tipos'

// A etapa do setor só some junto com o setor, e o processo, quando outra pessoa o exclui: o aviso é o do item excluído.
export const RECUSAS_DOS_PROCESSOS: RecusasDoModulo = {
  semPermissao: 'Seu perfil não permite alterar os processos.',
  registroInexistente: () => new CadastroInexistente(),
}

export function criarProcessosSupabase(cliente: ClienteSupabase): ModuloDeProcessos {
  return {
    ...criarAndamentosSupabase(cliente, RECUSAS_DOS_PROCESSOS),
    ...criarAnotacoesSupabase(cliente, RECUSAS_DOS_PROCESSOS),
    ...criarSituacaoSupabase(cliente, RECUSAS_DOS_PROCESSOS),
    ...criarPublicacaoSupabase(cliente, RECUSAS_DOS_PROCESSOS),
    ...criarReclassificacaoSupabase(cliente, RECUSAS_DOS_PROCESSOS),
    ...criarListaDeProcessosSupabase(cliente),
    ...criarLeituraDeProcessoSupabase(cliente),
    ...criarGravacaoDeProcessoSupabase(cliente, RECUSAS_DOS_PROCESSOS),
    catalogo: criarCatalogoSupabase(cliente, RECUSAS_DOS_PROCESSOS),
  }
}
