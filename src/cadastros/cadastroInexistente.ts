import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'

export const TEXTO_DE_CADASTRO_INEXISTENTE = 'Este cadastro não existe mais. Ele pode ter sido excluído; veja o Histórico.'

/** A gravação mirou um cadastro que já não existe (excluído por outra pessoa): a tela mostra o aviso próprio. */
export class CadastroInexistente extends Error {
  name = 'CadastroInexistente'

  constructor() {
    super(TEXTO_DE_CADASTRO_INEXISTENTE)
  }
}

export const RECUSAS_DOS_CADASTROS: RecusasDoModulo = {
  semPermissao: 'Seu perfil não permite alterar os cadastros.',
  registroInexistente: () => new CadastroInexistente(),
}
