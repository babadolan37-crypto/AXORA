import { AlertCircle, CheckCircle, XCircle, Camera, Zap } from 'lucide-react';

export function OCRQuickGuide() {
  return (
    <div className="space-y-4">
      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Tips Cepat OCR Scanner
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Foto jelas & fokus (tidak blur)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Pencahayaan cukup terang</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Posisi tegak (tidak miring)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Background polos & kontras</span>
          </div>
        </div>
      </div>

      {/* What Works Best */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Format Terbaik
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
          <div>✅ Struk ATM</div>
          <div>✅ Screenshot e-banking</div>
          <div>✅ Nota pembayaran digital</div>
          <div>✅ Invoice elektronik</div>
          <div>✅ Bukti transfer</div>
          <div>✅ Struk kasir digital</div>
        </div>
      </div>

      {/* What to Avoid */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          Hindari
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-red-800">
          <div>❌ Foto blur/goyang</div>
          <div>❌ Foto terlalu gelap</div>
          <div>❌ Foto miring >15°</div>
          <div>❌ Teks terlalu kecil</div>
          <div>❌ Glare/pantulan cahaya</div>
          <div>❌ Watermark menutupi teks</div>
        </div>
      </div>

      {/* Detection Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Yang Akan Dideteksi
        </h4>
        <ul className="text-xs text-purple-800 space-y-1">
          <li>📅 Tanggal: DD/MM/YYYY, YYYY-MM-DD, DD Month YYYY</li>
          <li>💰 Nominal: Rp, IDR, Total, Jumlah, Nominal, Amount</li>
          <li>📝 Berita/Keterangan: Berita, Pesan, Keterangan, Deskripsi</li>
          <li>🏷️ Kategori: Listrik, Air, Internet, Transport, dll 🆕</li>
          <li>✨ Multi-line: Otomatis gabung teks yang bertumpuk/terpecah</li>
          <li>⚠️ Biaya Admin: admin fee, service fee, biaya layanan</li>
        </ul>
      </div>

      {/* Important Note */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Penting:</strong> Selalu <strong>review hasil OCR</strong> sebelum submit. 
          Data bisa diedit manual jika ada yang tidak akurat.
        </p>
      </div>
    </div>
  );
}
