export interface IncomeEntry {
  id: string;
  date: string;
  source: string;
  description: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  photos?: string[]; // Array of base64 encoded images
  receivedFrom?: string; // Siapa yang bayar/kasih duit (Klien A, Customer B, dll)
  cashType: 'big' | 'small'; // Masuk ke Kas Besar atau Kas Kecil
}

export interface ExpenseEntry {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  photos?: string[]; // Array of base64 encoded images
  paidTo?: string; // Dibayar ke siapa/untuk apa (Supplier X, Vendor Y, Karyawan Z, dll)
  cashType: 'big' | 'small'; // Keluar dari Kas Besar atau Kas Kecil
}

export interface DebtEntry {
  id: string;
  type: 'Utang' | 'Piutang';
  name: string;
  description: string;
  amount: number;
  date: string;
  dueDate: string;
  paymentStatus: 'Lunas' | 'Tertunda';
  notes?: string;
  clientPhone?: string; // Nomor WA untuk notifikasi otomatis
  paymentDate?: string;
  status?: string; // For backward compatibility if needed
}

export const DEFAULT_INCOME_SOURCES = [
  'Penjualan Produk',
  'Penjualan Jasa',
  'Pemasukan Investasi',
  'Pembayaran Piutang',
  'Lainnya'
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Gaji Karyawan',
  'Sewa',
  'Bahan Baku',
  'Listrik',
  'Air',
  'Internet & Telekomunikasi',
  'Transportasi',
  'Peralatan Kantor',
  'Marketing',
  'Pajak',
  'Lainnya'
];

export const DEFAULT_PAYMENT_METHODS = [
  'Tunai',
  'Transfer Bank',
  'Cek',
  'Kartu Kredit',
  'E-Wallet'
];
