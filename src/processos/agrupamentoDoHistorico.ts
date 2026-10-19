import type { EventoDoCadastro } from '../cadastros/tipos'

export type GrupoDoHistorico = { rotulo: string; eventos: EventoDoCadastro[] }

const MS_DE_UM_DIA = 24 * 60 * 60 * 1000

const diaEMes = (data: Date) => data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
const diaMesEAno = (data: Date) => data.toLocaleDateString('pt-BR')

// A chave é o dia na hora de quem usa: um evento às 23h30 de ontem continua sendo de ontem.
function rotuloDoDia(dia: Date, agora: Date): string {
  const ontem = new Date(agora.getTime() - MS_DE_UM_DIA)
  if (diaMesEAno(dia) === diaMesEAno(agora)) return 'Hoje'
  if (diaMesEAno(dia) === diaMesEAno(ontem)) return 'Ontem'
  return dia.getFullYear() === agora.getFullYear() ? diaEMes(dia) : diaMesEAno(dia)
}

/** Agrupa os eventos por dia ("Hoje", "Ontem", "12/10"), mantendo a ordem recebida (do mais novo para o mais antigo). */
export function agruparPorDia(eventos: EventoDoCadastro[], agora: Date): GrupoDoHistorico[] {
  const grupos: GrupoDoHistorico[] = []
  for (const evento of eventos) {
    const rotulo = rotuloDoDia(new Date(evento.ocorridoEm), agora)
    const ultimo = grupos.at(-1)
    if (ultimo?.rotulo === rotulo) ultimo.eventos.push(evento)
    else grupos.push({ rotulo, eventos: [evento] })
  }
  return grupos
}
