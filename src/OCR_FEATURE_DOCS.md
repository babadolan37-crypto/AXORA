# 🤖 Fitur OCR Scanner - Babadolan

## 📋 Deskripsi
Fitur **OCR (Optical Character Recognition) Scanner** memungkinkan pengguna untuk mengunggah foto bukti transaksi dan secara otomatis mengekstrak informasi penting seperti:
- 📅 **Tanggal transaksi**
- 💰 **Nominal pembayaran**
- 📝 **Keterangan/deskripsi transaksi**
- ⚠️ **Deteksi biaya admin/layanan**

## 🎯 Cara Menggunakan

### 1. **Buka OCR Scanner**
   - Pada halaman **Transaksi**, klik tombol **"OCR Scanner"** (ikon Scan)
   - Tombol berada di sebelah tombol "Tambah Pemasukan/Pengeluaran"

### 2. **Upload Foto Bukti Transaksi**
   - Klik tombol **"Pilih Foto"**
   - Pilih foto bukti transaksi dari galeri/kamera
   - Format yang didukung: JPG, PNG, JPEG
   - Ukuran maksimal: 10MB per foto

### 3. **Proses OCR**
   - Sistem akan memproses foto menggunakan teknologi OCR
   - Progress bar akan menunjukkan status pemrosesan (0-100%)
   - Waktu proses: ~5-15 detik tergantung ukuran foto

### 4. **Review & Edit Hasil**
   - Setelah pemrosesan selesai, sistem akan menampilkan data yang diekstraksi:
     * **Tanggal**: Format YYYY-MM-DD (bisa diedit)
     * **Nominal**: Angka tanpa separator (bisa diedit)
     * **Keterangan**: Deskripsi singkat transaksi (bisa diedit)
   
   - **Edit manual**: Klik pada field untuk memperbaiki data jika tidak akurat
   - **Lihat teks lengkap**: Expand "Lihat teks lengkap yang dideteksi" untuk melihat semua teks yang berhasil dibaca

### 5. **Notifikasi Biaya Admin**
   - Jika sistem mendeteksi kata kunci **"biaya admin"** atau **"biaya layanan"**, akan muncul **warning box kuning**
   - Kata kunci yang dicari:
     * biaya admin, biaya administrasi, biaya layanan
     * biaya transfer, admin fee, service fee
     * handling fee, processing fee, charge
   
   - **Action**: User diminta untuk memasukkan biaya admin secara manual sebagai transaksi terpisah jika diperlukan

### 6. **Konfirmasi & Auto-Fill Form**
   - Klik tombol **"✅ Gunakan Data Ini"** untuk mengisi form transaksi secara otomatis
   - Form transaksi akan terbuka dengan data yang sudah terisi:
     * Tanggal
     * Nominal
     * Keterangan
     * Foto bukti transaksi (tersimpan otomatis)
   
   - User tinggal memilih **Sumber/Kategori** dan **Metode Pembayaran**
   - Klik **"Simpan"** untuk menambahkan transaksi

### 7. **Scan Ulang (Opsional)**
   - Jika hasil tidak akurat, klik tombol **"🔄 Scan Ulang"**
   - Upload foto baru atau foto yang sama dengan kualitas lebih baik

---

## 💡 Tips untuk Hasil Terbaik

### ✅ **DO's** (Yang Harus Dilakukan)
1. **Foto Jelas & Fokus**
   - Pastikan foto tidak blur/buram
   - Gunakan kamera dengan resolusi tinggi
   - Fokuskan pada area teks penting

2. **Pencahayaan Cukup**
   - Foto di tempat dengan cahaya terang
   - Hindari bayangan pada kertas
   - Jangan gunakan flash jika menyebabkan glare/pantulan

3. **Posisi Tegak**
   - Foto dalam posisi lurus (tidak miring)
   - Pastikan teks horizontal
   - Gunakan fitur grid kamera untuk membantu alignment

4. **Background Kontras**
   - Letakkan bukti transaksi di background polos (putih/hitam)
   - Hindari background yang ramai/bermotif
   - Pastikan kontras teks dengan background jelas

