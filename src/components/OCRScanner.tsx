import { useState, useRef } from 'react';
import { Camera, Scan, X, AlertCircle, CheckCircle, Loader2, FileImage } from 'lucide-react';
import Tesseract from 'tesseract.js@5.1.1';

interface OCRResult {
  date: string;
  description: string;
  amount: string;
  category: string; // Auto-detected category
  categoryConfidence: 'high' | 'medium' | 'low' | 'none';
  hasAdminFee: boolean;
  adminFeeKeywords: string[];
  detectedEmployeeName?: string; // NEW: Auto-detected employee name from OCR
  rawText: string;
  confidence: number;
  photo: string; // Store the photo data
}

interface OCRScannerProps {
  onExtractComplete: (result: OCRResult) => void;
  onClose: () => void;
}

export function OCRScanner({ onExtractComplete, onClose }: OCRScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse tanggal dari text
  const extractDate = (text: string): string => {
    const patterns = [
      // dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
      /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
      // yyyy-mm-dd, yyyy/mm/dd
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
      // dd Month yyyy (e.g., 02 Desember 2024)
      /(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|Mei|Jun|Jul|Ags|Sep|Okt|Nov|Des)\s+(\d{4})/i,
    ];

    const monthMap: { [key: string]: string } = {
      'januari': '01', 'jan': '01',
      'februari': '02', 'feb': '02',
      'maret': '03', 'mar': '03',
      'april': '04', 'apr': '04',
      'mei': '05',
      'juni': '06', 'jun': '06',
      'juli': '07', 'jul': '07',
      'agustus': '08', 'ags': '08',
      'september': '09', 'sep': '09',
      'oktober': '10', 'okt': '10',
      'november': '11', 'nov': '11',
      'desember': '12', 'des': '12',
    };

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // dd/mm/yyyy atau dd-mm-yyyy
        if (pattern.source.includes('1,2')) {
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          const year = match[3];
          
          // Check if it's month name pattern
          if (isNaN(parseInt(match[2]))) {
            const monthName = match[2].toLowerCase();
            const monthNum = monthMap[monthName] || '01';
            return `${year}-${monthNum}-${day}`;
          }
          
          return `${year}-${month}-${day}`;
        }
        // yyyy-mm-dd
        else if (pattern.source.startsWith('\\d{4}')) {
          const year = match[1];
          const month = match[2].padStart(2, '0');
          const day = match[3].padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        // dd Month yyyy
        else {
          const day = match[1].padStart(2, '0');
          const monthName = match[2].toLowerCase();
          const year = match[3];
          const month = monthMap[monthName] || '01';
          return `${year}-${month}-${day}`;
        }
      }
    }

    // Default to today if no date found
    return new Date().toISOString().split('T')[0];
  };

  // Parse nominal dari text
  const extractAmount = (text: string): string => {
    const patterns = [
      // Rp 1.000.000 atau Rp1.000.000
      /Rp\.?\s*([\d.,]+)/gi,
      // IDR 1,000,000
      /IDR\.?\s*([\d.,]+)/gi,
      // Total: 1.000.000 / Total 1.000.000
      /Total[:\s]+([\d.,]+)/gi,
      // Jumlah: 1.000.000 / Jumlah 1.000.000
      /Jumlah[:\s]+([\d.,]+)/gi,
      // Nominal: 1.000.000 / Nominal 1.000.000
      /Nominal[:\s]+([\d.,]+)/gi,
      // Amount: 1.000.000
      /Amount[:\s]+([\d.,]+)/gi,
      // Bayar: 1.000.000
      /Bayar[:\s]+([\d.,]+)/gi,
      // Tagihan: 1.000.000
      /Tagihan[:\s]+([\d.,]+)/gi,
      // Just numbers with dots/commas (at least 4 digits to avoid false positives)
      /(?:^|\s)([\d]{1,3}[.,][\d]{3}(?:[.,][\d]{3})*(?:[.,][\d]{2})?)/g,
    ];

    const amounts: number[] = [];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        let numStr = match[1];
        // Remove dots (thousand separator) and replace comma with dot for decimal
        numStr = numStr.replace(/\./g, '').replace(/,/g, '.');
        const num = parseFloat(numStr);
        // Filter out obvious false positives (dates, phone numbers, etc)
        if (!isNaN(num) && num > 100 && num < 999999999999) {
          amounts.push(num);
        }
      }
    }

    // Return the largest amount found (usually the transaction total)
    if (amounts.length > 0) {
      const maxAmount = Math.max(...amounts);
      return Math.floor(maxAmount).toString();
    }

    return '';
  };

  // Deteksi biaya admin/layanan
  const detectAdminFee = (text: string): { hasAdminFee: boolean; keywords: string[] } => {
    const keywords = [
      'biaya admin',
      'biaya administrasi',
      'biaya layanan',
      'biaya transfer',
      'admin fee',
      'service fee',
      'administration fee',
      'handling fee',
      'processing fee',
      'charge',
    ];

    const foundKeywords: string[] = [];
    const lowerText = text.toLowerCase();

    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }

    return {
      hasAdminFee: foundKeywords.length > 0,
      keywords: foundKeywords,
    };
  };

  // Extract keterangan/deskripsi/berita (with multi-line support)
  const extractDescription = (text: string): string => {
    const lines = text.split('\n').map(line => line.trim());
    
    // Keywords untuk mencari keterangan (prioritas dari yang paling spesifik)
    const descriptionKeywords = [
      // M-Banking / E-Banking specific (BANK-SPECIFIC PRIORITY)
      'berita',  // BCA, BNI - "Berita" field
      'keterangan transaksi', // Mandiri - "Keterangan Transaksi" field (must come before 'keterangan')
      'pesan',
      'remark',
      // General keywords
      'keterangan',
      'deskripsi',
      'description',
      'keperluan',
      'tujuan',
      'note',
      'catatan',
      'uraian',
    ];

    // Keywords yang HARUS DIABAIKAN (bukan keterangan transaksi)
    const ignoreKeywords = [
      'nama penerima', 'nama pengirim', 'penerima', 'pengirim',
      'nomor rekening', 'no rekening', 'no rek', 'rekening',
      'bank', 'bca', 'mandiri', 'bni', 'bri', 'cimb',
      'nama', 'account', 'holder',
      'transaksi lainnya', // Mandiri generic label (bukan keterangan sebenarnya)
      'transfer keuangan', // Generic transaction type
      'tujuan transaksi', // Generic label - BUKAN keterangan!
      'transfer berhasil', // Transaction status
      'transfer sukses', // Transaction status
      'pembayaran berhasil', // Transaction status
      'transaksi berhasil', // Transaction status
      'success', 'successful', // English status
      'metode transfer', // Payment method field - BUKAN keterangan!
      'metode pembayaran', // Payment method field
      'metode', 'method', // Generic method
      'bi fast', 'bifast', // Payment method value - BUKAN keterangan!
      'rtgs', 'skn', 'kliring', // Payment methods
      'online transfer', 'mobile banking', 'internet banking',
      'lainna', 'lainnya', // Generic "other" - BUKAN keterangan spesifik!
      'detail transaksi', // Section header
      'rekening sumber', // Source account
    ];

    // Keywords yang menandakan akhir dari keterangan
    const stopKeywords = [
      'rp', 'idr', 'total', 'jumlah', 'nominal', 'amount',
      'biaya', 'admin', 'tagihan', 'bayar',
      'tanggal', 'date', 'waktu', 'time', 'wib', 'wita',
      'rekening', 'account', 'no', 'nomor',
      'status', 'ref', 'referensi', 'id',
    ];

    // Separator characters
    const separators = ['=', '-', '_', '*', '#'];

    // Function to check if line is a separator
    const isSeparator = (line: string): boolean => {
      if (line.length === 0) return true;
      const uniqueChars = new Set(line.replace(/\s/g, ''));
      return uniqueChars.size <= 2 && separators.some(sep => line.includes(sep));
    };

    // Function to check if line contains stop keywords
    const hasStopKeyword = (line: string): boolean => {
      const lowerLine = line.toLowerCase();
      return stopKeywords.some(keyword => lowerLine.includes(keyword));
    };

    // Function to check if line is likely a number/amount
    const isAmountLine = (line: string): boolean => {
      return /^(rp|idr)?\\.?\\s*[\\d.,]+$/i.test(line.replace(/\\s/g, ''));
    };

    // Function to check if line is a time format (HH.MM or HH:MM)
    const isTimeLine = (line: string): boolean => {
      // Match patterns like: 00.33, 12:45, 23.59, etc
      return /\b\d{2}[.:]\d{2}\b/.test(line);
    };

    // Function to check if line is a date
    const isDateLine = (line: string): boolean => {
      return /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(line) ||
             /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(line);
    };

    // Function to check if line should be ignored (contains nama penerima, rekening, etc)
    const shouldIgnoreLine = (line: string): boolean => {
      const lowerLine = line.toLowerCase();
      
      // Check if line contains time format (00.33, 12:45, etc)
      if (isTimeLine(line)) {
        return true; // Skip time lines
      }
      
      // Check ignore keywords
      if (ignoreKeywords.some(keyword => lowerLine.includes(keyword))) {
        return true;
      }
      
      // Check if line is likely a person's name (ALL CAPS, 2+ words, no numbers)
      const words = line.trim().split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        const allCaps = words.every(word => {
          // Check if word is all uppercase and alphabetic (no numbers/symbols)
          return word === word.toUpperCase() && /^[A-Z]+$/.test(word) && word.length >= 2;
        });
        if (allCaps) {
          return true; // Likely a name like "AMELIA DESTY RAHMANITA"
        }
      }
      
      return false;
    };

    // Search for description keyword and collect multi-line text
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Check if line contains description keyword
      for (const keyword of descriptionKeywords) {
        const keywordIndex = lowerLine.indexOf(keyword);
        if (keywordIndex !== -1) {
          const descriptionParts: string[] = [];
          
          // Extract text after the keyword on the same line
          const afterKeyword = line.substring(keywordIndex + keyword.length)
            .replace(/^[:\s]+/, '') // Remove leading colons/spaces
            .trim();
          
          if (afterKeyword && !isAmountLine(afterKeyword) && !hasStopKeyword(afterKeyword) && !shouldIgnoreLine(afterKeyword)) {
            descriptionParts.push(afterKeyword);
          }
          
          // Collect next lines that are continuation of description
          for (let j = i + 1; j < lines.length && j < i + 5; j++) { // Max 5 lines
            const nextLine = lines[j];
            
            // Skip empty lines but continue checking next lines
            if (!nextLine) continue;
            
            // Hard STOP conditions (end of description block)
            if (isSeparator(nextLine)) break;
            if (isAmountLine(nextLine)) break;
            if (isDateLine(nextLine)) break;
            if (hasStopKeyword(nextLine)) break;
            
            // Check if it's a continuation (not a new keyword)
            const isNewKeyword = descriptionKeywords.some(kw => 
              nextLine.toLowerCase().includes(kw + ':') || 
              nextLine.toLowerCase().startsWith(kw)
            );
            if (isNewKeyword) break;
            
            // SKIP lines that should be ignored (but continue to next line)
            if (shouldIgnoreLine(nextLine)) {
              continue; // ← CONTINUE not BREAK! Skip this line but keep reading
            }
            
            // Add line if it's meaningful
            if (nextLine.length > 2 && !/^\d+$/.test(nextLine)) {
              descriptionParts.push(nextLine);
            } else if (nextLine.length === 0) {
              // Empty line might indicate end of description
              break;
            }
          }
          
          // Combine all parts
          if (descriptionParts.length > 0) {
            let description = descriptionParts.join(' ')
              .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
              .trim();
            
            // Return if we have meaningful text
            if (description.length > 3 && !/^\d+$/.test(description)) {
              return description;
            }
          }
        }
      }
    }

    // Fallback: Look for transaction type keywords
    const transactionKeywords = ['transfer', 'pembayaran', 'pembelian', 'setoran', 'tarik tunai', 'setor tunai'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // SKIP lines that should be ignored (status messages, names, etc)
      if (shouldIgnoreLine(line)) continue;
      
      if (transactionKeywords.some(kw => lowerLine.includes(kw))) {
        // Skip if this is a status line (contains "berhasil", "sukses", dates, etc)
        if (hasStopKeyword(line) || isDateLine(line)) continue;
        
        const descriptionParts: string[] = [line];
        
        // Collect next lines
        for (let j = i + 1; j < lines.length && j < i + 3; j++) {
          const nextLine = lines[j];
          if (!nextLine || isSeparator(nextLine) || isAmountLine(nextLine) || hasStopKeyword(nextLine) || shouldIgnoreLine(nextLine)) {
            break;
          }
          if (nextLine.length > 2) {
            descriptionParts.push(nextLine);
          }
        }
        
        const description = descriptionParts.join(' ').replace(/\s{2,}/g, ' ').trim();
        if (description.length > 5) {
          return description;
        }
      }
    }

    // Final fallback: Return first meaningful line (with strict filtering)
    const meaningfulLines = lines.filter(line => {
      return line.length > 2 && // At least 3 characters
             line.length < 100 && // Not too long (avoid concatenated mess)
             !/^\d+$/.test(line) && // Not just numbers
             !/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(line) && // Not a date
             !isSeparator(line) &&
             !isAmountLine(line) &&
             !isDateLine(line) &&
             !shouldIgnoreLine(line) && // Not in ignore list
             !hasStopKeyword(line); // Not a stop keyword line
    });
    
    return meaningfulLines[0]?.trim() || '';
  };

  // Auto-detect kategori pengeluaran berdasarkan keyword di keterangan
  const detectExpenseCategory = (description: string): { category: string; confidence: 'high' | 'medium' | 'low' | 'none' } => {
    const lowerDesc = description.toLowerCase();
    
    // Kategori dengan keyword mapping (sorted by priority)
    const categoryKeywords = {
      'Listrik': {
        high: ['pln', 'listrik', 'token listrik', 'kwh'],
        medium: ['electric', 'electricity', 'power'],
      },
      'Air': {
        high: ['pdam', 'air'],
        medium: ['water'],
      },
      'Internet & Telekomunikasi': {
        high: ['internet', 'wifi', 'telkom', 'indihome', 'xl', 'telkomsel', 'tri', 'smartfren', 'by.u', 'pulsa', 'paket data'],
        medium: ['telekomunikasi', 'broadband', 'data', 'provider'],
      },
      'Transportasi': {
        high: ['bensin', 'solar', 'pertamax', 'bbm', 'fuel', 'parkir', 'tol', 'grab', 'gojek', 'ojek', 'taxi', 'uber', 'maxim'],
        medium: ['transport', 'kendaraan', 'ongkir', 'angkot', 'bus'],
      },
      'Gaji Karyawan': {
        high: ['gaji', 'salary', 'upah', 'honor', 'tunjangan', 'lembur', 'bonus karyawan'],
        medium: ['payroll', 'pegawai', 'staff'],
      },
      'Sewa': {
        high: ['sewa', 'rent', 'rental', 'kontrak'],
        medium: ['lease', 'ewa'],
      },
      'Bahan Baku': {
        high: ['bahan baku', 'material', 'supplier', 'raw material', 'pembelian bahan'],
        medium: ['bahan', 'stok', 'inventory'],
      },
      'Peralatan Kantor': {
        high: ['atk', 'alat tulis', 'printer', 'kertas', 'tinta', 'cartridge', 'furniture', 'meja', 'kursi'],
        medium: ['office', 'kantor', 'peralatan', 'equipment'],
      },
      'Marketing': {
        high: ['iklan', 'ads', 'advertising', 'promosi', 'marketing', 'facebook ads', 'google ads', 'instagram ads', 'tiktok ads'],
        medium: ['sosmed', 'social media', 'campaign'],
      },
      'Pajak': {
        high: ['pajak', 'tax', 'pph', 'ppn', 'pbb', 'bpjs'],
        medium: [],
      },
    };

    // Check for high confidence matches
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords.high) {
        if (lowerDesc.includes(keyword)) {
          return { category, confidence: 'high' };
        }
      }
    }

    // Check for medium confidence matches
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords.medium) {
        if (lowerDesc.includes(keyword)) {
          return { category, confidence: 'medium' };
        }
      }
    }

    // Low confidence: Check for partial matches or related words
    if (lowerDesc.includes('bayar') || lowerDesc.includes('tagihan') || lowerDesc.includes('bill')) {
      if (lowerDesc.includes('telp') || lowerDesc.includes('hp') || lowerDesc.includes('phone')) {
        return { category: 'Internet & Telekomunikasi', confidence: 'low' };
      }
    }

    // Default
    return { category: 'Lainnya', confidence: 'none' };
  };

  // Extract employee name from OCR text (for salary transactions)
  const extractEmployeeName = (text: string): string => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Keywords to EXCLUDE (not employee names)
    const excludeKeywords = [
      // Bank names
      'BANK', 'BCA', 'MANDIRI', 'BNI', 'BRI', 'CIMB', 'NIAGA', 'PERMATA', 'MEGA',
      'DANAMON', 'PANIN', 'BTN', 'OCBC', 'HSBC', 'CITIBANK', 'STANDARD CHARTERED',
      // Transaction types
      'TRANSFER', 'BERHASIL', 'SUKSES', 'SUCCESS', 'SUCCESSFUL', 'COMPLETED',
      'PEMBAYARAN', 'PEMBELIAN', 'TRANSAKSI', 'PAYMENT', 'TRANSACTION',
      // Common fields
      'PENERIMA', 'PENGIRIM', 'REKENING', 'ACCOUNT', 'HOLDER', 'NAMA',
      'TANGGAL', 'DATE', 'WAKTU', 'TIME', 'JUMLAH', 'NOMINAL', 'AMOUNT',
      'KETERANGAN', 'BERITA', 'DESCRIPTION', 'REMARK', 'NOTE',
      'BIAYA', 'ADMIN', 'FEE', 'CHARGE',
      // E-wallet names
      'GOPAY', 'OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA', 'JENIUS',
      // Status
      'PENDING', 'PROCESS', 'PROCESSING',
      // Days/Months
      'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU',
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
      // Common abbreviations
      'WIB', 'WITA', 'WIT', 'IDR', 'RP',
    ];
    
    // Find potential employee names (ALL CAPS, 2-5 words, alphabetic only)
    const potentialNames: string[] = [];
    
    for (const line of lines) {
      const words = line.trim().split(/\s+/);
      
      // Must be 2-5 words
      if (words.length < 2 || words.length > 5) continue;
      
      // Check if ALL words are uppercase and alphabetic (no numbers/symbols)
      const allCapsAlpha = words.every(word => {
        return word === word.toUpperCase() && 
               /^[A-Z]+$/.test(word) && 
               word.length >= 2 && 
               word.length <= 20;
      });
      
      if (!allCapsAlpha) continue;
      
      // Check if contains excluded keywords
      const upperLine = line.toUpperCase();
      const hasExcluded = excludeKeywords.some(keyword => upperLine.includes(keyword));
      if (hasExcluded) continue;
      
      // Check if line doesn't contain numbers or special characters
      if (/\d/.test(line) || /[^A-Z\s]/.test(line.replace(/\s/g, ''))) continue;
      
      // Looks like a valid name!
      potentialNames.push(line.trim());
    }
    
    // Return the first potential name found (usually the most prominent)
    // Prefer names with 2-3 words (most common Indonesian names)
    const preferred = potentialNames.find(name => {
      const wordCount = name.split(/\s+/).length;
      return wordCount === 2 || wordCount === 3;
    });
    
    return preferred || potentialNames[0] || '';
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 10MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;
      setPreviewImage(imageData);
      processImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(
        imageData,
        'ind+eng', // Indonesian and English
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
        }
      );

      const text = result.data.text;
      const confidence = result.data.confidence;

      // Extract data
      const date = extractDate(text);
      const amount = extractAmount(text);
      const description = extractDescription(text);
      const { hasAdminFee, keywords } = detectAdminFee(text);
      const { category, confidence: categoryConfidence } = detectExpenseCategory(description);
      const detectedEmployeeName = extractEmployeeName(text);

      const ocrData: OCRResult = {
        date,
        description,
        amount,
        category,
        categoryConfidence,
        hasAdminFee,
        adminFeeKeywords: keywords,
        detectedEmployeeName,
        rawText: text,
        confidence,
        photo: imageData, // Store photo
      };

      setOcrResult(ocrData);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Gagal memproses gambar. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleConfirm = () => {
    if (ocrResult) {
      onExtractComplete(ocrResult);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <Scan className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">OCR Scanner - Ekstraksi Data Otomatis</h3>
              <p className="text-sm text-blue-100">Upload foto bukti transaksi untuk ekstraksi otomatis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Area */}
          {!previewImage && (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <Camera className="w-12 h-12 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Upload Foto Bukti Transaksi</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Sistem akan otomatis mengekstrak tanggal, nominal, dan keterangan
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <FileImage className="w-5 h-5" />
                    Pilih Foto
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">Maksimal 10MB • JPG, PNG, atau JPEG</p>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  💡 Tips untuk hasil terbaik:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Pastikan foto jelas dan tidak blur</li>
                  <li>Pastikan pencahayaan cukup terang</li>
                  <li>Foto dalam posisi tegak (tidak miring)</li>
                  <li>Text pada bukti transaksi terlihat jelas</li>
                  <li>Format terbaik: screenshot m-banking/e-banking, struk ATM</li>
                  <li>Pastikan field "Berita/Keterangan" terlihat jelas</li>
                </ul>
              </div>

              {/* Features Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3">
                  <div className="text-2xl mb-1">📅</div>
                  <h5 className="font-semibold text-green-900 text-sm mb-1">Auto-detect Tanggal</h5>
                  <p className="text-xs text-green-700">Mengenali berbagai format tanggal Indonesia & Inggris</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3">
                  <div className="text-2xl mb-1">💰</div>
                  <h5 className="font-semibold text-purple-900 text-sm mb-1">Auto-detect Nominal</h5>
                  <p className="text-xs text-purple-700">Mengenali Rp, IDR, dan format angka dengan separator</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-3">
                  <div className="text-2xl mb-1">📝</div>
                  <h5 className="font-semibold text-orange-900 text-sm mb-1">Auto-detect Berita ⭐</h5>
                  <p className="text-xs text-orange-700">Ekstrak & gabung teks multi-line dari m-banking</p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-lg p-3">
                  <div className="text-2xl mb-1">🏷️</div>
                  <h5 className="font-semibold text-pink-900 text-sm mb-1">Auto-detect Kategori 🆕</h5>
                  <p className="text-xs text-pink-700">Deteksi otomatis kategori dari keterangan transaksi</p>
                </div>
              </div>
              
              {/* Multi-line Support */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-xl">✨</div>
                  <div>
                    <h5 className="font-semibold text-cyan-900 text-sm mb-1">Smart Multi-Line Parsing</h5>
                    <p className="text-xs text-cyan-700">
                      Otomatis menggabungkan teks yang terpecah beberapa baris menjadi satu keterangan lengkap
                    </p>
                    <p className="text-xs text-cyan-600 mt-1 font-mono">
                      "cetak akte ppjb dan<br/>materai" → "cetak akte ppjb dan materai"
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Category Detection Info */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <div className="text-xl">🏷️</div>
                  <div>
                    <h5 className="font-semibold text-pink-900 text-sm mb-1">Smart Category Detection</h5>
                    <p className="text-xs text-pink-700 mb-2">
                      Sistem mendeteksi kategori pengeluaran otomatis dari keterangan transaksi
                    </p>
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="text-xs text-pink-800 cursor-pointer hover:text-pink-900 font-medium">
                    📋 Kategori yang bisa dideteksi (klik untuk lihat)
                  </summary>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded p-2 border border-pink-100">
                      <span className="font-semibold">⚡ Listrik:</span> PLN, token listrik
                    </div>
                    <div className="bg-white rounded p-2 border border-pink-100">
                      <span className="font-semibold">💧 Air:</span> PDAM
                    </div>
                    <div className="bg-white rounded p-2 border border-pink-100">
                      <span className="font-semibold">📡 Internet:</span> WiFi, Telkom, pulsa
                    </div>
                    <div className="bg-white rounded p-2 border border-pink-100">
                      <span className="font-semibold">🚗 Transportasi:</span> Bensin, parkir, Grab
                    </div>
                    <div className="bg-white rounded p-2 border border-pink-100">
                      <span className="font-semibold">👔 Gaji:</span> gaji, upah, honor
                    </div>
                    <div className="bg-white rounded p-2 border border-pink-100">
                      <span className="font-semibold">🏠 Sewa:</span> sewa, rental
                    </div>
                    <div className="bg-white rounded p-2 border border-pink-100">
                      <span className="font-semibold">📦 Bahan Baku:</span> material, supplier
                    </div>
                    <div className="bg-white rounded p-2 border border-pink-100">
                      <span className="font-semibold">🖊️ Alat Kantor:</span> ATK, printer
                    </div>
                    <div className="bg-white rounded p-2 border border-pink-100">
                      <span className="font-semibold">📢 Marketing:</span> iklan, ads, promosi
                    </div>
                    <div className="bg-white rounded p-2 border border-pink-100">
                      <span className="font-semibold">🧾 Pajak:</span> pajak, PPh, PPN, BPJS
                    </div>
                  </div>
                </details>
              </div>
              
              {/* Admin Fee Detection */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-xl">⚠️</div>
                  <div>
                    <h5 className="font-semibold text-yellow-900 text-sm mb-1">Deteksi Biaya Admin</h5>
                    <p className="text-xs text-yellow-700">Notifikasi otomatis jika ditemukan biaya admin/layanan pada bukti transaksi</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-blue-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-medium">Memproses gambar dengan OCR...</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">{progress}%</p>
            </div>
          )}

          {/* Preview Image */}
          {previewImage && !isProcessing && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full rounded-lg border-2 border-gray-200"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    setOcrResult(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* OCR Results */}
          {ocrResult && !isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  Ekstraksi selesai! (Akurasi: {ocrResult.confidence.toFixed(0)}%)
                </span>
              </div>

              {/* Admin Fee Warning */}
              {ocrResult.hasAdminFee && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800 mb-1">
                        Terdeteksi Biaya Admin/Layanan
                      </h4>
                      <p className="text-sm text-yellow-700 mb-2">
                        Kata kunci yang ditemukan: <strong>{ocrResult.adminFeeKeywords.join(', ')}</strong>
                      </p>
                      <p className="text-sm text-yellow-700">
                        💡 Jangan lupa tambahkan biaya admin secara terpisah jika diperlukan!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Data */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">📊 Data yang Diekstraksi:</h4>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <label className="text-xs text-gray-500 block mb-1">📅 Tanggal</label>
                    <input
                      type="date"
                      value={ocrResult.date}
                      onChange={(e) => setOcrResult({ ...ocrResult, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-white rounded p-3 border border-gray-200">
                    <label className="text-xs text-gray-500 block mb-1">💰 Nominal</label>
                    <input
                      type="text"
                      value={ocrResult.amount}
                      onChange={(e) => setOcrResult({ ...ocrResult, amount: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan nominal"
                    />
                    {ocrResult.amount && (
                      <p className="text-xs text-gray-600 mt-1">
                        = Rp {parseInt(ocrResult.amount || '0').toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded p-3 border border-gray-200">
                    <label className="text-xs text-gray-500 block mb-1">📝 Keterangan</label>
                    <textarea
                      value={ocrResult.description}
                      onChange={(e) => setOcrResult({ ...ocrResult, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      placeholder="Keterangan transaksi"
                    />
                  </div>

                  <div className="bg-white rounded p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-500">🏷️ Kategori (Auto-detected)</label>
                      {ocrResult.categoryConfidence !== 'none' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          ocrResult.categoryConfidence === 'high' 
                            ? 'bg-green-100 text-green-700' 
                            : ocrResult.categoryConfidence === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {ocrResult.categoryConfidence === 'high' ? '✅ Yakin' : 
                           ocrResult.categoryConfidence === 'medium' ? '⚠️ Cukup yakin' : 
                           '💭 Perkiraan'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={ocrResult.category}
                      onChange={(e) => setOcrResult({ ...ocrResult, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Kategori pengeluaran"
                    />
                    {ocrResult.categoryConfidence === 'none' && (
                      <p className="text-xs text-gray-500 mt-1">
                        ℹ️ Tidak ada kategori yang terdeteksi, silakan pilih manual
                      </p>
                    )}
                  </div>

                  {/* Employee Name Detection (if detected) */}
                  {ocrResult.detectedEmployeeName && (
                    <div className="bg-white rounded p-3 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-500">👨‍💼 Nama Karyawan Terdeteksi</label>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          ✅ Otomatis
                        </span>
                      </div>
                      <input
                        type="text"
                        value={ocrResult.detectedEmployeeName}
                        onChange={(e) => setOcrResult({ ...ocrResult, detectedEmployeeName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Nama karyawan"
                      />
                      <p className="text-xs text-green-600 mt-1">
                        💡 Nama ini akan otomatis diisi ke field "Nama Karyawan" jika kategori = "Gaji Karyawan"
                      </p>
                    </div>
                  )}
                </div>

                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    📄 Lihat teks lengkap yang dideteksi
                  </summary>
                  <div className="mt-2 bg-white rounded p-3 border border-gray-200 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                      {ocrResult.rawText}
                    </pre>
                  </div>
                </details>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  ✅ Gunakan Data Ini
                </button>
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    setOcrResult(null);
                  }}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  🔄 Scan Ulang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}