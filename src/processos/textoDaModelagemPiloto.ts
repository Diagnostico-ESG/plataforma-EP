/** O dia de hoje no relógio de quem usa (AAAA-MM-DD), que é como as datas dos processos são guardadas. */
export function hojeLocal(agora: Date = new Date()): string {
  const dois = (numero: number) => String(numero).padStart(2, '0')
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`
}
