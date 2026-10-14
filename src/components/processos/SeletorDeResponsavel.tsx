import type { EtapaDoProcesso, UsuarioResponsavel } from '../../processos/tipos'

type SeletorDeResponsavelProps = {
  etapa: EtapaDoProcesso
  /** Só quem pode ser responsável: ativos, Administrador ou Integrante. */
  usuarios: UsuarioResponsavel[]
  aoEscolher: (usuarioId: string | null) => void
}

/**
 * O responsável da etapa. Quem foi desativado depois de escolhido continua selecionado, marcado "Inativo", e não
 * se escolhe de novo (opção desabilitada).
 */
export function SeletorDeResponsavel({ etapa, usuarios, aoEscolher }: SeletorDeResponsavelProps) {
  const atual = etapa.responsavelId
  const foraDaLista = atual !== null && !usuarios.some((usuario) => usuario.id === atual)
  return (
    <span className="etapa-responsavel">
      Responsável:{' '}
      <select aria-label={`Responsável de ${etapa.nome}`} value={atual ?? ''}
        onChange={(mudanca) => aoEscolher(mudanca.target.value === '' ? null : mudanca.target.value)}>
        <option value="">Sem responsável</option>
        {foraDaLista && (
          <option value={atual} disabled={etapa.responsavelInativo}>
            {etapa.responsavelNome}{etapa.responsavelInativo ? ' (Inativo)' : ''}
          </option>
        )}
        {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
      </select>
    </span>
  )
}
