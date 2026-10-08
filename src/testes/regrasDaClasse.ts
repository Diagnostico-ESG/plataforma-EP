/** Junta as declarações de todos os blocos do CSS cujo seletor cita a classe; o CSS vem cru (import com ?raw). */
export function regrasDaClasse(css: string, classe: string): string {
  return css.split('}')
    .filter((bloco) => bloco.split('{')[0].includes(classe))
    .map((bloco) => bloco.split('{')[1] ?? '')
    .join(';')
}
