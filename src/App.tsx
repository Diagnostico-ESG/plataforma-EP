import type { ModuloDeAcesso } from './acesso/tipos'
import type { ModuloDeCadastros } from './cadastros/tipos'
import type { ModuloDeProcessos } from './processos/tipos'
import type { ModuloDeReunioes } from './reunioes/tipos'
import { AreaDeAdministracao } from './components/administracao/AreaDeAdministracao'
import { AreaDeCadastros } from './components/cadastros/AreaDeCadastros'
import { TelaDeEntrada } from './components/entrada/TelaDeEntrada'
import { ehAreaDeProcessos, type AreaComTela } from './components/moldura/areas'
import { Moldura } from './components/moldura/Moldura'
import { AreaDeProcessos } from './components/processos/AreaDeProcessos'
import { AreaDeReunioes } from './components/reunioes/AreaDeReunioes'
import { useAreaAtual } from './hooks/useAreaAtual'
import { useEntrada } from './hooks/useEntrada'

type AppProps = {
  acesso: ModuloDeAcesso
  cadastros: ModuloDeCadastros
  processos: ModuloDeProcessos
  reunioes: ModuloDeReunioes
}

const TITULO_DA_AREA: Record<AreaComTela, string> = {
  quadro: 'Processos', lista: 'Processos', setores: 'Setores', reunioes: 'Reuniões', administracao: 'Administração',
}

function App({ acesso, cadastros, processos, reunioes }: AppProps) {
  const { estado, entrar, sair, tentarDeNovo } = useEntrada(acesso)
  const [area, irPara] = useAreaAtual()
  if (estado.tipo !== 'dentro') {
    return <TelaDeEntrada estado={estado} aoEntrar={entrar} aoTentarDeNovo={tentarDeNovo} />
  }
  return (
    <Moldura areaAtual={area} aoIrPara={irPara} titulo={TITULO_DA_AREA[area]} usuario={estado.usuario} aoSair={sair}>
      {ehAreaDeProcessos(area) && <AreaDeProcessos usuario={estado.usuario} processos={processos} cadastros={cadastros} reunioes={reunioes} />}
      {area === 'setores' && <AreaDeCadastros usuario={estado.usuario} cadastros={cadastros} processos={processos} reunioes={reunioes} />}
      {area === 'reunioes' && <AreaDeReunioes usuario={estado.usuario} reunioes={reunioes} />}
      {area === 'administracao' && <AreaDeAdministracao usuario={estado.usuario} acesso={acesso} processos={processos} />}
    </Moldura>
  )
}

export default App
