import { type FormEvent, useId, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import type { DadosDoSetor } from '../../cadastros/tipos'
import { normalizarSigla, problemaNoSetor } from '../../cadastros/validacaoDoSetor'

type FormularioDeSetorProps = { aoSalvar: (dados: DadosDoSetor) => Promise<void>; aoCancelar: () => void }

// noValidate: as mensagens são as nossas (com o valor digitado), não as do navegador.
export function FormularioDeSetor({ aoSalvar, aoCancelar }: FormularioDeSetorProps) {
  const [nome, setNome] = useState('')
  const [sigla, setSigla] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const id = useId()

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const problema = problemaNoSetor(nome, sigla)
    setAviso(problema)
    if (problema) return
    setEnviando(true)
    try {
      await aoSalvar({ nome: nome.trim(), sigla: normalizarSigla(sigla), observacoes: observacoes.trim() || null })
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
      setEnviando(false)
    }
  }

  return (
    <form className="form-setor" aria-label="Novo setor" noValidate onSubmit={enviar}>
      <h3 className="form-setor-titulo">Novo setor</h3>
      <label htmlFor={`${id}-nome`}>Nome</label>
      <input id={`${id}-nome`} value={nome} maxLength={200} autoComplete="off"
        onChange={(evento) => setNome(evento.target.value)} />
      <label htmlFor={`${id}-sigla`}>Sigla</label>
      <input id={`${id}-sigla`} value={sigla} autoComplete="off"
        aria-describedby={aviso ? `${id}-aviso` : undefined} onChange={(evento) => setSigla(evento.target.value)} />
      <label htmlFor={`${id}-observacoes`}>Observações</label>
      <textarea id={`${id}-observacoes`} value={observacoes} maxLength={2000} rows={3}
        onChange={(evento) => setObservacoes(evento.target.value)} />
      <div className="form-setor-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando}>Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p id={`${id}-aviso`} className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
