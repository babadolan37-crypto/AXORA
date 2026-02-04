"use client"
import { ReactNode, useEffect } from 'react'
export function Dialog({open,onOpenChange,children}:{open:boolean,onOpenChange:(v:boolean)=>void,children?:ReactNode}){
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onOpenChange(false)}
    document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)
  },[onOpenChange])
  if(!open) return null
  return (
    <div onClick={()=>onOpenChange(false)} className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div onClick={(e:any)=>e.stopPropagation()} className="bg-white rounded-xl p-4 w-[720px] max-w-[92vw]">
        {children}
      </div>
    </div>
  )
}
