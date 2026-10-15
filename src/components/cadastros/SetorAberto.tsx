import { useCallback, useState } from 'react'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos } from '../../processos/tipos'
import type { ModuloDeReunioes } from '../../reunioes/tipos'
import { ReunioesDoSetor } from '../reunioes/ReunioesDoSetor'
import { EtapasDoSetor } from '../processos/EtapasDoSetor'
import { ProcessosDoSetor } from '../processos/ProcessosDoSetor'
import { ResponsaveisDoSetor } from '../processos/ResponsaveisDoSetor'
import { ErroAoCarregar } from './ErroAoCarregar'
import { SetorEditavel } from './SetorEditavel'
import { ItemInexistente } from './ItemInexistente'
import { SetorSomenteLeitura } from './SetorSomenteLeitura'

type SetorAbertoProps = {
  cadastros: ModuloDeCadastros
  processos: ModuloDeProcessos
  reunioes: ModuloDeReunioes
  podeAlterar: boolean
  id: string
  aoVoltar: () => void
}

export function SetorAberto({ cadastros, processos, reunioes, podeAlterar, id, aoVoltar }: SetorAbertoProps) {
  const ler = useCallback(() => cadastros.lerSetor(id), [cadastros, id])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const [sumiu, setSumiu] = useState(false)

  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="o setor" aoTentarDeNovo={tentarDeNovo} />
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando setor…</p>
  if (sumiu || estado.valor === null) return <ItemInexistente aoVoltar={aoVoltar} />
  // Responsáveis, etapas, processos e reuniões do setor ficam abaixo do que o setor já mostrava, para os dois modos.
  const secoes = (
    <>
      <ResponsaveisDoSetor processos={processos} setorId={id} podeAlterar={podeAlterar} />
      <EtapasDoSetor processos={processos} setorId={id} podeAlterar={podeAlterar} aoSumir={() => setSumiu(true)} />
      <ProcessosDoSetor processos={processos} setorId={id} />
      <ReunioesDoSetor reunioes={reunioes} setorId={id} podeRegistrar={podeAlterar && estado.valor.ativo} />
    </>
  )
  if (!podeAlterar) return <><SetorSomenteLeitura setor={estado.valor} aoVoltar={aoVoltar} />{secoes}</>
  return (
    <>
      <SetorEditavel cadastros={cadastros} setor={estado.valor} aoVoltar={aoVoltar}
        aoSumir={() => setSumiu(true)} aoMudar={recarregar} />
      {secoes}
    </>
  )
}
