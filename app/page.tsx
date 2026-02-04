"use client"
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Table, THead, TH, TR, TD } from '../components/ui/Table'
import { useStore, Transaction } from '../lib/store'
import { fmtRp } from '../lib/format'
import { useEffect, useState } from 'react'
import { downloadCSV, toCSV } from '../lib/csvExport'

export default function Dashboard(){
  const s=useStore()
  const [range,setRange]=useState('week' as any)
  const filter=(t:Transaction)=>true
  const rows=s.transactions.filter(filter)
  const pemasukan=rows.filter((r:Transaction)=>r.type==='in').reduce((a:number,b:Transaction)=>a+b.amount,0)
  const pengeluaran=rows.filter((r:Transaction)=>r.type==='out').reduce((a:number,b:Transaction)=>a+b.amount,0)
  const laba=pemasukan-pengeluaran
  const totalKas=(s.settings.kasBesar+s.settings.kasKecil)+laba
  const exportCSV=()=>{
    const headers=['date','type','category','note','party','amount','payment']
    downloadCSV('transaksi.csv',toCSV(rows.map((r:Transaction)=>({date:r.date,type:r.type,category:r.category,note:r.note,party:r.party,amount:r.amount,payment:r.payment})),headers))
  }
  return (
    <div className="grid gap-4">
      <div>
        <div className="text-xl font-semibold">Dashboard Keuangan</div>
        <div className="text-sm text-[var(--sub)]">Rekapitulasi transaksi dan manajemen kas</div>
      </div>
      <div className="flex gap-2">
        <Button className="bg-brand-blue text-white border-brand-blue">Overview</Button>
        <Button className="bg-white">Detail</Button>
        <Button className="bg-brand-green text-white border-brand-green">+ Transaksi Kas</Button>
        <Button onClick={exportCSV} className="bg-brand-blue text-white border-brand-blue">Export</Button>
      </div>
      <div className="flex gap-2">
        {['Hari Ini','3 Hari','Minggu Ini','Bulan Ini','Tahun Ini','Custom'].map((label,i)=>{
          const keys:['today','3d','week','month','year','custom']=['today','3d','week','month','year','custom']
          const key=keys[i];
          const active=range===key
          return <button key={key} onClick={()=>setRange(key)} className={`px-3 py-1 rounded-full border ${active?'border-brand-blue text-brand-blue':'border-[var(--ring)] text-[var(--sub)]'} bg-[var(--muted)] text-sm`}>{label}</button>
        })}
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Card className="grad-green text-white">
          <div className="font-semibold">Total Pemasukan</div>
          <div className="text-2xl">{fmtRp(pemasukan)}</div>
        </Card>
        <Card className="grad-red text-white">
          <div className="font-semibold">Total Pengeluaran</div>
          <div className="text-2xl">{fmtRp(pengeluaran)}</div>
        </Card>
        <Card className="grad-blue text-white">
          <div className="font-semibold">Laba Bersih</div>
          <div className="text-2xl">{fmtRp(laba)}</div>
        </Card>
        <Card className="grad-purple text-white">
          <div className="font-semibold">Total Kas</div>
          <div className="text-2xl">{fmtRp(totalKas)}</div>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="font-medium">Kas Besar</div>
          <div>{fmtRp(s.settings.kasBesar)}</div>
          <div className="text-xs text-[var(--sub)]">Saldo tersedia</div>
        </Card>
        <Card>
          <div className="font-medium">Kas Kecil</div>
          <div>{fmtRp(s.settings.kasKecil)}</div>
          <div className="text-xs text-[var(--sub)]">Saldo tersedia</div>
        </Card>
      </div>
      <Card>
        <Table>
          <THead>
            <TH>Tanggal</TH><TH>Tipe</TH><TH>Kategori/Sumber</TH><TH>Jumlah</TH>
          </THead>
          <tbody>
            {rows.map((r:Transaction)=> (
              <TR key={r.id}><TD>{r.date}</TD><TD>{r.type}</TD><TD>{r.category}</TD><TD>{fmtRp(r.amount)}</TD></TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
