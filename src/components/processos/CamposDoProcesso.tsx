import { useId } from 'react'
import type { Macroprocesso, Setor } from '../../cadastros/tipos'
import { ROTULO_DA_ORIGEM } from '../../processos/rotulos'
import type { OrigemDoProcesso } from '../../processos/tipos'
import type { CamposDoProcesso } from '../../processos/validacaoDoProcesso'

export type OpcoesDoProcesso = { setores: Setor[]; macroprocessos: Macroprocesso[] }

type CamposDoFormularioProps = {
  campos: CamposDoProcesso
  opcoes: OpcoesDoProcesso
  /** O tipo só se escolhe no cadastro: depois dele, só a reclassificação o muda. */
  mostrarTipo: boolean
  aoMudar: (mudanca: Partial<CamposDoProcesso>) => void
}

const ORIGENS: OrigemDoProcesso[] = ['novo', 'retomado']

/** Os campos do formulário do processo. Setor e macroprocesso: só os ativos (e o atual, se já foi desativado). */
export function CamposDoFormulario({ campos, opcoes, mostrarTipo, aoMudar }: CamposDoFormularioProps) {
  const id = useId()
  return (
    <>
      <label htmlFor={`${id}-nome`}>Nome</label>
      <input id={`${id}-nome`} value={campos.nome} maxLength={200} autoComplete="off"
        onChange={(evento) => aoMudar({ nome: evento.target.value })} />
      <label htmlFor={`${id}-setor`}>Setor</label>
      <select id={`${id}-setor`} value={campos.setorId} onChange={(evento) => aoMudar({ setorId: evento.target.value })}>
        <option value="">Escolha o setor</option>
        {opcoes.setores.filter((setor) => setor.ativo || setor.id === campos.setorId).map((setor) => (
          <option key={setor.id} value={setor.id}>{setor.sigla} — {setor.nome}</option>
        ))}
      </select>
      <label htmlFor={`${id}-macroprocesso`}>Macroprocesso</label>
      <select id={`${id}-macroprocesso`} value={campos.macroprocessoId}
        onChange={(evento) => aoMudar({ macroprocessoId: evento.target.value })}>
        <option value="">Escolha o macroprocesso</option>
        {opcoes.macroprocessos.filter((macro) => macro.ativo || macro.id === campos.macroprocessoId).map((macro) => (
          <option key={macro.id} value={macro.id}>{macro.nome}</option>
        ))}
      </select>
      {mostrarTipo && <CampoDoTipo id={id} valor={campos.tipo} aoMudar={aoMudar} />}
      <label htmlFor={`${id}-origem`}>Origem</label>
      <select id={`${id}-origem`} value={campos.origem}
        onChange={(evento) => aoMudar({ origem: evento.target.value as OrigemDoProcesso })}>
        {ORIGENS.map((origem) => <option key={origem} value={origem}>{ROTULO_DA_ORIGEM[origem]}</option>)}
      </select>
      <label htmlFor={`${id}-contexto`}>Contexto</label>
      <textarea id={`${id}-contexto`} value={campos.contexto} maxLength={4000} rows={3}
        onChange={(evento) => aoMudar({ contexto: evento.target.value })} />
      <label htmlFor={`${id}-observacoes`}>Observações</label>
      <textarea id={`${id}-observacoes`} value={campos.observacoes} maxLength={2000} rows={3}
        onChange={(evento) => aoMudar({ observacoes: evento.target.value })} />
    </>
  )
}

type CampoDoTipoProps = { id: string; valor: CamposDoProcesso['tipo']; aoMudar: CamposDoFormularioProps['aoMudar'] }

function CampoDoTipo({ id, valor, aoMudar }: CampoDoTipoProps) {
  return (
    <>
      <label htmlFor={`${id}-tipo`}>Tipo</label>
      <select id={`${id}-tipo`} value={valor}
        onChange={(evento) => aoMudar({ tipo: evento.target.value as CamposDoProcesso['tipo'] })}>
        <option value="processo">Processo</option>
        <option value="a_classificar">A classificar</option>
      </select>
    </>
  )
}
