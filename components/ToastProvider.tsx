"use client"
import { createContext, useContext, useState } from 'react'

type Toast = { id: number; title: string; variant?: 'success'|'error' }

const Ctx = createContext({push:(_:Omit<Toast,'id'>)=>{}} as {push:(t:Omit<Toast,'id'>)=>void})

export function useToast(){return useContext(Ctx)}

export function ToastProvider({children}:{children?:any}){
  const [items,setItems]=useState([] as Toast[])
  const push=(t:Omit<Toast,'id'>)=>{const id=Date.now();setItems((v:Toast[])=>[...v,{id,...t}]);setTimeout(()=>setItems((v:Toast[])=>v.filter((x:Toast)=>x.id!==id)),3000)}
  return (
    <Ctx.Provider value={{push}}>
      {children}
      <div className="fixed top-4 right-4 flex flex-col gap-2">
        {items.map((i:Toast)=> (
          <div key={i.id} className={`px-3 py-2 rounded-lg shadow-soft text-white ${i.variant==='error'?'bg-red-600':'bg-green-600'}`}>{i.title}</div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
