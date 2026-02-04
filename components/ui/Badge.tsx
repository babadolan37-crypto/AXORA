import { ReactNode } from 'react'
export function Badge({children,className=''}:{children?:ReactNode,className?:string}){return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${className}`} >{children}</span>}
