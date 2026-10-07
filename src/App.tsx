import { Moldura } from './components/moldura/Moldura'
import { QuadroVazio } from './components/quadro/QuadroVazio'

function App() {
  return (
    <Moldura areaAtual="quadro" titulo="Processos">
      <QuadroVazio />
    </Moldura>
  )
}

export default App
