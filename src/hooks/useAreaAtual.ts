import { useCallback } from 'react'
import type { AreaDoSistema } from '../components/moldura/areas'
import { useEndereco } from './useEndereco'
import { ultimaFormaDeVer } from '../processos/ultimaFormaDeVer'

const AREAS_PELO_ENDERECO = new Set<string>(['setores', 'painel', 'administracao', 'ajuda'])

// A área é o primeiro trecho do endereço (#/setores/macroprocessos → setores); qualquer outro endereço cai em Processos.
function areaDoEndereco(endereco: string): AreaDoSistema {
  const area = endereco.split('?')[0].split('/')[1]
  return AREAS_PELO_ENDERECO.has(area) ? area as AreaDoSistema : 'processos'
}

// Processos volta à última forma de ver da sessão; as outras áreas têm endereço fixo.
function enderecoDaArea(area: AreaDoSistema): string {
  return area === 'processos' ? ultimaFormaDeVer() : `#/${area}`
}

export function useAreaAtual(): [AreaDoSistema, (area: AreaDoSistema) => void] {
  const [endereco, irParaEndereco] = useEndereco()
  const irPara = useCallback((nova: AreaDoSistema) => irParaEndereco(enderecoDaArea(nova)), [irParaEndereco])
  return [areaDoEndereco(endereco), irPara]
}
