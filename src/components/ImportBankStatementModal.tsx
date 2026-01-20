import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface ImportBankStatementModalProps {
  onClose: () => void;
  onSuccess: () => void;
  accountId: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
}

interface ColumnMapping {
  date: string;
  description: string;
  reference?: string;
  amount?: string; // For single column (positive/negative)
  debit?: string;  // For separate debit column
  credit?: string; // For separate credit column
  type?: string;   // For separate type column (D/K or DB/CR)
}

export function ImportBankStatementModal({ 
  onClose, 
  onSuccess, 
  accountId,
  accountName,
  accountNumber,
  bankName
}: ImportBankStatementModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map, 3: Preview
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: '',
    description: '',
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header: 1 to get array of arrays first to find header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Simple heuristic: Find the row with the most non-empty cells as header
        // Or just take the first row for now
        if (jsonData.length > 0) {
            // Find first row that looks like a header (has > 2 strings)
            let headerRowIndex = 0;
            for(let i=0; i < Math.min(10, jsonData.length); i++) {
                const row = jsonData[i] as any[];
                if (row.filter(cell => typeof cell === 'string').length >= 2) {
                    headerRowIndex = i;
                    break;
                }
            }

            const detectedHeaders = jsonData[headerRowIndex] as string[];
            setHeaders(detectedHeaders.map((h, i) => h || `Column ${i+1}`));
            
            // Get data rows
            const rows = jsonData.slice(headerRowIndex + 1);
            // Convert array of arrays to array of objects based on detected headers
            const objectRows = rows.map((row: any) => {
                const obj: any = {};
                detectedHeaders.forEach((h: string, i: number) => {
                    obj[h || `Column ${i+1}`] = row[i];
                });
                return obj;
            });

            setRawData(objectRows);
            setStep(2);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Gagal membaca file Excel');
      }
    };
    reader.readAsBinaryString(file);
  };

  const generatePreview = () => {
    if (!mapping.date || !mapping.description || (!mapping.amount && (!mapping.debit && !mapping.credit))) {
      toast.error('Mohon lengkapi mapping kolom wajib');
      return;
    }

    const processed = rawData.slice(0, 5).map(row => processRow(row));
    setPreviewData(processed);
    setStep(3);
  };

  const processRow = (row: any) => {
    // Helper to clean currency string
    const parseAmount = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
        }
        return 0;
    };

    let debit = 0;
    let credit = 0;

    // Strategy 1: Separate Debit/Credit Columns
    if (mapping.debit && mapping.credit) {
        debit = parseAmount(row[mapping.debit]);
        credit = parseAmount(row[mapping.credit]);
    }
    // Strategy 2: Single Amount Column + Type Column
    else if (mapping.amount && mapping.type) {
        const amount = parseAmount(row[mapping.amount]);
        const type = String(row[mapping.type]).toUpperCase();
        if (type.includes('D') || type.includes('OUT') || type.includes('KELUAR')) {
            debit = amount;
        } else {
            credit = amount;
        }
    }
    // Strategy 3: Single Signed Amount Column
    else if (mapping.amount) {
        const amount = parseAmount(row[mapping.amount]);
        if (amount < 0) debit = Math.abs(amount);
        else credit = amount;
    }

    // Parse Date (Handle Excel Serial Date or String)
    let dateStr = row[mapping.date];
    if (typeof dateStr === 'number') {
        // Excel serial date
        const date = new Date(Math.round((dateStr - 25569)*86400*1000));
        dateStr = date.toISOString().split('T')[0];
    } else {
        // Try to parse string date
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                dateStr = date.toISOString().split('T')[0];
            }
        } catch (e) {}
    }

    return {
        date: dateStr,
        description: row[mapping.description],
        reference: mapping.reference ? row[mapping.reference] : '',
        debit,
        credit
    };
  };

  const handleImport = async () => {
    setIsProcessing(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Create Bank Statement Header
        const { data: statement, error: stmtError } = await supabase
            .from('bank_statements')
            .insert({
                userId: user.id,
                accountName,
                accountNumber,
                bankName,
                statementDate: new Date().toISOString().split('T')[0],
                fileName: file?.name || 'Imported File',
                transactions: [], // Legacy field
                reconciled: false
            })
            .select()
            .single();

        if (stmtError) throw stmtError;

        // 2. Process all rows and insert transactions
        const transactions = rawData.map(row => {
            const processed = processRow(row);
            // Skip empty rows
            if (!processed.date || (!processed.debit && !processed.credit)) return null;
            
            return {
                statementId: statement.id,
                date: processed.date,
                description: processed.description,
                reference: processed.reference,
                debit: processed.debit,
                credit: processed.credit,
                status: 'unmatched',
                balance: 0 // Will be calculated later or ignored
            };
        }).filter(Boolean);

        const { error: transError } = await supabase
            .from('bank_transactions')
            .insert(transactions);

        if (transError) throw transError;

        toast.success(`Berhasil mengimpor ${transactions.length} transaksi`);
        onSuccess();
        onClose();

    } catch (error: any) {
        console.error('Import error:', error);
        toast.error('Gagal mengimpor: ' + error.message);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Import Rekening Koran</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
            </button>
        </div>

        <div className="p-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold border-current">1</div>
                    <span className="text-sm font-medium">Upload</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-200 mx-2" />
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold border-current">2</div>
                    <span className="text-sm font-medium">Mapping</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-200 mx-2" />
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold border-current">3</div>
                    <span className="text-sm font-medium">Preview</span>
                </div>
            </div>

            {/* Step 1: Upload */}
            {step === 1 && (
                <div className="text-center py-8">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                    />
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                        <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Klik untuk upload file Excel/CSV</h3>
                        <p className="text-gray-500 mt-2">Mendukung format .xlsx, .xls, .csv</p>
                    </div>
                </div>
            )}

            {/* Step 2: Mapping */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium">File terdeteksi: {file?.name}</p>
                            <p>Silakan cocokkan kolom dari file Excel Anda dengan kolom sistem.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kolom Tanggal *</label>
                            <select 
                                className="w-full rounded-lg border-gray-300"
                                value={mapping.date}
                                onChange={e => setMapping({...mapping, date: e.target.value})}
                            >
                                <option value="">Pilih Kolom...</option>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kolom Deskripsi *</label>
                            <select 
                                className="w-full rounded-lg border-gray-300"
                                value={mapping.description}
                                onChange={e => setMapping({...mapping, description: e.target.value})}
                            >
                                <option value="">Pilih Kolom...</option>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kolom Referensi (Opsional)</label>
                            <select 
                                className="w-full rounded-lg border-gray-300"
                                value={mapping.reference}
                                onChange={e => setMapping({...mapping, reference: e.target.value})}
                            >
                                <option value="">Pilih Kolom...</option>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-4">Metode Nominal</h4>
                        <div className="space-y-4">
                            {/* Option 1: Separate Columns */}
                            <div className="p-3 border rounded-lg">
                                <div className="mb-3">
                                    <label className="flex items-center gap-2 font-medium">
                                        <input 
                                            type="radio" name="method" 
                                            checked={!!mapping.debit || (!mapping.amount)}
                                            onChange={() => setMapping({...mapping, amount: '', type: '', debit: '', credit: ''})} 
                                        />
                                        Kolom Debit & Kredit Terpisah
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pl-6">
                                    <div>
                                        <label className="text-xs text-gray-500">Kolom Debit (Keluar)</label>
                                        <select 
                                            className="w-full text-sm rounded border-gray-300"
                                            value={mapping.debit || ''}
                                            onChange={e => setMapping({...mapping, debit: e.target.value, amount: '', type: ''})}
                                        >
                                            <option value="">Pilih Kolom...</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Kolom Kredit (Masuk)</label>
                                        <select 
                                            className="w-full text-sm rounded border-gray-300"
                                            value={mapping.credit || ''}
                                            onChange={e => setMapping({...mapping, credit: e.target.value, amount: '', type: ''})}
                                        >
                                            <option value="">Pilih Kolom...</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Option 2: Single Column + Signed */}
                            <div className="p-3 border rounded-lg">
                                <div className="mb-3">
                                    <label className="flex items-center gap-2 font-medium">
                                        <input 
                                            type="radio" name="method" 
                                            checked={!!mapping.amount && !mapping.type}
                                            onChange={() => setMapping({...mapping, debit: '', credit: '', type: ''})} 
                                        />
                                        Satu Kolom Nominal (+/-)
                                    </label>
                                </div>
                                <div className="pl-6">
                                    <select 
                                        className="w-full text-sm rounded border-gray-300"
                                        value={mapping.amount || ''}
                                        onChange={e => setMapping({...mapping, amount: e.target.value, debit: '', credit: '', type: ''})}
                                    >
                                        <option value="">Pilih Kolom Nominal...</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Negatif (-) dianggap Debit/Keluar, Positif (+) dianggap Kredit/Masuk</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Kembali</button>
                        <button 
                            onClick={generatePreview}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            Lanjut Preview <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Preview */}
            {step === 3 && (
                <div className="space-y-6">
                    <h3 className="font-medium">Preview 5 Baris Pertama</h3>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                <tr>
                                    <th className="px-4 py-2">Tanggal</th>
                                    <th className="px-4 py-2">Deskripsi</th>
                                    <th className="px-4 py-2 text-right">Debit (Keluar)</th>
                                    <th className="px-4 py-2 text-right">Kredit (Masuk)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {previewData.map((row, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2">{row.date}</td>
                                        <td className="px-4 py-2">{row.description}</td>
                                        <td className="px-4 py-2 text-right text-red-600">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                                        <td className="px-4 py-2 text-right text-green-600">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setStep(2)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Kembali Mapping</button>
                        <button 
                            onClick={handleImport}
                            disabled={isProcessing}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? 'Mengimpor...' : 'Import Sekarang'} <CheckCircle size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
