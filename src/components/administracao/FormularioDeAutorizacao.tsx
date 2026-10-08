import { type FormEvent, useId, useState } from 'react'
import { normalizarEmail, problemaNoEmail } from '../../acesso/emailInstitucional'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import type { Perfil } from '../../acesso/tipos'
import { SeletorDePerfil } from './SeletorDePerfil'

type FormularioDeAutorizacaoProps = { aoAutorizar: (email: string, perfil: Perfil) => Promise<void> }

// noValidate: a mensagem de formato é a nossa (com o valor digitado), não a do navegador.
export function FormularioDeAutorizacao({ aoAutorizar }: FormularioDeAutorizacaoProps) {
  const [email, setEmail] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('consulta')
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const idDoEmail = useId()
  const idDoPerfil = useId()
  const idDoAviso = useId()

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const problema = problemaNoEmail(email)
    setAviso(problema)
    if (problema) return
    setEnviando(true)
    try {
      await aoAutorizar(normalizarEmail(email), perfil)
      setEmail('')
      setPerfil('consulta')
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="form-autorizacao" aria-label="Autorizar e-mail" noValidate onSubmit={enviar}>
      <h3 className="form-autorizacao-titulo">Autorizar e-mail</h3>
      <label htmlFor={idDoEmail}>E-mail</label>
      <input id={idDoEmail} type="email" value={email} placeholder="nome@ccivil.pr.gov.br" autoComplete="off"
        aria-invalid={aviso !== null} aria-describedby={aviso ? idDoAviso : undefined}
        onChange={(evento) => setEmail(evento.target.value)} />
      <label htmlFor={idDoPerfil}>Perfil</label>
      <SeletorDePerfil id={idDoPerfil} valor={perfil} aoMudar={setPerfil} />
      <button type="submit" className="botao botao-principal" disabled={enviando}>Autorizar</button>
      {aviso && <p id={idDoAviso} className="administracao-falha" role="alert">{aviso}</p>}
    </form>
  )
}
