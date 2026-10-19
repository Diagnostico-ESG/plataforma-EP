import { partesDoNome } from '../../processos/buscaNaLista'

/** O nome com o trecho da busca marcado; o texto continua inteiro, então o leitor de tela lê o nome todo. */
export function NomeComTrecho({ nome, busca }: { nome: string; busca: string | null }) {
  if (!busca) return <>{nome}</>
  return (
    <>
      {partesDoNome(nome, busca).map((parte, i) => (parte.achado ? <mark key={i}>{parte.texto}</mark> : parte.texto))}
    </>
  )
}
