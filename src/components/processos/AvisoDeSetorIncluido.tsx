import { useCallback } from 'react'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'

type AvisoDeSetorIncluidoProps = {
  cadastros: ModuloDeCadastros
  setorId: string
  setorSigla: string
  macroprocessoId: string
  macroprocessoNome: string
}

/** Aviso amarelo: o setor escolhido ainda não é envolvido no macroprocesso, e o banco o inclui ao salvar. */
export function AvisoDeSetorIncluido({
  cadastros, setorId, setorSigla, macroprocessoId, macroprocessoNome,
}: AvisoDeSetorIncluidoProps) {
  const ler = useCallback(() => cadastros.lerMacroprocesso(macroprocessoId), [cadastros, macroprocessoId])
  const { estado } = useCarregamento(ler)
  // Carregando ou erro: sem aviso. O banco inclui o setor de qualquer jeito; o aviso só adianta o que vai acontecer.
  if (estado.tipo !== 'pronto' || estado.valor === null) return null
  if (estado.valor.setoresEnvolvidos.some((envolvido) => envolvido.setorId === setorId)) return null
  return (
    <p className="processo-aviso" role="status">
      O setor {setorSigla} ainda não está no macroprocesso {macroprocessoNome}; ele será incluído ao salvar.
    </p>
  )
}