5. **Format Terbaik untuk OCR**
   - ✅ Struk ATM
   - ✅ Screenshot e-banking/mobile banking
   - ✅ Nota pembayaran digital
   - ✅ Invoice elektronik
   - ✅ Bukti transfer bank
   - ✅ Struk kasir digital

### ❌ **DON'Ts** (Yang Harus Dihindari)
1. ❌ Foto terlalu gelap
2. ❌ Foto blur/goyang
3. ❌ Foto miring >15 derajat
4. ❌ Teks terlalu kecil (zoom in jika perlu)
5. ❌ Foto dengan watermark/stempel menutupi teks penting
6. ❌ Screenshot dengan notifikasi overlay
7. ❌ Foto dengan glare/pantulan cahaya

---

## 🔍 Cara Kerja Ekstraksi

### 1. **Ekstraksi Tanggal**
Sistem mengenali berbagai format tanggal:

#### Format yang Didukung:
- `DD/MM/YYYY` → 02/12/2024
- `DD-MM-YYYY` → 02-12-2024
- `DD.MM.YYYY` → 02.12.2024
- `YYYY-MM-DD` → 2024-12-02
- `YYYY/MM/DD` → 2024/12/02
- `DD Month YYYY` → 02 Desember 2024
- `DD Mon YYYY` → 02 Des 2024

#### Bulan yang Dikenali (Indonesia):
- Januari, Februari, Maret, April, Mei, Juni
- Juli, Agustus, September, Oktober, November, Desember
- Jan, Feb, Mar, Apr, Mei, Jun, Jul, Ags, Sep, Okt, Nov, Des

**Default**: Jika tidak ditemukan tanggal, sistem akan menggunakan tanggal hari ini.

---

### 2. **Ekstraksi Nominal**
Sistem mencari pola angka dengan kata kunci:

#### Kata Kunci yang Dicari:
- `Rp 1.000.000` atau `Rp1.000.000`
- `IDR 1,000,000`
- `Total: 1.000.000` atau `Total 1.000.000`
- `Jumlah: 1.000.000` atau `Jumlah 1.000.000`
- `Nominal: 1.000.000` atau `Nominal 1.000.000`
- `Amount: 1.000.000`
- `Bayar: 1.000.000`
- `Tagihan: 1.000.000`

#### Logika Ekstraksi:
1. Sistem mencari semua angka dengan separator (. atau ,)
2. Filter angka yang valid (Rp 100 - Rp 999.999.999.999)
3. Pilih nominal **terbesar** (biasanya total transaksi)
4. Hapus separator dan simpan sebagai integer

**Contoh 1 - M-Banking BCA:**
```
Input OCR Text:
"Tanggal: 02/12/2024
 Berita: Bayar listrik PLN bulan Desember
 Biaya Admin: Rp 2.500
 Total Bayar: Rp 502.500"

Output Ekstraksi:
- Tanggal: 2024-12-02
- Berita: "Bayar listrik PLN bulan Desember"
- Nominal: 502500 (mengambil yang terbesar)
- Admin Fee: DETECTED ⚠️
```

**Contoh 2 - E-Banking Mandiri:**
```
Input OCR Text:
"Transfer Berhasil
 Tanggal: 02 Desember 2024
 Keterangan: Pembayaran supplier PT ABC
 Jumlah: Rp 5.000.000
 Admin: Rp 6.500"

Output Ekstraksi:
- Tanggal: 2024-12-02
- Keterangan: "Pembayaran supplier PT ABC"
- Nominal: 5000000
- Admin Fee: DETECTED ⚠️
```

**Contoh 3 - Screenshot GoPay/OVO:**
```
Input OCR Text:
"03/12/2024
 Bayar: Top Up GoPay
 Rp 100.000"

Output Ekstraksi:
- Tanggal: 2024-12-03
- Keterangan: "Top Up GoPay"
- Nominal: 100000
- Admin Fee: NOT DETECTED
```

