"use client"
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'

export function OCRDialog({open,onOpenChange,onApply}:{open:boolean,onOpenChange:(v:boolean)=>void,onApply:(data:{date:string,amount:number,note:string,category:string})=>void}){
  const onProcess=()=>{onApply({date:new Date().toISOString().slice(0,10),amount:1000000,note:'Hasil OCR',category:'Lainnya'});onOpenChange(false)}
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">OCR Scanner - Ekstraksi Data Otomatis</div>
        <Button onClick={()=>onOpenChange(false)} className="bg-gray-200">Tutup</Button>
      </div>
      <div className="grid gap-3">
        <div className="card p-4">
          <div className="text-center">Upload Foto Bukti Transaksi</div>
          <div className="flex justify-center mt-2"><input type="file" accept="image/*" /></div>
          <div className="text-xs text-[var(--sub)] mt-2 text-center">Maksimal 10MB, JPG/PNG/JPEG</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3"><div className="font-medium">Auto-detect Tanggal</div><div className="text-xs text-[var(--sub)]">Mengenali format Indonesia & Inggris</div></div>
          <div className="card p-3"><div className="font-medium">Auto-detect Nominal</div><div className="text-xs text-[var(--sub)]">Mengenali Rp/IDR dan angka</div></div>
          <div className="card p-3"><div className="font-medium">Auto-detect Berita</div><div className="text-xs text-[var(--sub)]">Ekstrak teks multi-line</div></div>
          <div className="card p-3"><div className="font-medium">Auto-detect Kategori</div><div className="text-xs text-[var(--sub)]">Deteksi dari keterangan</div></div>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onProcess} className="bg-brand-blue text-white border-brand-blue">Terapkan ke Form</Button>
        </div>
      </div>
    </Dialog>
  )
}
