import type { ModuloDeAcesso } from './acesso/tipos'
import { TelaDeEntrada } from './components/entrada/TelaDeEntrada'
import { Moldura } from './components/moldura/Moldura'
import { QuadroVazio } from './components/quadro/QuadroVazio'
import { useEntrada } from './hooks/useEntrada'

type AppProps = { acesso: ModuloDeAcesso }

function App({ acesso }: AppProps) {
  const { estado, entrar, sair, tentarDeNovo } = useEntrada(acesso)
  if (estado.tipo !== 'dentro') {
    return <TelaDeEntrada estado={estado} aoEntrar={entrar} aoTentarDeNovo={tentarDeNovo} />
  }
  return (
    <Moldura areaAtual="quadro" titulo="Processos" usuario={estado.usuario} aoSair={sair}>
      <QuadroVazio />
    </Moldura>
  )
}

export default App