**Contoh 4 - Multi-Line Description (BCA Mobile):**
```
Input OCR Text:
"TRANSFER BERHASIL
 Tanggal: 02/12/2024
 Berita: cetak akte ppjb dan
         materai
 Nominal: Rp 500.000"

Output Ekstraksi:
- Tanggal: 2024-12-02
- Keterangan: "cetak akte ppjb dan materai"  ✅ (Digabung otomatis!)
- Nominal: 500000
- Admin Fee: NOT DETECTED
```

**Contoh 5 - Multi-Line dengan Pembayaran Panjang:**
```
Input OCR Text:
"Keterangan: Pembayaran tagihan
             listrik PLN bulan
             Desember 2024
 Total: Rp 350.000"

Output Ekstraksi:
- Keterangan: "Pembayaran tagihan listrik PLN bulan Desember 2024"  ✅
- Nominal: 350000
```

---

### 3. **Ekstraksi Keterangan/Berita**

### **Keyword Priority** (17+ keywords):

1. **Berita** ⭐ (HIGHEST PRIORITY - BCA, BNI)
2. **Keterangan Transaksi** ⭐ (PRIORITY - Bank Mandiri)
3. **Pesan** (E-wallet: GoPay, OVO, Dana, ShopeePay)
4. **Remark** (English format banks)
5. Keterangan (Generic)
6. Deskripsi / Description
7. Keperluan
8. Tujuan
9. Note / Catatan
10. Uraian

### **🏦 Bank-Specific Field Names:**

```
📱 BCA Mobile/Internet Banking:
   Field: "Berita"
   Example: "Berita: Bayar listrik PLN"
   
🏦 Bank Mandiri:
   Field: "Keterangan Transaksi"
   Example: "Keterangan Transaksi: bensin"
   
🏦 BNI:
   Field: "Berita" atau "Keterangan"
   Example: "Berita: Transfer gaji"
   
📲 GoPay/OVO/Dana:
   Field: "Pesan" atau "Keterangan"
   Example: "Pesan: Top up saldo"
```

### **Cara Kerja:**

Sistem mencari keyword "Berita/Keterangan Transaksi/dll" kemudian mengambil **VALUE** (bukan label):

```
CORRECT Example (BCA):
"Berita: Print"
         ^^^^^  ← Ambil value ini
Result: "Print"  ✅

CORRECT Example (Mandiri):
"Keterangan Transaksi: bensin"
                       ^^^^^^  ← Ambil value ini
Result: "bensin"  ✅

WRONG Example:
"BCA Nama Penerima MURTHOSIYAH
 Berita: Print"
Result: "BCA Nama Penerima..."  ❌ SALAH!

After Fix:
Result: "Print"  ✅ BENAR!
```

**Fallback**: Jika tidak ditemukan kata kunci, sistem akan mengambil:
1. Baris yang mengandung "Transfer/Pembayaran/Pembelian" + lanjutannya
2. Baris pertama yang bermakna (>5 karakter, bukan hanya angka)

### **🔥 Ignore Keywords (NEW!)** - Smart Filtering

Sistem sekarang **MENGABAIKAN** baris yang bukan keterangan transaksi:

```
Ignored Keywords:
❌ Nama Penerima / Nama Pengirim
❌ Penerima / Pengirim
❌ Nomor Rekening / No Rekening / No Rek
❌ Rekening / Account / Holder
❌ Bank / BCA / Mandiri / BNI / BRI / CIMB
❌ Nama
```

**Before (Wrong):**
```
Screenshot:
"BCA Nama Penerima MURTHOSIYAH
 Berita: Print"

Result: "BCA Nama Penerima MURTHOSIYAH"  ❌ SALAH!
```

**After (Correct):**
```
Screenshot:
"BCA Nama Penerima MURTHOSIYAH
 Berita: Print"

Process:
1. Cari keyword "Berita"
2. Ambil "Print" setelah "Berita:"
3. Check next line: "BCA Nama Penerima..." → IGNORED! ❌
4. Result: "Print"  ✅ BENAR!
```

**Multi-Line Support** ⭐ (NEW!):
Sistem sekarang mendukung **keterangan yang terpecah menjadi beberapa baris**:

```
Example Input (Text Bertumpuk):
"Berita: cetak akte ppjb dan
        materai"

Output: "cetak akte ppjb dan materai"  ✅ (Digabung otomatis!)
```

