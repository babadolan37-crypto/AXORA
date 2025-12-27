import { useState } from 'react';
import { Plus, Trash2, Camera, TrendingUp, TrendingDown, Scan, Wallet, ArrowRightLeft,
  Eye,
  EyeOff,
  X,
  Pencil,
  Image as ImageIcon,
  Download,
  MessageCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { IncomeEntry, ExpenseEntry } from '../types/accounting';
import { sendWhatsApp } from '../services/whatsapp';

import { PhotoViewer } from './PhotoViewer';
import { OCRScanner } from './OCRScanner';
import { UniversalTransactionForm } from './UniversalTransactionForm';
import { QuickCashTransferModal } from './QuickCashTransferModal';
import { CashDashboard } from './CashDashboard';

interface TransactionSheetProps {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  incomeSources: string[];
  expenseCategories: string[];
  paymentMethods: string[];
  employees: string[];
  onAddIncome: (entry: Omit<IncomeEntry, 'id'>) => Promise<void>;
  onUpdateIncome: (id: string, entry: Omit<IncomeEntry, 'id'>) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  onAddExpense: (entry: Omit<ExpenseEntry, 'id'>) => Promise<void>;
  onUpdateExpense: (id: string, entry: Omit<ExpenseEntry, 'id'>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

type TransactionType = 'income' | 'expense' | 'transfer';
type CashFilterType = 'all' | 'big' | 'small';

export function TransactionSheet({
  incomeEntries,
  expenseEntries,
  incomeSources,
  expenseCategories,
  paymentMethods,
  employees,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}: TransactionSheetProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>('income');
  const [cashFilter, setCashFilter] = useState<CashFilterType>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sourceOrCategory: '',
    description: '',
    amount: '',
    paymentMethod: paymentMethods[0] || '',
    cashType: 'big' as 'big' | 'small', // Default Kas Besar
    photos: [] as string[],
    receivedFrom: '', // Untuk income: siapa yang bayar
    paidTo: '', // Untuk expense: dibayar ke siapa
    notes: '', // Keterangan tambahan
    // NEW: Fields untuk detail transaksi
    expenseTransactionType: 'expense' as 'transfer' | 'reimburse' | 'expense',
    debitAmount: '', // Nominal Debit (Masuk)
    creditAmount: '', // Nominal Kredit (Keluar)
    transferToSmallCash: false,
    expenseDetails: [] as Array<{description: string; amount: string; category: string}>
  });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerCanDelete, setViewerCanDelete] = useState(false);
  const [ocrScannerOpen, setOcrScannerOpen] = useState(false);
  const [isSmallCashTransferOpen, setIsSmallCashTransferOpen] = useState(false);
  const [isQuickCashTransferOpen, setIsQuickCashTransferOpen] = useState(false);

  const entries = transactionType === 'income' ? incomeEntries : expenseEntries;
  const sourceOrCategoryList = transactionType === 'income' ? incomeSources : expenseCategories;

  // Filter entries by cash type
  const filteredEntries = cashFilter === 'all' 
    ? entries 
    : entries.filter(entry => entry.cashType === cashFilter);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} terlalu besar. Maksimal 10MB per file.`);
        continue;
      }

      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} bukan gambar.`);
        continue;
      }

      const reader = new FileReader();
      const photoData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      newPhotos.push(photoData);
    }

    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };

  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleViewPhotos = (photos: string[], startIndex: number, canDelete: boolean) => {
    setViewerPhotos(photos);
    setViewerIndex(startIndex);
    setViewerCanDelete(canDelete);
    setViewerOpen(true);
  };

  const handleDeletePhotoFromViewer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleOCRComplete = (result: any) => {
    // Auto-select category if detected
    let category = transactionType === 'expense' && result.category ? result.category : formData.sourceOrCategory;
    
    // If employee name detected and category is "Gaji Karyawan", use detected name
    let paidToValue = formData.paidTo;
    if (transactionType === 'expense' && result.detectedEmployeeName) {
      // Check if detected category is "Gaji Karyawan" or contains "gaji" keyword
      const isGajiCategory = result.category === 'Gaji Karyawan' || 
                             result.category.toLowerCase().includes('gaji');
      
      if (isGajiCategory) {
        category = 'Gaji Karyawan'; // Force category to exact match
        paidToValue = result.detectedEmployeeName; // Auto-fill employee name
      }
    }
    
    setFormData({
      ...formData,
      date: result.date,
      sourceOrCategory: category,
      description: result.description,
      amount: result.amount,
      paidTo: paidToValue,
      photos: result.photo ? [result.photo] : formData.photos, // Add scanned photo
    });
    setOcrScannerOpen(false);
    setIsFormOpen(true);
    
    // Show admin fee notification if detected
    if (result.hasAdminFee) {
      setTimeout(() => {
        alert(`⚠️ Terdeteksi biaya admin/layanan!\n\nKata kunci: ${result.adminFeeKeywords.join(', ')}\n\nJangan lupa tambahkan biaya admin secara terpisah jika diperlukan.`);
      }, 500);
    }
    
    // Show employee name detection notification
    if (result.detectedEmployeeName && category === 'Gaji Karyawan') {
      setTimeout(() => {
        alert(`✅ Nama karyawan terdeteksi!\n\n"${result.detectedEmployeeName}"\n\nNama sudah otomatis diisi ke field "Nama Karyawan".`);
      }, 1000);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      sourceOrCategory: sourceOrCategoryList[0] || '',
      description: '',
      amount: '',
      paymentMethod: paymentMethods[0] || '',
      cashType: 'big', // Default Kas Besar
      photos: [],
      receivedFrom: '',
      paidTo: '',
      notes: '',
      // NEW: Reset detail transaksi
      expenseTransactionType: 'expense',
      debitAmount: '',
      creditAmount: '',
      transferToSmallCash: false,
      expenseDetails: []
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Jumlah harus lebih dari 0!');
      return;
    }

    // Validasi untuk SEMUA pengeluaran - detail pengeluaran WAJIB diisi
    if (transactionType === 'expense') {
      if (formData.expenseDetails.length === 0) {
        alert('❌ Detail pengeluaran harus diisi! Klik "Tambah Item" untuk menambahkan minimal 1 item pengeluaran.');
        return;
      }

      const totalDetails = formData.expenseDetails.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const nominal = parseFloat(formData.amount) || 0;
      
      if (totalDetails !== nominal) {
        alert(`❌ Total detail pengeluaran (Rp ${totalDetails.toLocaleString('id-ID')}) harus sama dengan nominal transaksi (Rp ${nominal.toLocaleString('id-ID')})!`);
        return;
      }
    }

    if (transactionType === 'income') {
      const entry = {
        date: formData.date,
        source: formData.sourceOrCategory,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        cashType: formData.cashType,
        photos: formData.photos,
        receivedFrom: formData.receivedFrom,
        notes: formData.notes
      };

      if (editingId) {
        onUpdateIncome(editingId, entry);
      } else {
        onAddIncome(entry);
      }
    } else {
      // Build notes with expense details - SEMUA pengeluaran harus punya detail
      let notesText = formData.notes;
      let categoryForEntry = 'Pengeluaran'; // Default category
      
      // Determine category based on transaction type
      if (formData.expenseTransactionType === 'transfer') {
        categoryForEntry = 'Transfer';
      } else if (formData.expenseTransactionType === 'reimburse') {
        categoryForEntry = 'Reimburse';
      } else if (formData.expenseDetails.length > 0) {
        // Untuk pengeluaran lain, gunakan kategori pertama dari detail
        categoryForEntry = formData.expenseDetails[0].category || 'Pengeluaran';
      }
      
      // Build notes dengan detail pengeluaran
      if (formData.expenseDetails.length > 0) {
        const breakdown = formData.expenseDetails.map((item, index) => {
          return `${index + 1}. ${item.category} - ${item.description}: Rp ${parseFloat(item.amount).toLocaleString('id-ID')}`;
        }).join('\\n');

        const transactionTypeLabel = formData.expenseTransactionType === 'transfer' ? 'Transfer' : 
                                      formData.expenseTransactionType === 'reimburse' ? 'Reimburse' : 
                                      'Pengeluaran';

        notesText = `${transactionTypeLabel}${formData.paidTo ? ' kepada: ' + formData.paidTo : ''}\\n\\nDetail Pengeluaran:\\n${breakdown}\\n\\nTotal: Rp ${parseFloat(formData.amount).toLocaleString('id-ID')}${formData.notes ? '\\n\\nCatatan:\\n' + formData.notes : ''}`;
      }

      const entry = {
        date: formData.date,
        category: categoryForEntry,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        cashType: formData.cashType,
        photos: formData.photos,
        paidTo: formData.paidTo,
        notes: notesText
      };

      if (editingId) {
        onUpdateExpense(editingId, entry);
      } else {
        onAddExpense(entry);
      }
    }

    resetForm();
  };

  const handleNotifyOwner = async (entry: ExpenseEntry) => {
    // Nomor HP Owner (Hardcoded sementara, nanti bisa dari database)
    const ownerPhone = '087785584654'; 
    const message = `*Notifikasi Pengeluaran Baru*\n\n` +
      `Kategori: ${entry.category}\n` +
      `Jumlah: Rp ${entry.amount.toLocaleString('id-ID')}\n` +
      `Keterangan: ${entry.description}\n` +
      `Tanggal: ${entry.date}\n\n` +
      `Mohon dicek di dashboard Axora.`;
      
    if (confirm('Kirim notifikasi WA ke Owner?')) {
       await sendWhatsApp(ownerPhone, message);
       alert('Notifikasi terkirim ke Owner!');
    }
  };

  const handleEdit = (entry: IncomeEntry | ExpenseEntry) => {
    setFormData({
      date: entry.date,
      sourceOrCategory: 'source' in entry ? entry.source : entry.category,
      description: entry.description,
      amount: entry.amount.toString(),
      paymentMethod: entry.paymentMethod,
      cashType: entry.cashType || 'big',
      photos: entry.photos || [],
      receivedFrom: 'source' in entry ? (entry.receivedFrom || '') : '',
      paidTo: 'category' in entry ? (entry.paidTo || '') : '',
      notes: entry.notes || '',
      // NEW: Set detail transaksi
      expenseTransactionType: 'category' in entry ? (entry.category === 'Transfer' ? 'transfer' : 'reimburse') : 'expense',
      debitAmount: 'source' in entry ? entry.amount.toString() : '',
      creditAmount: 'category' in entry ? entry.amount.toString() : '',
      transferToSmallCash: false,
      expenseDetails: 'category' in entry ? (entry.notes || '').split('\n').map(line => {
        const match = line.match(/(\d+)\. (.+?) - (.+?): Rp (\d+)/);
        if (match) {
          return {
            description: match[3],
            amount: match[4],
            category: match[2]
          };
        }
        return {description: '', amount: '', category: ''};
      }).filter(detail => detail.description && detail.amount && detail.category) : []
    });
    setEditingId(entry.id);
    setIsFormOpen(true);
  };

  const exportToExcel = () => {
    // 1. Prepare Data
    const dataToExport = filteredEntries.map(entry => {
      const isIncome = 'source' in entry;
      return {
        'Tanggal': entry.date,
        'Jenis': isIncome ? 'Pemasukan' : 'Pengeluaran',
        'Kategori/Sumber': isIncome ? (entry as IncomeEntry).source : (entry as ExpenseEntry).category,
        'Keterangan': entry.description,
        'Jumlah': entry.amount,
        'Metode Pembayaran': entry.paymentMethod,
        'Kas': entry.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil',
        'Penerima/Pengirim': isIncome ? (entry as IncomeEntry).receivedFrom : (entry as ExpenseEntry).paidTo,
        'Catatan': entry.notes
      };
    });

    // 2. Create Workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // 3. Format Header (Bold & Centered) - Basic styling isn't supported in free SheetJS, 
    // but column widths are helpful.
    const wscols = [
      {wch: 12}, // Tanggal
      {wch: 12}, // Jenis
      {wch: 20}, // Kategori
      {wch: 30}, // Keterangan
      {wch: 15}, // Jumlah
      {wch: 15}, // Metode
      {wch: 10}, // Kas
      {wch: 20}, // Pihak Terkait
      {wch: 40}  // Catatan
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");

    // 4. Generate File
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'});
    
    saveAs(data, `Laporan_${transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDelete = (id: string) => {
    if (transactionType === 'income') {
      onDeleteIncome(id);
    } else {
      onDeleteExpense(id);
    }
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      sourceOrCategory: sourceOrCategoryList[0] || '',
      cashType: 'big'
    }));
    setIsFormOpen(true);
  };

  const handleSmallCashTransferSubmit = async (data: {
    date: string;
    cashType: 'big' | 'small';
    description: string;
    transactionType: 'transfer' | 'reimburse' | 'expense' | 'income';
    receiverName: string;
    debitAmount: number;
    creditAmount: number;
    transferToSmallCash: boolean;
    expenseDetails: Array<{description: string; amount: string; category: string}>;
    notes: string;
  }) => {
    // Determine if this is income or expense
    const isIncome = data.debitAmount > 0;
    const amount = isIncome ? data.debitAmount : data.creditAmount;

    if (isIncome) {
      // Handle Income
      const entry = {
        date: data.date,
        source: data.transactionType === 'income' ? 'Pemasukan Lain' : data.transactionType,
        description: data.description,
        amount: amount,
        paymentMethod: 'Transfer',
        cashType: data.cashType,
        photos: [],
        receivedFrom: data.receiverName || '',
        notes: data.notes
      };
      await onAddIncome(entry);
    } else {
      // Handle Expense with optional expense details
      let notesText = data.notes;
      
      // If has expense details, add to notes
      if (data.expenseDetails && data.expenseDetails.length > 0) {
        const breakdown = data.expenseDetails.map((item, index) => {
          const parseAmount = (amt: string) => parseFloat(amt.replace(/\./g, '')) || 0;
          return `${index + 1}. ${item.category} - ${item.description}: Rp ${parseAmount(item.amount).toLocaleString('id-ID')}`;
        }).join('\n');

        notesText = `${data.transactionType.charAt(0).toUpperCase() + data.transactionType.slice(1)} kepada: ${data.receiverName}\n\nDetail Pengeluaran:\n${breakdown}\n\nTotal: Rp ${amount.toLocaleString('id-ID')}${data.notes ? '\n\nCatatan:\n' + data.notes : ''}`;
      }

      const entry = {
        date: data.date,
        category: data.transactionType === 'transfer' ? 'Transfer' : 
                  data.transactionType === 'reimburse' ? 'Reimburse' : 'Pengeluaran Lain',
        description: data.description,
        amount: amount,
        paymentMethod: 'Transfer',
        cashType: data.cashType,
        photos: [],
        paidTo: data.receiverName,
        notes: notesText
      };

      await onAddExpense(entry);
      
      // If transferToSmallCash is checked, also add income to small cash
      if (data.transferToSmallCash && data.cashType === 'big') {
        const smallCashEntry = {
          date: data.date,
          source: 'Transfer dari Kas Besar',
          description: `Transfer dari Kas Besar: ${data.description}`,
          amount: amount,
          paymentMethod: 'Transfer Internal',
          cashType: 'small' as 'small',
          photos: [],
          receivedFrom: 'Kas Besar',
          notes: `Transfer otomatis dari Kas Besar\nNominal: Rp ${amount.toLocaleString('id-ID')}`
        };
        await onAddIncome(smallCashEntry);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const HiddenValue = ({ value, isIncome }: { value: number, isIncome: boolean }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
      <div className="flex items-center justify-end gap-2">
        <span className={isVisible ? (isIncome ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}>
          {isVisible ? formatCurrency(value) : 'Rp ••••••••'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(!isVisible);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title={isVisible ? "Sembunyikan" : "Tampilkan"}
        >
          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Cash Dashboard - NEW! */}
      <CashDashboard />

      {/* Type Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex gap-2">
        <button
          onClick={() => {
            setTransactionType('income');
            resetForm();
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
            transactionType === 'income'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingUp size={20} />
          <span>Pemasukan</span>
        </button>
        <button
          onClick={() => {
            setTransactionType('expense');
            resetForm();
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
            transactionType === 'expense'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingDown size={20} />
          <span>Pengeluaran</span>
        </button>
      </div>

      {/* Cash Type Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setCashFilter('all')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
              cashFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Wallet size={16} />
            <span>Semua Kas</span>
          </button>
          <button
            onClick={() => setCashFilter('big')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
              cashFilter === 'big'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Wallet size={16} />
            <span>Kas Besar</span>
          </button>
          <button
            onClick={() => setCashFilter('small')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
              cashFilter === 'small'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Wallet size={16} />
            <span>Kas Kecil</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-gray-900">
            {transactionType === 'income' ? 'Data Pemasukan' : 'Data Pengeluaran'}
            {cashFilter !== 'all' && (
              <span className={`ml-2 text-sm px-2 py-1 rounded ${
                cashFilter === 'big' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {cashFilter === 'big' ? 'Kas Besar' : 'Kas Kecil'}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Total {filteredEntries.length} transaksi
            {cashFilter === 'all' && entries.length > 0 && (
              <span className="ml-2 text-xs">
                (Besar: {entries.filter(e => e.cashType === 'big').length}, 
                Kecil: {entries.filter(e => e.cashType === 'small').length})
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsQuickCashTransferOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowRightLeft size={20} />
            <span className="hidden sm:inline">Transfer Kas</span>
            <span className="sm:hidden">Transfer</span>
          </button>
          <button
            onClick={() => setOcrScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Scan size={20} />
            <span className="hidden sm:inline">OCR Scanner</span>
            <span className="sm:hidden">Scan</span>
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
          >
            <Download size={20} />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button
            onClick={handleAddNew}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
              transactionType === 'income'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Tambah {transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-gray-900 mb-4">
            {editingId ? 'Edit' : 'Tambah'} {transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              {/* Sumber Pemasukan hanya untuk income */}
              {transactionType === 'income' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Sumber Pemasukan
                  </label>
                  <select
                    value={formData.sourceOrCategory}
                    onChange={(e) => setFormData({ ...formData, sourceOrCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {sourceOrCategoryList.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Keterangan</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: Pembayaran invoice #001"
              />
            </div>

            {/* NEW: Jenis Transaksi (hanya untuk Pengeluaran) */}
            {transactionType === 'expense' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">Jenis Transaksi</label>
                <select
                  value={formData.expenseTransactionType}
                  onChange={(e) => setFormData({ ...formData, expenseTransactionType: e.target.value as 'transfer' | 'reimburse' | 'expense' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="expense">Pengeluaran Lain</option>
                  <option value="transfer">Transfer</option>
                  <option value="reimburse">Reimburse</option>
                </select>
              </div>
            )}

            {/* NEW: Received From / Paid To Field */}
            {transactionType === 'income' ? (
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Diterima dari <span className="text-gray-500 text-xs">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={formData.receivedFrom}
                  onChange={(e) => setFormData({ ...formData, receivedFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Klien A, Customer B, PT. ABC"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Dibayarkan kepada <span className="text-gray-500 text-xs">(Opsional)</span>
                </label>
                {employees.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={formData.paidTo === '__other__' || !employees.includes(formData.paidTo) && formData.paidTo !== '' ? '__other__' : formData.paidTo}
                      onChange={(e) => {
                        if (e.target.value === '__other__') {
                          setFormData({ ...formData, paidTo: '__other__' });
                        } else {
                          setFormData({ ...formData, paidTo: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Pilih Karyawan --</option>
                      {employees.map(emp => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                      <option value="__other__">⚙️ Input Manual</option>
                    </select>
                    {(formData.paidTo === '__other__' || (!employees.includes(formData.paidTo) && formData.paidTo !== '')) && (
                      <input
                        type="text"
                        value={formData.paidTo === '__other__' ? '' : formData.paidTo}
                        onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ketik nama atau keterangan lainnya"
                        autoFocus
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.paidTo}
                      onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Contoh: Budi Santoso, Supplier X"
                    />
                    <p className="text-xs text-amber-600">💡 Tip: Tambahkan daftar karyawan di menu Pengaturan untuk input lebih cepat!</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Jumlah (Rp)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Metode Pembayaran</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* NEW: Cash Type Selection */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Jenis Kas <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, cashType: 'big' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.cashType === 'big'
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Wallet size={20} />
                  <span>Kas Besar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, cashType: 'small' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.cashType === 'small'
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Wallet size={20} />
                  <span>Kas Kecil</span>
                </button>
              </div>
            </div>

            {/* NEW: Detail Pengeluaran (WAJIB untuk SEMUA pengeluaran) */}
            {transactionType === 'expense' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Detail Pengeluaran <span className="text-red-600">*</span></h4>
                    <p className="text-xs text-gray-600 mt-1">Wajib diisi minimal 1 item dengan total sama dengan nominal transaksi</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        expenseDetails: [
                          ...formData.expenseDetails,
                          { description: '', amount: '', category: expenseCategories[0] || '' }
                        ]
                      });
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Plus size={16} />
                    <span>Tambah Item</span>
                  </button>
                </div>

                {formData.expenseDetails.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm mb-2">⚠️ Belum ada item pengeluaran</p>
                    <p className="text-xs">Klik "Tambah Item" untuk menambahkan detail pengeluaran</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.expenseDetails.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-300 p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Kategori */}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Kategori <span className="text-red-500">*</span></label>
                              <select
                                value={item.category}
                                onChange={(e) => {
                                  const newDetails = [...formData.expenseDetails];
                                  newDetails[index].category = e.target.value;
                                  setFormData({ ...formData, expenseDetails: newDetails });
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                required
                              >
                                {expenseCategories.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>

                            {/* Deskripsi */}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Deskripsi <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => {
                                  const newDetails = [...formData.expenseDetails];
                                  newDetails[index].description = e.target.value;
                                  setFormData({ ...formData, expenseDetails: newDetails });
                                }}
                                placeholder="contoh: Bensin Premium"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                required
                              />
                            </div>

                            {/* Jumlah */}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Jumlah (Rp) <span className="text-red-500">*</span></label>
                              <input
                                type="number"
                                value={item.amount}
                                onChange={(e) => {
                                  const newDetails = [...formData.expenseDetails];
                                  newDetails[index].amount = e.target.value;
                                  setFormData({ ...formData, expenseDetails: newDetails });
                                }}
                                placeholder="0"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                min="0"
                                required
                              />
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const newDetails = formData.expenseDetails.filter((_, i) => i !== index);
                              setFormData({ ...formData, expenseDetails: newDetails });
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors mt-5"
                            title="Hapus item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary - Total Detail vs Nominal */}
                {formData.expenseDetails.length > 0 && formData.amount && (
                  <div className="bg-white rounded-lg border-2 border-gray-300 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Total Detail Pengeluaran:</span>
                      <span className="font-semibold">
                        Rp {formData.expenseDetails.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Nominal Transaksi:</span>
                      <span className="font-semibold">
                        Rp {(parseFloat(formData.amount) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      {(() => {
                        const totalDetails = formData.expenseDetails.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                        const nominal = parseFloat(formData.amount) || 0;
                        const isBalanced = totalDetails === nominal;
                        
                        return (
                          <div className={`text-center py-2 rounded-lg ${isBalanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {isBalanced ? (
                              <span className="text-sm font-medium">✅ Balanced! Total detail sama dengan nominal</span>
                            ) : (
                              <span className="text-sm font-medium">❌ Selisih: Rp {Math.abs(totalDetails - nominal).toLocaleString('id-ID')}</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Photo Upload */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Foto Bukti (Opsional)</label>
              <div className="space-y-3">
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <Camera size={20} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Upload Foto (Max 10MB per foto)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={photo}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer"
                          onClick={() => handleViewPhotos(formData.photos, index, true)}
                          onError={(e) => {
                            console.error('Failed to load thumbnail:', photo.substring(0, 100));
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="%23666"%3EError%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* NEW: Notes Field */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: Catatan penting tentang transaksi ini"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  transactionType === 'income'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {editingId ? 'Simpan Perubahan' : 'Tambah'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                  {transactionType === 'income' ? 'Sumber' : 'Kategori'}
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Keterangan</th>
                <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Kas</th>
                <th className="px-4 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Jumlah</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Pembayaran</th>
                <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Foto</th>
                <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {`Belum ada data ${transactionType === 'income' ? 'pemasukan' : 'pengeluaran'}`
                    }
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {'source' in entry ? entry.source : entry.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entry.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        entry.cashType === 'big'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        <Wallet size={12} />
                        {entry.cashType === 'big' ? 'Besar' : 'Kecil'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                      <HiddenValue value={entry.amount} isIncome={transactionType === 'income'} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entry.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.photos && entry.photos.length > 0 ? (
                        <button
                          onClick={() => handleViewPhotos(entry.photos || [], 0, false)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200 transition-colors"
                        >
                          <ImageIcon size={14} />
                          <span>{entry.photos.length}</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleNotifyOwner(entry as ExpenseEntry)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Lapor ke Owner"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Viewer */}
      {viewerOpen && (
        <PhotoViewer
          photos={viewerPhotos}
          currentIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onNext={() => setViewerIndex((prev) => (prev + 1) % viewerPhotos.length)}
          onPrev={() => setViewerIndex((prev) => (prev - 1 + viewerPhotos.length) % viewerPhotos.length)}
          onDelete={viewerCanDelete ? handleDeletePhotoFromViewer : undefined}
          canDelete={viewerCanDelete}
        />
      )}

      {/* OCR Scanner */}
      {ocrScannerOpen && (
        <OCRScanner
          onExtractComplete={handleOCRComplete}
          onClose={() => setOcrScannerOpen(false)}
        />
      )}

      {/* Universal Transaction Form (formerly Small Cash Transfer Form) */}
      {isSmallCashTransferOpen && (
        <UniversalTransactionForm
          onCancel={() => setIsSmallCashTransferOpen(false)}
          onSubmit={handleSmallCashTransferSubmit}
          expenseCategories={expenseCategories}
        />
      )}

      {/* Quick Cash Transfer Modal */}
      {isQuickCashTransferOpen && (
        <QuickCashTransferModal
          isOpen={isQuickCashTransferOpen}
          onClose={() => setIsQuickCashTransferOpen(false)}
          onAddIncome={async (entry) => { onAddIncome(entry); }}
          onAddExpense={async (entry) => { onAddExpense(entry); }}
        />
      )}
    </div>
  );
}