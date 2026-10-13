import type { UsuarioAtual } from '../../acesso/tipos'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useEndereco } from '../../hooks/useEndereco'
import { AreaDeSetores } from './AreaDeSetores'
import './Cadastros.css'

type AbaDosCadastros = 'setores' | 'macroprocessos' | 'historico'
type AreaDeCadastrosProps = { usuario: UsuarioAtual; cadastros: ModuloDeCadastros }

const ABAS: { aba: AbaDosCadastros; rotulo: string; endereco: string }[] = [
  { aba: 'setores', rotulo: 'Setores', endereco: '#/setores' },
  { aba: 'macroprocessos', rotulo: 'Macroprocessos', endereco: '#/setores/macroprocessos' },
  { aba: 'historico', rotulo: 'Histórico', endereco: '#/setores/historico' },
]

// A aba é o segundo trecho do endereço; sem ele, Setores.
function abaDoEndereco(endereco: string): AbaDosCadastros {
  const aba = endereco.split('/')[2]
  return aba === 'macroprocessos' || aba === 'historico' ? aba : 'setores'
}

// Esconder botões da Consulta é conveniência; quem protege os dados é a RLS de setores.
export function AreaDeCadastros({ usuario, cadastros }: AreaDeCadastrosProps) {
  const [endereco] = useEndereco()
  const abaAtual = abaDoEndereco(endereco)
  return (
    <section className="cadastros" aria-label="Setores">
      <nav className="cadastros-abas" aria-label="Seções de Setores">
        {ABAS.map(({ aba, rotulo, endereco: destino }) => (
          <a key={aba} href={destino} className="cadastros-aba" aria-current={aba === abaAtual ? 'page' : undefined}>
            {rotulo}
          </a>
        ))}
      </nav>
      {abaAtual === 'setores'
        ? <AreaDeSetores cadastros={cadastros} podeAlterar={usuario.perfil !== 'consulta'} />
        : <p className="cadastros-em-breve">Esta seção chega numa próxima entrega.</p>}
    </section>
  )
}
