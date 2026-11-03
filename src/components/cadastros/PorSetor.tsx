import { useCallback, useState } from 'react'
import type { ModuloDeCadastros, SetorEnvolvido } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import { BotaoDaCaixa, OpcaoDaCaixa } from '../OpcaoDaCaixa'
import { ErroAoCarregar } from './ErroAoCarregar'

type PorSetorProps = {
  cadastros: ModuloDeCadastros
  macroprocessoId: string
  envolvidos: SetorEnvolvido[]
  aoMudar: () => void
  aoSumir: () => void
}

/** Seletor dos setores ativos que ainda não estão no macroprocesso, mais o botão que grava na hora. */
export function PorSetor({ cadastros, macroprocessoId, envolvidos, aoMudar, aoSumir }: PorSetorProps) {
  const listar = useCallback(() => cadastros.listarSetores(), [cadastros])
  const { estado, tentarDeNovo } = useCarregamento(listar)
  const [escolhido, setEscolhido] = useState('')
  const { falha, executar } = useGravacaoComFalha(aoSumir)

  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os setores" aoTentarDeNovo={tentarDeNovo} />
  const jaEnvolvidos = new Set(envolvidos.map((setor) => setor.setorId))
  const opcoes = estado.tipo === 'pronto'
    ? estado.valor.filter((setor) => setor.ativo && !jaEnvolvidos.has(setor.id))
    : []

  return (
    <div className="por-setor">
      <select aria-label="Setor a pôr" value={escolhido} onChange={(evento) => setEscolhido(evento.target.value)}>
        <BotaoDaCaixa />
        <option value="">Escolha um setor</option>
        {opcoes.map((setor) => (
          <OpcaoDaCaixa key={setor.id} valor={setor.id} rotulo={`${setor.sigla} — ${setor.nome}`} corDoSetor={setor.cor} />
        ))}
      </select>
      <button type="button" className="botao botao-principal" disabled={escolhido === ''}
        onClick={() => executar(
          () => cadastros.porSetorNoMacroprocesso(macroprocessoId, escolhido),
          () => { setEscolhido(''); aoMudar() },
        )}>
        Pôr setor
      </button>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
    </div>
  )
}
