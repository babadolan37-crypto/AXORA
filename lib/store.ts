"use client"
import { create } from 'zustand'
import { supabase, supabaseEnabled } from './supabase'

export type Transaction={id:string,type:'in'|'out',date:string,category:string,note?:string,party?:string,amount:number,payment:string,attachments:{name:string,url:string}[]}
export type Debt={id:string,type:'utang'|'piutang',name:string,amount:number,due:string,status:string,note?:string}
export type Settings={kasBesar:number,kasKecil:number,incomeSources:string[],expenseCategories:string[],paymentMethods:string[],employees:string[],salaryComponents:{name:string,type:'income'|'deduction'}[]}

export type State={settings:Settings,transactions:Transaction[],debts:Debt[]}

const seed:State={
  settings:{kasBesar:0,kasKecil:0,incomeSources:['Penjualan Produk','Penjualan Jasa','Pembayaran Piutang','Lainnya'],expenseCategories:['Gaji Karyawan','Sewa','Bahan Baku','Listrik','Air'],paymentMethods:['Tunai','Transfer Bank','Cek','Kartu Kredit','E-Wallet'],employees:['Karyawan A','Karyawan B','Karyawan C'],salaryComponents:[{name:'Gaji Pokok',type:'income'},{name:'Tunjangan Makan',type:'income'},{name:'Potongan Telat',type:'deduction'}]},
  transactions:[],
  debts:[]
}

async function pullSupabase(): Promise<State|undefined>{
  if(!supabase) return
  const [tr,de,st] = await Promise.all([
    supabase.from('transactions').select('*'),
    supabase.from('debts').select('*'),
    supabase.from('settings').select('*').limit(1)
  ])
  const state:State={
    settings:(st.data&&st.data[0])||seed.settings,
    transactions:(tr.data as any[])||[],
    debts:(de.data as any[])||[]
  }
  return state
}

async function pushSupabase(s:State){
  if(!supabase) return
  // sinkronisasi penuh: replace semua baris sesuai state lokal
  // settings disimpan sebagai satu baris dengan id tetap 1
  await supabase.from('settings').upsert([{ id: 1, ...s.settings }], { onConflict: 'id' })
  await supabase.from('transactions').delete().neq('id','')
  if(s.transactions.length){
    await supabase.from('transactions').insert(s.transactions as any[])
  }
  await supabase.from('debts').delete().neq('id','')
  if(s.debts.length){
    await supabase.from('debts').insert(s.debts as any[])
  }
}

export const useStore=create<State & {
  init: ()=>Promise<void>
  up:(fn:(s:State)=>void)=>void
}>((set:any)=>({
  ...seed,
  async init(){
    if(supabaseEnabled){
      const s=await pullSupabase();
      if(s){
        set(s)
      }
    }
  },
  up:(fn:(s:State)=>void)=>{
    set((current:State)=>{
      const data:State={
        settings:current.settings,
        transactions:current.transactions,
        debts:current.debts
      }
      const next=structuredClone(data)
      fn(next)
      if(supabaseEnabled){void pushSupabase(next)}
      return next
    })
  }
}))
