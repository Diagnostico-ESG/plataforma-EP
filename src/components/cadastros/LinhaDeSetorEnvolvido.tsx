import { useState } from 'react'
import type { ModuloDeCadastros, SetorEnvolvido } from '../../cadastros/tipos'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import { Pilula } from '../Pilula'

type LinhaDeSetorEnvolvidoProps = {
  cadastros: ModuloDeCadastros
  macroprocessoId: string
  setor: SetorEnvolvido
  aoMudar: () => void
  aoSumir: () => void
}

export function LinhaDeSetorEnvolvido({ cadastros, macroprocessoId, setor, aoMudar, aoSumir }: LinhaDeSetorEnvolvidoProps) {
  const [texto, setTexto] = useState(setor.observacao ?? '')
  const { falha, executar } = useGravacaoComFalha(aoSumir)

  // Grava ao sair do campo, e só se o texto mudou; vazio vira nulo, como no banco.
  async function gravarObservacao() {
    const nova = texto.trim() || null
    if (nova === setor.observacao) return
    await executar(() => cadastros.mudarObservacaoDoSetorEnvolvido(macroprocessoId, setor.setorId, nova), aoMudar)
  }

  return (
    <tr>
      <td>{setor.sigla}</td>
      <td>{setor.nome}{!setor.ativo && <> <Pilula situacao="neutra">Inativo</Pilula></>}</td>
      <td>
        <input className="observacao-do-setor" aria-label={`Observação de ${setor.sigla}`} value={texto}
          maxLength={500} autoComplete="off" onChange={(evento) => setTexto(evento.target.value)}
          onBlur={gravarObservacao} />
        {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      </td>
      <td>
        <button type="button" className="botao botao-secundario" aria-label={`Tirar ${setor.sigla}`}
          onClick={() => executar(() => cadastros.tirarSetorDoMacroprocesso(macroprocessoId, setor.setorId), aoMudar)}>
          Tirar
        </button>
      </td>
    </tr>
  )
}
