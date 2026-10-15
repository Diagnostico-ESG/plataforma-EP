import { reunioesDoProcesso } from '../../reunioes/reunioesLigadas'
import type { ModuloDeReunioes } from '../../reunioes/tipos'
import { SecaoDeReunioes } from './SecaoDeReunioes'

type ReunioesDoProcessoProps = { reunioes: ModuloDeReunioes; processoId: string; setorId: string; podeAlterar: boolean }

/** Seção "Reuniões" do painel do processo: as reuniões de modelagem que o trataram; o registro já vem de modelagem. */
export function ReunioesDoProcesso({ reunioes, processoId, setorId, podeAlterar }: ReunioesDoProcessoProps) {
  return (
    <SecaoDeReunioes reunioes={reunioes} de="processo" selecionar={(todas) => reunioesDoProcesso(todas, processoId)}
      comProcessos={false} modelo={podeAlterar ? { setorId, tipo: 'modelagem', processoId } : null}
      classeDaSecao="painel-estrutura" classeDoTitulo="painel-subtitulo" />
  )
}