**Cara Kerja Multi-Line:**
1. Deteksi keyword (Berita/Keterangan/etc)
2. Ambil teks di baris yang sama
3. Lanjutkan membaca **hingga 5 baris berikutnya**
4. Gabungkan semua baris yang merupakan lanjutan
5. Stop jika menemukan:
   - Baris kosong berurutan
   - Keyword lain (Tanggal, Nominal, etc)
   - Separator (===, ---, ___)
   - Angka/nominal (Rp, IDR, dll)

**Fallback**: Jika tidak ditemukan kata kunci, sistem akan mengambil:
1. Baris yang mengandung "Transfer/Pembayaran/Pembelian" + lanjutannya
2. Baris pertama yang bermakna (>5 karakter, bukan hanya angka)

---

### 4. **Deteksi Biaya Admin/Layanan**

#### Kata Kunci yang Dicari (Case-Insensitive):
- `biaya admin`
- `biaya administrasi`
- `biaya layanan`
- `biaya transfer`
- `admin fee`
- `service fee`
- `administration fee`
- `handling fee`
- `processing fee`
- `charge`

#### Notifikasi:
Jika ditemukan salah satu kata kunci di atas:
1. **Warning Box** akan muncul di hasil OCR
2. **Alert Popup** akan muncul setelah auto-fill form
3. User diminta untuk **memasukkan biaya admin secara manual** sebagai transaksi terpisah

**Contoh**:
```
Detected Keywords: biaya admin, admin fee

Warning: ⚠️ Terdeteksi Biaya Admin/Layanan!
Kata kunci: biaya admin, admin fee
💡 Jangan lupa tambahkan biaya admin secara terpisah jika diperlukan!
```

---

## 🎨 Tampilan UI

### **Step 1: Upload Area**
```
┌─────────────────────────────────────────┐
│     📷 Camera Icon                      │
│                                         │
│  Upload Foto Bukti Transaksi           │
│  Sistem akan otomatis mengekstrak      │
│  tanggal, nominal, dan keterangan      │
│                                         │
│      [📄 Pilih Foto]                    │
│                                         │
│  Maksimal 10MB • JPG, PNG, atau JPEG   │
└─────────────────────────────────────────┘

💡 Tips untuk hasil terbaik:
✓ Pastikan foto jelas dan tidak blur
✓ Pastikan pencahayaan cukup terang
✓ Foto dalam posisi tegak (tidak miring)
✓ Text pada bukti transaksi terlihat jelas
✓ Format terbaik: struk ATM, e-banking, nota

┌─────────┐ ┌─────────┐ ┌─────────┐
│📅 Auto  │ │💰 Auto  │ │⚠️ Deteksi│
│Tanggal  │ │Nominal  │ │Biaya    │
│         │ │         │ │Admin    │
└─────────┘ └─────────┘ └─────────┘
```

### **Step 2: Processing**
```
┌─────────────────────────────────────────┐
│  ⏳ Memproses gambar dengan OCR...      │
│                                         │
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░  65%   │
└────────────────────────────────────────┘
```

### **Step 3: Results**
```
┌─────────────────────────────────────────┐
│  ✅ Ekstraksi selesai! (Akurasi: 92%)   │
└─────────────────────────────────────────┘

⚠️ TERDETEKSI BIAYA ADMIN/LAYANAN
Kata kunci: biaya admin, admin fee
💡 Jangan lupa tambahkan biaya admin secara terpisah!

📊 Data yang Diekstraksi:

┌─────────────────────────────────────────┐
│ 📅 Tanggal                              │
│ [2024-12-02]                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 💰 Nominal                              │
│ [500000]                                │
│ = Rp 500.000                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📝 Keterangan                           │
│ [Pembayaran listrik PLN...]             │
└─────────────────────────────────────────┘

[✅ Gunakan Data Ini]  [🔄 Scan Ulang]
```

---

---

## 🏷️ Auto-Detect Kategori Pengeluaran (NEW!)

### **Apa itu Auto-Detect Kategori?**

