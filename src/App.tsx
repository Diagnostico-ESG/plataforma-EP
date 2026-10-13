import type { ModuloDeAcesso } from './acesso/tipos'
import type { ModuloDeCadastros } from './cadastros/tipos'
import type { ModuloDeProcessos } from './processos/tipos'
import { AreaDeAdministracao } from './components/administracao/AreaDeAdministracao'
import { AreaDeCadastros } from './components/cadastros/AreaDeCadastros'
import { TelaDeEntrada } from './components/entrada/TelaDeEntrada'
import type { AreaComTela } from './components/moldura/areas'
import { Moldura } from './components/moldura/Moldura'
import { QuadroVazio } from './components/quadro/QuadroVazio'
import { useAreaAtual } from './hooks/useAreaAtual'
import { useEntrada } from './hooks/useEntrada'

type AppProps = { acesso: ModuloDeAcesso; cadastros: ModuloDeCadastros; processos: ModuloDeProcessos }

const TITULO_DA_AREA: Record<AreaComTela, string> = {
  quadro: 'Processos', setores: 'Setores', administracao: 'Administração',
}

function App({ acesso, cadastros, processos }: AppProps) {
  const { estado, entrar, sair, tentarDeNovo } = useEntrada(acesso)
  const [area, irPara] = useAreaAtual()
  if (estado.tipo !== 'dentro') {
    return <TelaDeEntrada estado={estado} aoEntrar={entrar} aoTentarDeNovo={tentarDeNovo} />
  }
  return (
    <Moldura areaAtual={area} aoIrPara={irPara} titulo={TITULO_DA_AREA[area]} usuario={estado.usuario} aoSair={sair}>
      {area === 'quadro' && <QuadroVazio />}
      {area === 'setores' && <AreaDeCadastros usuario={estado.usuario} cadastros={cadastros} processos={processos} />}
      {area === 'administracao' && <AreaDeAdministracao usuario={estado.usuario} acesso={acesso} />}
    </Moldura>
  )
}

export default App
