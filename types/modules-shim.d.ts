declare module 'react-dom'
declare module 'next/link' {
  const Link: any
  export default Link
}
declare module 'next/navigation' {
  export const usePathname: any
  export const useRouter: any
}
declare module 'lucide-react' {
  export const LogOut: any
  export const Square: any
}
declare module '@supabase/supabase-js'
declare module 'tailwindcss'
declare module 'zustand' {
  export function create<T>(fn: any): any
}
