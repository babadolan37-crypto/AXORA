"use client"
import { useEffect, useState } from 'react'
import { useStore, Transaction } from '../../lib/store'
import type { State } from '../../lib/store'
import { Tabs } from '../../components/ui/Tabs'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Table, THead, TH, TD, TR } from '../../components/ui/Table'
import { fmtRp } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Pencil, Trash2, Images } from 'lucide-react'
import { OCRDialog } from '../../components/OCRDialog'
import { useToast } from '../../components/ToastProvider'

type Form={date:string,category:string,note:string,party:string,amount:number,payment:string,files:File[]}

export default function Transaksi(){
  const s=useStore()
  const toast=useToast()
  const [type,setType]=useState('in' as 'in'|'out')
  const [showForm,setShowForm]=useState(false)
  const [ocrOpen,setOcrOpen]=useState(false)
  const [search,setSearch]=useState('')
  const [pageSize,setPageSize]=useState(10)
  const [page,setPage]=useState(1)
  const cats=type==='in'?s.settings.incomeSources:s.settings.expenseCategories

  const [form,setForm]=useState({date:new Date().toISOString().slice(0,10),category:cats[0]??'',note:'',party:'',amount:0,payment:s.settings.paymentMethods[0]??'',files:[]} as Form)

  const applyOCR=(d:{date:string,amount:number,note:string,category:string})=>{
    setForm((f:any)=>({...f,date:d.date,amount:d.amount,note:d.note,category:d.category}))
  }

  const onSubmit=()=>{
    if(!form.date||!form.category||form.amount<=0){toast.push({title:'Form tidak valid',variant:'error'});return}
    const id=String(Date.now())
    const attachments=[] as {name:string,url:string}[]
    const add=()=>{s.up((d:State)=>{d.transactions.push({id,type,date:form.date,category:form.category,note:form.note,party:form.party,amount:form.amount,payment:form.payment,attachments})});toast.push({title:'Transaksi ditambahkan',variant:'success'})}
    if(form.files.length){
      const read=(file:File)=>new Promise<{name:string,url:string}>(res=>{const fr=new FileReader();fr.onload=()=>res({name:file.name,url:String(fr.result)});fr.readAsDataURL(file)})
      Promise.all(form.files.map(read)).then(arr=>{attachments.push(...arr);add()})
    } else add()
    setShowForm(false)
  }

  const rows=s.transactions.filter((t:Transaction)=>t.type===type).filter((t:Transaction)=>t.note?.toLowerCase().includes(search.toLowerCase())||t.category.toLowerCase().includes(search.toLowerCase()))
  const total=rows.length
  const start=(page-1)*pageSize
  const pageRows=rows.slice(start,start+pageSize)

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{type==='in'?'Data Pemasukan':'Data Pengeluaran'}</div>
          <div className="text-sm text-[var(--sub)]">Total {total} transaksi</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={()=>setOcrOpen(true)} className="bg-brand-blue text-white border-brand-blue">OCR Scanner</Button>
          <Button onClick={()=>setShowForm(true)} className={`${type==='in'?'bg-brand-green border-brand-green':'bg-brand-red border-brand-red'} text-white`}>{type==='in'?'+ Tambah Pemasukan':'+ Tambah Pengeluaran'}</Button>
        </div>
      </div>
      <Tabs initial={type} onChange={k=>setType(k as 'in'|'out')} tabs={[{key:'in',label:'Pemasukan',className:'border-green-600 bg-green-50 text-green-700'},{key:'out',label:'Pengeluaran',className:'border-red-600 bg-red-50 text-red-700'}]} />

      <Card>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Cari keterangan/kategori" value={search} onChange={(e:any)=>setSearch(e.target.value)} />
          <Select value={String(pageSize)} onChange={(e:any)=>{setPageSize(parseInt(e.target.value));setPage(1)}}>
            {[10,25,50].map((n:any)=> <option key={n} value={n}>{n}/halaman</option>)}
          </Select>
        </div>
        <Table>
          <THead>
            <TH>Tanggal</TH><TH>{type==='in'?'Sumber':'Kategori'}</TH><TH>Keterangan</TH><TH>Jumlah</TH><TH>Pembayaran</TH><TH>Foto</TH><TH>Aksi</TH>
          </THead>
          <tbody>
            {pageRows.map((r:Transaction)=> (
              <TR key={r.id}>
                <TD>{r.date}</TD>
                <TD>{r.category}</TD>
                <TD>{r.note}</TD>
                <TD><span className={`${r.type==='in'?'text-green-600':'text-red-600'}`}>{fmtRp(r.amount)}</span></TD>
                <TD>{r.payment}</TD>
                <TD>{r.attachments.length? <Badge className="border-brand-blue text-brand-blue"><Images size={14}/> {r.attachments.length}</Badge>:'-'}</TD>
                <TD>
                  <div className="flex gap-2">
                    <Button className="bg-brand-blue text-white border-brand-blue"><Pencil size={14}/></Button>
                    <Button onClick={()=>{if(confirm('Hapus transaksi?')){useStore.getState().up((d:State)=>{d.transactions=d.transactions.filter(x=>x.id!==r.id)});toast.push({title:'Transaksi dihapus',variant:'success'})}}} className="bg-brand-red text-white border-brand-red"><Trash2 size={14}/></Button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
        <div className="flex justify-end gap-2 mt-3">
          <Button onClick={()=>setPage(Math.max(1,page-1))}>Prev</Button>
          <span className="px-2">Hal {page}</span>
          <Button onClick={()=>setPage(page+1)} disabled={start+pageSize>=total}>Next</Button>
        </div>
      </Card>

      {showForm && (
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={form.date} onChange={(e:any)=>setForm({...form,date:e.target.value})} />
            <Select value={form.category} onChange={(e:any)=>setForm({...form,category:e.target.value})}>
              {cats.map((c:any)=> <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input placeholder="Keterangan" value={form.note} onChange={(e:any)=>setForm({...form,note:e.target.value})} />
            {type==='out' ? (
              <Select value={form.party} onChange={(e:any)=>setForm({...form,party:e.target.value})}>
                <option value="">-- Pilih Karyawan --</option>
                {s.settings.employees.map((n:any)=> <option key={n} value={n}>{n}</option>)}
              </Select>
            ):(
              <Input placeholder="Diterima dari (opsional)" value={form.party} onChange={(e:any)=>setForm({...form,party:e.target.value})} />
            )}
            <Input type="number" placeholder="Jumlah (Rp)" value={form.amount} onChange={(e:any)=>setForm({...form,amount:parseInt(e.target.value||'0')})} />
            <Select value={form.payment} onChange={(e:any)=>setForm({...form,payment:e.target.value})}>
              {s.settings.paymentMethods.map((p:any)=> <option key={p} value={p}>{p}</option>)}
            </Select>
            <div className="col-span-2">
              <input type="file" multiple accept="image/*" onChange={(e:any)=>setForm({...form,files:Array.from(e.target.files??[])})} />
              <div className="text-xs text-[var(--sub)]">Upload Foto (Max 10MB per foto)</div>
            </div>
            <textarea placeholder="Catatan Tambahan" className="col-span-2 w-full px-3 py-2 rounded-xl border" />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button onClick={onSubmit} className={`${type==='in'?'bg-brand-green border-brand-green':'bg-brand-red border-brand-red'} text-white w-full`}>Tambah</Button>
            <Button onClick={()=>setShowForm(false)} className="bg-gray-200">Batal</Button>
          </div>
        </Card>
      )}

      <OCRDialog open={ocrOpen} onOpenChange={setOcrOpen} onApply={applyOCR} />
    </div>
  )
}
