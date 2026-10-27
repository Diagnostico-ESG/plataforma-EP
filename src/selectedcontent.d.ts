import 'react'

// <selectedcontent> é do HTML novo (caixa de seleção personalizável do Chrome e do Edge): os tipos do React ainda não o trazem.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      selectedcontent: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}
