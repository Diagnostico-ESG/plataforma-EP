import { type FormEvent, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'

type CorrecaoDeNomeProps = {
  email: string
  nomeAtual: string
  aoSalvar: (nome: string) => Promise<void>
  aoCancelar: () => void
}

export function CorrecaoDeNome({ email, nomeAtual, aoSalvar, aoCancelar }: CorrecaoDeNomeProps) {
  const [nome, setNome] = useState(nomeAtual)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setAviso(null)
    setEnviando(true)
    try {
      await aoSalvar(nome.trim())
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
    } finally {
      setEnviando(false)
    }
  }

  // autoFocus: o botão "Corrigir nome" some ao abrir o formulário; o foco vai para o campo.
  return (
    <form className="correcao-de-nome" aria-label={`Corrigir nome de ${email}`} onSubmit={enviar}>
      <input aria-label={`Nome de ${email}`} value={nome} autoFocus onChange={(evento) => setNome(evento.target.value)} />
      <button type="submit" className="botao botao-principal" disabled={enviando || !nome.trim()}>Salvar</button>
      <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
      {aviso && <p className="administracao-falha" role="alert">{aviso}</p>}
    </form>
  )
}
