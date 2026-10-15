import { reunioesDoSetor } from '../../reunioes/reunioesLigadas'
import type { ModuloDeReunioes } from '../../reunioes/tipos'
import { SecaoDeReunioes } from './SecaoDeReunioes'

type ReunioesDoSetorProps = {
  reunioes: ModuloDeReunioes
  setorId: string
  /** [Registrar reunião] só para quem pode alterar e num setor ativo (o banco recusa reunião nova em setor inativo). */
  podeRegistrar: boolean
}

/** Seção "Reuniões" do setor aberto: as reuniões do setor, de qualquer tipo, com os processos tratados. */
export function ReunioesDoSetor({ reunioes, setorId, podeRegistrar }: ReunioesDoSetorProps) {
  return (
    <SecaoDeReunioes reunioes={reunioes} de="setor" selecionar={(todas) => reunioesDoSetor(todas, setorId)} comProcessos
      modelo={podeRegistrar ? { setorId, tipo: null, processoId: null } : null}
      classeDaSecao="processos-do-setor" classeDoTitulo="form-setor-titulo" />
  )
}
