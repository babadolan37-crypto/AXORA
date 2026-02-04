declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
}

declare module 'react' {
  export type ReactNode = any
  export type ChangeEvent<T = any> = any
  export const useState: any
  export const useEffect: any
  const React: any
  export default React
}

declare module 'react-dom'
declare module 'next/link'
declare module 'next/navigation'
declare module 'lucide-react'
declare module '@supabase/supabase-js'
declare module 'tailwindcss'
declare module 'zustand' {
  export function create<T>(fn: any): any
}

declare const process: any