Sistem OCR sekarang dapat **mendeteksi kategori pengeluaran secara otomatis** berdasarkan keyword yang ditemukan di keterangan transaksi!

### **Kategori yang Dapat Dideteksi:**

#### **1. ⚡ Listrik**
```
Keyword HIGH Confidence:
✅ pln
✅ listrik
✅ token listrik
✅ kwh

Keyword MEDIUM Confidence:
⚠️ electric
⚠️ electricity
⚠️ power

Example:
"Bayar tagihan PLN bulan Desember" → Kategori: "Listrik" (HIGH)
```

#### **2. 💧 Air**
```
Keyword HIGH Confidence:
✅ pdam
✅ air

Keyword MEDIUM Confidence:
⚠️ water

Example:
"Bayar PDAM November 2024" → Kategori: "Air" (HIGH)
```

#### **3. 📡 Internet & Telekomunikasi**
```
Keyword HIGH Confidence:
✅ internet
✅ wifi
✅ telkom
✅ indihome
✅ xl, telkomsel, tri, smartfren, by.u
✅ pulsa
✅ paket data

Keyword MEDIUM Confidence:
⚠️ telekomunikasi
⚠️ broadband
⚠️ data
⚠️ provider

Example:
"Top up pulsa XL 50rb" → Kategori: "Internet & Telekomunikasi" (HIGH)
"Bayar WiFi IndiHome" → Kategori: "Internet & Telekomunikasi" (HIGH)
```

#### **4. 🚗 Transportasi**
```
Keyword HIGH Confidence:
✅ bensin
✅ solar
✅ pertamax
✅ bbm, fuel
✅ parkir
✅ tol
✅ grab, gojek, ojek, taxi, uber, maxim

Keyword MEDIUM Confidence:
⚠️ transport
⚠️ kendaraan
⚠️ ongkir
⚠️ angkot, bus

Example:
"Isi bensin Pertamax" → Kategori: "Transportasi" (HIGH)
"Ongkos Grab ke kantor" → Kategori: "Transportasi" (HIGH)
```

#### **5. 👔 Gaji Karyawan**
```
Keyword HIGH Confidence:
✅ gaji
✅ salary
✅ upah
✅ honor
✅ tunjangan
✅ lembur
✅ bonus karyawan

Keyword MEDIUM Confidence:
⚠️ payroll
⚠️ pegawai
⚠️ staff

Example:
"Transfer gaji karyawan bulan Desember" → Kategori: "Gaji Karyawan" (HIGH)
```

#### **6. 🏠 Sewa**
```
Keyword HIGH Confidence:
✅ sewa
✅ rent
✅ rental
✅ kontrak

Keyword MEDIUM Confidence:
⚠️ lease

Example:
"Bayar sewa kantor Q4 2024" → Kategori: "Sewa" (HIGH)
```

#### **7. 📦 Bahan Baku**
```
Keyword HIGH Confidence:
✅ bahan baku
✅ material
✅ supplier
✅ raw material
✅ pembelian bahan

Keyword MEDIUM Confidence:
⚠️ bahan
⚠️ stok
⚠️ inventory

Example:
"Pembelian bahan baku dari supplier ABC" → Kategori: "Bahan Baku" (HIGH)
```

#### **8. 🖊️ Peralatan Kantor**
```
Keyword HIGH Confidence:
✅ atk
✅ alat tulis
✅ printer
✅ kertas
✅ tinta
✅ cartridge
✅ furniture
✅ meja, kursi

Keyword MEDIUM Confidence:
⚠️ office
⚠️ kantor
⚠️ peralatan
⚠️ equipment

Example:
"Beli ATK untuk kantor" → Kategori: "Peralatan Kantor" (HIGH)
```

#### **9. 📢 Marketing**
```
Keyword HIGH Confidence:
✅ iklan
✅ ads
✅ advertising
✅ promosi
✅ marketing
✅ facebook ads, google ads, instagram ads, tiktok ads

Keyword MEDIUM Confidence:
⚠️ sosmed
⚠️ social media
⚠️ campaign

Example:
"Biaya iklan Facebook Ads Desember" → Kategori: "Marketing" (HIGH)
```

