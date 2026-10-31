import type { ModuloDeAcesso } from './acesso/tipos'
import type { ModuloDeCadastros } from './cadastros/tipos'
import type { ModuloDePlanilhas } from './planilhas/tipos'
import type { ModuloDeProcessos } from './processos/tipos'
import type { ModuloDeRevisoes } from './revisoes/tipos'
import type { ModuloDeVersoes } from './versoes/tipos'
import { AreaDeAdministracao } from './components/administracao/AreaDeAdministracao'
import { AreaDeCadastros } from './components/cadastros/AreaDeCadastros'
import { TelaDeEntrada } from './components/entrada/TelaDeEntrada'
import type { AreaDoSistema } from './components/moldura/areas'
import { Moldura } from './components/moldura/Moldura'
import { TelaEmBreve } from './components/moldura/TelaEmBreve'
import { AreaDeProcessos } from './components/processos/AreaDeProcessos'
import { useAreaAtual } from './hooks/useAreaAtual'
import { useEntrada } from './hooks/useEntrada'

type AppProps = {
  acesso: ModuloDeAcesso
  cadastros: ModuloDeCadastros
  processos: ModuloDeProcessos
  versoes: ModuloDeVersoes
  revisoes: ModuloDeRevisoes
  planilhas: ModuloDePlanilhas
}

const TITULO_DA_AREA: Record<AreaDoSistema, string> = {
  processos: 'Processos', setores: 'Setores', painel: 'Painel', administracao: 'Administração', ajuda: 'Ajuda',
}

function App({ acesso, cadastros, processos, versoes, revisoes, planilhas }: AppProps) {
  const { estado, entrar, sair, tentarDeNovo } = useEntrada(acesso)
  const [area, irPara] = useAreaAtual()
  if (estado.tipo !== 'dentro') {
    return <TelaDeEntrada estado={estado} aoEntrar={entrar} aoTentarDeNovo={tentarDeNovo} />
  }
  return (
    <Moldura areaAtual={area} aoIrPara={irPara} titulo={TITULO_DA_AREA[area]} usuario={estado.usuario} aoSair={sair}>
      {area === 'processos' && <AreaDeProcessos usuario={estado.usuario} processos={processos} cadastros={cadastros}
        versoes={versoes} revisoes={revisoes} />}
      {area === 'setores' && <AreaDeCadastros usuario={estado.usuario} cadastros={cadastros} processos={processos} />}
      {area === 'administracao' && <AreaDeAdministracao usuario={estado.usuario} acesso={acesso} processos={processos}
        planilhas={planilhas} />}
      {area === 'painel' && <TelaEmBreve titulo="Painel" texto="Em breve: o Painel com os números do EP chega na v1.5." />}
      {area === 'ajuda' && <TelaEmBreve titulo="Ajuda" texto="Em breve: a Ajuda da plataforma." />}
    </Moldura>
  )
}

export default App
