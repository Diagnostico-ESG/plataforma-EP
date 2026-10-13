import { type ChangeEvent, type FormEvent, useId, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import type { DadosDoResponsavel, ResponsavelDoSetor } from '../../processos/tipos'
import {
  type CamposDoResponsavel, dadosDoResponsavel, problemaNoResponsavel,
} from '../../processos/validacaoDoResponsavel'

type FormularioDeResponsavelProps = {
  titulo: string
  inicial?: ResponsavelDoSetor
  aoSalvar: (dados: DadosDoResponsavel) => Promise<void>
  aoCancelar: () => void
}

// noValidate: as mensagens são as nossas (com o valor digitado), não as do navegador.
export function FormularioDeResponsavel({ titulo, inicial, aoSalvar, aoCancelar }: FormularioDeResponsavelProps) {
  const [campos, setCampos] = useState<CamposDoResponsavel>({
    nome: inicial?.nome ?? '', email: inicial?.email ?? '', cargo: inicial?.cargo ?? '',
  })
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const id = useId()
  const mudar = (campo: keyof CamposDoResponsavel) => (evento: ChangeEvent<HTMLInputElement>) =>
    setCampos({ ...campos, [campo]: evento.target.value })

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const problema = problemaNoResponsavel(campos)
    setAviso(problema)
    if (problema) return
    setEnviando(true)
    try {
      await aoSalvar(dadosDoResponsavel(campos))
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
    }
    setEnviando(false)
  }

  return (
    <form className="form-setor" aria-label={titulo} noValidate onSubmit={enviar}>
      <h4 className="form-setor-titulo">{titulo}</h4>
      <label htmlFor={`${id}-nome`}>Nome</label>
      <input id={`${id}-nome`} value={campos.nome} maxLength={200} autoComplete="off" onChange={mudar('nome')} />
      <label htmlFor={`${id}-email`}>E-mail</label>
      <input id={`${id}-email`} type="email" value={campos.email} maxLength={254} autoComplete="off"
        aria-describedby={aviso ? `${id}-aviso` : undefined} onChange={mudar('email')} />
      <label htmlFor={`${id}-cargo`}>Cargo</label>
      <input id={`${id}-cargo`} value={campos.cargo} maxLength={200} autoComplete="off" onChange={mudar('cargo')} />
      <div className="form-setor-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando}>Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p id={`${id}-aviso`} className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
