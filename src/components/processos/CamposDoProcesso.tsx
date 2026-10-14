import { useId } from 'react'
import type { Macroprocesso, Setor } from '../../cadastros/tipos'
import { ROTULO_DA_ORIGEM, ROTULO_DO_TIPO } from '../../processos/rotulos'
import type { OrigemDoProcesso, ProcessoDaLista, TipoDeProcesso } from '../../processos/tipos'
import type { CamposDoProcesso } from '../../processos/validacaoDoProcesso'

/** Os pais possíveis são os processos do tipo Processo (só no cadastro; na edição a lista fica vazia). */
export type OpcoesDoProcesso = { setores: Setor[]; macroprocessos: Macroprocesso[]; pais: ProcessoDaLista[] }

type CamposDoFormularioProps = {
  campos: CamposDoProcesso
  opcoes: OpcoesDoProcesso
  /** Tipo e pai só se escolhem no cadastro: depois dele, só a reclassificação os muda. */
  mostrarTipo: boolean
  aoMudar: (mudanca: Partial<CamposDoProcesso>) => void
}

const ORIGENS: OrigemDoProcesso[] = ['novo', 'retomado']
const TIPOS: TipoDeProcesso[] = ['processo', 'subprocesso', 'a_classificar']

/**
 * Os campos do formulário do processo. Setor e macroprocesso: só os ativos (e o atual, se já foi desativado).
 * No subprocesso, o macroprocesso fica fixo no do pai.
 */
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
      <CampoDoMacroprocesso id={id} campos={campos} macroprocessos={opcoes.macroprocessos} aoMudar={aoMudar} />
      {mostrarTipo && <CampoDoTipo id={id} valor={campos.tipo} aoMudar={aoMudar} />}
      {mostrarTipo && campos.tipo === 'subprocesso' && (
        <CampoDoPai id={id} valor={campos.processoPaiId} pais={opcoes.pais} aoMudar={aoMudar} />
      )}
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

type CampoProps = { id: string; aoMudar: CamposDoFormularioProps['aoMudar'] }

function CampoDoTipo({ id, valor, aoMudar }: CampoProps & { valor: TipoDeProcesso }) {
  return (
    <>
      <label htmlFor={`${id}-tipo`}>Tipo</label>
      <select id={`${id}-tipo`} value={valor} onChange={(evento) => aoMudar({ tipo: evento.target.value as TipoDeProcesso })}>
        {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{ROTULO_DO_TIPO[tipo]}</option>)}
      </select>
    </>
  )
}

function CampoDoPai({ id, valor, pais, aoMudar }: CampoProps & { valor: string; pais: ProcessoDaLista[] }) {
  return (
    <>
      <label htmlFor={`${id}-pai`}>Processo pai</label>
      <select id={`${id}-pai`} value={valor} onChange={(evento) => aoMudar({ processoPaiId: evento.target.value })}>
        <option value="">Escolha o processo pai</option>
        {pais.map((pai) => <option key={pai.id} value={pai.id}>{pai.setorSigla} — {pai.nome}</option>)}
      </select>
    </>
  )
}

type CampoDoMacroprocessoProps = CampoProps & { campos: CamposDoProcesso; macroprocessos: Macroprocesso[] }

function CampoDoMacroprocesso({ id, campos, macroprocessos, aoMudar }: CampoDoMacroprocessoProps) {
  return (
    <>
      <label htmlFor={`${id}-macroprocesso`}>Macroprocesso</label>
      <select id={`${id}-macroprocesso`} value={campos.macroprocessoId} disabled={campos.tipo === 'subprocesso'}
        onChange={(evento) => aoMudar({ macroprocessoId: evento.target.value })}>
        <option value="">Escolha o macroprocesso</option>
        {macroprocessos.filter((macro) => macro.ativo || macro.id === campos.macroprocessoId).map((macro) => (
          <option key={macro.id} value={macro.id}>{macro.nome}</option>
        ))}
      </select>
    </>
  )
}
