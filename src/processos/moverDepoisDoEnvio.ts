import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { FRASE_DOS_ARQUIVOS_ENVIADOS } from './frasesDeTravaDeArquivos'
import type { ModuloDeProcessos } from './tipos'

/**
 * O movimento que vem logo depois do envio da janela da trava: se falha, a pessoa precisa saber que os arquivos já foram
 * (a tela os relê e a trava não abre de novo); o motivo real aparece quando ela repete o movimento. Processo que sumiu
 * segue o caminho de sempre.
 */
export async function moverDepoisDoEnvio(
  processos: Pick<ModuloDeProcessos, 'moverProcesso'>, id: string, etapaId: string,
): Promise<void> {
  try {
    await processos.moverProcesso(id, etapaId)
  } catch (erro) {
    if (erro instanceof CadastroInexistente) throw erro
    throw new TravaDoBanco(FRASE_DOS_ARQUIVOS_ENVIADOS)
  }
}
