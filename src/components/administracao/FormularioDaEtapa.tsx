import { type FormEvent, useId, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import type { EtapaNoCatalogo, NivelDaEtapa } from '../../processos/tipos'
import { problemaNaEtapa } from '../../processos/validacaoDaEtapa'
import { CamposDaEtapaNova } from './CamposDaEtapaNova'

/** O que o formulário entrega; na edição só nome e obrigatória valem. */
export type DadosDoFormularioDaEtapa = {
  nome: string
  codigo: string
  nivel: NivelDaEtapa
  obrigatoria: boolean
  antesDe: string | null
}

type FormularioDaEtapaProps = {
  titulo: string
  inicial?: EtapaNoCatalogo
  etapas: EtapaNoCatalogo[]
  aoSalvar: (dados: DadosDoFormularioDaEtapa) => Promise<void>
  aoCancelar: () => void
}

// noValidate: as mensagens são as nossas (com o valor digitado), não as do navegador.
export function FormularioDaEtapa({ titulo, inicial, etapas, aoSalvar, aoCancelar }: FormularioDaEtapaProps) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [codigo, setCodigo] = useState('')
  const [nivel, setNivel] = useState<NivelDaEtapa>('processo')
  const [posicao, setPosicao] = useState('')
  const [obrigatoria, setObrigatoria] = useState(inicial?.obrigatoria ?? false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const id = useId()

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const problema = problemaNaEtapa({ nome, codigo: inicial ? null : codigo })
    setAviso(problema)
    if (problema) return
    setEnviando(true)
    try {
      await aoSalvar({ nome: nome.trim(), codigo, nivel, obrigatoria, antesDe: posicao === '' ? null : posicao })
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
    }
    setEnviando(false)
  }

  return (
    <form className="form-setor" aria-label={titulo} noValidate onSubmit={enviar}>
      <h4 className="form-setor-titulo">{titulo}</h4>
      <label htmlFor={`${id}-nome`}>Nome</label>
      <input id={`${id}-nome`} value={nome} maxLength={200} autoComplete="off" onChange={(e) => setNome(e.target.value)} />
      {!inicial && <CamposDaEtapaNova id={id} etapas={etapas} codigo={codigo} nivel={nivel} posicao={posicao}
        aoMudarCodigo={setCodigo} aoMudarNivel={setNivel} aoMudarPosicao={setPosicao} />}
      <label className="campo-marcar">
        <input type="checkbox" checked={obrigatoria} onChange={(e) => setObrigatoria(e.target.checked)} /> Obrigatória
      </label>
      <div className="form-setor-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando}>Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
