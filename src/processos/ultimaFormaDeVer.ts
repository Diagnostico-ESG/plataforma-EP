const CHAVE = 'ep:ultima-forma-de-ver'
const PADRAO = '#/processos'

// ponytail: só na sessão (sessionStorage), como a spec pede; guardar entre sessões ficou fora do escopo.
// O armazenamento pode faltar (janela anônima com bloqueio): sem ele, Processos abre o Quadro por etapa.
export function lembrarFormaDeVer(endereco: string): void {
  try {
    sessionStorage.setItem(CHAVE, endereco)
  } catch {
    // Sem armazenamento, não há o que lembrar.
  }
}

export function ultimaFormaDeVer(): string {
  try {
    return sessionStorage.getItem(CHAVE) ?? PADRAO
  } catch {
    return PADRAO
  }
}