#### **10. 🧾 Pajak**
```
Keyword HIGH Confidence:
✅ pajak
✅ tax
✅ pph
✅ ppn
✅ pbb
✅ bpjs

Example:
"Bayar PPh 23 bulan Desember" → Kategori: "Pajak" (HIGH)
```

#### **11. 🏷️ Lainnya**
```
Default kategori jika tidak ada keyword yang match.

Example:
"Cetak akte ppjb dan materai" → Kategori: "Lainnya" (NONE)
```

---

### **Tingkat Keyakinan (Confidence Level):**

| Level | Badge | Keterangan |
|-------|-------|------------|
| **HIGH** | ✅ Yakin | Keyword spesifik ditemukan (PLN, Grab, ATK, dll) |
| **MEDIUM** | ⚠️ Cukup yakin | Keyword umum ditemukan (transport, office, dll) |
| **LOW** | 💭 Perkiraan | Berdasarkan konteks partial match |
| **NONE** | - | Tidak ada kategori yang terdeteksi → "Lainnya" |

---

### **Contoh Real-World Detection:**

#### **Test Case 1: Listrik PLN**
```
Input Keterangan:
"Bayar tagihan PLN 123456789 Desember 2024"

Output:
✅ Kategori: "Listrik"
✅ Confidence: HIGH
✅ Matched Keyword: "pln"
```

#### **Test Case 2: Internet WiFi**
```
Input Keterangan:
"Pembayaran WiFi IndiHome bulan Des"

Output:
✅ Kategori: "Internet & Telekomunikasi"
✅ Confidence: HIGH
✅ Matched Keyword: "indihome"
```

#### **Test Case 3: Transport Grab**
```
Input Keterangan:
"Ongkos Grab ke meeting client"

Output:
✅ Kategori: "Transportasi"
✅ Confidence: HIGH
✅ Matched Keyword: "grab"
```

#### **Test Case 4: Gaji Karyawan**
```
Input Keterangan:
"Transfer gaji karyawan produksi"

Output:
✅ Kategori: "Gaji Karyawan"
✅ Confidence: HIGH
✅ Matched Keyword: "gaji"
```

#### **Test Case 5: Tidak Terdeteksi**
```
Input Keterangan:
"Cetak akte ppjb dan materai"

Output:
⚪ Kategori: "Lainnya"
⚪ Confidence: NONE
⚪ Info: "Tidak ada kategori yang terdeteksi"
```

---

### **Cara Kerja Detection:**

```javascript
detectExpenseCategory(description) {
  1. Normalize: lowercase semua text
  
  2. Check HIGH confidence keywords:
     FOR EACH category:
       IF high_keyword FOUND in description:
         RETURN { category, confidence: 'high' }
  
  3. Check MEDIUM confidence keywords:
     FOR EACH category:
       IF medium_keyword FOUND in description:
         RETURN { category, confidence: 'medium' }
  
  4. Check LOW confidence (partial match):
     IF "bayar/tagihan/bill" + "telp/hp/phone":
       RETURN { category: 'Internet', confidence: 'low' }
  
  5. Default fallback:
     RETURN { category: 'Lainnya', confidence: 'none' }
}
```

---

### **UI Display:**

