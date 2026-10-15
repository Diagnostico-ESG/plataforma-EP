import { formatarData } from '../processos/caminhoDeEtapas'
import type { Reuniao, TipoDeReuniao } from './tipos'

export const ROTULO_DO_TIPO_DE_REUNIAO: Record<TipoDeReuniao, string> = { sensibilizacao: 'Sensibilização', modelagem: 'Modelagem' }

/** "14/10/2026" ou, com hora, "14/10/2026 09:30". */
export function dataEHoraDaReuniao({ data, hora }: Pick<Reuniao, 'data' | 'hora'>): string {
  return hora ? `${formatarData(data)} ${hora}` : formatarData(data)
}
