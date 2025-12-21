import { useState } from 'react';
import { Plus, Pencil, Trash2, Camera, X, Image as ImageIcon } from 'lucide-react';
import { ExpenseEntry } from '../types/accounting';
import { PhotoViewer } from './PhotoViewer';
import { CashType } from '../types/cash-management';

interface ExpenseSheetProps {
  entries: ExpenseEntry[];
  expenseCategories: string[];
  paymentMethods: string[];
  onAddEntry: (entry: Omit<ExpenseEntry, 'id'>) => void;
  onUpdateEntry: (id: string, entry: Omit<ExpenseEntry, 'id'>) => void;
  onDeleteEntry: (id: string) => void;
}

export function ExpenseSheet({ entries, expenseCategories, paymentMethods, onAddEntry, onUpdateEntry, onDeleteEntry }: ExpenseSheetProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: expenseCategories[0] || '',
    description: '',
    amount: '',
    paymentMethod: paymentMethods[0] || '',
    notes: '',
    paidTo: '', // Dibayar ke siapa
    cashType: 'big' as CashType, // Default ke Kas Besar
    photos: [] as string[]
  });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerCanDelete, setViewerCanDelete] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} terlalu besar. Maksimal 10MB per file.`);
        continue;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} bukan gambar yang valid.`);
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      const photoPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });

      const photoData = await photoPromise;
      newPhotos.push(photoData);
    }

    setFormData({ ...formData, photos: [...formData.photos, ...newPhotos] });
  };

  const handleRemovePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (editingId) {
      onUpdateEntry(editingId, entry);
      setEditingId(null);
    } else {
      onAddEntry(entry);
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: expenseCategories[0] || '',
      description: '',
      amount: '',
      paymentMethod: paymentMethods[0] || '',
      notes: '',
      paidTo: '',
      cashType: 'big' as CashType, // Reset ke Kas Besar
      photos: []
    });
    setIsFormOpen(false);
  };

  const handleEdit = (entry: ExpenseEntry) => {
    setFormData({
      date: entry.date,
      category: entry.category,
      description: entry.description,
      amount: entry.amount.toString(),
      paymentMethod: entry.paymentMethod,
      notes: entry.notes || '',
      paidTo: entry.paidTo || '',
      cashType: entry.cashType || 'big' as CashType, // Default ke Kas Besar jika tidak ada
      photos: entry.photos || []
    });
    setEditingId(entry.id);
    setIsFormOpen(true);
  };

  const openPhotoViewer = (photos: string[], index: number, canDelete: boolean = false) => {
    setViewerPhotos(photos);
    setViewerIndex(index);
    setViewerCanDelete(canDelete);
    setViewerOpen(true);
  };

  const closePhotoViewer = () => {
    setViewerOpen(false);
  };

  const handleViewerDelete = (index: number) => {
    handleRemovePhoto(index);
    if (formData.photos.length <= 1) {
      closePhotoViewer();
    } else if (index >= formData.photos.length - 1) {
      setViewerIndex(Math.max(0, index - 1));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      {viewerOpen && (
        <PhotoViewer
          photos={viewerPhotos}
          currentIndex={viewerIndex}
          onClose={closePhotoViewer}
          onNext={() => setViewerIndex((viewerIndex + 1) % viewerPhotos.length)}
          onPrev={() => setViewerIndex((viewerIndex - 1 + viewerPhotos.length) % viewerPhotos.length)}
          onDelete={viewerCanDelete ? handleViewerDelete : undefined}
          canDelete={viewerCanDelete}
        />
      )}
      
      <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2>Data Pengeluaran</h2>
        <button
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setEditingId(null);
            setFormData({
              date: new Date().toISOString().split('T')[0],
              category: expenseCategories[0] || '',
              description: '',
              amount: '',
              paymentMethod: paymentMethods[0] || '',
              notes: '',
              paidTo: '',
              cashType: 'big' as CashType, // Reset ke Kas Besar
              photos: []
            });
          }}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus size={20} />
          Tambah Pengeluaran
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="mb-4">{editingId ? 'Edit' : 'Tambah'} Pengeluaran</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tanggal</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Kategori Pengeluaran</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {expenseCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Jumlah Pengeluaran</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="1000000"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Metode Pembayaran</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Deskripsi</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Deskripsi transaksi"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Catatan Tambahan</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Catatan tambahan (opsional)"
                rows={2}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Dibayar ke Siapa</label>
              <input
                type="text"
                value={formData.paidTo}
                onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nama penerima pembayaran"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Jenis Kas</label>
              <select
                value={formData.cashType}
                onChange={(e) => setFormData({ ...formData, cashType: e.target.value as CashType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="big">Kas Besar</option>
                <option value="small">Kas Kecil</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-2">Foto Bukti Transaksi</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 cursor-pointer transition-colors border border-red-300">
                    <Camera size={20} />
                    Upload Foto
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-500">
                    Maks. 10MB per foto (JPG, PNG)
                  </span>
                </div>

                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => openPhotoViewer(formData.photos, index, true)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {editingId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Kategori</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Deskripsi</th>
                <th className="px-4 py-3 text-right text-sm text-gray-600">Jumlah</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Jenis Kas</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Metode</th>
                <th className="px-4 py-3 text-center text-sm text-gray-600">Foto</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data pengeluaran. Klik tombol "Tambah Pengeluaran" untuk menambah data.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(entry.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm">{entry.category}</td>
                    <td className="px-4 py-3 text-sm">{entry.description}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(entry.amount)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        entry.cashType === 'big' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {entry.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{entry.paymentMethod}</td>
                    <td className="px-4 py-3 text-sm">
                      {entry.photos && entry.photos.length > 0 ? (
                        <button
                          onClick={() => openPhotoViewer(entry.photos || [], 0, false)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mx-auto"
                          title={`${entry.photos.length} foto`}
                        >
                          <ImageIcon size={16} />
                          <span className="text-xs">({entry.photos.length})</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-center block">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-800"
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
    </div>
    </>
  );
}