```
┌─────────────────────────────────────────────────┐
│ 🏷️ Kategori (Auto-detected)    ✅ Yakin        │
│ ┌─────────────────────────────────────────────┐ │
│ │ Listrik                                     │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏷️ Kategori (Auto-detected)    ⚠️ Cukup yakin  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Transportasi                                │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏷️ Kategori (Auto-detected)                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ Lainnya                                     │ │
│ └─────────────────────────────────────────────┘ │
│ ℹ️ Tidak ada kategori yang terdeteksi          │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Teknologi yang Digunakan

### **Tesseract.js v5.1.1**
- Open-source OCR engine
- Mendukung 100+ bahasa
- Akurasi tinggi untuk teks Latin & Indonesia
- Processing di browser (client-side)

### **Language Models**
- `ind` - Indonesian
- `eng` - English
- Kombinasi: `ind+eng` untuk hasil terbaik

### **Processing Pipeline**
1. Image Upload → Base64 encoding
2. Tesseract Recognition → Text extraction
3. Regex Parsing → Data extraction
4. Validation → Data cleaning
5. Auto-fill Form → User confirmation

---

## 📊 Akurasi & Performa

### **Akurasi**
- **Foto Berkualitas Tinggi**: 90-95%
- **Foto Standar**: 70-85%
- **Foto Berkualitas Rendah**: 50-70%

### **Waktu Proses**
- **Foto <1MB**: ~5-8 detik
- **Foto 1-5MB**: ~8-12 detik
- **Foto 5-10MB**: ~12-15 detik

### **Faktor yang Mempengaruhi**
1. Kualitas foto (resolusi, focus, lighting)
2. Ukuran file foto
3. Kompleksitas teks pada bukti transaksi
4. Kecepatan internet (untuk loading Tesseract model)
5. Spesifikasi device (CPU/RAM)

---

## ⚠️ Limitasi & Catatan

### **Limitasi**
1. **Ukuran File**: Maksimal 10MB per foto
2. **Format**: Hanya JPG, PNG, JPEG (tidak support PDF)
3. **Akurasi**: Tidak 100% akurat, perlu review manual
4. **Bahasa**: Terbaik untuk teks Indonesia & Inggris
5. **Handwriting**: Tidak mendukung tulisan tangan
6. **Orientation**: Foto miring >30° mungkin tidak akurat

### **Catatan Penting**
- ✅ **ALWAYS REVIEW** hasil OCR sebelum submit
- ✅ Data bisa diedit manual sebelum auto-fill form
- ✅ Foto bukti transaksi tersimpan otomatis
- ✅ Biaya admin harus diinput manual sebagai transaksi terpisah
- ✅ OCR berjalan di browser (privacy-friendly, data tidak dikirim ke server)

---

## 🧪 Test Cases - Multi-Line Description

### **Test Case 1: Teks Bertumpuk Sederhana**
```
Input:
"Berita: cetak akte ppjb dan
        materai"

Expected Output:
"cetak akte ppjb dan materai"  ✅

Cara Kerja:
1. Deteksi keyword "Berita:"
2. Ambil "cetak akte ppjb dan" (baris 1)
3. Lanjut baca baris 2: "materai"
4. Gabung: "cetak akte ppjb dan" + "materai"
5. Clean spaces: "cetak akte ppjb dan materai"
```

### **Test Case 2: Teks 3 Baris**
```
Input:
"Keterangan: Pembayaran tagihan
             listrik PLN bulan
             Desember 2024
 Total: Rp 350.000"

Expected Output:
"Pembayaran tagihan listrik PLN bulan Desember 2024"  ✅

Cara Kerja:
1. Deteksi "Keterangan:"
2. Baris 1: "Pembayaran tagihan"
3. Baris 2: "listrik PLN bulan"
4. Baris 3: "Desember 2024"
5. Baris 4: "Total: Rp 350.000" → STOP (keyword "Total")
6. Gabung 3 baris pertama
```

### **Test Case 3: Stop di Separator**
```
Input:
"Berita: Transfer untuk
        pembayaran vendor
 =============================
 Nominal: Rp 1.000.000"

Expected Output:
"Transfer untuk pembayaran vendor"  ✅

Cara Kerja:
1. Deteksi "Berita:"
2. Baris 1: "Transfer untuk"
3. Baris 2: "pembayaran vendor"
4. Baris 3: "=====" → STOP (separator detected)
5. Gabung 2 baris
```

### **Test Case 4: Stop di Baris Kosong**
```
Input:
"Pesan: Bayar cicilan mobil

 Jumlah: Rp 3.500.000"

Expected Output:
"Bayar cicilan mobil"  ✅

Cara Kerja:
1. Deteksi "Pesan:"
2. Baris 1: "Bayar cicilan mobil"
3. Baris 2: "" (kosong) → STOP
4. Return "Bayar cicilan mobil"
```

### **Test Case 5: Mixed dengan Angka**
```
Input:
"Keterangan: Pembelian bahan
             baku 50kg
 Rp 500.000"

