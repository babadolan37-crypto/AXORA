"use client"
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
export default function PengembalianDana(){
  return (
    <div className="grid gap-3">
      <div className="text-lg font-semibold">Pengembalian Dana</div>
      <Card>
        <div className="text-sm text-[var(--sub)]">Kelola pengembalian dana internal. Fitur lanjutan dapat ditambahkan kemudian.</div>
        <div className="mt-3"><Button className="bg-brand-blue text-white border-brand-blue">Tambah Data</Button></div>
      </Card>
    </div>
  )
}
