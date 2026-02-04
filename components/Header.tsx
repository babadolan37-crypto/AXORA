"use client"
import { usePathname } from 'next/navigation'
import { useStore } from '../lib/store'
import { useEffect } from 'react'

const tabs = [
  { href: '/', label: 'Dashboard' },
  { href: '/transaksi', label: 'Transaksi' },
  { href: '/utang-piutang', label: 'Utang & Piutang' },
  { href: '/pengembalian-dana', label: 'Pengembalian Dana' },
  { href: '/pengaturan', label: 'Pengaturan' }
]

export function Header() {
  const pathname = usePathname()
  const s = useStore()
  
  useEffect(() => {
    void s.init()
  }, [])

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-[var(--ring)]">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <svg className="text-brand-blue" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
          <div>
            <div className="font-semibold">Axora</div>
            <div className="text-sm text-[var(--sub)]">Pencatatan Keuangan Perusahaan</div>
          </div>
        </div>
        <button className="text-[var(--sub)] flex items-center gap-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 17l5-5-5-5v3H9v4h7v3z"/><path d="M4 4h8a2 2 0 012 2v2h-2V6H6v12h6v-2h2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>Logout</button>
      </div>
      <nav className="flex gap-2 px-6 pb-4">
        {tabs.map(t => (
          <a key={t.href} href={t.href} className={`px-3 py-2 rounded-lg border ${pathname===t.href?'border-brand-green text-brand-green':'border-[var(--ring)] text-[var(--sub)]'} bg-[var(--muted)]`}>
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
