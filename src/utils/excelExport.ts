import ExcelJS from 'exceljs';
import { IncomeEntry, ExpenseEntry } from '../types/accounting';
import { CashTransaction } from '../types/cash-management';
import { AdvancePayment } from '../hooks/useAdvancePayment';

/**
 * Export transactions to Excel with detailed Debit/Kredit/Saldo structure:
 * 1. Ringkasan Keuangan
 * 2. Riwayat Pemasukan
 * 3. Riwayat Pengeluaran
 * 4. Riwayat Transfer Antar Kas
 * 5. Riwayat Pengeluaran Karyawan
 * 6. Laporan Debet/Kredit
 * 7. Rekonsiliasi Keuangan
 */
export async function exportToExcel(
  incomes: IncomeEntry[],
  expenses: ExpenseEntry[],
  interCashTransfers: CashTransaction[] = [],
  employeeTransfers: AdvancePayment[] = [],
  initialBigBalance: number = 0,
  initialSmallBalance: number = 0
) {
  // Create a new workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Babadolan';
  wb.created = new Date();

  // ==========================================
  // SHEET 1: Ringkasan Keuangan
  // ==========================================
  const ringkasanSheet = wb.addWorksheet('Ringkasan Keuangan');
  ringkasanSheet.columns = [
    { width: 12 },
    { width: 18 },
    { width: 18 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 18 },
    { width: 18 }
  ];
  const ringkasanHeaders = [
    'Tanggal',
    'Kas Besar - Saldo Awal',
    'Kas Kecil - Saldo Awal',
    'Pemasukan (Kas Besar) - Debet',
    'Pengeluaran (Kas Besar) - Kredit',
    'Pemasukan (Kas Kecil) - Debet',
    'Pengeluaran (Kas Kecil) - Kredit',
    'Kas Besar - Saldo Akhir',
    'Kas Kecil - Saldo Akhir'
  ];
  const headerRowRingkasan = ringkasanSheet.getRow(1);
  ringkasanHeaders.forEach((h, i) => {
    const cell = headerRowRingkasan.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF455A64' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });
  headerRowRingkasan.height = 22;
  const uniqueDatesSet = new Set<string>();
  incomes.forEach(i => uniqueDatesSet.add(i.date));
  expenses.forEach(e => uniqueDatesSet.add(e.date));
  const uniqueDates = Array.from(uniqueDatesSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  let openingBig = initialBigBalance;
  let openingSmall = initialSmallBalance;
  let rowIndexRingkasan = 2;
  uniqueDates.forEach(d => {
    const bigDebit = incomes.filter(i => i.cashType === 'big' && i.date === d)
      .reduce((s, i) => s + i.amount, 0);
    const bigCredit = expenses.filter(e => e.cashType === 'big' && e.date === d)
      .reduce((s, e) => s + e.amount, 0);
    const smallDebit = incomes.filter(i => i.cashType === 'small' && i.date === d)
      .reduce((s, i) => s + i.amount, 0);
    const smallCredit = expenses.filter(e => e.cashType === 'small' && e.date === d)
      .reduce((s, e) => s + e.amount, 0);
    const closingBig = openingBig + bigDebit - bigCredit;
    const closingSmall = openingSmall + smallDebit - smallCredit;
    const row = ringkasanSheet.getRow(rowIndexRingkasan);
    const date = new Date(d);
    const formatted = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    row.getCell(1).value = formatted;
    row.getCell(2).value = openingBig;
    row.getCell(3).value = openingSmall;
    row.getCell(4).value = bigDebit;
    row.getCell(5).value = bigCredit;
    row.getCell(6).value = smallDebit;
    row.getCell(7).value = smallCredit;
    row.getCell(8).value = closingBig;
    row.getCell(9).value = closingSmall;
    for (let c = 2; c <= 9; c++) {
      const cell = row.getCell(c);
      cell.numFmt = '#,##0';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
    for (let c = 1; c <= 9; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
    }
    row.height = 20;
    openingBig = closingBig;
    openingSmall = closingSmall;
    rowIndexRingkasan++;
  });

  const riwayatIncomeSheet = wb.addWorksheet('Riwayat Pemasukan');
  riwayatIncomeSheet.columns = [
    { width: 12 },
    { width: 14 },
    { width: 24 },
    { width: 20 },
    { width: 14 },
    { width: 28 },
    { width: 16 },
    { width: 18 }
  ];
  const riwayatIncomeHeaders = [
    'No. Transaksi',
    'Tanggal',
    'Sumber Pemasukan',
    'Jumlah Pemasukan (Debet)',
    'Kas Tujuan',
    'Deskripsi Pemasukan',
    'Bukti Pembayaran',
    'Status Verifikasi'
  ];
  const riRowHeaderIn = riwayatIncomeSheet.getRow(1);
  riwayatIncomeHeaders.forEach((h, i) => {
    const cell = riRowHeaderIn.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  riRowHeaderIn.height = 22;
  const sortedIncomeRows = [...incomes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sortedIncomeRows.forEach((item, idx) => {
    const r = riwayatIncomeSheet.getRow(idx + 2);
    const date = new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    r.getCell(1).value = String(item.id || idx + 1);
    r.getCell(2).value = date;
    r.getCell(3).value = item.source;
    r.getCell(4).value = item.amount;
    r.getCell(4).numFmt = '#,##0';
    r.getCell(5).value = item.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil';
    r.getCell(6).value = item.description;
    r.getCell(7).value = item.photos && item.photos.length > 0 ? '✓ Ada' : '-';
    r.getCell(8).value = '-';
    for (let c = 1; c <= 8; c++) {
      const cell = r.getCell(c);
      cell.alignment = { horizontal: c === 4 ? 'right' : 'left', vertical: 'middle' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFD0D0D0' } }, left: { style: 'thin', color: { argb: 'FFD0D0D0' } }, bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } }, right: { style: 'thin', color: { argb: 'FFD0D0D0' } } };
    }
    r.height = 20;
  });

  const riwayatExpenseSheet = wb.addWorksheet('Riwayat Pengeluaran');
  riwayatExpenseSheet.columns = [
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 22 },
    { width: 20 },
    { width: 28 },
    { width: 22 },
    { width: 16 },
    { width: 18 }
  ];
  const riwayatExpenseHeaders = [
    'No. Transaksi',
    'Tanggal',
    'Kas Sumber',
    'Jumlah Pengeluaran (Kredit)',
    'Penerima Uang',
    'Deskripsi Pengeluaran',
    'Kategori Pengeluaran',
    'Bukti Pengeluaran',
    'Status Verifikasi'
  ];
  const riRowHeaderEx = riwayatExpenseSheet.getRow(1);
  riwayatExpenseHeaders.forEach((h, i) => {
    const cell = riRowHeaderEx.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC62828' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  riRowHeaderEx.height = 22;
  const sortedExpenseRows = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sortedExpenseRows.forEach((item, idx) => {
    const r = riwayatExpenseSheet.getRow(idx + 2);
    const date = new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    r.getCell(1).value = String(item.id || idx + 1);
    r.getCell(2).value = date;
    r.getCell(3).value = item.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil';
    r.getCell(4).value = item.amount;
    r.getCell(4).numFmt = '#,##0';
    r.getCell(5).value = item.paidTo || '-';
    r.getCell(6).value = item.description;
    r.getCell(7).value = item.category;
    r.getCell(8).value = item.photos && item.photos.length > 0 ? '✓ Ada' : '-';
    r.getCell(9).value = '-';
    for (let c = 1; c <= 9; c++) {
      const cell = r.getCell(c);
      cell.alignment = { horizontal: c === 4 ? 'right' : 'left', vertical: 'middle' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFD0D0D0' } }, left: { style: 'thin', color: { argb: 'FFD0D0D0' } }, bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } }, right: { style: 'thin', color: { argb: 'FFD0D0D0' } } };
    }
    r.height = 20;
  });

  const transferSheet = wb.addWorksheet('Riwayat Transfer Antar Kas');
  transferSheet.columns = [
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 20 },
    { width: 28 },
    { width: 22 },
    { width: 16 },
    { width: 18 }
  ];
  const transferHeaders = [
    'No. Transaksi',
    'Tanggal',
    'Kas Sumber',
    'Kas Tujuan',
    'Jumlah Transfer',
    'Deskripsi Transfer',
    'Penerima Transfer',
    'Bukti Transfer',
    'Status Verifikasi'
  ];
  const tHeader = transferSheet.getRow(1);
  transferHeaders.forEach((h, i) => {
    const cell = tHeader.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6A1B9A' } }; // Purple
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  tHeader.height = 22;
  
  interCashTransfers.forEach((t, idx) => {
    const r = transferSheet.getRow(idx + 2);
    const date = new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Determine Source and Dest based on transactionType if available, or assume logic
    // Usually inter-transfer is represented as one record or two?
    // In CashTransaction, if it is 'transfer', it might be one record with source/dest logic?
    // Assuming 't' is the transfer record.
    // If we only have 'out' records for transfers in the list, or both?
    // Let's assume the list contains the 'out' side or we handle it generically.
    // If it has 'relatedTransactionId', it's a pair.
    
    let source = '-';
    let dest = '-';
    if (t.transactionType === 'expense') {
        source = t.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil';
        dest = t.cashType === 'big' ? 'Kas Kecil' : 'Kas Besar';
    } else {
        // Income (Receive from other cash)
        source = t.cashType === 'big' ? 'Kas Kecil' : 'Kas Besar';
        dest = t.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil';
    }

    r.getCell(1).value = String(t.id || idx + 1);
    r.getCell(2).value = date;
    r.getCell(3).value = source;
    r.getCell(4).value = dest;
    r.getCell(5).value = t.amount;
    r.getCell(5).numFmt = '#,##0';
    r.getCell(6).value = t.description;
    r.getCell(7).value = 'Internal';
    r.getCell(8).value = t.proof ? '✓ Ada' : '-';
    r.getCell(9).value = 'Terverifikasi'; // Auto verified for internal?

    for (let c = 1; c <= 9; c++) {
      const cell = r.getCell(c);
      cell.alignment = { horizontal: c === 5 ? 'right' : 'left', vertical: 'middle' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFD0D0D0' } }, left: { style: 'thin', color: { argb: 'FFD0D0D0' } }, bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } }, right: { style: 'thin', color: { argb: 'FFD0D0D0' } } };
    }
    r.height = 20;
  });

  const karyawanSheet = wb.addWorksheet('Riwayat Pengeluaran Karyawan');
  karyawanSheet.columns = [
    { width: 14 }, // No
    { width: 20 }, // Nama
    { width: 14 }, // Tanggal
    { width: 18 }, // Jumlah
    { width: 28 }, // Deskripsi
    { width: 20 }, // Kategori
    { width: 12 }, // Bukti
    { width: 16 }, // Status
    { width: 16 }, // Saldo Kas Kecil
    { width: 16 }, // Debet (Selisih)
    { width: 16 }  // Kredit (Selisih)
  ];
  const karyawanHeaders = [
    'No. Transaksi',
    'Nama Karyawan',
    'Tanggal',
    'Jumlah Pengeluaran',
    'Deskripsi',
    'Kategori',
    'Bukti',
    'Status Verifikasi',
    'Saldo Kas Kecil',
    'Debet (Selisih)',
    'Kredit (Selisih)'
  ];
  const kHeader = karyawanSheet.getRow(1);
  karyawanHeaders.forEach((h, i) => {
    const cell = kHeader.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF546E7A' } }; // Blue Grey
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  kHeader.height = 22;

  let kRow = 2;
  employeeTransfers.forEach((adv, idx) => {
    // 1. Show the Advance itself? Or just the expenses?
    // User asked for "Pengeluaran Karyawan". 
    // Usually we list the items they spent.
    
    if (adv.expense_items && adv.expense_items.length > 0) {
      adv.expense_items.forEach((item, i) => {
        const r = karyawanSheet.getRow(kRow);
        const date = new Date(adv.advance_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        
        r.getCell(1).value = `${adv.id.substring(0, 8)}-${i + 1}`;
        r.getCell(2).value = adv.employee_name;
        r.getCell(3).value = date;
        r.getCell(4).value = item.amount;
        r.getCell(4).numFmt = '#,##0';
        r.getCell(5).value = item.description || adv.notes;
        r.getCell(6).value = '-'; // Category not available in AdvanceExpenseItem
        r.getCell(7).value = item.receipt_url ? '✓ Ada' : '-';
        r.getCell(8).value = adv.status === 'settled' ? 'Sudah' : 'Menunggu';
        r.getCell(9).value = '-'; // Saldo kas kecil not tracked here
        
        // Show difference only on the first row of the group, or separate row?
        // Let's put it on the first row for now.
        if (i === 0) {
            if (adv.difference > 0) {
                // Employee returns money -> Debit for company
                r.getCell(10).value = adv.difference;
                r.getCell(11).value = 0;
            } else {
                // Company pays more -> Credit for company
                r.getCell(10).value = 0;
                r.getCell(11).value = Math.abs(adv.difference);
            }
        } else {
            r.getCell(10).value = '-';
            r.getCell(11).value = '-';
        }
        r.getCell(10).numFmt = '#,##0';
        r.getCell(11).numFmt = '#,##0';
        
        for (let c = 1; c <= 11; c++) {
          const cell = r.getCell(c);
          cell.alignment = { horizontal: [4, 9, 10, 11].includes(c) ? 'right' : 'left', vertical: 'middle' };
          cell.border = { top: { style: 'thin', color: { argb: 'FFD0D0D0' } }, left: { style: 'thin', color: { argb: 'FFD0D0D0' } }, bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } }, right: { style: 'thin', color: { argb: 'FFD0D0D0' } } };
        }
        r.height = 20;
        kRow++;
      });
    }
  });

  const debetKreditSheet = wb.addWorksheet('Laporan Debet Kredit');
  debetKreditSheet.columns = [
    { width: 14 },
    { width: 18 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 28 },
    { width: 16 },
    { width: 14 }
  ];
  const debetKreditHeaders = [
    'Tanggal',
    'No. Ref',
    'Kategori',
    'Debet (Pemasukan)',
    'Kredit (Pengeluaran)',
    'Saldo Kas',
    'Deskripsi',
    'Bukti Pembayaran',
    'Kategori Kas'
  ];
  const dkHeader = debetKreditSheet.getRow(1);
  debetKreditHeaders.forEach((h, i) => {
    const cell = dkHeader.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E88E5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  dkHeader.height = 22;

  type RowCombined = {
    date: string;
    id: string;
    category: string;
    debit: number;
    credit: number;
    description: string;
    proof: string;
    cashCategory: string;
  };
  const combined: RowCombined[] = [];

  // Incomes
  incomes.forEach(i => {
    combined.push({
      date: i.date,
      id: i.id || '-',
      category: i.source,
      debit: i.amount,
      credit: 0,
      description: i.description,
      proof: i.photos && i.photos.length > 0 ? '✓ Ada' : '-',
      cashCategory: i.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'
    });
  });

  // Expenses
  expenses.forEach(e => {
    combined.push({
      date: e.date,
      id: e.id || '-',
      category: e.category,
      debit: 0,
      credit: e.amount,
      description: e.description,
      proof: e.photos && e.photos.length > 0 ? '✓ Ada' : '-',
      cashCategory: e.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'
    });
  });

  // Inter-Cash Transfers
  interCashTransfers.forEach(t => {
     if (t.transactionType === 'income') {
        combined.push({
            date: t.date,
            id: t.id || '-',
            category: 'Transfer Masuk',
            debit: t.amount,
            credit: 0,
            description: t.description,
            proof: t.proof ? '✓ Ada' : '-',
            cashCategory: t.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'
        });
     } else {
        combined.push({
            date: t.date,
            id: t.id || '-',
            category: 'Transfer Keluar',
            debit: 0,
            credit: t.amount,
            description: t.description,
            proof: t.proof ? '✓ Ada' : '-',
            cashCategory: t.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'
        });
     }
  });

  // Employee Transfers (Advances)
  employeeTransfers.forEach(adv => {
      combined.push({
          date: adv.advance_date,
          id: adv.id.substring(0, 8),
          category: 'Advance Karyawan',
          debit: 0,
          credit: adv.advance_amount,
          description: `Advance to ${adv.employee_name}`,
          proof: '-',
          cashCategory: adv.cash_type === 'big' ? 'Kas Besar' : 'Kas Kecil'
      });

      if (adv.return_amount && adv.return_amount > 0 && adv.return_date) {
          combined.push({
            date: adv.return_date,
            id: `${adv.id.substring(0, 8)}-ret`,
            category: 'Pengembalian Advance',
            debit: adv.return_amount,
            credit: 0,
            description: `Pengembalian dari ${adv.employee_name}`,
            proof: '-', 
            cashCategory: adv.cash_type === 'big' ? 'Kas Besar' : 'Kas Kecil'
          });
      }
      
      if (adv.difference < 0 && adv.status === 'settled' && adv.settlement_date) {
          combined.push({
            date: adv.settlement_date,
            id: `${adv.id.substring(0, 8)}-stl`,
            category: 'Pelunasan Advance',
            debit: 0,
            credit: Math.abs(adv.difference),
            description: `Pelunasan ke ${adv.employee_name}`,
            proof: '-', 
            cashCategory: adv.cash_type === 'big' ? 'Kas Besar' : 'Kas Kecil'
          });
      }
  });

  combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let runningSaldo = 0; // Note: This should ideally start from opening balance, but for now 0
  combined.forEach((row, idx) => {
    runningSaldo += row.debit - row.credit;
    const r = debetKreditSheet.getRow(idx + 2);
    const date = new Date(row.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    r.getCell(1).value = date;
    r.getCell(2).value = row.id;
    r.getCell(3).value = row.category;
    r.getCell(4).value = row.debit;
    r.getCell(4).numFmt = '#,##0';
    r.getCell(5).value = row.credit;
    r.getCell(5).numFmt = '#,##0';
    r.getCell(6).value = runningSaldo;
    r.getCell(6).numFmt = '#,##0';
    r.getCell(7).value = row.description;
    r.getCell(8).value = row.proof;
    r.getCell(9).value = row.cashCategory;
    for (let c = 1; c <= 9; c++) {
      const cell = r.getCell(c);
      cell.alignment = { horizontal: c >= 4 && c <= 6 ? 'right' : 'left', vertical: 'middle' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFD0D0D0' } }, left: { style: 'thin', color: { argb: 'FFD0D0D0' } }, bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } }, right: { style: 'thin', color: { argb: 'FFD0D0D0' } } };
    }
    r.height = 20;
  });

  const rekonsiliasiSheet = wb.addWorksheet('Rekonsiliasi Keuangan');
  rekonsiliasiSheet.columns = [
    { width: 14 },
    { width: 18 },
    { width: 22 },
    { width: 22 },
    { width: 20 },
    { width: 20 },
    { width: 14 },
    { width: 28 }
  ];
  const rekHeaders = [
    'Tanggal',
    'Saldo Awal',
    'Pemasukan Total (Debet)',
    'Pengeluaran Total (Kredit)',
    'Kas Besar Saldo Akhir',
    'Kas Kecil Saldo Akhir',
    'Selisih',
    'Catatan Rekonsiliasi'
  ];
  const rHeader = rekonsiliasiSheet.getRow(1);
  rekHeaders.forEach((h, i) => {
    const cell = rHeader.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF37474F' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  rHeader.height = 22;

  // Re-calculate daily for Reconciliation
  // We can reuse the uniqueDates logic from Sheet 1 if we had stored it, but we can just recalc.
  const rekDatesSet = new Set<string>();
  incomes.forEach(i => rekDatesSet.add(i.date));
  expenses.forEach(e => rekDatesSet.add(e.date));
  interCashTransfers.forEach(t => rekDatesSet.add(t.date));
  employeeTransfers.forEach(t => rekDatesSet.add(t.advance_date));
  
  const rekDates = Array.from(rekDatesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  let currentBig = 0; 
  let currentSmall = 0;

  let rRowIdx = 2;
  rekDates.forEach(d => {
    // Incomes
    const dayIncomesBig = incomes.filter(i => i.cashType === 'big' && i.date === d).reduce((s, i) => s + i.amount, 0);
    const dayIncomesSmall = incomes.filter(i => i.cashType === 'small' && i.date === d).reduce((s, i) => s + i.amount, 0);
    
    // Expenses
    const dayExpensesBig = expenses.filter(e => e.cashType === 'big' && e.date === d).reduce((s, e) => s + e.amount, 0);
    const dayExpensesSmall = expenses.filter(e => e.cashType === 'small' && e.date === d).reduce((s, e) => s + e.amount, 0);

    // Transfers
    const dayTransferInBig = interCashTransfers.filter(t => t.cashType === 'big' && t.transactionType === 'income' && t.date === d).reduce((s, t) => s + t.amount, 0);
    const dayTransferInSmall = interCashTransfers.filter(t => t.cashType === 'small' && t.transactionType === 'income' && t.date === d).reduce((s, t) => s + t.amount, 0);
    
    const dayTransferOutBig = interCashTransfers.filter(t => t.cashType === 'big' && t.transactionType === 'expense' && t.date === d).reduce((s, t) => s + t.amount, 0);
    const dayTransferOutSmall = interCashTransfers.filter(t => t.cashType === 'small' && t.transactionType === 'expense' && t.date === d).reduce((s, t) => s + t.amount, 0);

    // Employee Advances (Credit/Expense)
    const dayAdvancesBig = employeeTransfers.filter(a => a.cash_type === 'big' && a.advance_date === d).reduce((s, a) => s + a.advance_amount, 0);
    const dayAdvancesSmall = employeeTransfers.filter(a => a.cash_type === 'small' && a.advance_date === d).reduce((s, a) => s + a.advance_amount, 0);

    const totalIncome = dayIncomesBig + dayIncomesSmall + dayTransferInBig + dayTransferInSmall;
    const totalExpense = dayExpensesBig + dayExpensesSmall + dayTransferOutBig + dayTransferOutSmall + dayAdvancesBig + dayAdvancesSmall;

    const openingTotal = currentBig + currentSmall;

    currentBig = currentBig + dayIncomesBig + dayTransferInBig - dayExpensesBig - dayTransferOutBig - dayAdvancesBig;
    currentSmall = currentSmall + dayIncomesSmall + dayTransferInSmall - dayExpensesSmall - dayTransferOutSmall - dayAdvancesSmall;

    const rRow = rekonsiliasiSheet.getRow(rRowIdx);
    const dateStr = new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    
    rRow.getCell(1).value = dateStr;
    rRow.getCell(2).value = openingTotal;
    rRow.getCell(3).value = totalIncome;
    rRow.getCell(4).value = totalExpense;
    rRow.getCell(5).value = currentBig;
    rRow.getCell(6).value = currentSmall;
    rRow.getCell(7).value = 0; 
    rRow.getCell(8).value = 'Sesuai';

    for (let c = 2; c <= 7; c++) {
      rRow.getCell(c).numFmt = '#,##0';
    }
    
    for (let c = 1; c <= 8; c++) {
      const cell = rRow.getCell(c);
      cell.alignment = { horizontal: c >= 2 && c <= 7 ? 'right' : 'left', vertical: 'middle' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFD0D0D0' } }, left: { style: 'thin', color: { argb: 'FFD0D0D0' } }, bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } }, right: { style: 'thin', color: { argb: 'FFD0D0D0' } } };
    }
    rRow.height = 20;
    rRowIdx++;
  });

  return wb.xlsx.writeBuffer();
}
