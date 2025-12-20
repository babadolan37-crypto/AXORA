import * as XLSX from 'xlsx';
import { CashTransfer, CashBalance } from '../types/cash-management';

export function exportCashManagementToExcel(transfers: CashTransfer[], balances: CashBalance[]) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Saldo Kas
  const balanceData = [
    ['RINGKASAN SALDO KAS'],
    [''],
    ['Jenis Kas', 'Saldo'],
    ['Kas Besar', balances.find(b => b.cashType === 'big')?.balance || 0],
    ['Kas Kecil', balances.find(b => b.cashType === 'small')?.balance || 0],
    ['', ''],
    ['Total Kas', (balances.find(b => b.cashType === 'big')?.balance || 0) + (balances.find(b => b.cashType === 'small')?.balance || 0)]
  ];

  const balanceSheet = XLSX.utils.aoa_to_sheet(balanceData);
  
  // Format currency
  if (!balanceSheet['!cols']) balanceSheet['!cols'] = [];
  balanceSheet['!cols'][1] = { wch: 20 };

  XLSX.utils.book_append_sheet(workbook, balanceSheet, 'Ringkasan Saldo');

  // Sheet 2: Daftar Transfer
  const transferHeaders = [
    'Tanggal Transfer',
    'Jenis Kas',
    'Nama Karyawan',
    'Deskripsi',
    'Jumlah Transfer',
    'Pengeluaran Aktual',
    'Selisih',
    'Status',
    'Tanggal Pengembalian',
    'Jumlah Pengembalian',
    'Tanggal Pembayaran Tambahan',
    'Jumlah Pembayaran Tambahan',
    'Catatan'
  ];

  const transferData = transfers.map(t => [
    new Date(t.date).toLocaleDateString('id-ID'),
    t.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil',
    t.employeeName,
    t.description,
    t.transferAmount,
    t.actualExpense || 0,
    t.difference || 0,
    getStatusLabel(t.status),
    t.returnDate ? new Date(t.returnDate).toLocaleDateString('id-ID') : '-',
    t.returnAmount || '-',
    t.additionalPaymentDate ? new Date(t.additionalPaymentDate).toLocaleDateString('id-ID') : '-',
    t.additionalPayment || '-',
    t.notes || '-'
  ]);

  const transferSheet = XLSX.utils.aoa_to_sheet([transferHeaders, ...transferData]);
  
  // Set column widths
  transferSheet['!cols'] = [
    { wch: 15 }, // Tanggal Transfer
    { wch: 12 }, // Jenis Kas
    { wch: 20 }, // Nama Karyawan
    { wch: 30 }, // Deskripsi
    { wch: 15 }, // Jumlah Transfer
    { wch: 18 }, // Pengeluaran Aktual
    { wch: 15 }, // Selisih
    { wch: 20 }, // Status
    { wch: 20 }, // Tanggal Pengembalian
    { wch: 18 }, // Jumlah Pengembalian
    { wch: 25 }, // Tanggal Pembayaran Tambahan
    { wch: 22 }, // Jumlah Pembayaran Tambahan
    { wch: 30 }  // Catatan
  ];

  XLSX.utils.book_append_sheet(workbook, transferSheet, 'Daftar Transfer');

  // Sheet 3: Detail Pengeluaran
  const expenseHeaders = [
    'Nama Karyawan',
    'Tanggal Pengeluaran',
    'Kategori',
    'Deskripsi',
    'Vendor/Toko',
    'Jumlah',
    'Bukti'
  ];

  const expenseData: any[] = [];
  transfers.forEach(transfer => {
    if (transfer.expenseDetails && transfer.expenseDetails.length > 0) {
      transfer.expenseDetails.forEach(detail => {
        expenseData.push([
          transfer.employeeName,
          new Date(detail.date).toLocaleDateString('id-ID'),
          detail.category,
          detail.description,
          detail.vendor || '-',
          detail.amount,
          detail.proof ? 'Ada' : 'Tidak Ada'
        ]);
      });
    }
  });

  if (expenseData.length > 0) {
    const expenseSheet = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseData]);
    
    expenseSheet['!cols'] = [
      { wch: 20 }, // Nama Karyawan
      { wch: 18 }, // Tanggal Pengeluaran
      { wch: 20 }, // Kategori
      { wch: 35 }, // Deskripsi
      { wch: 25 }, // Vendor/Toko
      { wch: 15 }, // Jumlah
      { wch: 10 }  // Bukti
    ];

    XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Detail Pengeluaran');
  }

  // Sheet 4: Analisis Per Kategori
  const categoryAnalysis = analyzeByCategory(transfers);
  if (categoryAnalysis.length > 0) {
    const categoryHeaders = ['Kategori', 'Total Pengeluaran', 'Jumlah Transaksi'];
    const categoryData = categoryAnalysis.map(c => [c.category, c.total, c.count]);
    
    const categorySheet = XLSX.utils.aoa_to_sheet([
      ['ANALISIS PENGELUARAN PER KATEGORI'],
      [''],
      categoryHeaders,
      ...categoryData,
      [''],
      ['TOTAL', categoryAnalysis.reduce((sum, c) => sum + c.total, 0), categoryAnalysis.reduce((sum, c) => sum + c.count, 0)]
    ]);

    categorySheet['!cols'] = [
      { wch: 25 }, // Kategori
      { wch: 20 }, // Total Pengeluaran
      { wch: 18 }  // Jumlah Transaksi
    ];

    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Analisis Kategori');
  }

  // Sheet 5: Analisis Per Karyawan
  const employeeAnalysis = analyzeByEmployee(transfers);
  if (employeeAnalysis.length > 0) {
    const employeeHeaders = [
      'Nama Karyawan',
      'Total Transfer',
      'Total Pengeluaran',
      'Selisih',
      'Jumlah Transfer',
      'Status'
    ];
    const employeeData = employeeAnalysis.map(e => [
      e.employeeName,
      e.totalTransfer,
      e.totalExpense,
      e.difference,
      e.transferCount,
      e.statusSummary
    ]);
    
    const employeeSheet = XLSX.utils.aoa_to_sheet([
      ['ANALISIS PER KARYAWAN'],
      [''],
      employeeHeaders,
      ...employeeData
    ]);

    employeeSheet['!cols'] = [
      { wch: 25 }, // Nama Karyawan
      { wch: 18 }, // Total Transfer
      { wch: 18 }, // Total Pengeluaran
      { wch: 15 }, // Selisih
      { wch: 18 }, // Jumlah Transfer
      { wch: 30 }  // Status
    ];

    XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Analisis Karyawan');
  }

  // Generate filename
  const date = new Date().toISOString().split('T')[0];
  const filename = `Laporan_Kas_${date}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, filename);
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Menunggu Laporan',
    reported: 'Sudah Dilaporkan',
    settled: 'Selesai',
    need_return: 'Perlu Pengembalian',
    need_payment: 'Perlu Pembayaran'
  };
  return statusMap[status] || status;
}

function analyzeByCategory(transfers: CashTransfer[]) {
  const categoryMap: Record<string, { total: number; count: number }> = {};

  transfers.forEach(transfer => {
    if (transfer.expenseDetails) {
      transfer.expenseDetails.forEach(detail => {
        if (!categoryMap[detail.category]) {
          categoryMap[detail.category] = { total: 0, count: 0 };
        }
        categoryMap[detail.category].total += detail.amount;
        categoryMap[detail.category].count += 1;
      });
    }
  });

  return Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count
    }))
    .sort((a, b) => b.total - a.total);
}

function analyzeByEmployee(transfers: CashTransfer[]) {
  const employeeMap: Record<string, {
    totalTransfer: number;
    totalExpense: number;
    transferCount: number;
    statuses: string[];
  }> = {};

  transfers.forEach(transfer => {
    if (!employeeMap[transfer.employeeName]) {
      employeeMap[transfer.employeeName] = {
        totalTransfer: 0,
        totalExpense: 0,
        transferCount: 0,
        statuses: []
      };
    }

    employeeMap[transfer.employeeName].totalTransfer += transfer.transferAmount;
    employeeMap[transfer.employeeName].totalExpense += transfer.actualExpense || 0;
    employeeMap[transfer.employeeName].transferCount += 1;
    employeeMap[transfer.employeeName].statuses.push(getStatusLabel(transfer.status));
  });

  return Object.entries(employeeMap).map(([employeeName, data]) => ({
    employeeName,
    totalTransfer: data.totalTransfer,
    totalExpense: data.totalExpense,
    difference: data.totalExpense - data.totalTransfer,
    transferCount: data.transferCount,
    statusSummary: data.statuses.join(', ')
  }));
}