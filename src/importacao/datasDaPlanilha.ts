export type DataLida = { iso: string | null; ilegivel: boolean }

const DIA_MES_ANO = /^(\d{1,2})[ /](\d{1,2})[ /](\d{4})$/

/**
 * A planilha escreve a data como "16 10 2026" (dia mês ano com espaços) ou "01/09/2026". Vazio não é erro; qualquer
 * outro formato, ou um dia que não existe (31/02), volta ilegível para a leitura avisar e seguir sem a data.
 */
export function lerData(valor: string): DataLida {
  const texto = valor.trim()
  if (texto === '') return { iso: null, ilegivel: false }
  const partes = DIA_MES_ANO.exec(texto)
  if (!partes) return { iso: null, ilegivel: true }
  const [dia, mes, ano] = [Number(partes[1]), Number(partes[2]), Number(partes[3])]
  const data = new Date(ano, mes - 1, dia)
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return { iso: null, ilegivel: true }
  return { iso: `${String(ano)}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`, ilegivel: false }
}

/** Data ISO (aaaa-mm-dd) depois de hoje; a data da modelagem piloto só existe como realização. */
export function ehFutura(iso: string, hoje: Date): boolean {
  const hojeIso = `${String(hoje.getFullYear())}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
  return iso > hojeIso
}
