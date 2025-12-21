import ExcelJS from 'exceljs';
import { useState } from 'react';
import { Plus, DollarSign, FileText, CheckCircle, ArrowLeftRight, Upload, Trash2, Eye, Download } from 'lucide-react';
import { useAdvancePayment, AdvanceExpenseItem } from '../hooks/useAdvancePayment';
import { useCashManagement } from '../hooks/useCashManagement';
import { supabase } from '../lib/supabase';

interface AdvanceReimbursementSheetProps {
  employees: string[];
}

export function AdvanceReimbursementSheet({ employees }: AdvanceReimbursementSheetProps) {
  const { advances, loading, error, createAdvance, settleAdvance, recordReturn, deleteAdvance } = useAdvancePayment();
  const { addTransaction } = useCashManagement();

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<string | null>(null);

  // Advance form state
  const [advanceEmployee, setAdvanceEmployee] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [advanceCashType, setAdvanceCashType] = useState<'big' | 'small'>('small');
  const [advanceNotes, setAdvanceNotes] = useState('');

  // Settlement form state
  const [expenseItems, setExpenseItems] = useState<AdvanceExpenseItem[]>([]);
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);

  // Return form state
  const [returnAmount, setReturnAmount] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnMethod, setReturnMethod] = useState('Kas Kecil');

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'settled' | 'returned'>('all');
  const [uploadingReceipt, setUploadingReceipt] = useState<string | null>(null);

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceEmployee || !advanceAmount) {
      alert('Mohon lengkapi data karyawan dan jumlah advance');
      return;
    }

    try {
      const amount = parseFloat(advanceAmount);
      
      // Create advance record
      await createAdvance(advanceEmployee, amount, advanceDate, advanceCashType, advanceNotes);
      
      // Record as cash transaction (pengeluaran)
      await addTransaction({
        cashType: advanceCashType,
        transactionType: 'expense',
        amount: amount,
        description: `[Advance Payment] Advance untuk ${advanceEmployee}${advanceNotes ? ` - ${advanceNotes}` : ''}`,
        date: advanceDate,
      });

      // Reset form
      setAdvanceEmployee('');
      setAdvanceAmount('');
      setAdvanceDate(new Date().toISOString().split('T')[0]);
      setAdvanceNotes('');
      setShowAdvanceModal(false);

      alert('Advance payment berhasil dibuat!');
    } catch (error) {
      console.error('Error creating advance:', error);
      alert('Gagal membuat advance payment. Silakan coba lagi.');
    }
  };

  const handleAddExpenseItem = () => {
    const newItem: AdvanceExpenseItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      notes: '',
    };
    setExpenseItems([...expenseItems, newItem]);
  };

  const handleUpdateExpenseItem = (id: string, field: keyof AdvanceExpenseItem, value: any) => {
    setExpenseItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleDeleteExpenseItem = (id: string) => {
    setExpenseItems(items => items.filter(item => item.id !== id));
  };

  const handleUploadReceipt = async (itemId: string, file: File) => {
    try {
      setUploadingReceipt(itemId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${itemId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      handleUpdateExpenseItem(itemId, 'receipt_url', data.publicUrl);
    } catch (error) {
      console.error('Error uploading receipt:', error);
      alert('Gagal upload bukti transaksi. Silakan coba lagi.');
    } finally {
      setUploadingReceipt(null);
    }
  };

  const handleSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvance || expenseItems.length === 0) {
      alert('Mohon tambahkan minimal 1 item pengeluaran');
      return;
    }

    // Validate all items have description and amount
    const invalidItems = expenseItems.filter(item => !item.description || item.amount <= 0);
    if (invalidItems.length > 0) {
      alert('Mohon lengkapi deskripsi dan jumlah untuk semua item pengeluaran');
      return;
    }

    try {
      await settleAdvance(selectedAdvance, expenseItems, settlementDate);
      
      // Reset form
      setExpenseItems([]);
      setSettlementDate(new Date().toISOString().split('T')[0]);
      setShowSettlementModal(false);
      setSelectedAdvance(null);

      alert('Settlement berhasil disimpan!');
    } catch (error) {
      console.error('Error settling advance:', error);
      alert('Gagal menyimpan settlement. Silakan coba lagi.');
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvance || !returnAmount) {
      alert('Mohon lengkapi jumlah pengembalian');
      return;
    }

    try {
      const amount = parseFloat(returnAmount);
      const advance = advances.find(a => a.id === selectedAdvance);
      if (!advance) throw new Error('Advance not found');

      await recordReturn(selectedAdvance, amount, returnDate, returnMethod);

      // Record as cash transaction (pemasukan jika karyawan mengembalikan)
      if (advance.difference > 0) {
        await addTransaction({
          cashType: advance.cash_type,
          transactionType: 'income',
          amount: amount,
          description: `[Pengembalian Advance] Pengembalian dari ${advance.employee_name} - Settlement advance ${advance.advance_amount.toLocaleString('id-ID')}`,
          date: returnDate,
        });
      }

      // Reset form
      setReturnAmount('');
      setReturnDate(new Date().toISOString().split('T')[0]);
      setShowReturnModal(false);
      setSelectedAdvance(null);

      alert('Pengembalian berhasil dicatat!');
    } catch (error) {
      console.error('Error recording return:', error);
      alert('Gagal mencatat pengembalian. Silakan coba lagi.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Babadolan';
      wb.created = new Date();

      // Create worksheet
      const ws = wb.addWorksheet('Detail Pengeluaran Transfer', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 0 }]
      });

      // Set column widths
      ws.columns = [
        { width: 5 },   // NO
        { width: 12 },  // TANGGAL
        { width: 35 },  // KETERANGAN TRANSAKSI
        { width: 20 },  // KATEGORI
        { width: 15 },  // JUMLAH
        { width: 18 }   // METODE PEMBAYARAN
      ];

      let currentRow = 1;

      // Filter advances yang sudah settled (punya expense_items)
      const settledAdvances = advances.filter(adv => 
        adv.expense_items && adv.expense_items.length > 0
      );

      settledAdvances.forEach((advance, advanceIndex) => {
        if (advanceIndex > 0) {
          currentRow += 2; // Add spacing between recipients
        }

        // RECIPIENT HEADER
        const headerRow = ws.getRow(currentRow);
        const headerText = `${advance.employee_name.toUpperCase()} - Total: Rp ${advance.actual_expenses.toLocaleString('id-ID')} (Transfer: Rp ${advance.advance_amount.toLocaleString('id-ID')})`;
        
        headerRow.getCell(1).value = headerText;
        headerRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
        headerRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4A5568' } // Dark gray
        };
        headerRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        
        ws.mergeCells(`A${currentRow}:F${currentRow}`);
        headerRow.height = 25;
        currentRow++;

        // COLUMN HEADERS
        const colHeaderRow = ws.getRow(currentRow);
        const columnHeaders = ['NO', 'TANGGAL', 'KETERANGAN TRANSAKSI', 'KATEGORI', 'JUMLAH', 'METODE PEMBAYARAN'];
        
        columnHeaders.forEach((header, index) => {
          const cell = colHeaderRow.getCell(index + 1);
          cell.value = header;
          cell.font = { bold: true, size: 10, color: { argb: 'FF000000' }, name: 'Arial' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFBDC3C7' } // Light gray
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });
        colHeaderRow.height = 20;
        currentRow++;

        // DATA ROWS
        advance.expense_items.forEach((item, index) => {
          const dataRow = ws.getRow(currentRow);

          dataRow.getCell(1).value = index + 1;
          dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
          dataRow.getCell(1).font = { name: 'Arial', size: 10 };

          const date = new Date(advance.settlement_date || advance.advance_date);
          dataRow.getCell(2).value = date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          dataRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
          dataRow.getCell(2).font = { name: 'Arial', size: 10 };

          dataRow.getCell(3).value = item.description;
          dataRow.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
          dataRow.getCell(3).font = { name: 'Arial', size: 10 };

          dataRow.getCell(4).value = 'Transfer'; // Kategori default untuk advance
          dataRow.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
          dataRow.getCell(4).font = { name: 'Arial', size: 10 };

          dataRow.getCell(5).value = item.amount;
          dataRow.getCell(5).numFmt = 'Rp #,##0';
          dataRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
          dataRow.getCell(5).font = { name: 'Arial', size: 10, color: { argb: 'FFDC3545' } };

          // Metode pembayaran - Transfer Bank karena ini advance
          dataRow.getCell(6).value = 'Transfer Bank';
          dataRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
          dataRow.getCell(6).font = { name: 'Arial', size: 10 };

          for (let col = 1; col <= 6; col++) {
            const cell = dataRow.getCell(col);
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
            };
          }

          dataRow.height = 60; // Taller untuk wrapText
          currentRow++;
        });

        // TOTAL ROW
        const totalRow = ws.getRow(currentRow);
        totalRow.getCell(4).value = 'TOTAL';
        totalRow.getCell(4).font = { bold: true, size: 11, name: 'Arial' };
        totalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
        totalRow.getCell(4).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }
        };

        totalRow.getCell(5).value = advance.actual_expenses;
        totalRow.getCell(5).numFmt = 'Rp #,##0';
        totalRow.getCell(5).font = { bold: true, size: 11, name: 'Arial', color: { argb: 'FFDC3545' } };
        totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
        totalRow.getCell(5).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }
        };

        for (let col = 1; col <= 6; col++) {
          const cell = totalRow.getCell(col);
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
          };
        }

        totalRow.height = 22;
        currentRow++;
      });

      if (settledAdvances.length === 0) {
        const msgRow = ws.getRow(1);
        msgRow.getCell(1).value = 'Tidak ada data transfer dengan detail pengeluaran.';
        msgRow.getCell(1).font = { italic: true, size: 12, color: { argb: 'FF7F8C8D' }, name: 'Arial' };
        msgRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        ws.mergeCells('A1:G1');
        msgRow.height = 30;
      }

      // Download file
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Detail_Pengeluaran_Transfer_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Gagal export ke Excel. Silakan coba lagi.');
    }
  };

  const filteredAdvances = advances.filter(adv => {
    if (activeFilter === 'all') return true;
    return adv.status === activeFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'settled': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'settled': return 'Settled';
      case 'returned': return 'Returned';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Error / Setup Banner */}
      {error === 'TABLE_NOT_EXIST' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
           <p className="font-medium">⚠️ Error Database</p>
           <p className="text-sm">Tabel advance_payments tidak ditemukan. Silakan hubungi administrator.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-3 rounded-lg">
            <ArrowLeftRight className="text-white" size={24} />
          </div>
          <div>
            <h2>Advance & Reimbursement</h2>
            <p className="text-sm text-gray-600">Kelola uang muka dan pengembalian karyawan</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            Export Excel
          </button>
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            Advance Baru
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { value: 'all', label: 'Semua', count: advances.length },
          { value: 'pending', label: 'Pending', count: advances.filter(a => a.status === 'pending').length },
          { value: 'settled', label: 'Settled', count: advances.filter(a => a.status === 'settled').length },
          { value: 'returned', label: 'Returned', count: advances.filter(a => a.status === 'returned').length },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value as any)}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === filter.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Advance List */}
      <div className="space-y-4">
        {filteredAdvances.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-gray-900 mb-2">Belum Ada Data</h3>
            <p className="text-gray-600 mb-4">
              {activeFilter === 'all' 
                ? 'Belum ada advance payment yang dibuat'
                : `Belum ada advance dengan status ${getStatusLabel(activeFilter)}`
              }
            </p>
            {activeFilter === 'all' && (
              <button
                onClick={() => setShowAdvanceModal(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Buat Advance Baru
              </button>
            )}
          </div>
        ) : (
          filteredAdvances.map((advance) => (
            <div key={advance.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg">{advance.employee_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(advance.status)}`}>
                      {getStatusLabel(advance.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(advance.advance_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex gap-2">
                  {advance.status === 'pending' && !advance.settlement_date && (
                    <button
                      onClick={() => {
                        setSelectedAdvance(advance.id);
                        setExpenseItems([]);
                        setShowSettlementModal(true);
                      }}
                      className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <FileText size={16} />
                      Settlement
                    </button>
                  )}
                  {advance.status === 'pending' && advance.difference !== 0 && advance.settlement_date && (
                    <button
                      onClick={() => {
                        setSelectedAdvance(advance.id);
                        setReturnAmount(Math.abs(advance.difference).toString());
                        setShowReturnModal(true);
                      }}
                      className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <DollarSign size={16} />
                      Catat Pengembalian
                    </button>
                  )}
                  {advance.status === 'pending' && !advance.settlement_date && (
                    <button
                      onClick={() => {
                        if (confirm('Yakin ingin menghapus advance ini?')) {
                          deleteAdvance(advance.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 transition-colors p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Advance</p>
                  <p className="text-gray-900">{formatCurrency(advance.advance_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pengeluaran Aktual</p>
                  <p className="text-gray-900">{formatCurrency(advance.actual_expenses)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Selisih</p>
                  <p className={`${
                    advance.difference > 0 ? 'text-green-600' : 
                    advance.difference < 0 ? 'text-red-600' : 
                    'text-gray-900'
                  }`}>
                    {formatCurrency(Math.abs(advance.difference))}
                    {advance.difference > 0 && ' (Kembali)'}
                    {advance.difference < 0 && ' (Kurang)'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dari</p>
                  <p className="text-gray-900">{advance.cash_type === 'big' ? 'Kas Besar' : 'Kas Kecil'}</p>
                </div>
              </div>

              {advance.expense_items && advance.expense_items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm mb-3">Detail Pengeluaran:</h4>
                  <div className="space-y-2">
                    {advance.expense_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm">{item.description}</p>
                          {item.notes && <p className="text-xs text-gray-600">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm">{formatCurrency(item.amount)}</p>
                          {item.receipt_url && (
                            <a
                              href={item.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="Lihat bukti"
                            >
                              <Eye size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {advance.notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Catatan:</strong> {advance.notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Advance */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl mb-4">Buat Advance Payment</h3>
              
              <form onSubmit={handleCreateAdvance} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Karyawan</label>
                  <select
                    value={advanceEmployee}
                    onChange={(e) => setAdvanceEmployee(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Pilih Karyawan</option>
                    {employees.map((emp) => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Jumlah Advance</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <input
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      placeholder="500000"
                      className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Dari Kas</label>
                  <select
                    value={advanceCashType}
                    onChange={(e) => setAdvanceCashType(e.target.value as 'big' | 'small')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="small">Kas Kecil</option>
                    <option value="big">Kas Besar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Catatan (Opsional)</label>
                  <textarea
                    value={advanceNotes}
                    onChange={(e) => setAdvanceNotes(e.target.value)}
                    placeholder="Catatan tambahan..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanceModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Buat Advance
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Settlement */}
      {showSettlementModal && selectedAdvance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl mb-4">Settlement Pengeluaran</h3>
              
              <form onSubmit={handleSettlement} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Tanggal Settlement</label>
                  <input
                    type="date"
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm">Detail Pengeluaran</label>
                    <button
                      type="button"
                      onClick={handleAddExpenseItem}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Plus size={16} />
                      Tambah Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {expenseItems.map((item, index) => (
                      <div key={item.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-gray-600">Item #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpenseItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateExpenseItem(item.id, 'description', e.target.value)}
                          placeholder="Deskripsi pengeluaran..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />

                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                          <input
                            type="number"
                            value={item.amount || ''}
                            onChange={(e) => handleUpdateExpenseItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <textarea
                          value={item.notes || ''}
                          onChange={(e) => handleUpdateExpenseItem(item.id, 'notes', e.target.value)}
                          placeholder="Catatan (opsional)..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Upload size={16} className="text-gray-600" />
                            <span className="text-sm text-blue-600 hover:text-blue-800">
                              {uploadingReceipt === item.id ? 'Uploading...' : item.receipt_url ? 'Ganti Bukti Transaksi' : 'Upload Bukti Transaksi'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadReceipt(item.id, file);
                                }
                              }}
                              className="hidden"
                              disabled={uploadingReceipt === item.id}
                            />
                          </label>
                          {item.receipt_url && (
                            <div className="mt-2 flex items-center gap-2">
                              <CheckCircle size={16} className="text-green-600" />
                              <a
                                href={item.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-600 hover:text-green-800"
                              >
                                Bukti terupload
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {expenseItems.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        Klik "Tambah Item" untuk menambahkan pengeluaran
                      </p>
                    )}
                  </div>
                </div>

                {expenseItems.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm">
                      <strong>Total Pengeluaran: </strong>
                      {formatCurrency(expenseItems.reduce((sum, item) => sum + item.amount, 0))}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettlementModal(false);
                      setSelectedAdvance(null);
                      setExpenseItems([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Simpan Settlement
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Return Payment */}
      {showReturnModal && selectedAdvance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl mb-4">Catat Pengembalian</h3>
              
              <form onSubmit={handleReturn} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  {(() => {
                    const advance = advances.find(a => a.id === selectedAdvance);
                    if (!advance) return null;
                    
                    return (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Karyawan:</strong> {advance.employee_name}
                        </p>
                        <p className="text-sm">
                          <strong>Advance:</strong> {formatCurrency(advance.advance_amount)}
                        </p>
                        <p className="text-sm">
                          <strong>Pengeluaran Aktual:</strong> {formatCurrency(advance.actual_expenses)}
                        </p>
                        <p className="text-sm">
                          <strong>Selisih:</strong>{' '}
                          <span className={advance.difference > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(Math.abs(advance.difference))}
                            {advance.difference > 0 ? ' (Karyawan harus mengembalikan)' : ' (Perusahaan harus bayar)'}
                          </span>
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-sm mb-2">Jumlah Pengembalian</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <input
                      type="number"
                      value={returnAmount}
                      onChange={(e) => setReturnAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Tanggal Pengembalian</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Metode Pengembalian</label>
                  <select
                    value={returnMethod}
                    onChange={(e) => setReturnMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Kas Kecil">Kas Kecil</option>
                    <option value="Kas Besar">Kas Besar</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Potong Gaji">Potong Gaji</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReturnModal(false);
                      setSelectedAdvance(null);
                      setReturnAmount('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Simpan Pengembalian
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Setup Guide - Removed */}
    </div>
  );
}