"use client"
import { useStore } from '../../lib/store'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useState } from 'react'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Table, THead, TH, TR, TD } from '../../components/ui/Table'
import { fmtRp } from '../../lib/format'

import type { State, Debt } from '../../lib/store'

export default function UtangPiutang(){
  const s=useStore()
  const [open,setOpen]=useState(false)
  const [form,setForm]=useState({type:'utang',name:'',amount:0,due:new Date().toISOString().slice(0,10),status:'Belum dibayar',note:''})
  const utang=s.debts.filter((d:Debt)=>d.type==='utang'&&d.status!=='Dibayar').reduce((a:number,b:Debt)=>a+b.amount,0)
  const piutang=s.debts.filter((d:Debt)=>d.type==='piutang'&&d.status!=='Diterima').reduce((a:number,b:Debt)=>a+b.amount,0)
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Utang & Piutang</div>
        <Button onClick={()=>setOpen(true)} className="bg-brand-purple text-white border-brand-purple">+ Tambah Data</Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-orange-50 border-orange-200"><div className="font-medium">Total Utang Tertunda</div><div className="text-2xl">{fmtRp(utang)}</div></Card>
        <Card className="bg-teal-50 border-teal-200"><div className="font-medium">Total Piutang Tertunda</div><div className="text-2xl">{fmtRp(piutang)}</div></Card>
      </div>
      <Card>
        <Table>
          <THead><TH>Tipe</TH><TH>Nama</TH><TH>Jumlah</TH><TH>Jatuh Tempo</TH><TH>Status</TH><TH>Catatan</TH></THead>
          <tbody>
            {s.debts.length===0? <TR><TD colSpan={6}>Belum ada data</TD></TR> : s.debts.map((d:Debt)=> (
              <TR key={d.id}><TD>{d.type}</TD><TD>{d.name}</TD><TD>{fmtRp(d.amount)}</TD><TD>{d.due}</TD><TD>{d.status}</TD><TD>{d.note}</TD></TR>
            ))}
          </tbody>
        </Table>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="font-semibold mb-2">Tambah Data</div>
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.type} onChange={(e:any)=>setForm({...form,type:e.target.value})}><option value="utang">Utang</option><option value="piutang">Piutang</option></Select>
          <Input placeholder="Nama pihak" value={form.name} onChange={(e:any)=>setForm({...form,name:e.target.value})} />
          <Input type="number" placeholder="Jumlah" value={form.amount} onChange={(e:any)=>setForm({...form,amount:parseInt(e.target.value||'0')})} />
          <Input type="date" value={form.due} onChange={(e:any)=>setForm({...form,due:e.target.value})} />
          <Select value={form.status} onChange={(e:any)=>setForm({...form,status:e.target.value})}>
            {form.type==='utang'?<>
              <option>Belum dibayar</option><option>Dibayar</option>
            </>:<>
              <option>Belum diterima</option><option>Diterima</option>
            </>}
          </Select>
          <Input placeholder="Catatan" value={form.note} onChange={(e:any)=>setForm({...form,note:e.target.value})} />
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <Button onClick={()=>{if(!form.name||form.amount<=0){setOpen(false);return} s.up((d:State)=>{d.debts.push({id:String(Date.now()),...form})}); setOpen(false)}} className="bg-brand-purple text-white border-brand-purple">Simpan</Button>
          <Button onClick={()=>setOpen(false)} className="bg-gray-200">Batal</Button>
        </div>
      </Dialog>
    </div>
  )
}
