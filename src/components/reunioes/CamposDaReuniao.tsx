import { useId } from 'react'
import { ROTULO_DO_TIPO_DE_REUNIAO } from '../../reunioes/rotulos'
import type { CamposDaReuniao } from '../../reunioes/validacaoDaReuniao'
import type { ModuloDeReunioes, Reuniao, SetorParaReuniao, TipoDeReuniao } from '../../reunioes/tipos'
import { EscolhaDeProcessos } from './EscolhaDeProcessos'
import { ParticipantesDoFormulario } from './ParticipantesDoFormulario'

type CamposDoFormularioProps = {
  campos: CamposDaReuniao
  setores: SetorParaReuniao[]
  reunioes: ModuloDeReunioes
  /** Na edição, a reunião que já existe (para os participantes marcados que saíram das listas). */
  reuniao?: Reuniao
  aoMudar: (mudanca: Partial<CamposDaReuniao>) => void
}

const TIPOS: TipoDeReuniao[] = ['sensibilizacao', 'modelagem']

/** Os campos do formulário da reunião. Setor: só os ativos. Processos: só na modelagem, depois de escolhido o setor. */
export function CamposDoFormulario({ campos, setores, reunioes, reuniao, aoMudar }: CamposDoFormularioProps) {
  const id = useId()
  return (
    <>
      <fieldset className="reuniao-tipo">
        <legend>Tipo</legend>
        {TIPOS.map((tipo) => (
          <label key={tipo} className="reuniao-tipo-opcao">
            <input type="radio" name={`${id}-tipo`} value={tipo} checked={campos.tipo === tipo}
              onChange={() => aoMudar({ tipo })} />
            {ROTULO_DO_TIPO_DE_REUNIAO[tipo]}
          </label>
        ))}
      </fieldset>
      <label htmlFor={`${id}-setor`}>Setor</label>
      <select id={`${id}-setor`} value={campos.setorId} onChange={(evento) => aoMudar({ setorId: evento.target.value })}>
        <option value="">Escolha o setor</option>
        {setores.map((setor) => (
          <option key={setor.id} value={setor.id}>{setor.inativo ? `${setor.sigla} (inativo)` : `${setor.sigla} — ${setor.nome}`}</option>
        ))}
      </select>
      {campos.tipo === 'modelagem' && campos.setorId && (
        <EscolhaDeProcessos key={campos.setorId} reunioes={reunioes} setorId={campos.setorId}
          marcados={campos.processosIds} aoMudar={(processosIds) => aoMudar({ processosIds })} />
      )}
      <label htmlFor={`${id}-data`}>Data</label>
      <input id={`${id}-data`} type="date" value={campos.data} onChange={(evento) => aoMudar({ data: evento.target.value })} />
      <label htmlFor={`${id}-hora`}>Hora (opcional)</label>
      <input id={`${id}-hora`} type="time" value={campos.hora} onChange={(evento) => aoMudar({ hora: evento.target.value })} />
      <label htmlFor={`${id}-local`}>Local</label>
      <input id={`${id}-local`} value={campos.local} maxLength={300} autoComplete="off"
        onChange={(evento) => aoMudar({ local: evento.target.value })} />
      <ParticipantesDoFormulario campos={campos} reunioes={reunioes} reuniao={reuniao} aoMudar={aoMudar} />
      <label htmlFor={`${id}-anotacoes`}>Anotações</label>
      <textarea id={`${id}-anotacoes`} value={campos.anotacoes} maxLength={10000} rows={8}
        onChange={(evento) => aoMudar({ anotacoes: evento.target.value })} />
    </>
  )
}
