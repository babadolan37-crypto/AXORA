"use client"
import { useStore } from '../../lib/store'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'

import { useState } from 'react'

export default function Pengaturan(){
  const s=useStore()
  const [newComp,setNewComp]=useState({name:'',type:'income' as 'income'|'deduction'})

  const addComp=()=>{
    if(!newComp.name)return
    s.up((d:any)=>{
      if(!d.settings.salaryComponents) d.settings.salaryComponents=[]
      d.settings.salaryComponents.push(newComp)
    })
    setNewComp({name:'',type:'income'})
  }

  const removeComp=(idx:number)=>{
    s.up((d:any)=>{
      d.settings.salaryComponents.splice(idx,1)
    })
  }

  return (
    <div className="grid gap-3">
      <div className="text-lg font-semibold">Pengaturan</div>
      <Card>
        <div className="font-medium mb-2">Pengaturan Saldo Awal</div>
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" value={s.settings.kasBesar} onChange={(e:any)=>s.up((d:any)=>{d.settings.kasBesar=parseInt(e.target.value||'0')})} />
          <Input type="number" value={s.settings.kasKecil} onChange={(e:any)=>s.up((d:any)=>{d.settings.kasKecil=parseInt(e.target.value||'0')})} />
        </div>
      </Card>
      
      <Card>
        <div className="font-medium mb-2">Komponen Slip Gaji</div>
        <div className="text-sm text-[var(--sub)] mb-3">Atur komponen penambah (income) dan pengurang (deduction) untuk slip gaji karyawan.</div>
        
        <div className="grid gap-2 mb-4">
          {(s.settings.salaryComponents||[]).map((c:any,i:number)=>(
            <div key={i} className="flex items-center justify-between p-2 border rounded bg-[var(--muted)]">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${c.type==='income'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                  {c.type==='income'?'Penambah':'Pengurang'}
                </span>
                <span>{c.name}</span>
              </div>
              <button onClick={()=>removeComp(i)} className="text-red-500 hover:text-red-700 px-2">×</button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input placeholder="Nama Komponen (mis: Tunjangan Makan)" value={newComp.name} onChange={(e:any)=>setNewComp({...newComp,name:e.target.value})} />
          <Select value={newComp.type} onChange={(e:any)=>setNewComp({...newComp,type:e.target.value as 'income'|'deduction'})}>
            <option value="income">Penambah (Income)</option>
            <option value="deduction">Pengurang (Deduction)</option>
          </Select>
          <Button onClick={addComp} className="bg-brand-blue text-white border-brand-blue whitespace-nowrap">+ Tambah</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <ListEditor title="Sumber Pemasukan" items={s.settings.incomeSources} onAdd={(v)=>s.up((d:any)=>d.settings.incomeSources.push(v))} onRemove={(i)=>s.up((d:any)=>d.settings.incomeSources.splice(i,1))} />
        <ListEditor title="Kategori Pengeluaran" items={s.settings.expenseCategories} onAdd={(v)=>s.up((d:any)=>d.settings.expenseCategories.push(v))} onRemove={(i)=>s.up((d:any)=>d.settings.expenseCategories.splice(i,1))} />
        <ListEditor title="Metode Pembayaran" items={s.settings.paymentMethods} onAdd={(v)=>s.up((d:any)=>d.settings.paymentMethods.push(v))} onRemove={(i)=>s.up((d:any)=>d.settings.paymentMethods.splice(i,1))} />
        <ListEditor title="Daftar Karyawan" items={s.settings.employees} onAdd={(v)=>s.up((d:any)=>d.settings.employees.push(v))} onRemove={(i)=>s.up((d:any)=>d.settings.employees.splice(i,1))} />
      </div>
    </div>
  )
}

function ListEditor({title,items,onAdd,onRemove}:{title:string,items:string[],onAdd:(v:string)=>void,onRemove:(i:number)=>void}){
  const [val,setVal]=useState('')
  return (
    <Card>
      <div className="font-medium mb-3">{title}</div>
      <div className="flex gap-2 mb-3">
        <Input value={val} onChange={(e:any)=>setVal(e.target.value)} placeholder="Tambah baru..." />
        <Button onClick={()=>{if(val){onAdd(val);setVal('')}}} className="bg-brand-blue text-white border-brand-blue">+</Button>
      </div>
      <div className="grid gap-2 max-h-[200px] overflow-y-auto">
        {items.map((x,i)=>(
          <div key={i} className="flex items-center justify-between p-2 border rounded bg-[var(--muted)] text-sm">
            <span>{x}</span>
            <button onClick={()=>onRemove(i)} className="text-red-500 hover:text-red-700 px-2">×</button>
          </div>
        ))}
      </div>
    </Card>
  )
}