Expected Output:
"Pembelian bahan baku 50kg"  ✅

Cara Kerja:
1. Deteksi "Keterangan:"
2. Baris 1: "Pembelian bahan"
3. Baris 2: "baku 50kg" (angka di dalam teks = OK)
4. Baris 3: "Rp 500.000" → STOP (amount line)
5. Gabung 2 baris
```

### **Test Case 6: Keyword di Tengah Teks**
```
Input:
"Transfer Berhasil
 Berita: top up saldo
         e-wallet
 Total: Rp 100.000"

Expected Output:
"top up saldo e-wallet"  ✅

Cara Kerja:
1. Skip "Transfer Berhasil" (bukan keyword)
2. Deteksi "Berita:" di baris 2
3. Baris 2: "top up saldo"
4. Baris 3: "e-wallet"
5. Baris 4: "Total:" → STOP
6. Gabung
```

---

## 🆘 Troubleshooting

### **Masalah: OCR tidak mendeteksi tanggal/nominal**
**Solusi**:
1. Pastikan foto jelas dan tidak blur
2. Crop foto pada area yang berisi tanggal/nominal
3. Tingkatkan brightness/contrast foto sebelum upload
4. Manual edit hasil OCR sebelum confirm

### **Masalah: Akurasi rendah (<70%)**
**Solusi**:
1. Ambil foto ulang dengan pencahayaan lebih baik
2. Gunakan foto dengan resolusi lebih tinggi
3. Pastikan teks terlihat jelas (tidak terlalu kecil)
4. Hindari watermark/overlay pada teks penting

### **Masalah: Processing lama (>30 detik)**
**Solusi**:
1. Compress foto sebelum upload (target <2MB)
2. Close tab/app lain untuk free up memory
3. Restart browser jika perlu
4. Periksa koneksi internet (untuk loading model)

### **Masalah: "Gagal memproses gambar"**
**Solusi**:
1. Refresh halaman dan coba lagi
2. Periksa ukuran file (<10MB)
3. Periksa format file (JPG/PNG/JPEG)
4. Clear browser cache
5. Gunakan browser lain (Chrome/Safari recommended)

---

## 📱 Mobile Optimization

### **iOS Safari**
- ✅ Full support untuk camera upload
- ✅ Touch gestures untuk zoom/pan hasil
- ✅ Auto-rotate detection
- ⚠️ Proses lebih lambat pada device lama

### **Android Chrome**
- ✅ Full support untuk camera upload
- ✅ Fast processing
- ✅ Better memory management

### **Best Practices (Mobile)**
1. Compress foto sebelum upload (gunakan app photo editor)
2. Gunakan mode "Document" pada camera (jika ada)
3. Pastikan WiFi/4G stabil untuk loading model
4. Close background apps untuk free up RAM

---

## 🔐 Privacy & Security

### **Data Privacy**
- ✅ **OCR processing 100% di browser** (client-side)
- ✅ Foto TIDAK dikirim ke server eksternal
- ✅ Data tersimpan di localStorage browser
- ✅ User bisa hapus foto kapan saja

### **Security**
- ✅ No API calls untuk OCR (privacy-friendly)
- ✅ No personal data sent to third-party
- ✅ Tesseract.js open-source & audited

---

## 🚀 Future Improvements

### **Planned Features**
1. 🔲 Support multi-language OCR (Chinese, Japanese, etc)
2. 🔲 Auto-rotation untuk foto miring
3. 🔲 Auto-crop untuk focus pada area teks
4. 🔲 Batch OCR (upload multiple photos)
5. 🔲 OCR dari PDF
6. 🔲 Machine Learning untuk kategori otomatis
7. 🔲 History OCR hasil (save & reuse)
8. 🔲 Export OCR data ke CSV/Excel

---

## 📞 Support

Jika ada pertanyaan atau masalah dengan fitur OCR Scanner, silakan hubungi tim support Babadolan.

**Email**: support@babadolan.com  
**Website**: https://babadolan.com/support

---

*Dokumentasi ini dibuat pada: 3 Desember 2024*  
*Last Updated: 3 Desember 2024*  
*Version: 1.0.0*