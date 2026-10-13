import { useCallback } from 'react'
import type { AreaComTela } from '../components/moldura/areas'
import { useEndereco } from './useEndereco'

// A área é o primeiro trecho do endereço (#/setores/macroprocessos → setores).
function areaDoEndereco(endereco: string): AreaComTela {
  const area = endereco.split('/')[1]
  return area === 'administracao' || area === 'setores' ? area : 'quadro'
}

export function useAreaAtual(): [AreaComTela, (area: AreaComTela) => void] {
  const [endereco, irParaEndereco] = useEndereco()
  const irPara = useCallback((nova: AreaComTela) => irParaEndereco(`#/${nova}`), [irParaEndereco])
  return [areaDoEndereco(endereco), irPara]
}
