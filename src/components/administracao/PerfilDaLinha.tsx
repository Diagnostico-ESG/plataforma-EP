import { useRef, useState } from 'react'
import { textoDaFalha } from '../../acesso/falhasDeGravacao'
import type { Perfil } from '../../acesso/tipos'
import { SeletorDePerfil } from './SeletorDePerfil'

type PerfilDaLinhaProps = { email: string; perfilGravado: Perfil; aoSalvar: (perfil: Perfil) => Promise<void> }

// Escolher não grava (no Windows cada seta do teclado troca a opção); só o Salvar grava (ADR 0003).
// Depois de salvar, a lista relida traz o perfil novo e os botões somem, porque a escolha fica igual ao gravado;
// ao salvar ou cancelar, o foco volta ao seletor para não cair no topo da página com os botões.
export function PerfilDaLinha({ email, perfilGravado, aoSalvar }: PerfilDaLinhaProps) {
  const [escolha, setEscolha] = useState(perfilGravado)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const seletor = useRef<HTMLSelectElement>(null)

  async function salvar() {
    setAviso(null)
    setEnviando(true)
    try {
      await aoSalvar(escolha)
      seletor.current?.focus()
    } catch (erro) {
      setAviso(textoDaFalha(erro))
    } finally {
      setEnviando(false)
    }
  }

  function cancelar() {
    setEscolha(perfilGravado)
    setAviso(null)
    seletor.current?.focus()
  }

  return (
    <span className="perfil-da-linha">
      <SeletorDePerfil ref={seletor} rotulo={`Perfil de ${email}`} valor={escolha} aoMudar={setEscolha} />
      {escolha !== perfilGravado && (
        <>
          <button type="button" className="botao botao-principal" aria-label={`Salvar perfil de ${email}`}
            disabled={enviando} onClick={salvar}>Salvar</button>
          <button type="button" className="botao botao-secundario" aria-label={`Cancelar perfil de ${email}`}
            onClick={cancelar}>Cancelar</button>
        </>
      )}
      {aviso && <p className="administracao-falha" role="alert">{aviso}</p>}
    </span>
  )
}
