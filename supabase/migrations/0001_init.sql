-- Schema & Tabel inti untuk aplikasi Babadolan
-- Jalankan di Supabase SQL Editor pada project Anda

begin;

-- Tabel Settings (single row, kolom camelCase disimpan dengan quoted identifier)
create table if not exists public.settings (
  "id" integer primary key,
  "kasBesar" numeric(18,2) not null default 0,
  "kasKecil" numeric(18,2) not null default 0,
  "incomeSources" text[] not null default '{}',
  "expenseCategories" text[] not null default '{}',
  "paymentMethods" text[] not null default '{}',
  "employees" text[] not null default '{}'
);

-- Tabel Transactions
create table if not exists public.transactions (
  id text primary key,
  type text not null check (type in ('in','out')),
  date text not null,
  category text not null,
  note text,
  party text,
  amount numeric(18,2) not null default 0,
  payment text not null,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Tabel Debts
create table if not exists public.debts (
  id text primary key,
  type text not null check (type in ('utang','piutang')),
  name text not null,
  amount numeric(18,2) not null default 0,
  due text not null,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

-- Row Level Security (RLS) dan policy dasar
alter table public.settings enable row level security;
alter table public.transactions enable row level security;
alter table public.debts enable row level security;

-- Perhatian: kebijakan di bawah ini mengizinkan akses publik (anon) penuh.
-- Sesuaikan untuk kebutuhan produksi (gunakan auth, owner checks, dsb.).

create policy if not exists "settings_select_all" on public.settings
  for select using (true);
create policy if not exists "settings_insert_all" on public.settings
  for insert with check (true);
create policy if not exists "settings_update_all" on public.settings
  for update using (true) with check (true);
create policy if not exists "settings_delete_all" on public.settings
  for delete using (true);

create policy if not exists "transactions_select_all" on public.transactions
  for select using (true);
create policy if not exists "transactions_insert_all" on public.transactions
  for insert with check (true);
create policy if not exists "transactions_update_all" on public.transactions
  for update using (true) with check (true);
create policy if not exists "transactions_delete_all" on public.transactions
  for delete using (true);

create policy if not exists "debts_select_all" on public.debts
  for select using (true);
create policy if not exists "debts_insert_all" on public.debts
  for insert with check (true);
create policy if not exists "debts_update_all" on public.debts
  for update using (true) with check (true);
create policy if not exists "debts_delete_all" on public.debts
  for delete using (true);

-- Seed default Settings (id=1)
insert into public.settings ("id","kasBesar","kasKecil","incomeSources","expenseCategories","paymentMethods","employees")
values (
  1,
  0,
  0,
  array['Penjualan Produk','Penjualan Jasa','Pembayaran Piutang','Lainnya'],
  array['Gaji Karyawan','Sewa','Bahan Baku','Listrik','Air'],
  array['Tunai','Transfer Bank','Cek','Kartu Kredit','E-Wallet'],
  array['Karyawan A','Karyawan B','Karyawan C']
)
on conflict ("id") do update set
  "kasBesar"=excluded."kasBesar",
  "kasKecil"=excluded."kasKecil",
  "incomeSources"=excluded."incomeSources",
  "expenseCategories"=excluded."expenseCategories",
  "paymentMethods"=excluded."paymentMethods",
  "employees"=excluded."employees";

commit;
