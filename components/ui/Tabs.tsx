"use client"
export function Tabs({tabs, onChange, initial}:{tabs:{key:string,label:string,className?:string}[],initial?:string,onChange?:(k:string)=>void}){
  const active=initial??tabs[0].key
  return (
    <div className="flex gap-2 mb-3">
      {tabs.map(t=> (
        <button key={t.key} onClick={()=>{onChange&&onChange(t.key)}} className={`flex-1 px-3 py-2 rounded-full border ${active===t.key?(t.className??'border-green-600 bg-green-50 text-green-700'):'border-[var(--ring)] bg-[var(--muted)]'}`}>{t.label}</button>
      ))}
    </div>
  )
}
